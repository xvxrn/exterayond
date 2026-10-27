import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from 'solid-js/web';
import {getMiddleware, MiddlewareHelper} from '@helpers/middleware';
import {Message, ReactionCount} from '@layer';
import '@helpers/peerIdPolyfill';

const state = vi.hoisted(() => ({
  settings: {DisableNumberRounding: false},
  listeners: new Map<string, Set<(...args: any[]) => void>>(),
  managers: {
    appMessagesManager: {
      getGroupsFirstMessage: vi.fn(),
      canViewMessageReadParticipants: vi.fn(),
      getMessageReadParticipants: vi.fn()
    },
    appReactionsManager: {canDeleteParticipantReactions: vi.fn()}
  },
  disposePopup: undefined as VoidFunction | undefined,
  avatarRenders: vi.fn(),
  stickerRenders: vi.fn().mockResolvedValue({render: undefined})
}));

vi.mock('@stores/exteralessSettings', () => ({exteralessSettings: state.settings}));
vi.mock('@lib/rootScope', () => ({default: {
  myId: 999,
  managers: state.managers,
  addEventListener: (name: string, callback: (...args: any[]) => void) => {
    if(!state.listeners.has(name)) state.listeners.set(name, new Set());
    state.listeners.get(name).add(callback);
  },
  removeEventListener: (name: string, callback: (...args: any[]) => void) => state.listeners.get(name)?.delete(callback)
}}));
vi.mock('@lib/accounts/bindManagersToAccount', () => ({bindManagersToSession: (managers: unknown) => managers}));
vi.mock('@components/singleTransition', () => ({default: ({element, className, forwards}: any) => element.classList.toggle(className, forwards)}));
vi.mock('@components/stackedAvatars', () => ({default: class {
  container = Object.assign(document.createElement('div'), {className: 'test-avatars'});
  render = state.avatarRenders;
}}));
vi.mock('@components/wrappers/sticker', () => ({default: state.stickerRenders}));
vi.mock('@components/wrappers/stickerAnimation', () => ({default: vi.fn()}));
vi.mock('@lib/lottie/lottiePlayer', () => ({default: class {}}));
vi.mock('@lib/apiManagerProxy', () => ({default: {
  getReaction: () => ({pFlags: {}, static_icon: {id: 1}}),
  getChat: (id: number) => ({pFlags: id === 42 ? {broadcast: true} : id === 43 ? {broadcast: true, megagroup: true} : {}})
}}));
vi.mock('@helpers/getImageFromStrippedThumb', () => ({default: vi.fn()}));
vi.mock('@lib/customEmoji/element', () => ({default: class {}}));
vi.mock('@lib/customEmoji/renderer', () => ({CustomEmojiRendererElement: class {}}));
vi.mock('@lib/appDownloadManager', () => ({default: {}}));
vi.mock('@lib/lottie/lottieLoader', () => ({default: {}}));
vi.mock('@lib/richTextProcessor/wrapEmojiText', () => ({default: (text: string) => text}));
vi.mock('@components/stars/starsAmount', () => ({StarsStar: vi.fn()}));
vi.mock('@components/sparkles', () => ({Sparkles: vi.fn()}));
vi.mock('@components/animatedCounter', () => ({AnimatedCounter: class {
  container = Object.assign(document.createElement('div'), {className: 'test-paid-counter'});
  setCount = vi.fn();
}}));
vi.mock('@helpers/liteMode', () => ({default: {isAvailable: () => false}}));
vi.mock('@hooks/useHeavyAnimationCheck', () => ({getHeavyAnimationPromise: () => Promise.resolve()}));
vi.mock('@config/modes', () => ({default: {a11y: false}}));
vi.mock('@lib/langPack', () => ({default: {format: (text: string) => text}}));
vi.mock('@components/scrollable', () => ({default: class {
  container = document.createElement('div');
  append(node: Node) { this.container.append(node); }
}}));
vi.mock('@helpers/scrollableLoader', () => ({default: class {load() {}}}));
vi.mock('@components/dialogElement', () => ({}));
vi.mock('@components/wrappers/getUserStatusString', () => ({default: vi.fn()}));
vi.mock('@components/wrappers/customEmoji', () => ({default: vi.fn()}));
vi.mock('@helpers/date', () => ({formatFullSentTime: vi.fn()}));
vi.mock('@components/icon', () => ({default: () => document.createElement('i')}));
vi.mock('@components/buttonMenu', () => ({ButtonMenuSync: vi.fn()}));
vi.mock('@helpers/dom/attachContextMenuListener', () => ({attachContextMenuListener: vi.fn()}));
vi.mock('@helpers/contextMenuController', () => ({default: {}}));
vi.mock('@helpers/positionMenu', () => ({default: vi.fn()}));
vi.mock('@components/chat/deleteParticipantReaction', () => ({default: vi.fn()}));
vi.mock('@lib/solidjs/hotReloadGuardProvider', () => ({hotReloadGuard: {
  appDialogsManager: {createChatList: () => document.createElement('div'), setListClickListener: vi.fn()}
}}));
vi.mock('@components/horizontalMenu', () => ({horizontalMenu: (_strip: HTMLElement, tabs: HTMLElement, callback: Function) => {
  let previous = -1;
  const select = (index: number) => {
    callback(index, tabs.children[index]);
    previous = index;
  };
  select.prevId = () => previous;
  return select;
}}));
vi.mock('@components/popups/indexTsx', () => {
  const Popup = (props: any) => <div class={props.class}>{props.children}</div>;
  Popup.Header = (props: any) => <div ref={props.ref}>{props.children}</div>;
  Popup.Body = (props: any) => <div ref={props.ref}>{props.children}</div>;
  Popup.CloseButton = () => <button class="popup-close" />;
  return {
    default: Popup,
    createPopup: (factory: () => any) => {
      const mount = document.createElement('div');
      document.body.append(mount);
      state.disposePopup = render(factory, mount);
    }
  };
});

