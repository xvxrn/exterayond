/**
 * The mini-player rows (PLAYER-24/27/29/30) over the pinned-audio plate
 * (`chat/audio.tsx`, the web owner of Android's `PlayerMiniView`). Each gate
 * is a composition toggle over the live plate: off = the stock plate, on/off
 * flips what `PlayerMiniView.applyStyle` flips on Android. The store helpers
 * (defaults, ranges, the progress mapping) are covered in the store suite —
 * this file drives the REAL plate with the playback controller stubbed.
 */

import {createRoot} from 'solid-js';

// * the plate binds to the controller singleton with EventListenerBase-style
// * add/remove; the fake calls its listeners straight with the payload, the
// * way `dispatchEvent(name, ...args)` does
const controllerMock = vi.hoisted(() => {
  const instance = {
    previous: vi.fn(),
    next: vi.fn(),
    toggle: vi.fn(),
    stop: vi.fn(),
    cycleRepeatMode: vi.fn(),
    getPlaybackParams: () => ({playbackRate: 1, loop: false, round: false}),
    getPlayingDetails: (): undefined => undefined,
    getSearchContext: () => ({}),
    listeners: {} as Record<string, Array<(payload?: any) => void>>,
    addEventListener(name: string, callback: (payload?: any) => void) {
      (instance.listeners[name] ??= []).push(callback);
    },
    removeEventListener(name: string, callback: (payload?: any) => void) {
      instance.listeners[name] = (instance.listeners[name] ?? []).filter((cb) => cb !== callback);
    },
    emit(name: string, payload?: any) {
      for(const callback of instance.listeners[name] ?? []) callback(payload);
    }
  };
  return instance;
});

vi.mock('@components/appMediaPlaybackController', () => ({
  default: controllerMock,
  AppMediaPlaybackController: class {}
}));

vi.mock('@lib/langPack', () => ({
  default: {
    format: (key: string) => key
  },
  i18n: (key: string) => {
    const element = document.createElement('span');
    element.textContent = key;
    return element;
  },
  _i18n: (key: string) => {
    const element = document.createElement('span');
    element.textContent = key;
    return element;
  }
}));

vi.mock('@components/peerTitle', () => ({
  default: class {
    element = document.createElement('span');
  }
}));

vi.mock('@helpers/date', () => ({
  formatFullSentTime: () => 'sent time'
}));

vi.mock('@appManagers/utils/docs/getAudioTitles', () => ({
  default: (doc: any) => doc?.type === 'music' ? {title: doc.title, performer: doc.performer} : undefined
}));

vi.mock('@lib/richTextProcessor/wrapEmojiText', () => ({
  default: (text: any) => text
}));

vi.mock('@components/mediaProgressLine', () => ({
  default: class {
    container = document.createElement('div');
    setMedia() {}
    removeListeners() {}
  }
}));

vi.mock('@components/volumeSelector', () => ({
  default: class {
    container = document.createElement('div');
    btn = document.createElement('button');
    setMaxVolume() {}
    setGlobalVolume() {}
  }
}));

vi.mock('@components/playbackRateButton', () => ({
  PlaybackRateButton: () => {
    const element = document.createElement('button');
    return {element, setIcon: () => {}, closeMenu: () => {}};
  }
}));

vi.mock('@components/audioAnimatedIcon', () => ({
  default: () => {
    const element = document.createElement('div');
    return {element, play: () => {}};
  },
  createPlayPauseIcon: () => () => {}
}));

vi.mock('@components/singleTransition', () => ({
  default: ({element, className, forwards}: {element: HTMLElement, className: string, forwards?: boolean}) => {
    element.classList.toggle(className, !!forwards);
  }
}));

vi.mock('@lib/apiManagerProxy', () => ({
  default: new Proxy({}, {get: (): (() => undefined) => () => undefined})
}));

vi.mock('@components/savedMusicActions', () => ({
  openSavedMusicTab: vi.fn()
}));

vi.mock('@components/wrappers/photo', () => ({
  default: vi.fn(() => Promise.resolve())
}));

import createChatAudio from '@components/chat/audio';
import {setExterayondSetting, resetExterayondSettings} from '@stores/exterayondSettings';
import {readFile} from 'fs/promises';
import wrapPhoto from '@components/wrappers/photo';

