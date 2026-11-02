import {loadChatBubbles, LOAD_CHAT_BUBBLES_TIMEOUT} from '@/tests/helpers/chatBubbles';
import {setExteralessSetting} from '@stores/exteralessSettings';

/**
 * exteraless ConfirmAVMessage: the recording's release pauses into the
 * existing paused-preview state instead of sending; the preview's own send is
 * the explicit confirmation (Android `MediaController.stopRecording` send=2).
 */

let ChatRecording: typeof import('@components/chat/recording/chatRecording')['default'];
beforeAll(async() => {
  await loadChatBubbles();
  ({default: ChatRecording} = await import('@components/chat/recording/chatRecording'));
}, LOAD_CHAT_BUBBLES_TIMEOUT);

// * the real prototype handler over a stub instance: its prototype supplies
// * the helpers, the fields it reads are assigned, and the recordings'
// * actions are spies
const recordingHost = () => {
  const recorder = {stop: vi.fn(), pause: vi.fn(), resume: vi.fn()};
  const host = Object.create(ChatRecording.prototype) as any;
  host.active = true;
  host.recordingType = 'voice';
  host.recordPaused = false;
  host.recordAccumulatedMs = 5000; // * past RECORD_MIN_TIME with the running clock
  host.recordStartTime = Date.now();
  host.recorder = recorder;
  host.videoRecorder = undefined;
  host.onCancelRecordClick = vi.fn();
  host.onPauseToggleClick = vi.fn();
  host.stopPlayback = vi.fn();
  const press = () => host.handleSendButtonClick();
  return {host, recorder, press};
};

describe('ConfirmAVMessage', () => {
  afterEach(() => setExteralessSetting('ConfirmAVMessage', false));

  test('the release pauses for preview instead of sending while enabled', () => {
    setExteralessSetting('ConfirmAVMessage', true);
    const {host, recorder, press} = recordingHost();
    press();
    expect(host.onPauseToggleClick).toHaveBeenCalledTimes(1);
    expect(recorder.stop).not.toHaveBeenCalled();
  });

  test('the paused preview send commits the recording', () => {
    setExteralessSetting('ConfirmAVMessage', true);
    const {host, recorder, press} = recordingHost();
    host.recordPaused = true;
    press();
    expect(host.onPauseToggleClick).not.toHaveBeenCalled();
    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(host.stopPlayback).toHaveBeenCalledTimes(1);
  });

  test('disabled confirmation sends on release like stock', () => {
    const {host, recorder, press} = recordingHost();
    press();
    expect(host.onPauseToggleClick).not.toHaveBeenCalled();
    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(host.stopPlayback).toHaveBeenCalledTimes(1);
  });

  test('a too short recording is cancelled regardless of the setting', () => {
    setExteralessSetting('ConfirmAVMessage', true);
    const {host, recorder, press} = recordingHost();
    host.recordAccumulatedMs = 0;
    host.recordStartTime = Date.now();
    press();
    expect(host.onCancelRecordClick).toHaveBeenCalledTimes(1);
    expect(host.onPauseToggleClick).not.toHaveBeenCalled();
    expect(recorder.stop).not.toHaveBeenCalled();
  });
});