import ReactionElement, {ReactionLayoutType} from '@components/chat/reaction';
import ReactionsElement, {PENDING_PAID_REACTIONS, REACTIONS_ELEMENTS} from '@components/chat/reactions';
import showReactedListPopup from '@components/popups/reactedList';

const helpers: MiddlewareHelper[] = [];
function middleware() {
  const helper = getMiddleware();
  helpers.push(helper);
  return helper;
}
function toggle(exact: boolean, key = 'DisableNumberRounding') {
  state.settings.DisableNumberRounding = exact;
  state.listeners.get('exteraless_settings_updated')?.forEach((callback) => callback({key}));
}
function count(value = 1000): ReactionCount {
  return {_: 'reactionCount', reaction: {_: 'reactionEmoji', emoticon: '🔥'}, count: value};
}
function message(counts = [count()]): Message.message {
  return {_: 'message', pFlags: {}, peerId: 123, mid: 10, id: 10,
    reactions: {_: 'messageReactions', pFlags: {}, results: counts, recent_reactions: []}
  } as Message.message;
}
function strip(counts = [count()], forceCounter?: boolean) {
  const helper = middleware();
  const element = ReactionsElement.create();
  element.init({context: message(counts), type: ReactionLayoutType.Block, middleware: helper.get(), isPlaceholder: true, forceCounter});
  element.render();
  document.body.append(element);
  return {element, helper};
}
function counter(element: Element) {
  return element.querySelector('.reaction-counter')?.textContent;
}

beforeEach(() => {
  state.settings.DisableNumberRounding = false;
  vi.clearAllMocks();
});
afterEach(() => {
  state.disposePopup?.();
  state.disposePopup = undefined;
  helpers.splice(0).forEach((helper) => helper.destroy());
  document.body.replaceChildren();
  REACTIONS_ELEMENTS.clear();
  PENDING_PAID_REACTIONS.clear();
});

