import EventListenerBase from '@helpers/eventListenerBase';
import type {AppMediaPlaybackController} from '@components/appMediaPlaybackController';
import {audioDocument} from '@components/popupSandbox/fixtures';
import type {Message} from '@layer';

/** Disposable playback state; never plays media or contacts Telegram. */
export default function createMusicPlayerFixture(message: Message.message, trackDoc = audioDocument) {
  const events = new EventListenerBase<any>();
  const media = document.createElement('audio');
  let paused = true;
  Object.defineProperty(media, 'paused', {get: () => paused});
  const playbackParams = {volume: 1, muted: false, boost: 1, playbackRate: 1, loop: false, round: false};
  let track = 1;
  const details = () => ({
    doc: {...trackDoc, type: 'audio', duration: 214, attributes: [{
      _: 'documentAttributeAudio', pFlags: {}, duration: 214,
      title: `Sandbox Track ${track}`, performer: 'Mock Artist'
    }]},
    message, media, playbackParams, isSavedMusic: false, isLocal: true, isSlotted: false
  });
  const changeTrack = (delta: number) => {
    track = Math.max(1, track + delta);
    media.currentTime = 0;
    events.dispatchEvent('play', details());
  };
  const controller = Object.assign(events, {
    getPlayingDetails: details,
    previous: () => changeTrack(-1),
    next: () => changeTrack(1),
    toggle: () => {
      paused = !paused;
      media.dispatchEvent(new Event(paused ? 'pause' : 'play'));
    },
    cycleRepeatMode: () => {
      playbackParams.round = !playbackParams.round;
      events.dispatchEvent('playbackParams', {...playbackParams});
    },
    stop: () => events.dispatchEvent('stop')
  });
  return controller as unknown as AppMediaPlaybackController;
}
