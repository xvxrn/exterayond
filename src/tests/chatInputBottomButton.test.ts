import '@/tests/mocks/chatInputIntegrationUi';
import '@helpers/peerIdPolyfill';
import ChatInput from '@components/chat/input';
import {ChatType} from '@components/chat/chatType';
import {i18n} from '@lib/langPack';
import type {LangPackKey} from '@lib/langPack';
import {getMiddleware, MiddlewareHelper} from '@helpers/middleware';
import ListenerSetter from '@helpers/listenerSetter';
import {setExteralessSetting} from '@stores/exteralessSettings';
import type {ChatFull} from '@layer';

vi.mock('@lib/appImManager', () => ({AppImManager: class {}, APP_TABS: {}, default: {}}));

/**
 * The channel "can't write" plate's centre button (OEChatsBottomButton). Its
 * label and its click must agree: Discuss opens the linked discussion chat,
 * anything else is the stock Mute/Unmute toggle. The preference is live while
 * the channel is open. The fixture drives the real ChatInput methods with the
 * managers, peers and DOM the production code uses.
 */

const CHANNEL_PEER_ID = -1001234567890 as PeerId;
const OTHER_CHANNEL_PEER_ID = -1009876543210 as PeerId;
const LINKED_CHAT_ID = 1234567890;
const REPLIES_PEER_ID_LOCAL = 1271266957 as PeerId;

const keyText = (key: LangPackKey) => i18n(key).textContent;
const label = (element: HTMLElement) => element.textContent;
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const linkedFull = () => ({
  _: 'channelFull',
  linked_chat_id: LINKED_CHAT_ID
}) as unknown as ChatFull.channelFull;

const deferred = <T>() => {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((r) => {resolve = r;});
  return {promise, resolve: resolve!};
};

type Options = {
  peerId?: PeerId,
  mode?: number,
  muted?: boolean,
  fullChat?: ChatFull.channelFull,
  getCachedFullChat?: (chatId: ChatId) => Promise<ChatFull.channelFull>,
  isPeerLocalMuted?: (params: {peerId: PeerId, respectType: boolean}) => Promise<boolean>
};

type Host = {
  chat: {peerId: PeerId},
  channelMuteBtnPeerId: PeerId,
  channelMuteBtnCanShow: boolean,
  discussTarget: {peerId: PeerId, peerIdToOpen: PeerId},
  updateChannelMuteButton(peerMuted?: boolean): void,
  onChannelMuteClick(): void,
  attachChannelMuteButton(): void,
  listenChannelMuteButtonPreference(): void
};

const middlewareHelpers: MiddlewareHelper[] = [];

const setup = (options: Options = {}) => {
  const {
    peerId = CHANNEL_PEER_ID,
    mode = 2,
    muted = false,
    fullChat,
    getCachedFullChat = async() => fullChat,
    isPeerLocalMuted = async() => muted
  } = options;

  const channelMuteBtn = document.createElement('button');
  const setInnerPeer = vi.fn();
  const togglePeerMute = vi.fn();
  const cachedFull = vi.fn(getCachedFullChat);
  const localMuted = vi.fn(isPeerLocalMuted);
  const destroyMiddlewareHelper = getMiddleware();
  middlewareHelpers.push(destroyMiddlewareHelper);
  const host = Object.assign(Object.create(ChatInput.prototype), {
    channelMuteBtn,
    discussTarget: undefined,
    channelMuteBtnCanShow: true,
    channelMuteBtnPeerId: peerId,
    listenerSetter: new ListenerSetter(),
    chat: {type: ChatType.Chat, peerId, appImManager: {setInnerPeer}, destroyMiddlewareHelper},
    managers: {
      appProfileManager: {getCachedFullChat: cachedFull},
      appNotificationsManager: {isPeerLocalMuted: localMuted},
      appMessagesManager: {togglePeerMute}
    },
    getMiddleware: () => () => true
  });

  setExteralessSetting('OEChatsBottomButton', mode);

  return {
    host: host as Host,
    channelMuteBtn,
    setInnerPeer,
    togglePeerMute,
    cachedFull,
    localMuted
  };
};

