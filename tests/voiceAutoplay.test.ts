import {stubBrowserGlobals} from '@/tests/helpers/browserGlobals';
import {setExteralessSetting} from '@stores/exteralessSettings';

vi.mock('@lib/apiManagerProxy', () => ({default: {
  addEventListener: () => {},
  getState: () => Promise.resolve({})
}}));

let handleEnded: (this: any) => void;
let cycleRepeatMode: (this: any) => void;
beforeAll(async() => {
  stubBrowserGlobals();
  const {AppMediaPlaybackController} = await import('@components/appMediaPlaybackController');
  handleEnded = (AppMediaPlaybackController.prototype as any).handleEnded;
  cycleRepeatMode = AppMediaPlaybackController.prototype.cycleRepeatMode;
}, 60000);
afterEach(() => setExteralessSetting('DontAutoPlayNextVoice', false));

test('both music players share the existing repeat off / playlist / track cycle', () => {
  const owner = {round: false, loop: false};
  cycleRepeatMode.call(owner);
  expect(owner).toEqual({round: true, loop: false});
  cycleRepeatMode.call(owner);
  expect(owner).toEqual({round: true, loop: true});
  cycleRepeatMode.call(owner);
  expect(owner).toEqual({round: false, loop: false});
});

test.each([
  ['voice', false, true],
  ['voice', true, false],
  ['audio', true, true],
  ['round', true, true]
])('end of %s with preference %s: next=%s', (playingDocType, enabled, advances) => {
  setExteralessSetting('DontAutoPlayNextVoice', enabled as boolean);
  const owner = {
    playingDocType,
    round: playingDocType === 'round',
    lockedSwitchers: false,
    listLoader: {current: {}, getNext: () => [{}]},
    onPause: vi.fn(),
    next: vi.fn(() => true),
    stop: vi.fn(),
    dispatchEvent: vi.fn()
  };
  handleEnded.call(owner);
  expect(owner.onPause).toHaveBeenCalledTimes(1);
  expect(owner.next).toHaveBeenCalledTimes(advances ? 1 : 0);
  expect(owner.stop).toHaveBeenCalledTimes(advances ? 0 : 1);
  expect(owner.dispatchEvent.mock.calls).toEqual(advances ? [] : [['stop']]);
});
