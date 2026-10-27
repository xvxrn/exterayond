import {createEffect, createSignal, onCleanup, onMount, Show, useContext} from 'solid-js';
import PopupElement, {createPopup, PopupContext} from '@components/popups/indexTsx';
import type {AppMediaPlaybackController} from '@components/appMediaPlaybackController';
import Button from '@components/buttonTsx';
import {IconTsx} from '@components/iconTsx';
import MediaProgressLine from '@components/mediaProgressLine';
import wrapPhoto from '@components/wrappers/photo';
import getAudioTitles from '@appManagers/utils/docs/getAudioTitles';
import ListenerSetter from '@helpers/listenerSetter';
import toHHMMSS from '@helpers/string/toHHMMSS';
import I18n, {i18n} from '@lib/langPack';
import {getAccountSession, isSessionLeaving} from '@lib/accounts/getCurrentAccount';
import {bindManagersToSession} from '@lib/accounts/bindManagersToAccount';
import rootScope from '@lib/rootScope';
import {exteralessSettings} from '@stores/exteralessSettings';
import styles from '@components/popups/md3Player.module.scss';

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
    const progress = new MediaProgressLine({onTimeUpdate: setTime});
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

    return (
      <div class={styles.content}>
        <div class={styles.cover}>
          <IconTsx icon="music_filled" />
          <div ref={cover} class={styles.artwork} />
        </div>
        <div class={styles.metadata}>
          <h2 dir="auto">{titles()?.title || i18n('AudioUnknownTitle')}</h2>
          <p dir="auto">{titles()?.performer || i18n('AudioUnknownArtist')}</p>
        </div>
        <div class={styles.timeline} dir="ltr">
          {progress.container}
          <div class={styles.times}><span>{toHHMMSS(time(), true)}</span><span>{toHHMMSS(details().doc.duration, true)}</span></div>
        </div>
        <div class={styles.transport} dir="ltr">
          <Button.Icon icon="previous" aria-label={I18n.format('KeyboardShortcuts.Action.PreviousMedia', true)} onClick={() => run(() => controller.previous())} />
          <Button.Icon class={styles.play} icon={playing() ? 'pause_filled' : 'play_filled'} aria-label={I18n.format(playing() ? 'Pause' : 'Play', true)} onClick={() => run(() => controller.toggle())} />
          <Button.Icon icon="next" disabled={details().isSlotted} aria-label={I18n.format('KeyboardShortcuts.Action.NextMedia', true)} onClick={() => run(() => controller.next())} />
        </div>
        <Show when={!details().isSlotted}>
          <Button.Icon
            icon={params().loop ? 'audio_repeat_single' : 'audio_repeat'}
            class={params().round || params().loop ? styles.active : undefined}
            aria-label={I18n.format('Schedule.Repeat', true)}
            aria-pressed={params().round || params().loop}
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
