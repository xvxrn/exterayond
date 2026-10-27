import '@helpers/peerIdPolyfill';
import {ChatType} from '@components/chat/chatType';
import {setExteralessSetting} from '@stores/exteralessSettings';
import showDeleteDialogPopup from '@components/popups/deleteDialog';
import showDeleteMessagesPopup from '@components/popups/deleteMessages';

const mocks = vi.hoisted(() => ({
  popup: vi.fn(),
  flushHistory: vi.fn(),
  deleteMessages: vi.fn(),
  message: {_: 'message', pFlags: {out: true}, media: undefined as any},
  managers: undefined as any
}));
vi.mock('@components/popups/peer', () => ({default: mocks.popup}));
vi.mock('@components/popups/indexTsx', () => ({addCancelButton: (buttons: unknown) => buttons}));
vi.mock('@components/popups/deleteMegagroupMessages', () => ({default: vi.fn()}));
vi.mock('@components/wrappers/peerTitle', () => ({default: async() => document.createTextNode('Test user')}));
vi.mock('@lib/rootScope', () => ({default: {
  myId: 99,
  get managers() {return mocks.managers;},
  addEventListener: vi.fn(),
  dispatchEventSingle: vi.fn()
}}));
vi.mock('@lib/accounts/bindManagersToAccount', () => ({bindManagersToSession: (managers: unknown) => managers}));
vi.mock('@lib/langPack', () => ({i18n: (key: string) => document.createTextNode(key)}));
vi.mock('@helpers/date', () => ({formatFullSentTime: vi.fn()}));

beforeEach(() => {
  vi.clearAllMocks();
  setExteralessSetting('DeleteChatForBothSides', true);
  mocks.message.media = undefined;
  mocks.managers = {
    appPeersManager: {isSavedDialog: async() => false, isBot: async() => false, isMegagroup: async() => false},
    appChatsManager: {hasRights: async() => true},
    appMessagesManager: {
      getMessageByPeer: async() => mocks.message,
      getScheduledMessageByPeer: async() => mocks.message,
      flushHistory: mocks.flushHistory,
      deleteMessages: mocks.deleteMessages
    }
  };
});
afterEach(() => setExteralessSetting('DeleteChatForBothSides', true));
const options = () => mocks.popup.mock.lastCall[1];

test.each([false, true])('preselects available private-chat and message choices only when preference=%s', async(checked) => {
  setExteralessSetting('DeleteChatForBothSides', checked);
  await showDeleteDialogPopup(123 as PeerId, 'chat');
  expect(options().checkboxes[0].checked).toBe(checked);
  expect(mocks.flushHistory).not.toHaveBeenCalled();
  // The user's choice at confirmation, including opting out, remains authoritative.
  options().buttons[0].callback(undefined, new Set(checked ? [] : ['DeleteMessagesOptionAlso']));
  expect(mocks.flushHistory).toHaveBeenCalledWith({peerId: 123, justClear: false, revoke: !checked});
  await showDeleteMessagesPopup(123 as PeerId, [1], ChatType.Chat);
  expect(options().checkboxes[0].checked).toBe(checked);
  expect(mocks.deleteMessages).not.toHaveBeenCalled();
  options().buttons[0].callback(undefined, new Set(checked ? [] : ['DeleteMessagesOptionAlso']));
  expect(mocks.deleteMessages).toHaveBeenCalledWith(123, [1], checked ? undefined : true);
});

test('does not preselect deleting a whole channel or add unavailable revoke choices', async() => {
  await showDeleteDialogPopup((-123).toPeerId(), 'channel');
  expect(options().checkboxes[0].text).toBe('DeleteChannelForAll');
  expect(options().checkboxes[0].checked).toBeUndefined();
  await showDeleteMessagesPopup(123 as PeerId, [1], ChatType.Scheduled);
  expect(options().checkboxes).toEqual([]);
  await showDeleteMessagesPopup(99 as PeerId, [1], ChatType.Chat);
  expect(options().checkboxes).toEqual([]);
  mocks.message.media = {_: 'messageMediaDice'};
  await showDeleteMessagesPopup(123 as PeerId, [1], ChatType.Chat);
  expect(options().checkboxes).toEqual([]);
});