afterEach(() => {
  middlewareHelpers.splice(0).forEach((helper) => helper.destroy());
  setExteralessSetting('OEChatsBottomButton', 1);
  setExteralessSetting('OEAddCommaAfterMention', true);
});

test.each([
  [true, {_: 'user', id: 123, username: 'test_user', pFlags: {}}, '@test_user, '],
  [false, {_: 'user', id: 123, username: 'test_user', pFlags: {}}, '@test_user '],
  [true, {_: 'user', id: 123, username: 'test_bot', pFlags: {bot: true}}, '@test_bot '],
  [true, {_: 'user', id: 123, first_name: 'Test', pFlags: {}}, 'Test '],
  [true, {_: 'channel', id: 123, username: 'test_channel', pFlags: {}}, '@test_channel, ']
] as const)('mention punctuation follows Android for preference=%s and peer=%j', async(enabled, peer, expected) => {
  setExteralessSetting('OEAddCommaAfterMention', enabled);
  const insertAtCaret = vi.fn();
  const host = {
    chat: {peerId: 456},
    getMiddleware: () => () => true,
    managers: {appPeersManager: {getPeer: async() => peer}},
    insertAtCaret
  };
  ChatInput.prototype.mentionUser.call(host, (peer._ === 'channel' ? -123 : 123) as PeerId, true);
  await flush();
  expect(insertAtCaret).toHaveBeenCalledWith(expected, peer._ === 'user' && !('username' in peer) ? {
    _: 'messageEntityMentionName', length: 4, offset: 0, user_id: 123
  } : undefined, true);
});

test('a delayed mention cannot be inserted into another chat', async() => {
  const pending = deferred<any>();
  const insertAtCaret = vi.fn();
  const host = {
    chat: {peerId: 456},
    getMiddleware: () => () => true,
    managers: {appPeersManager: {getPeer: () => pending.promise}},
    insertAtCaret
  };
  ChatInput.prototype.mentionUser.call(host, 123 as PeerId);
  host.chat.peerId = 789;
  pending.resolve({_: 'user', id: 123, username: 'test_user', pFlags: {}});
  await flush();
  expect(insertAtCaret).not.toHaveBeenCalled();
});

test('the registered DOM click reaches the handler with the ChatInput receiver', async() => {
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute} = setup({fullChat: linkedFull()});

  host.attachChannelMuteButton();
  host.updateChannelMuteButton(false);
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ViewDiscussion'));

  channelMuteBtn.click();
  expect(setInnerPeer).toHaveBeenCalledWith({peerId: LINKED_CHAT_ID.toPeerId(true)});
  expect(togglePeerMute).not.toHaveBeenCalled();
});

test('linked discussion: the label says Discuss and the click opens the linked chat', async() => {
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute} = setup({fullChat: linkedFull()});

  host.updateChannelMuteButton(false);
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ViewDiscussion'));

  host.onChannelMuteClick();
  expect(setInnerPeer).toHaveBeenCalledWith({peerId: LINKED_CHAT_ID.toPeerId(true)});
  expect(togglePeerMute).not.toHaveBeenCalled();
});

test.each([false, true])('no linked discussion: the stock mute button still acts (muted: %s)', async(muted) => {
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute} = setup({muted});

  host.updateChannelMuteButton();
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText(muted ? 'ChatList.Context.Unmute' : 'ChatList.Context.Mute'));

  host.onChannelMuteClick();
  expect(togglePeerMute).toHaveBeenCalledWith({peerId: CHANNEL_PEER_ID});
  expect(setInnerPeer).not.toHaveBeenCalled();
});

