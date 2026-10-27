import '@helpers/peerIdPolyfill';
import ListenerSetter from '@helpers/listenerSetter';
import GroupSetController from '@components/emoticonsDropdown/groupSet';
import {setExteralessSetting} from '@stores/exteralessSettings';

vi.mock('@lib/rootScope', () => ({default: {addEventListener: vi.fn(), removeEventListener: vi.fn()}}));

const set = {_: 'stickerSet', id: '42', title: 'Test group pack', pFlags: {}} as any;
const listeners: ListenerSetter[] = [];
const makeController = (isEmoji = false) => {
  const listenerSetter = new ListenerSetter();
  listeners.push(listenerSetter);
  const getChatFull = vi.fn(async() => ({_: 'channelFull', pFlags: {can_set_stickers: true}, stickerset: set, emojiset: set}));
  const render = vi.fn();
  const remove = vi.fn();
  const controller = new GroupSetController({
    managers: {
      appProfileManager: {getChatFull},
      appChatsManager: {getChat: async() => ({_: 'channel', pFlags: {megagroup: true, creator: true}})}
    } as any,
    listenerSetter,
    isEmoji,
    getPeerId: () => (-123).toPeerId(),
    isHidden: () => false,
    isInstalled: () => false,
    render,
    remove
  });
  return {controller, getChatFull, render, remove};
};

beforeEach(() => setExteralessSetting('hideGroupSticker', false));
afterEach(() => {
  listeners.splice(0).forEach((listener) => listener.removeAll());
  setExteralessSetting('hideGroupSticker', false);
});

test('hides even the admin group section without fetching and restores it on the next panel open', async() => {
  const h = makeController();
  await h.controller.update();
  expect(h.render).toHaveBeenCalledOnce();
  setExteralessSetting('hideGroupSticker', true);
  await h.controller.update();
  expect(h.remove).toHaveBeenCalledOnce();
  expect(h.getChatFull).toHaveBeenCalledOnce();
  expect(h.controller.getCurrentSet()).toBeUndefined();
  setExteralessSetting('hideGroupSticker', false);
  await h.controller.update();
  expect(h.render).toHaveBeenCalledTimes(2);
});

test('does not bring back a pending group set after hiding is enabled', async() => {
  const h = makeController();
  const pending = h.controller.update();
  setExteralessSetting('hideGroupSticker', true);
  await pending;
  expect(h.render).not.toHaveBeenCalled();
});

test('keeps the group emoji pack available', async() => {
  setExteralessSetting('hideGroupSticker', true);
  const h = makeController(true);
  await h.controller.update();
  expect(h.render).toHaveBeenCalledWith({set, canEdit: true, hidden: false});
});
