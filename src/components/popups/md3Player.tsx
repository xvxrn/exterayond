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
import liteMode from '@helpers/liteMode';
import toHHMMSS from '@helpers/string/toHHMMSS';
import I18n, {i18n} from '@lib/langPack';
import {getAccountSession, isSessionLeaving} from '@lib/accounts/getCurrentAccount';
import {bindManagersToSession} from '@lib/accounts/bindManagersToAccount';
import rootScope from '@lib/rootScope';
import {
  exterayondSettings,
  getPlayerCoverStyle,
  playerControlsScale,
  playerCoverSizeFraction,
  playerTitleSizes
} from '@stores/exterayondSettings';
import styles from '@components/popups/md3Player.module.scss';
import {
  attachCoverSwipe,
  coverSwipeDragVisual,
  coverSwipeRelease,
  COVER_DRAG_ROTATE
} from '@components/popups/md3PlayerCoverSwipe';

/** Android `PlayerStyle.COVER_DISC` spin: one turn per 16 seconds while playing. */
const DISC_SPIN_DURATION = '16s';
/** Android `WavySeekBar` maxAmplitude, dp(4). */
const WAVE_AMPLITUDE = 4;

/** Android's out (EASE_IN) and spring-back / entry (EMPHASIZED) timings. */
const COVER_OUT_MS = 180;
const COVER_IN_MS = 450;
const COVER_EASE_IN = 'cubic-bezier(.42, 0, 1, 1)';
const COVER_EMPHASIZED = 'cubic-bezier(.2, 0, 0, 1)';

/** Non-default cover styles; index is `coverStyle - 1` (0 card needs no class). */
const COVER_STYLE_CLASSES = ['is-wide', 'is-full', 'is-disc'] as const;