test('a late cached full answer does not relabel or navigate another chat', async() => {
  const pending = deferred<ChatFull.channelFull>();
  const getCachedFullChat = (chatId: ChatId) => chatId === CHANNEL_PEER_ID.toChatId() ?
    pending.promise :
    Promise.resolve(undefined);
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute} = setup({getCachedFullChat});

  host.updateChannelMuteButton(false);
  await flush();

  host.chat.peerId = OTHER_CHANNEL_PEER_ID;
  host.channelMuteBtnPeerId = OTHER_CHANNEL_PEER_ID;
  host.updateChannelMuteButton(false);
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));

  pending.resolve(linkedFull());
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));

  host.onChannelMuteClick();
  expect(togglePeerMute).toHaveBeenCalledWith({peerId: OTHER_CHANNEL_PEER_ID});
  expect(setInnerPeer).not.toHaveBeenCalled();
});

test('a late mute answer does not relabel the next chat', async() => {
  const pending = deferred<boolean>();
  const isPeerLocalMuted = ({peerId}: {peerId: PeerId}) => peerId === CHANNEL_PEER_ID ?
    pending.promise :
    Promise.resolve(false);
  const {host, channelMuteBtn, togglePeerMute} = setup({mode: 1, isPeerLocalMuted});

  host.updateChannelMuteButton();
  host.chat.peerId = OTHER_CHANNEL_PEER_ID;
  host.channelMuteBtnPeerId = OTHER_CHANNEL_PEER_ID;
  host.updateChannelMuteButton(false);
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));

  pending.resolve(true);
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));

  host.onChannelMuteClick();
  expect(togglePeerMute).toHaveBeenCalledWith({peerId: OTHER_CHANNEL_PEER_ID});
});

test('2 -> 1 while the cached full answer is pending keeps the stock mute action', async() => {
  const pending = deferred<ChatFull.channelFull>();
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute} = setup({getCachedFullChat: () => pending.promise});

  host.listenChannelMuteButtonPreference();
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));

  setExteralessSetting('OEChatsBottomButton', 1);
  await flush();
  pending.resolve(linkedFull());
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));

  host.onChannelMuteClick();
  expect(togglePeerMute).toHaveBeenCalledWith({peerId: CHANNEL_PEER_ID});
  expect(setInnerPeer).not.toHaveBeenCalled();
});

test('2 -> 1 after the discussion resolved returns to the stock mute label and action', async() => {
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute} = setup({fullChat: linkedFull(), muted: true});

  host.listenChannelMuteButtonPreference();
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ViewDiscussion'));

  setExteralessSetting('OEChatsBottomButton', 1);
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Unmute'));

  host.onChannelMuteClick();
  expect(togglePeerMute).toHaveBeenCalledWith({peerId: CHANNEL_PEER_ID});
  expect(setInnerPeer).not.toHaveBeenCalled();
});

test('0 -> 1 restores an eligible plate and its stock label', async() => {
  const {host, channelMuteBtn} = setup({mode: 0});

  host.listenChannelMuteButtonPreference();
  await flush();
  expect(channelMuteBtn.classList.contains('hide')).toBe(true);

  setExteralessSetting('OEChatsBottomButton', 1);
  await flush();
  expect(channelMuteBtn.classList.contains('hide')).toBe(false);
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));
});

test.each([0, 1])('mode %s keeps the stock Mute/Unmute button and never reads the full chat', async(mode) => {
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute, cachedFull} = setup({mode, muted: true});

  host.updateChannelMuteButton();
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Unmute'));
  expect(cachedFull).not.toHaveBeenCalled();

  host.onChannelMuteClick();
  expect(togglePeerMute).toHaveBeenCalledWith({peerId: CHANNEL_PEER_ID});
  expect(setInnerPeer).not.toHaveBeenCalled();
});

test.each([1, 2])('the Replies chat keeps its stock Mute button in mode %s', async(mode) => {
  const {host, channelMuteBtn, setInnerPeer, togglePeerMute, cachedFull} = setup({peerId: REPLIES_PEER_ID_LOCAL, mode});

  host.updateChannelMuteButton(false);
  await flush();
  expect(label(channelMuteBtn)).toBe(keyText('ChatList.Context.Mute'));
  expect(cachedFull).not.toHaveBeenCalled();

  host.onChannelMuteClick();
  expect(togglePeerMute).toHaveBeenCalledWith({peerId: REPLIES_PEER_ID_LOCAL});
  expect(setInnerPeer).not.toHaveBeenCalled();
});
