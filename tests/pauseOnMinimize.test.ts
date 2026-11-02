/**
 * exteraless pause-on-minimize (MEDIA-13/14/15): the real playback
 * controller's visibilitychange handler pauses the playing media by its
 * document type — video (`NekoConfig.autoPauseVideo`, default on), voice
 * notes and round videos (`ChatsConfig`, default off) — and never music.
 */
import {loadChatBubbles, LOAD_CHAT_BUBBLES_TIMEOUT} from '@tests/helpers/chatBubbles';
import {setExteralessSetting} from '@stores/exteralessSettings';

let appMediaPlaybackController: typeof import('@components/appMediaPlaybackController')['default'];
beforeAll(async() => {
  await loadChatBubbles();
  appMediaPlaybackController = (await import('@components/appMediaPlaybackController')).default;
  // * the app wires the controller's listeners on sign-in (appImManager.construct);
  // * the harness has no session, so the visibilitychange listener needs the same call
  appMediaPlaybackController.construct({
    appMessagesManager: {reportMusicListen: () => Promise.resolve()}
  } as any);
}, LOAD_CHAT_BUBBLES_TIMEOUT);

afterEach(() => {
  setExteralessSetting('AutoPauseVideo', true);
  setExteralessSetting('OEChatsPauseVoice', false);
  setExteralessSetting('OEChatsPauseRound', false);
});

/** Pretend the given document type is playing, hide the tab once, report whether it paused. */
function hideTabWhilePlaying(docType: string): boolean {
  const controller = appMediaPlaybackController as any;
  const pause = vi.spyOn(controller, 'pause').mockReturnValue(true);
  const wasHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
  Object.defineProperty(document, 'hidden', {value: true, configurable: true});
  const playingMedia = controller.playingMedia;
  const playingDocType = controller.playingDocType;
  controller.playingMedia = {paused: false};
  controller.playingDocType = docType;
  try {
    document.dispatchEvent(new Event('visibilitychange'));
    return pause.mock.calls.length > 0;
  } finally {
    if(wasHidden) Object.defineProperty(document, 'hidden', wasHidden);
    else delete (document as any).hidden;
    controller.playingMedia = playingMedia;
    controller.playingDocType = playingDocType;
    pause.mockRestore();
  }
}

test('hiding the tab pauses video by default and never music', () => {
  expect(hideTabWhilePlaying('video')).toBe(true);
  expect(hideTabWhilePlaying('audio')).toBe(false);
});

test('the three Android toggles each own their document type', () => {
  // * the stock defaults: voice and round keep playing, video pauses
  expect(hideTabWhilePlaying('voice')).toBe(false);
  expect(hideTabWhilePlaying('round')).toBe(false);
  setExteralessSetting('OEChatsPauseVoice', true);
  setExteralessSetting('OEChatsPauseRound', true);
  expect(hideTabWhilePlaying('voice')).toBe(true);
  expect(hideTabWhilePlaying('round')).toBe(true);
  // * the video toggle off returns the stock web behavior
  setExteralessSetting('AutoPauseVideo', false);
  expect(hideTabWhilePlaying('video')).toBe(false);
});
