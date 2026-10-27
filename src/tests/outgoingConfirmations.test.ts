import {loadChatBubbles, LOAD_CHAT_BUBBLES_TIMEOUT} from '@/tests/helpers/chatBubbles';
import {setExteralessSetting, setOpenLinkConfirmation} from '@stores/exteralessSettings';
import addAnchorListener from '@helpers/addAnchorListener';
import '@helpers/peerIdPolyfill';

const state = vi.hoisted(() => ({
  confirm: vi.fn(),
  startCall: vi.fn(),
  existingCall: vi.fn(),
  account: {
    accountNumber: 1,
    myId: 99,
    managers: {appProfileManager: {getProfile: vi.fn(async() => ({pFlags: {}}))}}
  }
}));
vi.mock('@components/confirmationPopup', () => ({default: state.confirm}));
vi.mock('@components/wrappers/getPeerTitle', () => ({default: async() => document.createTextNode('Test user')}));
vi.mock('@lib/calls/callsController', () => ({default: {
  getCallByUserId: state.existingCall,
  startCallInternal: state.startCall
}}));
vi.mock('@lib/calls/callAccount', () => ({captureCallAccount: () => state.account}));
vi.mock('@lib/calls/noiseSuppression/noiseSuppression', () => ({preloadNoiseSuppression: vi.fn()}));

let AppImManager: typeof import('@lib/appImManager')['AppImManager'];
let appImManager: typeof import('@lib/appImManager')['default'];
let InternalLinkProcessor: typeof import('@lib/internalLinkProcessor')['InternalLinkProcessor'];
beforeAll(async() => {
  await loadChatBubbles();
  const loaded = await import('@lib/appImManager');
  AppImManager = loaded.AppImManager;
  appImManager = loaded.default;
  InternalLinkProcessor = (await import('@lib/internalLinkProcessor')).InternalLinkProcessor;
}, LOAD_CHAT_BUBBLES_TIMEOUT);
beforeEach(() => {
  vi.clearAllMocks();
  state.confirm.mockResolvedValue(undefined);
  state.existingCall.mockReturnValue(undefined);
  setExteralessSetting('AskBeforeCalling', true);
});
afterEach(() => {
  setOpenLinkConfirmation(0);
  setExteralessSetting('AskBeforeCalling', true);
  setExteralessSetting('DisableClickCommandToSend', false);
  appImManager.chats = [];
});

test('the real link question supports hidden, All and Never without running the continuation early', async() => {
  const popupModule = await import('@components/popups/peer');
  const popup = vi.spyOn(popupModule, 'default').mockReturnValue({} as any);
  new InternalLinkProcessor().construct({} as any);
  const anchor = document.createElement('a');
  anchor.href = 'https://destination.example/path';
  anchor.textContent = 'A different destination';
  const execute = vi.fn();
  setOpenLinkConfirmation(0);
  const opened = (window as any).showMaskedAlert(anchor, undefined, execute);
  expect(execute).not.toHaveBeenCalled();
  expect(popup).toHaveBeenCalledOnce();
  const options = popup.mock.lastCall[1];
  expect((options.descriptionLangArgs[0] as HTMLElement).textContent).toBe(anchor.href);
  expect((options.descriptionLangArgs[0] as HTMLElement).tagName).toBe('SPAN');
  const approvedHref = anchor.href;
  anchor.href = 'https://changed.example/';
  options.buttons[0].callback(undefined, undefined);
  options.buttons[0].callback(undefined, undefined);
  await opened;
  expect(execute).toHaveBeenCalledOnce();
  expect(execute.mock.lastCall[0].href).toBe(approvedHref);

  popup.mockClear();
  execute.mockClear();
  setOpenLinkConfirmation(2);
  (window as any).showMaskedAlert(anchor, undefined, execute);
  expect(popup).not.toHaveBeenCalled();
  expect(execute).toHaveBeenCalledOnce();

  popup.mockClear();
  execute.mockClear();
  setOpenLinkConfirmation(1);
  setExteralessSetting('SkipOpenLinkConfirm', true);
  anchor.textContent = anchor.href;
  const cancellation = (window as any).showMaskedAlert(anchor, undefined, execute);
  expect(popup).toHaveBeenCalledOnce();
  expect(execute).not.toHaveBeenCalled();
  popup.mock.lastCall[1].onCloseAfterTimeout();
  expect(await cancellation).toBeUndefined();
  expect(execute).not.toHaveBeenCalled();
  popup.mockRestore();
});

test('Telegram links wait for Open once and a changed account session drops the pending action', async() => {
  const popupModule = await import('@components/popups/peer');
  const popup = vi.spyOn(popupModule, 'default').mockReturnValue({} as any);
  const {getCurrentAccount, setCurrentAccount} = await import('@lib/accounts/getCurrentAccount');
  const originalAccount = getCurrentAccount();
  new InternalLinkProcessor().construct({} as any);
  const execute = vi.fn((_params: {uriParams?: Record<string, string>}) => Promise.resolve('original result'));
  addAnchorListener({name: 'im', callback: execute});
  const anchor = document.createElement('a');
  anchor.href = 'https://t.me/example/42?thread=7';
  anchor.textContent = anchor.href;
  setOpenLinkConfirmation(1);
  const result = (window as any).im(anchor);
  expect(execute).not.toHaveBeenCalled();
  popup.mock.lastCall[1].buttons[0].callback(undefined, undefined);
  expect(await result).toBe('original result');
  expect(execute).toHaveBeenCalledOnce();
  expect(popup).toHaveBeenCalledOnce();
  expect(execute.mock.lastCall[0].uriParams.thread).toBe('7');
  execute.mockClear();
  (window as any).im(anchor);
  const pending = popup.mock.lastCall[1].buttons[0].callback;
  setCurrentAccount(originalAccount === 1 ? 2 : 1);
  pending(undefined, undefined);
  expect(execute).not.toHaveBeenCalled();
  setCurrentAccount(originalAccount);
  popup.mockRestore();
});

