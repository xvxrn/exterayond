import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import '@helpers/peerIdPolyfill';

const mocks = vi.hoisted(() => ({
  avatarNew: vi.fn()
}));

vi.mock('@components/avatarNew', () => ({avatarNew: mocks.avatarNew}));
vi.mock('@components/wrappers/messageForReply', () => ({
  default: async() => document.createDocumentFragment()
}));
vi.mock('@components/icon', () => ({
  default: () => document.createElement('span')
}));
vi.mock('@lib/langPack', () => ({
  i18n: (key: string) => document.createTextNode(key)
}));
// * dialogElement's constructor graph is not under test here; only its subtitle helpers are
vi.mock('@components/peerTitle', () => ({default: class {}, changeTitleEmojiColor() {}}));
vi.mock('@lib/solidjs/hotReloadGuardProvider', () => ({hotReloadGuard: {}}));
vi.mock('@lib/apiManagerProxy', () => ({default: {addEventListener() {}, getState: () => Promise.resolve({})}}));

// * dialogElement pulls the message-rendering graph, which asks for browser APIs jsdom lacks
vi.hoisted(() => {
  class IntersectionObserverMock {
    public observe() {}
    public unobserve() {}
    public disconnect() {}
    public takeRecords(): IntersectionObserverEntry[] { return []; }
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {configurable: true, value: IntersectionObserverMock});
  Object.defineProperty(globalThis, 'Worker', {configurable: true, writable: true, value: class Worker {}});
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: () => ({matches: false, addEventListener() {}, removeEventListener() {}})
  });
  Object.defineProperty(globalThis, 'CSS', {configurable: true, value: {supports: () => false, escape: (value: string) => value}});
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/webp;base64,';
  HTMLCanvasElement.prototype.getContext = (() : null => null) as any;
});

import renderDialogSubtitleParts from '@components/wrappers/dialogSubtitle';
import {
  isRenderedSubtitleIntact,
  setDialogSubtitle,
  setPromiseMiddleware
} from '@components/dialogElement';
import {getMiddleware, type MiddlewareHelper} from '@helpers/middleware';
import {setExteralessSetting} from '@stores/exteralessSettings';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const MINI_AVATAR = '.dialog-sender-mini-avatar';

const peerTitleRenderer = vi.fn(async() => {
  const title = document.createElement('span');
  title.textContent = 'Sender';
  return title;
});

function makeMessage(fromId = -3) {
  return {
    _: 'message',
    pFlags: {},
    peerId: (-1) as PeerId,
    fromId: fromId as PeerId,
    mid: 1,
    date: 1,
    message: 'body'
  } as any;
}

async function render(
  message: any,
  middleware: <T>(value: T) => T,
  owner: MiddlewareHelper,
  middlewareOwner = owner.get()
) {
  return renderDialogSubtitleParts({
    peerId: message.peerId,
    isSaved: false,
    lastMessage: message,
    middleware,
    middlewareOwner,
    messageRenderer: (async() => document.createDocumentFragment()) as any,
    peerTitleRenderer,
    textColor: 'secondary-text-color'
  });
}