export default function showMd3Player(controller: AppMediaPlaybackController) {
  const initial = controller.getPlayingDetails();
  if(!exterayondSettings.OEAppearanceMd3Player || !initial || initial.doc.type !== 'audio') return;
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
    /** The cover box: the drag surface (Android's cover view). */
    let coverBox: HTMLDivElement;
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

    onCleanup(() => {
      listeners.removeAll();
      mediaListeners.removeAll();
      progress.removeListeners();
      coverCleanup?.();
    });
    createEffect(() => {
      if(!exterayondSettings.OEAppearanceMd3Player) context.hide();
    });
    // * Android `WavySeekBar.setMaxAmplitude`: the setting feeds the amplitude,
    // * zero keeps the flat bar
    createEffect(() => progress.setMaxAmplitude(exterayondSettings.OEPlayerWavy ? WAVE_AMPLITUDE : 0));

    const coverStyle = () => getPlayerCoverStyle();
    const framed = () => coverStyle() === 0 || coverStyle() === 3;
    const titleAbove = () => framed() && exterayondSettings.OEPlayerTitleAbove;

    // * Android `PlayerSheet.onCoverTouch` + `finishCoverDrag`: the card and
    // * disc covers drag horizontally and switch the track past dp(70) —
    // * next to the left, previous to the right (a physical gesture, like the
    // * tape: not mirrored in RTL). The store is read at every pointerdown,
    // * so the toggle applies live; off restores the stock cover, which has
    // * no gesture. The pointer mechanics live in md3PlayerCoverSwipe.ts.
    let coverAnimating = false;
    const clearCoverDrag = () => {
      coverBox.style.transform = '';
      coverBox.style.opacity = '';
    };
    const switchTrack = (next: boolean) => run(() => next ? controller.next() : controller.previous());

    const finishCoverDrag = (dx: number) => {
      const current = {transform: coverBox.style.transform, opacity: coverBox.style.opacity};
      clearCoverDrag();
      const motion = liteMode.isAvailable('motion');
      const release = coverSwipeRelease(dx);
      if(!release.switch) {
        if(motion) {
          coverBox.animate([{...current}, {transform: 'none', opacity: '1'}], {duration: COVER_IN_MS, easing: COVER_EMPHASIZED});
        }
        return;
      }
      if(!liteMode.isAvailable('animations')) {
        switchTrack(release.next);
        return;
      }
      const out = (release.next ? -1 : 1) * (coverBox.parentElement?.clientWidth || coverBox.clientWidth);
      coverAnimating = true;
      if(motion) {
        const outTransform = `translateX(${out}px)` + (coverStyle() === 3 ? '' : ` rotate(${out / COVER_DRAG_ROTATE / 4}deg)`);
        coverBox.animate([current, {transform: outTransform, opacity: '0'}], {duration: COVER_OUT_MS, easing: COVER_EASE_IN}).finished.then(() => {
          switchTrack(release.next);
          // * Android drops the new cover at the opposite third of the way
          // * out (rotation reset) and slides it home over 450ms
          coverBox.animate(
            [{transform: `translateX(${-out * 0.35}px)`, opacity: '0'}, {transform: 'none', opacity: '1'}],
            {duration: COVER_IN_MS, easing: COVER_EMPHASIZED}
          ).finished.then(() => {
            coverAnimating = false;
          }).catch(() => {
            coverAnimating = false;
          });
        }).catch(() => {
          coverAnimating = false;
        });
      } else {
        // * reduced motion: the slide becomes a crossfade
        coverBox.animate([{...current}, {opacity: '0'}], {duration: COVER_OUT_MS, easing: COVER_EASE_IN}).finished.then(() => {
          switchTrack(release.next);
          coverBox.animate([{opacity: '0'}, {opacity: '1'}], {duration: COVER_IN_MS, easing: COVER_EMPHASIZED}).finished.then(() => {
            coverAnimating = false;
          }).catch(() => {
            coverAnimating = false;
          });
        }).catch(() => {
          coverAnimating = false;
        });
      }
    };

    onMount(() => {
      follow(initial);
      listeners.add(controller)('play', follow);
      listeners.add(controller)('stop', () => context.hide());
      listeners.add(controller)('playbackParams', setParams);
      // * the gate mirrors Android's onCoverTouch early return: the drag only
      // * runs for the card and disc covers while the key allows it
      attachCoverSwipe(coverBox, {
        allowed: () => !coverAnimating && framed() && !!exterayondSettings.OEPlayerCoverSwipe,
        onDrag: (dx) => {
          const visual = coverSwipeDragVisual(dx, coverStyle() === 3);
          coverBox.style.transform = visual.transform;
          coverBox.style.opacity = visual.opacity;
        },
        onFinish: finishCoverDrag
      });
    });
    const contentClass = () => [
      styles.content,
      coverStyle() && styles[COVER_STYLE_CLASSES[coverStyle() - 1]],
      exterayondSettings.OEPlayerTitleAlign === 1 && styles['is-title-center'],
      playing() && coverStyle() === 3 && exterayondSettings.OEPlayerDiscSpin && styles['is-spinning']
    ].filter(Boolean).join(' ');

    // * Android `PlayerSheet.applyStyle`: sizes and the controls scale as
    // * custom properties, so the stylesheet keeps the layout ownership
    const styleVars = () => ({
      '--oe-player-cover-size': '' + playerCoverSizeFraction(),
      '--oe-player-cover-radius': exterayondSettings.OEPlayerCoverRadius + 'px',
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
          classList={{[styles.hidden]: !exterayondSettings.OEPlayerShowSource}}
          aria-hidden={!exterayondSettings.OEPlayerShowSource}
        >
          <span>{i18n(details().isSavedMusic ? 'Exterayond.Player.FromProfile' : 'Exterayond.Player.FromChat')}</span>
          <PeerTitleTsx peerId={details().message.peerId} meAsNotes={details().isSavedMusic} />
        </div>
        <Show when={titleAbove()}>{metadata()}</Show>
        <div
          ref={coverBox}
          class={styles.cover}
          classList={{[styles['is-swipeable']]: framed() && exterayondSettings.OEPlayerCoverSwipe}}
        >
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
        <Show when={!details().isSlotted && exterayondSettings.OEPlayerShowModes}>
          <Button.Icon
            icon={params().loop ? 'audio_repeat_single' : 'audio_repeat'}
            class={params().round || params().loop ? styles.active : undefined}
            aria-label={I18n.format(params().loop ? 'Exterayond.Md3.RepeatTrack' : params().round ? 'Exterayond.Md3.RepeatPlaylist' : 'Exterayond.Md3.RepeatOff', true)}
            onClick={() => run(() => controller.cycleRepeatMode())}
          />
        </Show>
      </div>
    );
  }

  createPopup(() => (
    <PopupElement class={styles.popup} managers={managers} closable>
      <PopupElement.Header><PopupElement.Title title="Exterayond.Md3.Player" /></PopupElement.Header>
      <Content />
    </PopupElement>
  ));
}
