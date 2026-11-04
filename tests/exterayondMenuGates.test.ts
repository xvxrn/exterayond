import '@helpers/peerIdPolyfill';
import deferred from '@tests/helpers/deferred';

vi.hoisted(() => {
  // * jsdom has no IntersectionObserver, and the popups graph builds an
  // * AnimationIntersector at import time — a never-fired stub is enough here
  (globalThis as any).IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): unknown[] {
      return [];
    }
  };

  // * jsdom's canvas has no real toDataURL (jsdom logs "Not implemented" and
  // * answers null, which crashes `webpSupport`'s import-time .startsWith)
  (HTMLCanvasElement.prototype as any).toDataURL = () => 'data:image/webp;base64,AAAA';
});

const rootScopeMock = vi.hoisted(() => ({myId: 0 as PeerId}));
const controllerMock = vi.hoisted(() => ({openBtnMenu: undefined as undefined | ((element: HTMLElement) => void)}));

vi.mock('@lib/rootScope', () => ({
  default: Object.assign(rootScopeMock, {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEventSingle: vi.fn()
  })
}));

vi.mock('@lib/apiManagerProxy', () => ({
  default: new Proxy({}, {get: (): (() => undefined) => () => undefined})
}));

vi.mock('@helpers/contextMenuController', () => ({
  default: {
    close: vi.fn(),
    openBtnMenu: (element: HTMLElement) => controllerMock.openBtnMenu?.(element),
    // * swipeHandler's top-level hotListen subscribes to the controller
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
}));

// * the reactions strip component is stubbed; the strip's creation CONDITION
// * (the MENU-05 gate under test) lives in contextMenu.ts itself
vi.mock('@components/chat/reactionsMenu', () => ({
  ChatReactionsMenu: class {
    container = document.createElement('div');
    widthContainer = document.createElement('div');
    async init() {}
    cleanup() {}
  },
  REACTION_CONTAINER_SIZE: 44
}));

vi.mock('@components/buttonMenu', () => {
  const render = ({buttons}: {buttons: any[]}) => {
    const menu = document.createElement('div');
    buttons.forEach((button) => {
      const element = button.element ?? document.createElement('button');
      button.element = element;
      if(button.className) {
        element.className = button.className;
      }

      const text = document.createElement('div');
      text.className = 'btn-menu-item-text';
      text.textContent = button.text ?? button.regularText ?? '';
      button.textElement = text;
      element.append(text);
      menu.append(element);
    });
    return menu;
  };

  return {
    default: async(options: {buttons: any[]}) => render(options)
  };
});

vi.mock('@lib/langPack', () => {
  const i18n = (key: string) => {
    const element = document.createElement('span');
    element.textContent = key;
    return element;
  };

  return {
    default: Object.assign(
      class {
        static IntlElement = class {
          element = document.createElement('span');
          constructor(options: {key?: string, element?: HTMLElement}) {
            if(options?.key) this.element.textContent = options.key;
            options?.element?.append(this.element);
          }
        };
      },
      {
        getIsRTL: () => false,
        format: (key: string) => key
      }
    ),
    i18n,
    _i18n: i18n
  };
});

vi.mock('@components/peerTitle', () => ({
  default: class {
    element = document.createElement('span');
    constructor() {}
  }
}));

import type {MyDocument} from '@appManagers/appDocsManager';
import ChatTopbar from '@components/chat/topbar';
import {filterButtonMenuItems} from '@components/buttonMenuToggle';
import ChatContextMenu from '@components/chat/contextMenu';
import {ChatType} from '@components/chat/chatType';
import {
  exterayondSettings,
  setExterayondSetting,
  markDoubleTapMenuEvent,
  verifyCopyLinkContext
} from '@stores/exterayondSettings';

const chatPeerId = (300 as ChatId).toPeerId(true);

/**
 * A managers stub: every call answers `false` unless an override says
 * otherwise — the verifies read the answers only through `?.` and `&&`.
 * `acknowledged` namespaces its managers one level deeper.
 */
const managerOverrides: Record<string, Record<string, any>> = {};
const methodStub = () => Promise.resolve(false);
const managersStub = new Proxy({}, {
  get: (_t, domain: string) => {
    if(domain === 'acknowledged') {
      return new Proxy({}, {
        get: (_t2, manager: string) => {
          const mgr = managerOverrides.acknowledged?.[manager as string];
          return new Proxy({}, {
            get: (_t3, method: string) => mgr?.[method as string] ?? methodStub
          });
        }
      });
    }

    return new Proxy({}, {
      get: (_t2, method: string) => {
        const override = managerOverrides[domain]?.[method as string];
        if(override) return override;
        return methodStub;
      }
    });
  }
}) as any;

const makeChat = () => ({
  type: ChatType.Chat,
  peerId: chatPeerId,
  isMonoforum: false,
  isBroadcast: true,
  isMegagroup: true,
  threadId: undefined,
  monoforumThreadId: undefined,
  selection: {
    isSelecting: false,
    canSelectBubble: () => true,
    isMidSelected: () => false,
    selectedMids: new Map()
  },
  bubbles: {canForward: () => true, getRenderedLength: () => 1, getAvatarAuthorRank: (): undefined => undefined, toggleActiveBubble: () => {}},
  input: {messageInput: {}},
  appSettings: {},
  appConfig: {},
  canSend: () => true,
  canManageAutoDelete: () => Promise.resolve(false),
  getMidsByMid: () => Promise.resolve([500]),
  peerTranslation: {areTranslationsAvailable: () => false, canTranslate: () => false},
  appImManager: {setInnerPeer: vi.fn()},
  container: document.createElement('div')
}) as any;

const makeMessage = (media?: any) => ({
  _: 'message',
  mid: 500,
  peerId: chatPeerId,
  pFlags: {},
  message: '',
  ...(media ? {media} : {})
}) as any;

const STICKER_MEDIA: any = {
  _: 'messageMediaDocument',
  document: {_: 'document', id: BigInt(123), sticker: true} as unknown as MyDocument
};

const POLL_MEDIA: any = {
  _: 'messageMediaPoll',
  poll: {_: 'poll', id: BigInt(1), question: {_: 'textWithEntities', text: '', entities: []}, answers: [], pFlags: {}},
  results: {_: 'pollResults', results: [], pFlags: {}}
};

/** The message context menu's real open path: a contextmenu event over a bubble. */
const makeBubble = (container: HTMLElement, message: any) => {
  const bubble = document.createElement('div');
  bubble.className = 'bubble is-in';
  bubble.dataset.mid = '500';
  bubble.dataset.peerId = String(chatPeerId);
  (bubble as any).message = message;
  const target = document.createElement('span');
  bubble.append(target);
  container.append(bubble);
  return target;
};

const openContextMenu = async(contextMenu: ChatContextMenu, target: HTMLElement, options: {doubleTap?: boolean} = {}) => {
  const opened = deferred<HTMLElement>();
  controllerMock.openBtnMenu = (element) => opened.resolve(element);
  const event = new MouseEvent('contextmenu', {bubbles: true, cancelable: true});
  if(options.doubleTap) markDoubleTapMenuEvent(event);
  // * the real handler over a real event object: the target is what a real
  // * dispatch would give it (this jsdom reports touch support, so the
  // * attached listener only forwards reaction-element holds — the handler is
  // * what the desktop path feeds)
  Object.defineProperty(event, 'target', {value: target, configurable: true});
  contextMenu.onContextMenu(event);
  const element = await opened.promise;
  return {
    element,
    reactionsMenu: (contextMenu as any).reactionsMenu,
    rows: [...element.querySelectorAll('.btn-menu-item-text')].map((node) => node.textContent)
  };
};

describe('MENU-03 — the chat header menu composition gates', () => {
  beforeEach(() => {
    rootScopeMock.myId = (999 as UserId).toPeerId(false);
    managerOverrides.appProfileManager = {
      // * the cached full chat answers the linked discussion
      getCachedFullChat: () => Promise.resolve({_: 'chatFull', linked_chat_id: 400 as ChatId})
    };
    setExterayondSetting('ChatMenuItemBoostGroup', true);
    setExterayondSetting('ChatMenuItemLinkedChat', true);
  });

  it('keeps the boost and discussion rows at the defaults', async() => {
    const topbar = new ChatTopbar(makeChat(), {} as any, managersStub);
    topbar.constructUtils();
    const items = await filterButtonMenuItems((topbar as any).menuButtons);
    const texts = items.map((item) => item.text);
    expect(texts).toContain('BoostChannel');
    expect(texts).toContain('BoostGroup');
    expect(texts).toContain('ViewDiscussion');
  });

  it('drops the gated rows with the toggles off and returns them on re-open', async() => {
    const topbar = new ChatTopbar(makeChat(), {} as any, managersStub);
    topbar.constructUtils();
    setExterayondSetting('ChatMenuItemBoostGroup', false);
    setExterayondSetting('ChatMenuItemLinkedChat', false);

    // * the menu is built once; every open re-runs the verifies through
    // * filterButtonMenuItems — the same array, the toggles read live
    const closed = await filterButtonMenuItems((topbar as any).menuButtons);
    const closedTexts = closed.map((item) => item.text);
    expect(closedTexts).not.toContain('BoostChannel');
    expect(closedTexts).not.toContain('BoostGroup');
    expect(closedTexts).not.toContain('ViewDiscussion');

    setExterayondSetting('ChatMenuItemBoostGroup', true);
    setExterayondSetting('ChatMenuItemLinkedChat', true);
    const reopened = await filterButtonMenuItems((topbar as any).menuButtons);
    const reopenedTexts = reopened.map((item) => item.text);
    expect(reopenedTexts).toContain('BoostChannel');
    expect(reopenedTexts).toContain('BoostGroup');
    expect(reopenedTexts).toContain('ViewDiscussion');
  });

  it('reset restores the stock menu', async() => {
    setExterayondSetting('ChatMenuItemBoostGroup', false);
    setExterayondSetting('ChatMenuItemLinkedChat', false);
    // * the store's own reset (the hub's reset row) puts both back
    const {resetExterayondSettings} = await import('@stores/exterayondSettings');
    resetExterayondSettings();
    expect(exterayondSettings.ChatMenuItemBoostGroup).toBe(true);
    expect(exterayondSettings.ChatMenuItemLinkedChat).toBe(true);
  });
});

describe('MENU-05 — verifyCopyLinkContext (Android ChatActivity:50320)', () => {
  it('keeps the channel link row for stickers and polls with the toggle off', () => {
    expect(verifyCopyLinkContext(false, true, false)).toBe(true);
    expect(verifyCopyLinkContext(false, false, true)).toBe(true);
    expect(verifyCopyLinkContext(false, false, false)).toBe(false);
    expect(verifyCopyLinkContext(true, false, false)).toBe(true);
  });
});

describe('MENU-05 — the message context menu composition gates', () => {
  let container: HTMLElement;
  let contextMenu: ChatContextMenu;

  beforeEach(() => {
    rootScopeMock.myId = (999 as UserId).toPeerId(false);
    container = document.createElement('div');
    document.body.append(container);
    contextMenu = new ChatContextMenu(makeChat(), managersStub);
    contextMenu.attachTo(container);

    managerOverrides.appMessagesManager = {
      getGroupsFirstMessage: (message: any) => Promise.resolve(message),
      canForward: () => Promise.resolve(true)
    };
    managerOverrides.appPeersManager = {
      // * the web's link row lives in the channel menu
      isChannel: () => Promise.resolve(true),
      getPeerUsername: () => Promise.resolve(undefined)
    };
    delete managerOverrides.acknowledged;
    setExterayondSetting('Reactions', true);
    setExterayondSetting('CopyLink', true);
    setExterayondSetting('AddToFavorites', true);
  });

  afterEach(() => {
    contextMenu.destroy();
    container.remove();
  });

  it('hides the link row for a regular message with CopyLink off', async() => {
    setExterayondSetting('CopyLink', false);
    const target = makeBubble(container, makeMessage());
    const {rows} = await openContextMenu(contextMenu, target);
    expect(rows).not.toContain('MessageContext.CopyMessageLink1');
  });

  it('keeps the link row for a sticker message with CopyLink off', async() => {
    setExterayondSetting('CopyLink', false);
    const target = makeBubble(container, makeMessage(STICKER_MEDIA));
    const {rows} = await openContextMenu(contextMenu, target);
    expect(rows).toContain('MessageContext.CopyMessageLink1');
  });

  it('keeps the link row for a poll message with CopyLink off', async() => {
    setExterayondSetting('CopyLink', false);
    const target = makeBubble(container, makeMessage(POLL_MEDIA));
    const {rows} = await openContextMenu(contextMenu, target);
    expect(rows).toContain('MessageContext.CopyMessageLink1');
  });

  it('gates the favorites add direction but never the remove one', async() => {
    const favedStickers = {cached: true, result: Promise.resolve([])};
    managerOverrides.acknowledged = {
      appStickersManager: {
        getFavedStickersStickers: () => Promise.resolve(favedStickers)
      }
    };

    setExterayondSetting('AddToFavorites', false);
    const target = makeBubble(container, makeMessage(STICKER_MEDIA));
    const closed = await openContextMenu(contextMenu, target);
    expect(closed.rows).not.toContain('AddToFavorites');

    setExterayondSetting('AddToFavorites', true);
    const open = await openContextMenu(contextMenu, target);
    expect(open.rows).toContain('AddToFavorites');

    // * the sticker is already favorited: DeleteFromFavorites shows with the
    // * toggle off — Android's ungated delete direction
    (favedStickers as any).result = Promise.resolve([{id: BigInt(123)}]);
    setExterayondSetting('AddToFavorites', false);
    const remove = await openContextMenu(contextMenu, target);
    expect(remove.rows).toContain('DeleteFromFavorites');
    expect(remove.rows).not.toContain('AddToFavorites');
  });

  it('drops the reactions strip with Reactions off', async() => {
    setExterayondSetting('Reactions', false);
    const target = makeBubble(container, makeMessage());
    const open = await openContextMenu(contextMenu, target);
    expect(open.reactionsMenu).toBeUndefined();
  });

  it('keeps the strip for the double-tap Show Reactions menu with Reactions off', async() => {
    setExterayondSetting('Reactions', false);
    const target = makeBubble(container, makeMessage());
    const open = await openContextMenu(contextMenu, target, {doubleTap: true});
    expect(open.reactionsMenu).toBeDefined();
  });
});
