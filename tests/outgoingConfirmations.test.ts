import {loadChatBubbles, LOAD_CHAT_BUBBLES_TIMEOUT} from '@tests/helpers/chatBubbles';
import {setExterayondSetting, setOpenLinkConfirmation} from '@stores/exterayondSettings';
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
// * the popup's source line resolves the chat's title over the managers; the
// * fixture peer has none, and the line's presence is what the tests assert
vi.mock('@components/peerTitleTsx', () => ({
  PeerTitleTsx: (props: {peerId: PeerId, meAsNotes?: boolean}) => {
    const span = document.createElement('span');
    span.className = 'mock-peer-title';
    span.dataset.peerId = String(props.peerId);
    span.dataset.meAsNotes = String(!!props.meAsNotes);
    return span;
  }
}));
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
  setExterayondSetting('AskBeforeCalling', true);
});
afterEach(() => {
  setOpenLinkConfirmation(0);
  setExterayondSetting('AskBeforeCalling', true);
  setExterayondSetting('DisableClickCommandToSend', false);
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
  setExterayondSetting('SkipOpenLinkConfirm', true);
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
  setExterayondSetting('OEAppearanceMd3Player', true);
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
  for(const [current, nextMode] of [
    ['Exterayond.Md3.RepeatOff', 'Exterayond.Md3.RepeatPlaylist'],
    ['Exterayond.Md3.RepeatPlaylist', 'Exterayond.Md3.RepeatTrack'],
    ['Exterayond.Md3.RepeatTrack', 'Exterayond.Md3.RepeatOff']
  ] as const) {
    document.querySelector<HTMLButtonElement>(`button[aria-label="${I18n.format(current, true)}"]`).click();
    expect(document.querySelector(`button[aria-label="${I18n.format(nextMode, true)}"]`)).not.toBeNull();
  }
  setExterayondSetting('OEAppearanceMd3Player', false);
  await vi.waitFor(() => expect(PopupElement.POPUPS.length).toBe(0));
  controller.stop();
  setExterayondSetting('OEAppearanceMd3Player', true);
});