function host() {
  return {
    managers: {},
    callTransitions: {run: (callback: () => Promise<void>) => callback()},
    discardCurrentCall: vi.fn(async() => {})
  };
}

test('the real MD3 music popup follows media events, delegates controls and closes when disabled', async() => {
  const {default: showMd3Player} = await import('@components/popups/md3Player');
  const {default: createMusicPlayerFixture} = await import('@components/popupSandbox/musicPlayerFixture');
  const {default: PopupElement} = await import('@components/popups/indexTsx');
  const {default: I18n} = await import('@lib/langPack');
  setExteralessSetting('OEAppearanceMd3Player', true);
  const controller = createMusicPlayerFixture({pFlags: {}, peerId: 123, mid: 1} as any);
  const toggle = vi.spyOn(controller, 'toggle');
  const next = vi.spyOn(controller, 'next');
  showMd3Player(controller);
  await vi.waitFor(() => expect(document.body.textContent).toContain('Sandbox Track'));
  const play = document.querySelector<HTMLButtonElement>('button[aria-label="Play"]');
  expect(play).not.toBeNull();
  play.click();
  expect(toggle).toHaveBeenCalledOnce();
  expect(document.querySelector('button[aria-label="Pause"]')).not.toBeNull();
  const nextLabel = I18n.format('KeyboardShortcuts.Action.NextMedia', true);
  document.querySelector<HTMLButtonElement>(`button[aria-label="${nextLabel}"]`).click();
  expect(next).toHaveBeenCalledOnce();
  expect(document.body.textContent).toContain('Sandbox Track 2');
  setExteralessSetting('OEAppearanceMd3Player', false);
  await vi.waitFor(() => expect(PopupElement.POPUPS.length).toBe(0));
  controller.stop();
  setExteralessSetting('OEAppearanceMd3Player', true);
});

test.each(['voice', 'video'] as const)('the real %s call method waits for confirmation before leaving or starting a call', async(type) => {
  let resolve: () => void;
  state.confirm.mockReturnValue(new Promise<void>((r) => {resolve = r;}));
  const h = host();
  const pending = AppImManager.prototype.callUser.call(h, 123, type);
  await vi.waitFor(() => expect(state.confirm).toHaveBeenCalled());
  expect(state.confirm.mock.lastCall[0].descriptionLangKey).toBe(type === 'voice' ? 'Exteraless.ConfirmCall.Voice' : 'Exteraless.ConfirmCall.Video');
  expect(h.discardCurrentCall).not.toHaveBeenCalled();
  expect(state.startCall).not.toHaveBeenCalled();
  resolve();
  await pending;
  expect(h.discardCurrentCall).toHaveBeenCalledWith(123, 'Call');
  expect(state.startCall).toHaveBeenCalledWith(123, type === 'video', state.account);
});

test('cancellation stops a call while disabled confirmation preserves the existing call path', async() => {
  const h = host();
  state.confirm.mockRejectedValue(undefined);
  await AppImManager.prototype.callUser.call(h, 123, 'voice');
  expect(h.discardCurrentCall).not.toHaveBeenCalled();
  expect(state.startCall).not.toHaveBeenCalled();
  setExteralessSetting('AskBeforeCalling', false);
  await AppImManager.prototype.callUser.call(h, 123, 'voice');
  expect(state.confirm).toHaveBeenCalledTimes(1);
  expect(state.startCall).toHaveBeenCalledOnce();
});

test('a clicked command preserves its original sending context and waits for consent', async() => {
  let resolve: () => void;
  state.confirm.mockReturnValue(new Promise<void>((r) => {resolve = r;}));
  setExteralessSetting('DisableClickCommandToSend', true);
  const sendText = vi.fn();
  let current = true;
  appImManager.chats = [{
    peerId: 123,
    threadId: 42,
    bubbles: {getMiddleware: () => () => current},
    input: {getEphemeralSendingSnapshot: () => ({peerId: 123, threadId: 42, ephemeral: true, replyToMsgId: 77})}
  } as any];
  new InternalLinkProcessor().construct({appMessagesManager: {sendText}} as any);
  const anchor = document.createElement('a');
  anchor.href = 'tg://bot_command?command=start&bot=test_bot';
  const invoke = () => (window as any).execBotCommand(anchor);
  const pending = invoke();
  expect(sendText).not.toHaveBeenCalled();
  resolve();
  await pending;
  expect(sendText).toHaveBeenCalledWith({peerId: 123, threadId: 42, ephemeral: true, replyToMsgId: 77, text: '/start@test_bot'});
  sendText.mockClear();
  state.confirm.mockReturnValue(new Promise<void>((r) => {resolve = r;}));
  const stale = invoke();
  current = false;
  resolve();
  await stale;
  expect(sendText).not.toHaveBeenCalled();
});
