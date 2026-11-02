import {afterEach, describe, expect, it, vi} from 'vitest';
import {render} from 'solid-js/web';
import {JSX} from 'solid-js';
import AppStatisticsTab, {StatisticsOverviewItems, createLoadableList} from '@components/sidebarRight/tabs/statistics';
import {setExteralessSettings} from '@stores/exteralessSettings';

const mocks = vi.hoisted(() => ({members: vi.fn()}));

vi.mock('@lib/langPack', () => {
  const weakMap = new WeakMap();
  class IntlElement {
    element: HTMLElement;
    constructor(options: any) {
      this.element = options.element || document.createElement('span');
      weakMap.set(this.element, this);
      this.compareAndUpdate(options);
    }
    compareAndUpdate(options: any) {
      this.element.textContent = `${options.args?.[0] ?? ''} ${options.key}`.trim();
    }
  }
  return {
    default: {IntlElement, IntlDateElement: class {}, weakMap},
    i18n: (key: string, args?: any[]) => new IntlElement({key, args}).element,
    join: (nodes: Node[]) => nodes,
    joinElementsWith: (nodes: Node[]) => nodes
  };
});
vi.mock('@components/sliderTab', () => ({SliderSuperTabEventable: class {}}));
vi.mock('@components/section', () => ({default: (props: {children: JSX.Element}) => <section>{props.children}</section>}));
vi.mock('@helpers/dom/customProperties', () => ({default: {getProperty: () => '#000000'}}));
vi.mock('@components/emptyPlaceholder', () => ({default: vi.fn()}));
vi.mock('@helpers/liteMode', () => ({default: {isAvailable: () => false}}));
vi.mock('@components/icon', () => ({default: () => document.createElement('i')}));
vi.mock('@components/rowTsx', () => ({default: (): JSX.Element => undefined}));
vi.mock('@components/chat/replyContainer', () => ({wrapReplyDivAndCaption: vi.fn()}));
vi.mock('@helpers/date', () => ({formatFullSentTime: vi.fn()}));
vi.mock('@components/stories/preview', () => ({wrapStoryMedia: vi.fn()}));
vi.mock('@helpers/dom/clickEvent', () => ({attachClickEvent: vi.fn()}));
vi.mock('@components/buttonTsx', () => ({default: (): JSX.Element => undefined}));
vi.mock('@helpers/themeController', () => ({default: {isNight: () => false}}));
vi.mock('@components/wrappers/getChatMembersString', () => ({default: mocks.members}));
vi.mock('@helpers/dom/createContextMenu', () => ({default: vi.fn()}));
vi.mock('@components/avatarNew', () => ({avatarNew: vi.fn()}));
vi.mock('@components/wrappers/peerTitle', () => ({default: vi.fn()}));
vi.mock('@lib/accounts/bindManagersToAccount', () => ({bindManagersToSession: (value: unknown) => value}));
vi.mock('@lib/solidjs/hotReloadGuardProvider', () => ({
  hotReloadGuard: {
    appDialogsManager: {
      addDialogNew: () => {
        const listEl = document.createElement('div');
        const lastMessageSpan = document.createElement('span');
        listEl.append(lastMessageSpan);
        return {dom: {listEl, lastMessageSpan}};
      },
      createChatList: () => document.createElement('div'),
      setListClickListener: vi.fn()
    }
  }
}));

const disposers: VoidFunction[] = [];
const mount = (component: () => JSX.Element) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(component, container));
  return container;
};

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  document.body.replaceChildren();
  setExteralessSettings({DisableNumberRounding: false});
});

describe('statistics exact counts', () => {
  it('updates mounted overview values/deltas and preserves omitted versus requested zero rows', () => {
    const zero = {_: 'statsAbsValueAndPrev', current: 0, previous: 0} as const;
    const container = mount(() => <StatisticsOverviewItems items={[
      {title: 'StatisticViews', value: {_: 'statsAbsValueAndPrev', current: 1234, previous: 100}},
      {title: 'Reactions', value: zero},
      {title: 'PublicShares', value: zero, includeZeroValue: true}
    ]} />);
    expect(container.querySelectorAll('.statistics-overview-item')).toHaveLength(2);
    const value = container.querySelector('.statistics-overview-item-value');
    expect(value.textContent).toContain('1.2K +1.1K');
    setExteralessSettings({DisableNumberRounding: true});
    expect(container.querySelector('.statistics-overview-item-value')).toBe(value);
    expect(value.textContent).toContain('1\u00a0234 +1\u00a0134');
    expect(container.textContent).toContain('0PublicShares');
    setExteralessSettings({DisableNumberRounding: false});
    expect(value.textContent).toContain('1.2K +1.1K');
  });

  it('keeps localized Views DOM and reconciles a row loaded across a toggle at installation', async() => {
    let finishMembers: (value: HTMLElement) => void;
    mocks.members.mockImplementation(() => new Promise<HTMLElement>((resolve) => finishMembers = resolve));
    const tab = new AppStatisticsTab(undefined) as any;
    tab.middlewareHelper = {get: () => () => true};
    tab.listenerSetter = {add: () => () => {}};
    tab.stats = {_: 'stats.messageStats'};
    tab.graphDcIds = new Map();
    const peerId = {toChatId: () => 1};
    const loading = tab.renderPeer({_: 'message', peerId, mid: 10, views: 1234});
    setExteralessSettings({DisableNumberRounding: true});
    finishMembers(document.createElement('span'));
    const loaded = await loading;
    const [forwards] = createLoadableList({rendered: [loaded.container], count: 1});
    const container = mount(() => tab._construct([], [], [], [], forwards, undefined));
    const label = container.querySelector<HTMLElement>('[data-oe-count]');
    expect(label.textContent).toBe('1\u00a0234 Views');
    expect(label.textContent).not.toContain('[object');
    setExteralessSettings({DisableNumberRounding: false});
    tab.refreshCountLabels(container);
    expect(container.querySelector('[data-oe-count]')).toBe(label);
    expect(label.textContent).toBe('1.2K Views');
  });
});