test('the MD3 player style settings reshape the popup live and keep the Android defaults', async() => {
  const {default: showMd3Player} = await import('@components/popups/md3Player');
  const {default: createMusicPlayerFixture} = await import('@components/popupSandbox/musicPlayerFixture');
  const {default: PopupElement} = await import('@components/popups/indexTsx');
  const {default: I18n} = await import('@lib/langPack');
  const styles = (await import('@components/popups/md3Player.module.scss')).default;
  setExterayondSetting('OEAppearanceMd3Player', true);
  const controller = createMusicPlayerFixture({pFlags: {}, peerId: 123, mid: 1} as any);
  showMd3Player(controller);
  await vi.waitFor(() => expect(document.body.textContent).toContain('Sandbox Track'));

  const content = document.querySelector<HTMLElement>(`.${styles.content}`);
  expect(content).not.toBeNull();
  const metadata = content.querySelector(`.${styles.metadata}`) as HTMLElement;
  const cover = content.querySelector(`.${styles.cover}`) as HTMLElement;

  // * Android defaults: card cover (no style class), title below, source and
  // * modes shown, wave on, size 100, radius 28, normal controls
  expect(content.classList.contains(styles['is-wide'])).toBe(false);
  expect(content.classList.contains(styles['is-disc'])).toBe(false);
  expect(cover.compareDocumentPosition(metadata) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(content.style.getPropertyValue('--oe-player-cover-size')).toBe('1');
  expect(content.style.getPropertyValue('--oe-player-cover-radius')).toBe('28px');
  expect(content.style.getPropertyValue('--oe-player-controls-scale')).toBe('1');

  const source = content.querySelector(`.${styles.source}`) as HTMLElement;
  expect(source.classList.contains(styles.hidden)).toBe(false);
  expect(source.getAttribute('aria-hidden')).toBe('false');
  expect(source.querySelector('.mock-peer-title').getAttribute('data-peer-id')).toBe('123');
  expect(content.querySelector(`.progress-line__wave`)).not.toBeNull();

  const nextLabel = I18n.format('KeyboardShortcuts.Action.NextMedia', true);
  const repeatLabel = I18n.format('Exterayond.Md3.RepeatOff', true);
  expect(content.querySelector(`button[aria-label="${repeatLabel}"]`)).not.toBeNull();

  // * PLAYER-15: modes off removes the repeat control, source off hides its row
  setExterayondSetting('OEPlayerShowModes', false);
  await vi.waitFor(() => expect(content.querySelector(`button[aria-label="${repeatLabel}"]`)).toBeNull());
  setExterayondSetting('OEPlayerShowSource', false);
  await vi.waitFor(() => expect(source.classList.contains(styles.hidden)).toBe(true));
  expect(source.getAttribute('aria-hidden')).toBe('true');

  // * PLAYER-02/03/04: the wide cover loses the radius rows' effect, the disc
  // * is a circle; size and radius travel as custom properties
  setExterayondSetting('OEPlayerCoverStyle', 1);
  await vi.waitFor(() => expect(content.classList.contains(styles['is-wide'])).toBe(true));
  setExterayondSetting('OEPlayerCoverSize', 60);
  setExterayondSetting('OEPlayerControlsSize', 0);
  await vi.waitFor(() => {
    expect(content.style.getPropertyValue('--oe-player-cover-size')).toBe('0.6');
    expect(content.style.getPropertyValue('--oe-player-controls-scale')).toBe('0.84');
  });

  // * PLAYER-10: the title moves above the cover only for the framed styles
  setExterayondSetting('OEPlayerTitleAbove', true);
  expect(cover.compareDocumentPosition(metadata) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  setExterayondSetting('OEPlayerCoverStyle', 3);
  await vi.waitFor(() => expect(content.classList.contains(styles['is-disc'])).toBe(true));
  expect(metadata.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

  // * PLAYER-05: the disc spins while playing and the setting turns it off
  controller.toggle();
  await vi.waitFor(() => expect(content.classList.contains(styles['is-spinning'])).toBe(true));
  setExterayondSetting('OEPlayerDiscSpin', false);
  await vi.waitFor(() => expect(content.classList.contains(styles['is-spinning'])).toBe(false));

  // * PLAYER-16: the wave rises with playback and flattens on pause. The test
  // * harness has no signed-in state, so liteMode is unset; the stock default
  // * has every animation available
  const {setAppSettingsSilent} = await import('@stores/appSettings');
  setAppSettingsSilent('liteMode', {all: false, animations: false, motion: false} as any);
  const waveContainer = content.querySelector(`.progress-line`) as HTMLElement;
  await vi.waitFor(() => expect(waveContainer.classList.contains('is-wavy')).toBe(true), {timeout: 5000});
  controller.toggle();

  // * the decay eases over ~70 frames, so it is asserted on a standalone bar
  // * with a pumped frame queue instead of wall-clock rAF
  const {default: WavyProgressLine} = await import('@components/wavyProgressLine');
  const frames: FrameRequestCallback[] = [];
  const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  try {
    const media = document.createElement('audio');
    const wave = new WavyProgressLine({}, 4);
    wave.setMedia({media, duration: 10});
    document.body.append(wave.container);
    (wave as any).width = 300;
    let now = 0;
    const pump = (count: number) => {
      for(let i = 0; i < count; ++i) frames.shift()?.(now += 16);
    };

    media.dispatchEvent(new Event('play'));
    pump(4);
    expect(wave.container.classList.contains('is-wavy')).toBe(true);
    expect((wave.container.querySelector('.progress-line__wave path') as SVGPathElement).getAttribute('d')).toContain('L');
    media.dispatchEvent(new Event('pause'));
    pump(150);
    expect(wave.container.classList.contains('is-wavy')).toBe(false);
    expect((wave.container.querySelector('.progress-line__wave path') as SVGPathElement).getAttribute('d')).toBeNull();
    // * a zero amplitude keeps the flat bar even while playing (OEPlayerWavy off)
    wave.setMaxAmplitude(0);
    media.dispatchEvent(new Event('play'));
    pump(4);
    expect(wave.container.classList.contains('is-wavy')).toBe(false);
    wave.removeListeners();
    wave.container.remove();
  } finally {
    rafSpy.mockRestore();
  }

  setExterayondSetting('OEAppearanceMd3Player', false);
  await vi.waitFor(() => expect(PopupElement.POPUPS.length).toBe(0));
  controller.stop();
  setExterayondSetting('OEAppearanceMd3Player', true);
  setExterayondSetting('OEPlayerShowModes', true);
  setExterayondSetting('OEPlayerShowSource', true);
  setExterayondSetting('OEPlayerCoverStyle', 0);
  setExterayondSetting('OEPlayerCoverSize', 100);
  setExterayondSetting('OEPlayerControlsSize', 1);
  setExterayondSetting('OEPlayerTitleAbove', false);
  setExterayondSetting('OEPlayerDiscSpin', true);
});

test.each(['voice', 'video'] as const)('the real %s call method waits for confirmation before leaving or starting a call', async(type) => {
  let resolve: () => void;
  state.confirm.mockReturnValue(new Promise<void>((r) => {resolve = r;}));
  const h = host();
  const pending = AppImManager.prototype.callUser.call(h, 123, type);
  await vi.waitFor(() => expect(state.confirm).toHaveBeenCalled());
  expect(state.confirm.mock.lastCall[0].descriptionLangKey).toBe(type === 'voice' ? 'Exterayond.ConfirmCall.Voice' : 'Exterayond.ConfirmCall.Video');
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
  setExterayondSetting('AskBeforeCalling', false);
  await AppImManager.prototype.callUser.call(h, 123, 'voice');
  expect(state.confirm).toHaveBeenCalledTimes(1);
  expect(state.startCall).toHaveBeenCalledOnce();
});

test('a clicked command preserves its original sending context and waits for consent', async() => {
  let resolve: () => void;
  state.confirm.mockReturnValue(new Promise<void>((r) => {resolve = r;}));
  setExterayondSetting('DisableClickCommandToSend', true);
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
