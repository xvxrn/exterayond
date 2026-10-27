import {loadChatBubbles, LOAD_CHAT_BUBBLES_TIMEOUT} from '@/tests/helpers/chatBubbles';
import {resetExteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';
import {ChatType} from '@components/chat/chatType';
import type {FullMid} from '@components/chat/bubbles';
import type {Message} from '@layer';
import '@helpers/peerIdPolyfill';
import {getMiddleware} from '@helpers/middleware';

const stickerMocks = vi.hoisted(() => ({render: vi.fn(async(_options: any) => ({render: Promise.resolve()}))}));
const hintMocks = vi.hoisted(() => ({show: vi.fn((_options: any) => ({close: vi.fn()}))}));
vi.mock('@components/tooltip', () => ({default: hintMocks.show}));
vi.mock('@components/wrappers/sticker', () => ({
  default: stickerMocks.render,
  StickerTsx: vi.fn(),
  fireStickerEffect: vi.fn(),
  STICKER_EFFECT_MULTIPLIER: 1.49,
  videosCache: {}
}));

/**
 * `DisableNumberRounding` rewrites the views counters already on screen through
 * `ChatBubbles.refreshPostViews` (`exteraless_settings_updated`), without a
 * re-render. The fixture drives that method on a real `ChatBubbles.prototype`
 * with the DOM and messages the production code reads:
 * - two peers can hold the same numeric mid in mixed/global history, so the
 *   label is re-read through the bubble's full mid, never the bare mid;
 * - one DOM bubble filed under several ids is touched once;
 * - only labels whose text changed are rewritten, and the scroll is saved once,
 *   before the first write, restored once;
 * - a missing message, a zero count, an unchanged label or a bubble without a
 *   `.post-views` node is skipped without throwing;
 * - no message re-render, no manager/network read.
 */

let ChatBubbles: typeof import('@components/chat/bubbles').default;
let makeFullMid: typeof import('@components/chat/bubbles').makeFullMid;
let MessageRender: typeof import('@components/chat/messageRender').MessageRender;
let showMessageTimeHint: typeof import('@components/chat/messageTimeHint').showMessageTimeHint;

const PEER_A = 123 as PeerId;
const PEER_B = 456 as PeerId;
const MID = 7;
const NBSP = '\u00A0';

beforeAll(async() => {
  const loaded = await loadChatBubbles();
  ChatBubbles = loaded.bubbles.default;
  makeFullMid = loaded.bubbles.makeFullMid;
  MessageRender = (await import('@components/chat/messageRender')).MessageRender;
  showMessageTimeHint = (await import('@components/chat/messageTimeHint')).showMessageTimeHint;
  const {default: I18n} = await import('@lib/langPack');
  const {default: storage} = await import('@lib/commonStateStorage');
  vi.spyOn(storage, 'get').mockResolvedValue({
    _: 'langPackDifference', lang_code: 'en', from_version: 0, version: 1,
    strings: ['Sent', 'Edited', 'Forwarded'].map((name) => ({
      _: 'langPackString', key: 'Exteraless.TimeHint.' + name, value: name + ': %1$s'
    }))
  });
  await I18n.getCacheLangPackAndApply();
  const {setAppStateSilent} = await import('@stores/appState');
  setAppStateSilent('appConfig', {});
}, LOAD_CHAT_BUBBLES_TIMEOUT);

beforeEach(() => {
  resetExteralessSettings();
  hintMocks.show.mockClear();
});

test('forward headers use the original date only when enabled; saved date and missing dates do not leak', () => {
  const m = {...message(PEER_A, MID, 0), fwd_from: {
    _: 'messageFwdHeader', pFlags: {}, date: 1700000000, saved_date: 1800000000
  }} as Message.message;
  const header = document.createElement('div');
  header.textContent = 'Forwarded from Test author';
  MessageRender.appendForwardedDate(header, m);
  expect(header.textContent).toBe('Forwarded from Test author');
  setExteralessSetting('DateOfForwardedMsg', true);
  MessageRender.appendForwardedDate(header, m);
  const date = header.querySelector('.bubble-forward-date');
  expect(date).not.toBeNull();
  expect(date.textContent).toContain('2023');
  expect(date.textContent).not.toContain('2027');
  expect(header.textContent).toMatch(/^Forwarded from Test author\u00A0· /);
  const noDate = document.createElement('div');
  MessageRender.appendForwardedDate(noDate, {...m, fwd_from: {...m.fwd_from, date: 0}});
  MessageRender.appendForwardedDate(noDate, message(PEER_A, MID, 0));
  expect(noDate.children).toHaveLength(0);
});

test('time hints are opt-in, omit imported/scheduled messages and build exact sent, edited and forward times on demand', async() => {
  const m = {...message(PEER_A, MID, 0), date: 1700000000, edit_date: 1700000060, fwd_from: {
    _: 'messageFwdHeader', pFlags: {}, date: 1600000000, saved_date: 1800000000
  }} as Message.message;
  const target = document.createElement('span');
  const container = document.createElement('div');
  expect(showMessageTimeHint(m, ChatType.Chat, target, container)).toBe(false);
  expect(hintMocks.show).not.toHaveBeenCalled();
  setExteralessSetting('ShowTimeHint', true);
  expect(showMessageTimeHint(m, ChatType.Scheduled, target, container)).toBe(false);
  expect(showMessageTimeHint({...m, fwd_from: {...m.fwd_from, pFlags: {imported: true}}}, ChatType.Chat, target, container)).toBe(false);
  expect(showMessageTimeHint(m, ChatType.Chat, target, container)).toBe(true);
  const options = hintMocks.show.mock.lastCall[0] as any;
  expect(options.element).toBe(target);
  expect(options.container).toBe(container);
  const rows = options.textElement.children as HTMLCollection;
  expect(rows).toHaveLength(3);
  expect(rows[0].textContent).toMatch(/2023.*\d{1,2}:\d{2}:\d{2}/);
  expect(rows[1].textContent).toContain('2023');
  expect(rows[2].textContent).toContain('2020');
  expect(options.textElement.textContent).not.toContain('2027');
  const {default: navigation} = await import('@components/appNavigationController');
  const {item} = navigation.findItemByType('toast');
  expect(item.noHistory).toBe(true);
  expect(item.noBlurOnPop).toBe(true);
  item.onPop(false);
  expect(hintMocks.show.mock.results[0].value.close).toHaveBeenCalledOnce();
  showMessageTimeHint({...m, pFlags: {edit_hide: true}, fwd_from: undefined}, ChatType.Pinned, target, container);
  expect((hintMocks.show.mock.lastCall[0] as any).textElement.children).toHaveLength(1);
  setExteralessSetting('ShowTimeHint', false);
  expect(showMessageTimeHint(m, ChatType.Chat, target, container)).toBe(false);
});

test('saved forward hover dates convert seconds to milliseconds before formatting', () => {
  const saved = 1800000000;
  const m = {...message(PEER_A, MID, 0), date: 1700000000, fwd_from: {
    _: 'messageFwdHeader', pFlags: {}, date: 1600000000, saved_date: saved
  }} as Message.message;
  setExteralessSetting('ShowTimeHint', true);
  const time = MessageRender.setTime({
    chat: {getPostAuthor: () => ''} as any, chatType: ChatType.Chat,
    message: m, isOut: false, middleware: getMiddleware().get()
  });
  expect(time.querySelector('.time-inner').getAttribute('title')).toContain('Original: ' + new Date(saved * 1000).getDate());
  expect(time.querySelector('.time-inner').getAttribute('title')).toContain('2027');
  expect(time.getAttribute('role')).toBeNull();
  expect(time.querySelector('.time-inner').getAttribute('role')).toBe('button');
});

afterEach(() => {
  for(const [options] of hintMocks.show.mock.calls) options.onClose?.();
  document.body.replaceChildren();
  resetExteralessSettings();
});

function message(peerId: PeerId, mid: number, views: number): Message.message {
  return {_: 'message', pFlags: {}, id: mid, mid, peerId, views} as unknown as Message.message;
}

function createHarness() {
  const root = document.createElement('div');
  document.body.append(root);

  const messages = new Map<FullMid, Message.message>();
  const getMessage = vi.fn((fullMid: FullMid) => messages.get(fullMid));
  /** the labels as they were when `save()` ran, so a write before the save shows up */
  const saves: Array<{reverse: boolean, labels: Array<string | null>}> = [];
  const restore = vi.fn();
  const createScrollSaver = vi.fn((reverse: boolean) => ({
    save: () => saves.push({
      reverse,
      labels: [...root.querySelectorAll<HTMLElement>('.post-views')].map((label) => label.textContent)
    }),
    restore
  }));
  const safeRenderMessage = vi.fn();
  const registry: Record<string, HTMLElement> = {};

  const harness = Object.assign(Object.create(ChatBubbles.prototype), {
    chat: {
      type: ChatType.Chat,
      peerId: PEER_A,
      getMessage
    },
    bubbles: registry,
    createScrollSaver,
    safeRenderMessage,
    // * any manager read here is a network path this refresh must not take
    managers: new Proxy({}, {get: () => {
      throw new Error('unexpected manager access');
    }})
  }) as any;

  const labels = () => [...root.querySelectorAll<HTMLElement>('.post-views')];

  return {
    harness,
    root,
    messages,
    registry,
    getMessage,
    saves,
    restore,
    createScrollSaver,
    safeRenderMessage,
    labels,
    /** a bubble with one label per value; `[]` makes a bubble with no `.post-views` node */
    bubble(peerId: PeerId, mid: number, texts: Array<string | null>) {
      const bubble = document.createElement('div');
      bubble.classList.add('bubble');
      bubble.dataset.peerId = '' + peerId;
      bubble.dataset.mid = '' + mid;

      for(const text of texts) {
        if(text === null) continue;
        const label = document.createElement('span');
        label.classList.add('post-views');
        label.textContent = text;
        bubble.append(label);
      }

      root.append(bubble);
      return bubble;
    }
  };
}

test('each peer reads its own message for a shared mid; one scroll save, existing nodes kept', () => {
  const h = createHarness();
  const fullMidA = makeFullMid(PEER_A, MID);
  const fullMidB = makeFullMid(PEER_B, MID);
  h.messages.set(fullMidA, message(PEER_A, MID, 1000));
  h.messages.set(fullMidB, message(PEER_B, MID, 2500));

  const bubbleA = h.bubble(PEER_A, MID, ['1K', '1K']);
  const bubbleB = h.bubble(PEER_B, MID, ['2.5K']);
  h.registry[fullMidA] = bubbleA;
  h.registry[fullMidB] = bubbleB;
  // * the same node can be filed under another id (a grouped message keeps its own and its
  // * group's): the refresh must visit it once, through the id its dataset names
  h.registry[makeFullMid(PEER_A, MID + 1)] = bubbleA;

  const nodes = h.labels();
  setExteralessSetting('DisableNumberRounding', true);
  h.harness.refreshPostViews();

  expect(h.labels()).toEqual(nodes);
  expect(h.labels().map((label) => label.textContent)).toEqual([
    '1' + NBSP + '000',
    '1' + NBSP + '000',
    '2' + NBSP + '500'
  ]);
  expect(h.getMessage.mock.calls.map(([fullMid]) => fullMid)).toEqual([fullMidA, fullMidB]);
  expect(h.createScrollSaver).toHaveBeenCalledTimes(1);
  expect(h.createScrollSaver).toHaveBeenCalledWith(true);
  // * saved before the first write: the snapshot is still the compact text
  expect(h.saves).toEqual([{reverse: true, labels: ['1K', '1K', '2.5K']}]);
  expect(h.restore).toHaveBeenCalledTimes(1);
  expect(h.safeRenderMessage).not.toHaveBeenCalled();
  expect(h.root.children.length).toBe(2);

  // * exact -> compact rewrites the same nodes, not new ones
  setExteralessSetting('DisableNumberRounding', false);
  h.harness.refreshPostViews();

  expect(h.labels()).toEqual(nodes);
  expect(h.labels().map((label) => label.textContent)).toEqual(['1K', '1K', '2.5K']);
  expect(h.createScrollSaver).toHaveBeenCalledTimes(2);
  expect(h.saves[1]).toEqual({reverse: true, labels: ['1' + NBSP + '000', '1' + NBSP + '000', '2' + NBSP + '500']});
  expect(h.restore).toHaveBeenCalledTimes(2);

  // * nothing left to change: no second save or restore
  h.harness.refreshPostViews();
  expect(h.createScrollSaver).toHaveBeenCalledTimes(2);
  expect(h.restore).toHaveBeenCalledTimes(2);
});

test('unchanged, missing, zero and label-less bubbles are skipped without a scroll save', () => {
  const h = createHarness();

  const unchanged = h.bubble(PEER_A, 1, ['1K']);
  h.messages.set(makeFullMid(PEER_A, 1), message(PEER_A, 1, 1000));

  const missing = h.bubble(PEER_A, 2, ['old']);
  const zero = h.bubble(PEER_A, 3, ['0']);
  h.messages.set(makeFullMid(PEER_A, 3), message(PEER_A, 3, 0));

  const noLabels = h.bubble(PEER_A, 4, []);
  h.messages.set(makeFullMid(PEER_A, 4), message(PEER_A, 4, 1000));

  h.registry[makeFullMid(PEER_A, 1)] = unchanged;
  h.registry[makeFullMid(PEER_A, 2)] = missing;
  h.registry[makeFullMid(PEER_A, 3)] = zero;
  h.registry[makeFullMid(PEER_A, 4)] = noLabels;

  expect(() => h.harness.refreshPostViews()).not.toThrow();

  expect(h.labels().map((label) => label.textContent)).toEqual(['1K', 'old', '0']);
  expect(h.getMessage).toHaveBeenCalledTimes(3);
  expect(h.getMessage).not.toHaveBeenCalledWith(makeFullMid(PEER_A, 4));
  expect(h.createScrollSaver).not.toHaveBeenCalled();
  expect(h.restore).not.toHaveBeenCalled();
  expect(h.safeRenderMessage).not.toHaveBeenCalled();
});

test('HIDE-16 keeps the empty-chat text without fetching or mounting a greeting sticker', async() => {
  setExteralessSetting('DontSendGreetingSticker', true);
  const middleware = getMiddleware();
  const getGreetingSticker = vi.fn();
  const getProfile = vi.fn(async() => ({}));
  const owner = {
    managers: {appStickersManager: {getGreetingSticker}, appProfileManager: {getProfile}},
    getMiddleware: () => middleware.get()
  };
  const elements: HTMLElement[] = [];
  await (ChatBubbles.prototype as any).renderEmptyPlaceholder.call(
    owner, 'greeting', document.createElement('div'), {peerId: PEER_A}, elements
  );
  expect(getGreetingSticker).not.toHaveBeenCalled();
  expect(getProfile).toHaveBeenCalledWith(PEER_A.toUserId());
  expect(elements).toHaveLength(2);
  expect(elements[0].classList.contains('empty-bubble-placeholder-title')).toBe(true);
  expect(elements[1].classList.contains('empty-bubble-placeholder-subtitle')).toBe(true);
  middleware.destroy();
});

test('chat sticker sizing updates attachment and render dimensions while preserving emoji and explicit boxes', async() => {
  const {default: mediaSizes} = await import('@helpers/mediaSizes');
  const {makeMediaSize} = await import('@helpers/mediaSize');
  const base = mediaSizes.active.staticSticker.width;
  const doc = {
    _: 'document' as const, id: '42', access_hash: '0', file_reference: new Uint8Array(),
    date: 0, mime_type: 'image/webp' as const, size: 1, dc_id: 1, attributes: [] as never[],
    w: 512, h: 256, type: 'sticker' as const, thumbs: [] as never[], pFlags: {}
  };
  const harness = {chat: {animationGroup: 'CHAT-TEST'}};
  const render = async(value: number, emoji = false, boxSize?: ReturnType<typeof makeMediaSize>) => {
    setExteralessSetting('stickerSize', value);
    const container = document.createElement('div');
    const bubble = document.createElement('div');
    if(emoji) bubble.classList.add('emoji-big');
    const bubbleContainer = document.createElement('div');
    await ChatBubbles.prototype.wrapSticker.call(harness, {
      bubble, bubbleContainer, middleware: () => true, loadPromises: []
    } as any, {doc, container, boxSize});
    return {width: parseFloat(container.style.width), height: parseFloat(container.style.height), minWidth: bubbleContainer.style.minWidth, options: stickerMocks.render.mock.lastCall[0]};
  };
  const stock = await render(14);
  expect(stock.width).toBe(base);
  const enlarged = await render(20);
  expect(enlarged.width).toBe(base * 1.375);
  expect(enlarged.minWidth).toBe(enlarged.width + 'px');
  expect(enlarged.options.width).toBe(enlarged.width);
  expect(enlarged.options.height).toBe(enlarged.height);
  expect(Math.abs(enlarged.height * 2 - enlarged.width)).toBeLessThanOrEqual(1);
  expect((await render(4)).width).toBe(base * 0.375);
  expect((await render(20, true)).width).toBe(mediaSizes.active.emojiSticker.width);
  expect((await render(20, false, makeMediaSize(96, 96))).width).toBe(96);
});

test('sender visibility guards the real menu without touching paid reactions or the chosen sender', async() => {
  const menu = await import('@components/buttonMenuToggle');
  const spy = vi.spyOn(menu, 'default').mockImplementation(() => document.createElement('button'));
  const {default: ChatSendAs} = await import('@components/chat/sendAs');
  const onChange = vi.fn();
  const sender = new ChatSendAs({managers: {} as any, onReady: vi.fn(), onChange});
  const canOpen = spy.mock.lastCall[0].canOpen;
  expect(canOpen()).toBe(true);
  setExteralessSetting('hideSendAsChannel', true);
  expect(canOpen()).toBe(false);
  expect(onChange).not.toHaveBeenCalled();
  const reactions = new ChatSendAs({managers: {} as any, forPaidReaction: true, onReady: vi.fn(), onChange});
  expect(spy.mock.lastCall[0].canOpen()).toBe(true);
  setExteralessSetting('hideSendAsChannel', false);
  expect(canOpen()).toBe(true);
  sender.destroy();
  reactions.destroy();
  spy.mockRestore();
});

test('hiding header status never removes premium, verification or scam data from other titles', async() => {
  const {default: generateTitleIcons} = await import('@components/generateTitleIcons');
  setExteralessSetting('OEAppearanceHideActionBarStatus', true);
  const {elements} = await generateTitleIcons({
    peerId: PEER_A,
    peer: {_: 'user', id: PEER_A, pFlags: {premium: true, verified: true, scam: true}} as any,
    wrapOptions: {middleware: getMiddleware().get()}
  });
  expect(elements.some((el) => el.classList.contains('premium-icon'))).toBe(true);
  expect(elements.some((el) => el.classList.contains('verified-icon'))).toBe(true);
  expect(elements.some((el) => el.classList.contains('badge-fake'))).toBe(true);
});