describe('reaction counter setting refresh', () => {
  it('classifies cached peers without a request and replaces the class when a strip is reused', () => {
    const {element, helper} = strip([]);
    expect(element.classList.contains('oe-reactions-private')).toBe(true);
    for(const [peerId, kind] of [[-42, 'channels'], [-43, 'groups'], [-44, 'groups'], [123, 'private']] as const) {
      element.init({context: {...message([]), peerId: peerId as PeerId}, type: ReactionLayoutType.Block, middleware: helper.get()});
      element.render();
      expect([...element.classList].filter((name) => name.startsWith('oe-reactions-'))).toEqual(['oe-reactions-' + kind]);
    }
  });
  it('updates mounted counters without replacing media, avatars, identity or choice', () => {
    const {element} = strip();
    const reaction = element.getSorted()[0];
    reaction.setIsChosen(true);
    const avatar = document.createElement('div');
    reaction.append(avatar);
    const sticker = reaction.stickerContainer;
    const identity = reaction.reactionCount;
    const counterNode = reaction.querySelector('.reaction-counter');
    const renderSpy = vi.spyOn(element, 'render');
    expect(counter(reaction)).toBe('1K');
    toggle(true, 'HidePhone');
    expect(counter(reaction)).toBe('1K');
    toggle(true);
    expect(counter(reaction)).toBe('1\u00a0000');
    toggle(false);
    expect(counter(reaction)).toBe('1K');
    expect(reaction.querySelector('.reaction-counter')).toBe(counterNode);
    expect(reaction.stickerContainer).toBe(sticker);
    expect(avatar.parentElement).toBe(reaction);
    expect(reaction.reactionCount).toBe(identity);
    expect(reaction.classList.contains('is-chosen')).toBe(true);
    expect(renderSpy).not.toHaveBeenCalled();
    expect(state.stickerRenders).not.toHaveBeenCalled();
  });

  it('retains hidden avatar counters and force/title decisions, including undefined fake identities', () => {
    const {element} = strip([count(2)]);
    const reaction = element.getSorted()[0];
    const avatars = reaction.querySelector('.test-avatars');
    expect(avatars).not.toBeNull();
    expect(counter(reaction)).toBeUndefined();
    const forced = ReactionElement.create();
    forced.init(ReactionLayoutType.Tag, middleware().get());
    forced.reactionCount = count();
    const title = Object.assign(document.createElement('strong'), {textContent: 'Saved'});
    forced.renderCounter(true, title);
    const titleOnly = ReactionElement.create();
    titleOnly.init(ReactionLayoutType.Tag, middleware().get());
    titleOnly.reactionCount = count();
    titleOnly.renderCounter(false, 'Title only');
    const fake = ReactionElement.create();
    fake.init(ReactionLayoutType.Block, middleware().get());
    fake.reactionCount = {...count(), reaction: undefined};
    fake.renderCounter(true);
    toggle(true);
    forced.refreshCounter();
    titleOnly.refreshCounter();
    fake.refreshCounter();
    expect(counter(forced)).toBe('Saved 1\u00a0000');
    expect(forced.querySelector('strong')).toBe(title);
    expect(counter(titleOnly)).toBe('Title only');
    expect(counter(fake)).toBe('1\u00a0000');
    expect(counter(reaction)).toBeUndefined();
    expect(reaction.querySelector('.test-avatars')).toBe(avatars);
    expect(state.avatarRenders).toHaveBeenCalledOnce();
    toggle(false);
    forced.refreshCounter();
    fake.refreshCounter();
    expect(counter(forced)).toBe('Saved 1K');
    expect(counter(fake)).toBe('1K');
  });

  it('preserves optimistic paid counts and stops refreshing after destruction or removal', () => {
    const pending = {count: () => 1000, abortController: new AbortController()} as any;
    PENDING_PAID_REACTIONS.set('123_10', pending);
    const {element, helper} = strip([{_: 'reactionCount', reaction: {_: 'reactionPaid'}, count: 20}]);
    const reaction = element.getSorted()[0];
    const pendingNode = reaction.querySelector('.test-paid-counter');
    expect(reaction.reactionCount.count).toBe(1020);
    toggle(true);
    expect(counter(reaction)).toBe('1\u00a0020');
    expect(reaction.querySelector('.test-paid-counter')).toBe(pendingNode);
    expect(reaction.classList.contains('effect-active')).toBe(true);
    expect(reaction.classList.contains('is-chosen')).toBe(true);
    expect(pending.abortController.signal.aborted).toBe(false);
    helper.destroy();
    toggle(false);
    expect(counter(reaction)).toBe('1\u00a0020');
    element.remove();
    expect(REACTIONS_ELEMENTS.has('123_10')).toBe(false);
  });

  it('refreshes real popup counters and standalone all/read counters and removes its listener on dispose', async() => {
    state.managers.appMessagesManager.getGroupsFirstMessage.mockResolvedValue(message());
    state.managers.appMessagesManager.canViewMessageReadParticipants.mockResolvedValue(true);
    state.managers.appMessagesManager.getMessageReadParticipants.mockResolvedValue(Array.from({length: 1000}, (_, index) => index + 1));
    state.managers.appReactionsManager.canDeleteParticipantReactions.mockResolvedValue(false);
    const baseline = state.listeners.get('exteraless_settings_updated').size;
    await showReactedListPopup(message());
    const strip = document.querySelector('reactions-element') as ReactionsElement;
    const tabs = [...strip.children].filter((child) => child instanceof ReactionElement) as ReactionElement[];
    const values = () => tabs.map((tab) => tab.querySelector('.reaction-counter:last-child')?.textContent);
    expect(values()).toEqual(['1K', '1K', '1K']);
    expect(tabs[0].reactionCount.reaction).toBeUndefined();
    expect(tabs[1].reactionCount.reaction).toBeUndefined();
    const selected = tabs[0].className;
    toggle(true);
    expect(values()).toEqual(['1\u00a0000', '1\u00a0000', '1\u00a0000']);
    toggle(false);
    expect(values()).toEqual(['1K', '1K', '1K']);
    expect(tabs[0].className).toBe(selected);
    expect(state.listeners.get('exteraless_settings_updated').size).toBe(baseline + 1);
    state.disposePopup();
    state.disposePopup = undefined;
    expect(state.listeners.get('exteraless_settings_updated').size).toBe(baseline);
    toggle(true);
    expect(values()).toEqual(['1K', '1K', '1K']);
  });

  it('uses the current setting when popup read-participant loading finishes after a toggle', async() => {
    let resolveReadParticipants: (ids: UserId[]) => void;
    state.managers.appMessagesManager.getGroupsFirstMessage.mockResolvedValue(message());
    state.managers.appMessagesManager.canViewMessageReadParticipants.mockResolvedValue(true);
    state.managers.appReactionsManager.canDeleteParticipantReactions.mockResolvedValue(false);
    state.managers.appMessagesManager.getMessageReadParticipants.mockReturnValue(new Promise<UserId[]>((resolve) => {
      resolveReadParticipants = resolve;
    }));
    const opening = showReactedListPopup(message());
    await vi.waitFor(() => expect(state.managers.appMessagesManager.getMessageReadParticipants).toHaveBeenCalledOnce());
    toggle(true);
    resolveReadParticipants(Array.from({length: 1000}, (_, index) => (index + 1) as UserId));
    await opening;
    const counters = () => [...document.querySelectorAll('reaction-element > .reaction-counter:last-child')].map((element) => element.textContent);
    expect(counters()).toEqual(['1\u00a0000', '1\u00a0000', '1\u00a0000']);
    toggle(false);
    expect(counters()).toEqual(['1K', '1K', '1K']);
  });
});