const musicDetails = (): any => ({
  doc: {type: 'music', duration: 100, thumbs: [{}], title: 'Song', performer: 'Artist'},
  message: {peerId: 1, mid: 1, fromId: 1, date: 0, fwd_from: undefined},
  media: {
    paused: false,
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  playbackParams: {playbackRate: 1, loop: false, round: false},
  isSavedMusic: false,
  isLocal: false,
  isSlotted: false
});

const voiceDetails = (): any => ({
  doc: {type: 'voice', duration: 10, thumbs: []},
  message: {peerId: 1, mid: 2, fromId: 1, date: 0, fwd_from: undefined},
  media: {
    paused: false,
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  playbackParams: {playbackRate: 1, loop: false, round: false},
  isSavedMusic: false,
  isLocal: false,
  isSlotted: false
});

describe('the mini-player gates over the pinned-audio plate', () => {
  let disposeRoot: () => void;
  let destroy: () => void;

  const nextButton = () => document.querySelector<HTMLElement>('[aria-label="KeyboardShortcuts.Action.NextMedia"]');
  const closeButton = () => document.querySelector<HTMLElement>('.pinned-container-close');
  const subtitle = () => document.querySelector<HTMLElement>('.pinned-container-subtitle');
  const progressWrapper = () => document.querySelector<HTMLElement>('.pinned-audio-progress-wrapper');

  beforeEach(() => {
    localStorage.clear();
    resetExterayondSettings();
    document.body.replaceChildren();
    const root = createRoot((dispose) => {
      const controller = createChatAudio({} as any, {} as any);
      document.body.append(controller.container);
      destroy = controller.destroy;
      disposeRoot = dispose;
    });
    void root;
  });

  afterEach(() => {
    destroy?.();
    disposeRoot?.();
    document.body.replaceChildren();
    resetExterayondSettings();
  });

  test('the stock plate: artist, next, close and the progress line all show', () => {
    controllerMock.emit('play', musicDetails());

    expect(document.querySelector('.pinned-audio.is-music')).toBeTruthy();
    expect(subtitle().textContent).toContain('Artist');
    expect(subtitle().textContent).toContain('•');
    expect(nextButton().classList.contains('hide')).toBe(false);
    expect(closeButton().classList.contains('hide')).toBe(false);
    expect(progressWrapper()).toBeTruthy();
  });

  test('PLAYER-27: the artist leaves the subtitle, the time stays, the voice date is not an artist', () => {
    controllerMock.emit('play', musicDetails());

    setExterayondSetting('OEPlayerMiniArtist', false);
    expect(subtitle().textContent).not.toContain('Artist');
    expect(subtitle().textContent).not.toContain('•');
    expect(subtitle().querySelector('.pinned-audio-time')).toBeTruthy();

    // * back on: the artist returns without a replay
    setExterayondSetting('OEPlayerMiniArtist', true);
    expect(subtitle().textContent).toContain('Artist');

    // * a voice message's subtitle is a date — the toggle must not touch it
    controllerMock.emit('play', voiceDetails());
    setExterayondSetting('OEPlayerMiniArtist', false);
    expect(subtitle().textContent).toContain('sent time');

    setExterayondSetting('OEPlayerMiniArtist', true);
  });

  test('PLAYER-29/30: the next-track and close buttons leave with their toggles off', () => {
    controllerMock.emit('play', musicDetails());

    setExterayondSetting('OEPlayerMiniNext', false);
    expect(nextButton().classList.contains('hide')).toBe(true);
    setExterayondSetting('OEPlayerMiniNext', true);
    expect(nextButton().classList.contains('hide')).toBe(false);

    setExterayondSetting('OEPlayerMiniClose', false);
    expect(closeButton().classList.contains('hide')).toBe(true);
    setExterayondSetting('OEPlayerMiniClose', true);
    expect(closeButton().classList.contains('hide')).toBe(false);
  });

  test('PLAYER-24: only the "none" progress mode removes the line', () => {
    controllerMock.emit('play', musicDetails());

    setExterayondSetting('OEPlayerMiniProgress', 2);
    expect(progressWrapper()).toBeNull();

    // * the ring and the border have no web surface: the line stays
    setExterayondSetting('OEPlayerMiniProgress', 0);
    expect(progressWrapper()).toBeTruthy();
    setExterayondSetting('OEPlayerMiniProgress', 3);
    expect(progressWrapper()).toBeTruthy();

    setExterayondSetting('OEPlayerMiniProgress', 0);
  });

  test('the gates re-evaluate when the pinned audio changes and across close/reopen', () => {
    // * a second track with different metadata and a stop/play cycle are the
    // * plate's real lifecycle: the gates read the store live, so they survive
    // * both without a re-mount
    setExterayondSetting('OEPlayerMiniArtist', false);
    setExterayondSetting('OEPlayerMiniNext', false);

    controllerMock.emit('play', musicDetails());
    expect(subtitle().textContent).not.toContain('Artist');

    // * a voice in between: the date is not an artist, the plate leaves
    // * is-music — the gate must not eat the date
    controllerMock.emit('play', voiceDetails());
    expect(subtitle().textContent).toContain('sent time');

    // * the plate closes and reopens with another track: the gates hold
    controllerMock.emit('stop', undefined);
    expect(document.querySelector('.pinned-audio.is-visible')).toBeNull();
    controllerMock.emit('play', {...musicDetails(), doc: {...musicDetails().doc, title: 'Other', performer: 'Other Artist'}});
    expect(document.querySelector('.pinned-audio.is-music')).toBeTruthy();
    expect(subtitle().textContent).not.toContain('Other Artist');
    expect(nextButton().classList.contains('hide')).toBe(true);

    // * the toggles come back live on the mounted plate, no replay needed
    setExterayondSetting('OEPlayerMiniArtist', true);
    setExterayondSetting('OEPlayerMiniNext', true);
    expect(subtitle().textContent).toContain('Other Artist');
    expect(nextButton().classList.contains('hide')).toBe(false);
  });

  test('the shape/cover root classes stay scoped to the MD3 mini player block', async() => {
    // * the rows are on, the MD3 mini player master is off: the override
    // * classes ride the root together with `oe-md3-mini-player`, whose SCSS
    // * block is the only place they select anything — nothing leaks to the
    // * stock plate
    const source = await readFile('src/scss/partials/_chatPinned.scss', 'utf-8');
    const overrides = source.match(/^:root\.oe-md3-mini-player\.oe-md3-mini-(?:shape|cover)[^\n{]*\{/gm) ?? [];
    expect(overrides.length).toBeGreaterThanOrEqual(4);
    for(const selector of overrides) {
      expect(selector).toContain('oe-md3-mini-player');
    }

    setExterayondSetting('OEAppearanceMd3MiniPlayer', false);
    setExterayondSetting('OEPlayerMiniShape', 1);
    setExterayondSetting('OEPlayerMiniCover', 2);
    expect(document.documentElement.classList.contains('oe-md3-mini-shape-pill')).toBe(true);
    expect(document.documentElement.classList.contains('oe-md3-mini-cover-hidden')).toBe(true);
    expect(document.documentElement.classList.contains('oe-md3-mini-player')).toBe(false);

    // * the master on: the pair selects and the card repaints
    setExterayondSetting('OEAppearanceMd3MiniPlayer', true);
    expect(document.documentElement.classList.contains('oe-md3-mini-player')).toBe(true);
    setExterayondSetting('OEAppearanceMd3MiniPlayer', false);
    setExterayondSetting('OEPlayerMiniShape', 0);
    setExterayondSetting('OEPlayerMiniCover', 0);
  });

  test('PLAYER-22: a hidden cover does not fetch the artwork it has no box for', () => {
    const wrapCalls = () => (wrapPhoto as any).mock.calls.length as number;

    setExterayondSetting('OEPlayerMiniCover', 1);
    controllerMock.emit('play', musicDetails());
    const afterRound = wrapCalls();
    expect(afterRound).toBeGreaterThan(0);

    // * hidden: the next track wraps nothing
    setExterayondSetting('OEPlayerMiniCover', 2);
    controllerMock.emit('play', {...musicDetails(), doc: {...musicDetails().doc, title: 'Second'}});
    expect(wrapCalls()).toBe(afterRound);

    // * the mode back while the plate plays: the artwork fetches live
    setExterayondSetting('OEPlayerMiniCover', 0);
    expect(wrapCalls()).toBe(afterRound + 1);
    setExterayondSetting('OEPlayerMiniCover', 0);
  });
});
