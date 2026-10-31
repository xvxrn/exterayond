import {createEffect, createSignal, onCleanup, onMount, Show, useContext} from 'solid-js';
import PopupElement, {createPopup, PopupContext} from '@components/popups/indexTsx';
import type {AppMediaPlaybackController} from '@components/appMediaPlaybackController';
import Button from '@components/buttonTsx';
import {IconTsx} from '@components/iconTsx';
import WavyProgressLine from '@components/wavyProgressLine';
import wrapPhoto from '@components/wrappers/photo';
import {PeerTitleTsx} from '@components/peerTitleTsx';
import getAudioTitles from '@appManagers/utils/docs/getAudioTitles';
import ListenerSetter from '@helpers/listenerSetter';
import toHHMMSS from '@helpers/string/toHHMMSS';
import I18n, {i18n} from '@lib/langPack';
import {getAccountSession, isSessionLeaving} from '@lib/accounts/getCurrentAccount';
import {bindManagersToSession} from '@lib/accounts/bindManagersToAccount';
import rootScope from '@lib/rootScope';
import {
  exteralessSettings,
  getPlayerCoverStyle,
  playerControlsScale,
  playerCoverSizeFraction,
  playerTitleSizes
} from '@stores/exteralessSettings';
import styles from '@components/popups/md3Player.module.scss';

/** Android `PlayerStyle.COVER_DISC` spin: one turn per 16 seconds while playing. */
const DISC_SPIN_DURATION = '16s';
/** Android `WavySeekBar` maxAmplitude, dp(4). */
const WAVE_AMPLITUDE = 4;

/** Non-default cover styles; index is `coverStyle - 1` (0 card needs no class). */
const COVER_STYLE_CLASSES = ['is-wide', 'is-full', 'is-disc'] as const;

