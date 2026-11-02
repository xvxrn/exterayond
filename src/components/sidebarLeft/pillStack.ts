import Icon from '@components/icon';
import type InputSearch from '@components/inputSearch';
import {attachClickEvent} from '@helpers/dom/clickEvent';
import type {Middleware} from '@helpers/middleware';
import formatBytes from '@helpers/formatBytes';
import {i18n, I18n} from '@lib/langPack';
import type {LangPackKey} from '@lib/langPack';
import rootScope from '@lib/rootScope';
import {getVisiblePillIds, getRegisteredPill, nextPillIndex, PILL_IDS} from '@stores/exteralessPills';
import type {WebPillKind} from '@stores/exteralessPills';
import {exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';

/**
 * The pill stack strip (PILLS-01..04), ported from Android
 * `pillstack/PillStackController` + `PillStackView`: a line of widgets living
 * at the inline end of the chat list's search field, one visible at a time.
 * While the field holds text the strip hides (Android's `updateVisibility`).
 *
 * The layout (which pills exist) is the `OEPillActivePills` /
 * `OEPillHiddenPills` strings; a hub change reaches this strip through the
 * settings store's live event — Android's `PillStackEvents.layoutChanged`.
 * Switching (PILLS-03) rides the PC equivalents the checklist asks for: the
 * mouse wheel and ArrowUp/ArrowDown on the pill itself (Android's vertical
 * swipe), wrapping per `OEPillInfiniteScrolling` (PILLS-04). The index the
 * strip restores is `OEPillLastActiveId` (`PillStackController.rebuildContents`).
 */

/** Android `CachePill.getRefreshInterval` (3 minutes). */
const CACHE_REFRESH_INTERVAL = 3 * 60 * 1000;
/** One wheel notch = one switch; a trackpad burst is collapsed. */
const WHEEL_SWITCH_COOLDOWN = 300;

const CACHE_NAME_KEY: LangPackKey = 'Exteraless.PillStack.CacheName';

type PillRenderer = {
  dispose?: () => void
};

/** Android `CachePill.onUpdateData`: the client's cached bytes, refreshed on its interval. */
const cachePillRenderer = (button: HTMLButtonElement, valueEl: HTMLElement, nameKey: LangPackKey): PillRenderer => {
  let disposed = false;
  let timer: ReturnType<typeof setInterval> | undefined = undefined;
  let inflight = false;

  const refresh = async() => {
    if(inflight) return;
    inflight = true;
    try {
      const {collectCachedFilesSizes, collectCachedVideoStreamChunksSize} = await import(
        '@components/sidebarLeft/tabs/dataAndStorage/cachedSizes'
      );
      const [files, chunks] = await Promise.all([collectCachedFilesSizes(), collectCachedVideoStreamChunksSize()]);
      if(disposed) return;
      // * formatBytes returns a realtime i18n element; the pill's value is its text
      valueEl.textContent = formatBytes(files.totalSize + chunks, 1).textContent;
      button.setAttribute('aria-label', `${I18n.format(nameKey, true)}: ${valueEl.textContent}`);
    } finally {
      inflight = false;
    }
  };

  void refresh();
  timer = setInterval(() => void refresh(), CACHE_REFRESH_INTERVAL);

  return {
    dispose: () => {
      disposed = true;
      clearInterval(timer);
    }
  };
};

const PILL_RENDERERS: Record<WebPillKind, (button: HTMLButtonElement, valueEl: HTMLElement, nameKey: LangPackKey) => PillRenderer> = {
  cache: cachePillRenderer
};

const PILL_ICONS: Record<WebPillKind, Parameters<typeof Icon>[0]> = {
  cache: 'data_filled'
};

export type PillStackStrip = {
  container: HTMLElement,
  rebuild: () => void
};

/**
 * Attaches the strip to the chat list's search field. `onOpenPillSettings`
 * serves the pill's click action — Android's `CachePill.openCacheSettings`
 * presents `CacheControlActivity`, the web's owner of the same data is the
 * Data & Storage tab.
 */
export const attachPillStackStrip = (
  inputSearch: InputSearch,
  middleware: Middleware,
  onOpenPillSettings: () => void
): PillStackStrip => {
  const container = document.createElement('div');
  container.className = 'oe-pill-stack';
  const input = inputSearch.input;
  let pills: HTMLButtonElement[] = [];
  let pillRenderers: PillRenderer[] = [];
  let currentIndex = 0;

  const updateVisibility = () => {
    // * Android hides the strip while the search holds text
    container.classList.toggle('is-hidden', input.value.length > 0);
  };

  /** Shows the pill at the index; the others leave the tab order and the tree. */
  const showPill = (index: number, direction: 1 | -1 | 0 = 0) => {
    currentIndex = Math.max(0, Math.min(index, pills.length - 1));
    pills.forEach((pill, i) => {
      const current = i === currentIndex;
      pill.classList.remove('oe-pill-enter-up', 'oe-pill-enter-down');
      pill.classList.toggle('is-hidden-pill', !current);
      pill.tabIndex = current ? 0 : -1;
      pill.setAttribute('aria-hidden', current ? 'false' : 'true');
      if(current && direction) {
        // * a one-off restart of the enter animation (a repeated switch in the
        // * same direction must animate again)
        void pill.offsetLeft;
        pill.classList.add(direction === 1 ? 'oe-pill-enter-up' : 'oe-pill-enter-down');
      }
    });
  };

  /** Android `PillStackView.animateToNextPill`, the index decision + persistence. */
  const switchPill = (direction: 1 | -1) => {
    if(pills.length < 2) return;
    const next = nextPillIndex(currentIndex, pills.length, direction, exteralessSettings.OEPillInfiniteScrolling);
    if(next === currentIndex) return;
    showPill(next, direction);
    setExteralessSetting('OEPillLastActiveId', getVisiblePillIds()[next] ?? -1);
  };

  let lastWheelSwitch = 0;
  container.addEventListener('wheel', (e) => {
    if(!e.deltaY) return;
    e.preventDefault();
    const now = Date.now();
    if(now - lastWheelSwitch < WHEEL_SWITCH_COOLDOWN) return;
    lastWheelSwitch = now;
    switchPill(e.deltaY < 0 ? 1 : -1);
  }, {passive: false});

  const rebuild = () => {
    // * the old pills' renderers own intervals — disposed on every rebuild;
    // * the middleware disposal below is only for the page teardown
    for(const renderer of pillRenderers) {
      renderer.dispose?.();
    }

    pillRenderers = [];
    for(const pill of [...container.children] as HTMLElement[]) {
      pill.remove();
    }

    const ids = getVisiblePillIds();
    pills = [];
    container.classList.toggle('has-pills', ids.length > 0);
    for(const id of ids) {
      const registration = getRegisteredPill(id);
      if(!registration || registration.kind !== 'cache') continue;

      const nameKey = registration.nameKey;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `oe-pill oe-pill-${registration.kind}`;
      button.setAttribute('aria-label', I18n.format(nameKey, true));

      const icon = Icon(PILL_ICONS[registration.kind], 'oe-pill-icon');
      const nameEl = i18n(nameKey);
      nameEl.classList.add('oe-pill-name');
      const valueEl = document.createElement('span');
      valueEl.className = 'oe-pill-value';
      button.append(icon, nameEl, valueEl);

      const renderer = PILL_RENDERERS[registration.kind](button, valueEl, nameKey);
      pillRenderers.push(renderer);

      attachClickEvent(button, onOpenPillSettings);

      // * the keyboard equivalent of the vertical swipe (PILLS-03)
      button.addEventListener('keydown', (e: KeyboardEvent) => {
        if(e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          switchPill(1);
        } else if(e.key === 'ArrowDown') {
          e.preventDefault();
          e.stopPropagation();
          switchPill(-1);
        }
      });

      container.append(button);
      pills.push(button);
    }

    // * Android restores the last active pill on rebuild (rebuildContents)
    const lastId = exteralessSettings.OEPillLastActiveId;
    const restored = ids.indexOf(lastId);
    showPill(restored >= 0 ? restored : 0);

    updateVisibility();
  };

  const onSettingsUpdated = ({key}: {key: string}) => {
    if(key === 'OEPillActivePills' || key === 'OEPillHiddenPills') {
      rebuild();
    }
  };

  input.addEventListener('input', updateVisibility);
  rootScope.addEventListener('exteraless_settings_updated', onSettingsUpdated);
  middleware.onClean(() => {
    input.removeEventListener('input', updateVisibility);
    rootScope.removeEventListener('exteraless_settings_updated', onSettingsUpdated);
    for(const renderer of pillRenderers) {
      renderer.dispose?.();
    }
  });
  rebuild();

  inputSearch.container.append(container);
  return {container, rebuild};
};