describe('sender mini avatars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.avatarNew.mockImplementation(() => {
      const node = document.createElement('div');
      node.classList.add('avatar');
      return {node};
    });
    setExteralessSetting('OEAppearanceSenderMiniAvatars', true);
  });

  afterEach(() => {
    setExteralessSetting('OEAppearanceSenderMiniAvatars', true);
  });

  it('follows the setting live, without a second avatar or one after release', async() => {
    const row = getMiddleware();
    const owner = row.get().create();
    const message = makeMessage();

    const parts = await render(message, (value) => value, owner);
    const sender = parts[0];

    await flush();
    expect(sender.querySelectorAll(MINI_AVATAR)).toHaveLength(1);

    setExteralessSetting('OEAppearanceSenderMiniAvatars', false);
    await flush();
    expect(sender.querySelectorAll(MINI_AVATAR)).toHaveLength(0);
    expect(mocks.avatarNew).toHaveBeenCalledTimes(1);

    setExteralessSetting('OEAppearanceSenderMiniAvatars', true);
    await flush();
    expect(sender.querySelectorAll(MINI_AVATAR)).toHaveLength(1);
    expect(mocks.avatarNew).toHaveBeenCalledTimes(2);

    owner.destroy();
    row.destroy();
    setExteralessSetting('OEAppearanceSenderMiniAvatars', false);
    setExteralessSetting('OEAppearanceSenderMiniAvatars', true);
    await flush();
    expect(sender.querySelectorAll(MINI_AVATAR)).toHaveLength(0);
    expect(mocks.avatarNew).toHaveBeenCalledTimes(2);
  });

  it('creates no avatar at all while the setting is off', async() => {
    setExteralessSetting('OEAppearanceSenderMiniAvatars', false);

    const row = getMiddleware();
    await render(makeMessage(), (value) => value, row.get().create());

    await flush();
    expect(mocks.avatarNew).not.toHaveBeenCalled();
    row.destroy();
  });

  it('keeps the released owner from mounting a pending avatar', async() => {
    const row = getMiddleware();
    const owner = row.get().create();

    await render(makeMessage(), (value) => value, owner);
    // * released before the dynamic import settles
    owner.destroy();
    await flush();

    expect(mocks.avatarNew).not.toHaveBeenCalled();
    row.destroy();
  });

  it('replaces the sender avatar and releases the subtitle it replaced', async() => {
    const row = getMiddleware();
    const dom = {lastMessageSpan: document.createElement('span')} as any;

    const firstOwner = row.get().create();
    const firstParts = await render(makeMessage(-3), (value) => value, firstOwner);
    setDialogSubtitle(dom, firstParts, firstOwner);
    await flush();
    expect(dom.lastMessageSpan.querySelectorAll(MINI_AVATAR)).toHaveLength(1);
    expect(mocks.avatarNew).toHaveBeenLastCalledWith(expect.objectContaining({peerId: -3}));

    const secondOwner = row.get().create();
    const secondParts = await render(makeMessage(-4), (value) => value, secondOwner);
    setDialogSubtitle(dom, secondParts, secondOwner);
    await flush();

    expect(dom.lastMessageSpan.querySelectorAll(MINI_AVATAR)).toHaveLength(1);
    expect(mocks.avatarNew).toHaveBeenCalledTimes(2);
    expect(mocks.avatarNew).toHaveBeenLastCalledWith(expect.objectContaining({peerId: -4}));

    row.destroy();
    expect(dom.lastMessageSpan.querySelectorAll(MINI_AVATAR)).toHaveLength(0);
  });

  it('drops an unfinished render when the next subtitle replaces it', async() => {
    const row = getMiddleware();
    const dom = {lastMessageSpan: document.createElement('span')} as any;

    const unfinishedOwner = row.get().create();
    const unfinished = render(makeMessage(-3), (value) => value, unfinishedOwner);
    unfinishedOwner.destroy();

    const nextOwner = row.get().create();
    const nextParts = await render(makeMessage(-4), (value) => value, nextOwner);
    setDialogSubtitle(dom, nextParts, nextOwner);
    await unfinished;
    await flush();

    expect(dom.lastMessageSpan.querySelectorAll(MINI_AVATAR)).toHaveLength(1);
    expect(mocks.avatarNew).toHaveBeenCalledTimes(1);
    expect(mocks.avatarNew).toHaveBeenLastCalledWith(expect.objectContaining({peerId: -4}));

    row.destroy();
  });

  it('keeps the live avatar across a repeated render key, and drops it with the row', async() => {
    const row = getMiddleware();
    const dom = {lastMessageSpan: document.createElement('span')} as any;
    const message = makeMessage();

    const first = setPromiseMiddleware(dom, 'setLastMessagePromise');
    const firstOwner = row.get().create();
    const parts = await render(message, first.middleware, firstOwner);
    setDialogSubtitle(dom, parts, firstOwner);
    dom.lastMessageRenderKey = 'same';
    dom.lastMessageRenderParts = parts;
    await flush();
    expect(dom.lastMessageSpan.querySelectorAll(MINI_AVATAR)).toHaveLength(1);

    // * the next update starts a new generic promise helper, then recognizes the
    // * cached subtitle as intact and does not render it again
    setPromiseMiddleware(dom, 'setLastMessagePromise');
    expect(dom.lastMessageRenderKey === 'same' && isRenderedSubtitleIntact(dom)).toBe(true);
    await flush();
    expect(dom.lastMessageSpan.querySelectorAll(MINI_AVATAR)).toHaveLength(1);
    expect(mocks.avatarNew).toHaveBeenCalledTimes(1);

    row.destroy();
    expect(dom.lastMessageSpan.querySelectorAll(MINI_AVATAR)).toHaveLength(0);
  });
});