export default function showMd3Player(controller: AppMediaPlaybackController) {
  const initial = controller.getPlayingDetails();
  if(!exteralessSettings.OEAppearanceMd3Player || !initial || initial.doc.type !== 'audio') return;
  const session = getAccountSession();
  if(isSessionLeaving(session)) return;
  const managers = bindManagersToSession(rootScope.managers);

  function Content() {
    const context = useContext(PopupContext);
    const managers = context.managers;
    const middleware = context.middlewareHelper.get();
    const [details, setDetails] = createSignal(initial);
    const [playing, setPlaying] = createSignal(!initial.media.paused);
    const [params, setParams] = createSignal(initial.playbackParams);
    const [time, setTime] = createSignal(initial.media.currentTime || 0);
    const listeners = new ListenerSetter();
    const mediaListeners = new ListenerSetter();
    const progress = new WavyProgressLine({onTimeUpdate: setTime}, WAVE_AMPLITUDE);
    const titles = () => getAudioTitles(details().doc);
    let cover: HTMLDivElement;
    let coverCleanup: () => void;

    const run = (action: () => void) => {
      if(!isSessionLeaving(session)) action();
    };

    const follow = (next = controller.getPlayingDetails()) => {
      if(!next || next.doc.type !== 'audio' || isSessionLeaving(session)) {
        context.hide();
        return;
      }
      setDetails(next);
      setParams(next.playbackParams);
      setPlaying(!next.media.paused);
      mediaListeners.removeAll();
      mediaListeners.add(next.media)('play', () => setPlaying(true));
      mediaListeners.add(next.media)('pause', () => setPlaying(false));
      progress.setMedia({media: next.media, duration: next.doc.duration});
      setTime(next.media.currentTime || 0);
      coverCleanup?.();
      cover.replaceChildren();
      if(next.doc.thumbs?.length) {
        const child = middleware.create();
        coverCleanup = () => child.destroy();
        void wrapPhoto({
          photo: next.doc, message: null, container: cover,
          boxWidth: 280, boxHeight: 280, withoutPreloader: true,
          middleware: child.get(), managers
        }).catch(() => {});
      }
    };

    onMount(() => {
      follow(initial);
      listeners.add(controller)('play', follow);
      listeners.add(controller)('stop', () => context.hide());
      listeners.add(controller)('playbackParams', setParams);
    });
    onCleanup(() => {
      listeners.removeAll();
      mediaListeners.removeAll();
      progress.removeListeners();
      coverCleanup?.();
    });
    createEffect(() => {
      if(!exteralessSettings.OEAppearanceMd3Player) context.hide();
    });
    // * Android `WavySeekBar.setMaxAmplitude`: the setting feeds the amplitude,
    // * zero keeps the flat bar
    createEffect(() => progress.setMaxAmplitude(exteralessSettings.OEPlayerWavy ? WAVE_AMPLITUDE : 0));

    const coverStyle = () => getPlayerCoverStyle();
    const framed = () => coverStyle() === 0 || coverStyle() === 3;
    const titleAbove = () => framed() && exteralessSettings.OEPlayerTitleAbove;
    const contentClass = () => [
      styles.content,
      coverStyle() && styles[COVER_STYLE_CLASSES[coverStyle() - 1]],
      exteralessSettings.OEPlayerTitleAlign === 1 && styles['is-title-center'],
      playing() && coverStyle() === 3 && exteralessSettings.OEPlayerDiscSpin && styles['is-spinning']
    ].filter(Boolean).join(' ');

    // * Android `PlayerSheet.applyStyle`: sizes and the controls scale as
    // * custom properties, so the stylesheet keeps the layout ownership
    const styleVars = () => ({
      '--oe-player-cover-size': '' + playerCoverSizeFraction(),
      '--oe-player-cover-radius': exteralessSettings.OEPlayerCoverRadius + 'px',
      '--oe-player-title-size': playerTitleSizes()[0] + 'px',
      '--oe-player-artist-size': playerTitleSizes()[1] + 'px',
      '--oe-player-controls-scale': '' + playerControlsScale(),
      '--oe-player-spin-duration': DISC_SPIN_DURATION
    });

    const metadata = () => (
      <div class={styles.metadata}>
        <h2 dir="auto">{titles()?.title || i18n('AudioUnknownTitle')}</h2>
        <p dir="auto">{titles()?.performer || i18n('AudioUnknownArtist')}</p>
      </div>
    );

    return (
      <div class={contentClass()} style={styleVars()}>
        <div
          class={styles.source}
          classList={{[styles.hidden]: !exteralessSettings.OEPlayerShowSource}}
          aria-hidden={!exteralessSettings.OEPlayerShowSource}
        >
          <span>{i18n(details().isSavedMusic ? 'Exteraless.Player.FromProfile' : 'Exteraless.Player.FromChat')}</span>
          <PeerTitleTsx peerId={details().message.peerId} meAsNotes={details().isSavedMusic} />
        </div>
        <Show when={titleAbove()}>{metadata()}</Show>
        <div class={styles.cover}>
          <IconTsx icon="music_filled" />
          <div ref={cover} class={styles.artwork} />
        </div>
        <Show when={!titleAbove()}>{metadata()}</Show>
        <div class={styles.timeline} dir="ltr">
          {progress.container}
          <div class={styles.times}><span>{toHHMMSS(time(), true)}</span><span>{toHHMMSS(details().doc.duration, true)}</span></div>
        </div>
        <div class={styles.transport} dir="ltr">
          <Button.Icon icon="previous" aria-label={I18n.format('KeyboardShortcuts.Action.PreviousMedia', true)} onClick={() => run(() => controller.previous())} />
          <Button.Icon class={styles.play} icon={playing() ? 'pause_filled' : 'play_filled'} aria-label={I18n.format(playing() ? 'Pause' : 'Play', true)} onClick={() => run(() => controller.toggle())} />
          <Button.Icon icon="next" disabled={details().isSlotted} aria-label={I18n.format('KeyboardShortcuts.Action.NextMedia', true)} onClick={() => run(() => controller.next())} />
        </div>
        <Show when={!details().isSlotted && exteralessSettings.OEPlayerShowModes}>
          <Button.Icon
            icon={params().loop ? 'audio_repeat_single' : 'audio_repeat'}
            class={params().round || params().loop ? styles.active : undefined}
            aria-label={I18n.format(params().loop ? 'Exteraless.Md3.RepeatTrack' : params().round ? 'Exteraless.Md3.RepeatPlaylist' : 'Exteraless.Md3.RepeatOff', true)}
            onClick={() => run(() => controller.cycleRepeatMode())}
          />
        </Show>
      </div>
    );
  }

  createPopup(() => (
    <PopupElement class={styles.popup} managers={managers} closable>
      <PopupElement.Header><PopupElement.Title title="Exteraless.Md3.Player" /></PopupElement.Header>
      <Content />
    </PopupElement>
  ));
}
