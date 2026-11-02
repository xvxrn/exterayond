import '@helpers/peerIdPolyfill';
import RepliesElement from '@components/chat/replies';
import {setExteralessSetting} from '@stores/exteralessSettings';
import {MiddlewareHelper} from '@helpers/middleware';
import type {Message} from '@layer';

const mocks = vi.hoisted(() => {
  const listeners = new Map<string, Set<(value: any) => void>>();
  return {
    avatarRender: vi.fn(),
    subscribe: vi.fn(),
    update: vi.fn(),
    rootScope: {
      managers: {appMessagesManager: {subscribeRepliesThread: vi.fn(), updateMessage: vi.fn()}},
      addEventListener: (name: string, callback: (value: any) => void) => {
        if(!listeners.has(name)) listeners.set(name, new Set());
        listeners.get(name).add(callback);
      },
      removeEventListener: (name: string, callback: (value: any) => void) => listeners.get(name)?.delete(callback),
      dispatchEventSingle: (name: string, value: any) => listeners.get(name)?.forEach((callback) => callback(value))
    }
  };
});

vi.mock('@lib/rootScope', () => ({default: mocks.rootScope}));
vi.mock('@components/ripple', () => ({default: vi.fn()}));
vi.mock('@components/stackedAvatars', () => ({default: class {
  container = document.createElement('div');
  render = mocks.avatarRender;
}}));
vi.mock('@lib/langPack', () => ({default: {
  format: (key: string, _plain: boolean, args?: unknown[]) => `${key}:${args?.join(',') ?? ''}`,
  IntlElement: class {
    element = document.createElement('span');
    compareAndUpdate({key, args}: {key: string, args?: unknown[]}) {
      this.element.textContent = `${key}:${args?.join(',') ?? ''}`;
    }
  }
}}));

const middlewareHelpers: MiddlewareHelper[] = [];

function makeReplies(type: 'beside' | 'footer', count = 12345, avatars = false) {
  const element = RepliesElement.create();
  element.type = type;
  element.message = {
    _: 'message', peerId: 101, mid: 202, pFlags: {},
    replies: {_: 'messageReplies', pFlags: {}, replies: count,
      ...(avatars ? {recent_repliers: [{_: 'peerUser', user_id: 303}]} : {})}
  } as unknown as Message.message;
  element.middlewareHelper = new MiddlewareHelper();
  middlewareHelpers.push(element.middlewareHelper);
  element.init();
  document.body.append(element);
  return element;
}

beforeEach(() => {
  document.body.replaceChildren();
  setExteralessSetting('DisableNumberRounding', false);
  vi.clearAllMocks();
});

afterEach(() => {
  document.body.replaceChildren();
  middlewareHelpers.splice(0).forEach((helper) => helper.destroy());
  setExteralessSetting('DisableNumberRounding', false);
});

it('updates only existing beside count text on and off, preserving its icon and subscriptions', () => {
  const element = makeReplies('beside');
  const counter = element.querySelector('.replies-beside-text');
  const icon = element.firstElementChild;
  const render = vi.spyOn(element, 'render');
  const attributes = element.outerHTML.match(/^[^>]*>/)[0];
  const managers = mocks.rootScope.managers.appMessagesManager;
  expect(counter.textContent).toBe('12K');
  expect(managers.subscribeRepliesThread).toHaveBeenCalledTimes(1);
  expect(managers.updateMessage).toHaveBeenCalledTimes(1);

  setExteralessSetting('DisableNumberRounding', true);
  expect(counter.textContent).toBe('12\u00a0345');
  expect(element.querySelector('.replies-beside-text')).toBe(counter);
  expect(element.firstElementChild).toBe(icon);
  expect(element.outerHTML.match(/^[^>]*>/)[0]).toBe(attributes);

  setExteralessSetting('DisableNumberRounding', false);
  expect(counter.textContent).toBe('12K');
  expect(element.firstElementChild).toBe(icon);
  expect(render).not.toHaveBeenCalled();
  expect(managers.subscribeRepliesThread).toHaveBeenCalledTimes(1);
  expect(managers.updateMessage).toHaveBeenCalledTimes(1);
});

it.each([false, true])('leaves footer text, icons and avatar rendering untouched (avatars: %s)', (avatars) => {
  const element = makeReplies('footer', 12345, avatars);
  const nodes = [...element.childNodes];
  const html = element.innerHTML;
  const render = vi.spyOn(element, 'render');
  const avatarCalls = mocks.avatarRender.mock.calls.length;
  const managers = mocks.rootScope.managers.appMessagesManager;

  setExteralessSetting('DisableNumberRounding', true);
  setExteralessSetting('DisableNumberRounding', false);

  expect(element.innerHTML).toBe(html);
  expect([...element.childNodes]).toEqual(nodes);
  nodes.forEach((node, index) => expect(element.childNodes[index]).toBe(node));
  expect(mocks.avatarRender).toHaveBeenCalledTimes(avatarCalls);
  expect(render).not.toHaveBeenCalled();
  expect(managers.subscribeRepliesThread).toHaveBeenCalledTimes(1);
  expect(managers.updateMessage).toHaveBeenCalledTimes(1);
});

it('safely ignores uninitialized elements, even with a beside type and no message', () => {
  const fresh = RepliesElement.create();
  const beside = RepliesElement.create();
  beside.type = 'beside';
  document.body.append(fresh, beside);
  expect(() => setExteralessSetting('DisableNumberRounding', true)).not.toThrow();
  expect(fresh.childNodes).toHaveLength(0);
  expect(beside.childNodes).toHaveLength(0);
});

it('ignores removed elements after their middleware is disposed', () => {
  const element = makeReplies('beside');
  const counter = element.querySelector('.replies-beside-text');
  const render = vi.spyOn(element, 'render');
  element.middlewareHelper.destroy();
  element.remove();
  expect(() => setExteralessSetting('DisableNumberRounding', true)).not.toThrow();
  expect(counter.textContent).toBe('12K');
  expect(render).not.toHaveBeenCalled();
});

it('uses the current count and safely empties zero or missing replies without replacing nodes', () => {
  const element = makeReplies('beside');
  const counter = element.querySelector('.replies-beside-text');
  const icon = element.firstElementChild;
  element.message.replies.replies = 54321;
  setExteralessSetting('DisableNumberRounding', true);
  expect(counter.textContent).toBe('54\u00a0321');
  element.message.replies.replies = 0;
  setExteralessSetting('DisableNumberRounding', false);
  expect(counter.textContent).toBe('');
  element.message.replies = undefined;
  setExteralessSetting('DisableNumberRounding', true);
  expect(counter.textContent).toBe('');
  expect(element.firstElementChild).toBe(icon);
  expect(element.querySelector('.replies-beside-text')).toBe(counter);
});

it('ignores other setting changes', () => {
  const element = makeReplies('beside');
  const counter = element.querySelector('.replies-beside-text');
  element.message.replies.replies = 54321;
  setExteralessSetting('HidePhone', false);
  expect(counter.textContent).toBe('12K');
});
