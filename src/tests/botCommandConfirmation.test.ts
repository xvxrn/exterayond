import ChatBotCommands from '@components/chat/botCommands';
import CommandsHelper from '@components/chat/commandsHelper';
import '@helpers/peerIdPolyfill';
import {setExteralessSetting} from '@stores/exteralessSettings';
import deferred from '@/tests/helpers/deferred';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  select: undefined as (target: Element) => boolean | Promise<boolean>,
  hide: vi.fn(),
  hideAutocomplete: vi.fn()
}));
vi.mock('@components/confirmationPopup', () => ({default: mocks.confirm}));
vi.mock('@lib/accounts/getCurrentAccount', () => ({getCurrentAccount: () => 1}));
vi.mock('@lib/rootScope', () => ({default: {addEventListener: vi.fn(), dispatchEventSingle: vi.fn()}}));
vi.mock('@components/chat/processPeerFullForCommands', () => ({default: vi.fn()}));
vi.mock('@components/chat/hideCommandAutocomplete', () => ({default: mocks.hideAutocomplete}));
vi.mock('@lib/apiManagerProxy', () => ({default: {getPeer: () => ({_: 'user', username: 'test_bot', pFlags: {bot: true}})}}));
vi.mock('@components/chat/autocompletePeerHelper', () => ({default: class {
  static BASE_CLASS_LIST_ELEMENT = 'test-command';
  toggle = mocks.hide;
  constructor(_append: unknown, _controller: unknown, _className: unknown, select: typeof mocks.select) {
    mocks.select = select;
  }
}}));

beforeEach(() => {
  vi.clearAllMocks();
  setExteralessSetting('DisableClickCommandToSend', true);
});
afterEach(() => setExteralessSetting('DisableClickCommandToSend', false));

function menu() {
  let current = true;
  const sendMessage = vi.fn();
  const setValueSilently = vi.fn();
  new ChatBotCommands(document.createElement('div'), {
    getMiddleware: () => () => current,
    getReadyToSend: (callback: () => void) => {callback(); return false;},
    sendMessage,
    messageInputField: {setValueSilently}
  } as any, {} as any);
  const target = document.createElement('div');
  target.innerHTML = '<span class="test-command-name">/start@test_bot</span>';
  return {select: () => mocks.select(target), sendMessage, setValueSilently, leave: () => {current = false;}};
}

test('a menu command waits for consent, preserving the draft until confirmation', async() => {
  const pending = deferred();
  mocks.confirm.mockReturnValue(pending.promise);
  const m = menu();
  const selected = m.select();
  expect(mocks.confirm.mock.lastCall[0].descriptionLangArgs).toEqual(['/start@test_bot']);
  expect(m.sendMessage).not.toHaveBeenCalled();
  expect(m.setValueSilently).not.toHaveBeenCalled();
  pending.resolve();
  await selected;
  expect(m.setValueSilently).toHaveBeenCalledWith('/start@test_bot');
  expect(m.sendMessage).toHaveBeenCalledWith(true);
  expect(mocks.hide).toHaveBeenCalledWith(true);
});

test('cancel keeps both the draft and menu navigation available', async() => {
  mocks.confirm.mockRejectedValue(undefined);
  const m = menu();
  expect(await m.select()).toBe(true);
  expect(m.sendMessage).not.toHaveBeenCalled();
  expect(m.setValueSilently).not.toHaveBeenCalled();
  expect(mocks.hide).not.toHaveBeenCalled();
});

test('a command cannot send into a chat left while consent was pending', async() => {
  const pending = deferred();
  mocks.confirm.mockReturnValue(pending.promise);
  const m = menu();
  const selected = m.select();
  m.leave();
  pending.resolve();
  await selected;
  expect(m.sendMessage).not.toHaveBeenCalled();
  expect(m.setValueSilently).not.toHaveBeenCalled();
});

test('disabled confirmation keeps the immediate command path', () => {
  setExteralessSetting('DisableClickCommandToSend', false);
  const m = menu();
  m.select();
  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(m.sendMessage).toHaveBeenCalledOnce();
});

test('autocomplete asks before sending and preserves the ephemeral receiver', async() => {
  mocks.confirm.mockResolvedValue(undefined);
  const sendMessage = vi.fn();
  const setValueSilently = vi.fn();
  const controller = {};
  new CommandsHelper(document.createElement('div'), controller as any, {
    chat: {peerId: (-123).toPeerId()},
    getMiddleware: () => () => true,
    getReadyToSend: (callback: () => void) => {callback(); return false;},
    sendMessage,
    messageInputField: {setValueSilently}
  } as any, {} as any);
  const target = document.createElement('div');
  target.dataset.peerId = '321';
  target.dataset.ephemeral = '1';
  target.innerHTML = '<span class="test-command-name">/help</span>';
  await mocks.select(target);
  expect(mocks.confirm.mock.lastCall[0].descriptionLangArgs).toEqual(['/help@test_bot']);
  expect(sendMessage).toHaveBeenCalledWith(true, 321);
  expect(mocks.hideAutocomplete).toHaveBeenCalledWith(controller);
  mocks.hideAutocomplete.mockClear();
  sendMessage.mockClear();
  setValueSilently.mockClear();
  mocks.confirm.mockRejectedValue(undefined);
  expect(await mocks.select(target)).toBe(true);
  expect(sendMessage).not.toHaveBeenCalled();
  expect(setValueSilently).not.toHaveBeenCalled();
  expect(mocks.hideAutocomplete).not.toHaveBeenCalled();
});
