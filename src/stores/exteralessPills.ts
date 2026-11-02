import {exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';
import type {ExteralessSettings} from '@stores/exteralessSettings';
import type {LangPackKey} from '@lib/langPack';

/**
 * The pill stack (PILLS-01..12) — Android `app/exteraless/pillstack/`, the
 * exteraGram port: a strip of widgets living in the chat list's search field,
 * one visible at a time, switched by a vertical swipe. This module owns the
 * layout contract; the strip itself lives in `@components/sidebarLeft/pillStack`.
 *
 * The ids are `PillType.java` verbatim (exteraGram's numbering, so an
 * `.extera` layout string reads the same); the layout strings are the
 * `PillStackConfig` keys (`OEPillActivePills`, default `DEFAULT_ACTIVE` =
 * "5,6" — the pills that need no network — and `OEPillHiddenPills`, default
 * empty). Android's registry is open and hardware-bound pills register on
 * Android only; the web registry carries the pills this client can really
 * back, and the strip renders only registered ids — the same rule Android's
 * `sanitizePills` applies to its own registry. Unregistered ids stay in the
 * stored strings (Android's dormant pills), so enabling one later restores it.
 */

/** Android `PillType.java` verbatim. */
export const PILL_IDS = {
  WEATHER: 1,
  GRAM: 2,
  BTC: 3,
  USD: 4,
  CACHE: 5,
  PROXY: 6,
  GHOST: 7,
  RAM: 8,
  CPU: 9,
  NET_SPEED: 10,
  DC_PING: 11,
  GOLD: 12,
  ETH: 13,
  EUR: 14,
  LAST_SEEN: 15
} as const;

/** Android `PillStackConfig.DEFAULT_ACTIVE` — the pills that need no network. */
export const PILL_DEFAULT_ACTIVE = '5,6';

/** The pill a web registration can really render today. */
export type WebPillKind = 'cache';

export type WebPillRegistration = {
  id: number,
  kind: WebPillKind,
  /** The pill's display name — Android registers `LocaleController.getString(...)` per pill. */
  nameKey: LangPackKey
};

/**
 * The web registry, the analog of `PillRegistry`'s default registrations.
 * Verdicts for the rest, all recorded in docs/tasks/progress.md (packet 052):
 * WEATHER and the rate pills (GRAM/BTC/USD/GOLD/ETH/EUR) wait on an external
 * data source the hub has no provider for (PILLS-05/11); PROXY waits on a
 * proxy subsystem the browser client has none of (PILLS-07); GHOST and
 * LAST_SEEN wait on their owning subsystems (GHOST-01, AYU-09); RAM/CPU/
 * NET_SPEED are OS-bound (a page has no such counters); DC_PING waits on a
 * manager-level ping primitive (PILLS-10). None are faked.
 */
export const WEB_PILL_REGISTRY: readonly WebPillRegistration[] = [
  // * Android registers the cache pill under R.string.StorageUsage
  {id: PILL_IDS.CACHE, kind: 'cache', nameKey: 'Exteraless.PillStack.CacheName'}
];

export const getRegisteredPill = (id: number): WebPillRegistration | undefined =>
  WEB_PILL_REGISTRY.find((pill) => pill.id === id);

/** Android `PillStackConfig.parseList`: comma ints, trimmed, distinct, blanks skipped. */
export const parsePillIds = (value: string | undefined): number[] => {
  if(!value || !value.trim()) return [];
  const out: number[] = [];
  for(const part of value.split(',')) {
    const trimmed = part.trim();
    if(!trimmed) continue;
    const id = Number(trimmed);
    if(!Number.isInteger(id) || out.includes(id)) continue;
    out.push(id);
  }

  return out;
};

/** Android `PillStackConfig.serializeList`. */
export const serializePillIds = (ids: number[]): string => ids.join(',');

export type PillLayout = {
  /** The live active list in display order (Android `getActivePills`). */
  active: number[],
  /** The hidden list (Android `getHiddenPills`; an id in both reads active). */
  hidden: number[]
};

/**
 * Android `loadConfig`'s read side: parse both strings, an id listed as both
 * hidden and active reads active.
 */
export const resolvePillLayout = (
  settings: Pick<ExteralessSettings, 'OEPillActivePills' | 'OEPillHiddenPills'> = exteralessSettings
): PillLayout => {
  const active = parsePillIds(settings.OEPillActivePills);
  const hidden = parsePillIds(settings.OEPillHiddenPills).filter((id) => !active.includes(id));
  return {active, hidden};
};

export const isRegisteredPill = (id: number): boolean =>
  WEB_PILL_REGISTRY.some((pill) => pill.id === id);

/**
 * The strip's ids: Android renders `getActivePills()` through
 * `PillRegistry.createPill`, which returns null for an unregistered id —
 * the same filter here.
 */
export const getVisiblePillIds = (
  settings: Pick<ExteralessSettings, 'OEPillActivePills' | 'OEPillHiddenPills'> = exteralessSettings
): number[] => resolvePillLayout(settings).active.filter(isRegisteredPill);

/**
 * The hub screen's groups (Android `PillStackSettingsActivity.updateRows`
 * reads the same layout through `sanitizePills`, which drops ids the registry
 * does not know): registered pills only, active first in display order.
 */
export const getHubPillGroups = (
  settings: Pick<ExteralessSettings, 'OEPillActivePills' | 'OEPillHiddenPills'> = exteralessSettings
): PillLayout => {
  const layout = resolvePillLayout(settings);
  return {
    active: layout.active.filter(isRegisteredPill),
    hidden: layout.hidden.filter(isRegisteredPill)
  };
};

const persistPillLayout = (active: number[], hidden: number[]) => {
  setExteralessSetting('OEPillActivePills', serializePillIds(active));
  setExteralessSetting('OEPillHiddenPills', serializePillIds(hidden));
};

/** Android `PillStackConfig.setPillActive`: out of both lists, into the target. */
export const setPillActive = (id: number, active: boolean) => {
  const layout = resolvePillLayout();
  const nextActive = layout.active.filter((known) => known !== id);
  const nextHidden = layout.hidden.filter((known) => known !== id);
  (active ? nextActive : nextHidden).push(id);
  persistPillLayout(nextActive, nextHidden);
};

/** Android `PillStackConfig.resetLayout`: the default active list, nothing hidden. */
export const resetPillLayout = () => persistPillLayout(parsePillIds(PILL_DEFAULT_ACTIVE), []);

/**
 * The switch decision (PILLS-03/04, `PillStackView.animateToNextPill`):
 * direction 1 = the next pill (a swipe/wheel up), -1 = the previous one.
 * With `OEPillInfiniteScrolling` the strip wraps around; without it the index
 * clamps at the edge — the strip shows the same pill, Android's pull-and-
 * resist (a position animation, not a switch).
 */
export const nextPillIndex = (current: number, count: number, direction: 1 | -1, infinite: boolean): number => {
  if(count <= 0) return 0;
  let next = current + direction;
  if(infinite) {
    if(next >= count) next = 0;
    if(next < 0) next = count - 1;
  } else {
    next = Math.max(0, Math.min(next, count - 1));
  }

  return next;
};
