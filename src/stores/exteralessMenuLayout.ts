import {exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';
import type {ExteralessSettings} from '@stores/exteralessSettings';

/**
 * The main menu layout (FOLD-10..13) — Android `app/exteraless/drawer/
 * MainMenuLayout.java` over `AppearanceConfig.mainMenuLayout`
 * (`OEAppearanceMainMenuLayout`, string, default empty = "not customized").
 * One text key carries both halves: `"visible;hidden"`, comma-separated
 * `MainMenuItem` ids, DIVIDER(-1) allowed in the visible half only; an empty
 * string means the stock menu (`isCustomized() == false`, the consumers show
 * exactly what they showed before the setting existed).
 *
 * The web's owner of the main menu is the left sidebar's tools (burger) menu.
 * Its id-mappable items are the five below; ids without a web backing render
 * nothing (the same rule the pill registry applies — never faked), and the
 * menu's web-only composites (add account, "Create a new", stories, "More")
 * keep their stock frame around the laid-out block. The web has no bottom
 * navigation bar, so Android's `ensureSettingsVisibility` always applies:
 * Settings can never be hidden.
 */

/** Android `MainMenuItem.java` verbatim — the ids are the storage contract. */
export const MAIN_MENU_ITEMS = {
  DIVIDER: -1,
  NEW_GROUP: 2,
  CONTACTS: 6,
  NEW_CHANNEL: 3,
  CALLS: 10,
  SAVED: 11,
  SETTINGS: 8,
  ARCHIVE: 14,
  PROFILE: 18,
  QR: 17,
  BROWSER: 101,
  PLUGINS: 102,
  BOTS: 105,
  FEED: 106,
  GHOST_MODE: 107,
  RECENT_CHATS: 108,
  WALLET: 109,
  EXTERALESS_SETTINGS: 110,
  KILL_APP: 111
} as const;

const ALL_ITEM_IDS: number[] = Object.values(MAIN_MENU_ITEMS).filter((id) => id !== MAIN_MENU_ITEMS.DIVIDER);

/**
 * The `MainMenuItem` ids the web tools menu can really back today, mapped to
 * its stock items. Verdicts for the rest (packet 054, recorded in the
 * checklist): NEW_GROUP/NEW_CHANNEL live inside the web's "Create a new"
 * composite, PROFILE/QR/FEED/BROWSER/BOTS/WALLET/GHOST_MODE/RECENT_CHATS/
 * KILL_APP have no web counterpart at all, and PLUGINS/EXTERALESS_SETTINGS
 * open hub tabs (a menu row for them waits on its own decision).
 */
export const WEB_MENU_ITEM_IDS: readonly number[] = [
  MAIN_MENU_ITEMS.SAVED,
  MAIN_MENU_ITEMS.ARCHIVE,
  MAIN_MENU_ITEMS.CONTACTS,
  MAIN_MENU_ITEMS.CALLS,
  MAIN_MENU_ITEMS.SETTINGS
];

export type MainMenuLayout = {
  /** Visible ids in display order, DIVIDER(-1) entries included. */
  visible: number[],
  hidden: number[]
};

/** Android `MainMenuLayout.readIds`: comma ints, trimmed, known ids only, distinct; dividers where allowed. */
const readIds = (section: string, out: number[], allowDivider: boolean) => {
  if(!section) return;
  for(const part of section.split(',')) {
    const trimmed = part.trim();
    if(!trimmed) continue;
    const id = Number(trimmed);
    if(!Number.isInteger(id)) continue;
    if(id === MAIN_MENU_ITEMS.DIVIDER) {
      if(allowDivider) out.push(id);
      continue;
    }

    if(ALL_ITEM_IDS.includes(id) && !out.includes(id)) {
      out.push(id);
    }
  }
};

/** Android `MainMenuLayout.parse`: empty = stock; ids in neither list are hidden. */
export const parseMainMenuLayout = (raw: string | undefined): MainMenuLayout => {
  const visible: number[] = [];
  const hidden: number[] = [];
  if(raw) {
    const sections = raw.split(';');
    readIds(sections[0] ?? '', visible, true);
    readIds(sections[1] ?? '', hidden, false);
  }

  for(const id of ALL_ITEM_IDS) {
    if(!visible.includes(id) && !hidden.includes(id)) {
      hidden.push(id);
    }
  }

  return {visible, hidden};
};

export const isMainMenuCustomized = (
  raw: string = exteralessSettings.OEAppearanceMainMenuLayout
): boolean => !!raw;

/**
 * The web read: an uncustomized key leaves the stock menu; a customized one
 * yields the visible sequence (unbacked ids skipped by the consumer) with
 * Settings forced in — the web always runs "no bottom navigation bar", so
 * `ensureSettingsVisibility` appends it when the layout hides it and keeps it
 * at its own position when the layout carries one.
 */
export const resolveMainMenuLayout = (
  raw: string = exteralessSettings.OEAppearanceMainMenuLayout
): MainMenuLayout => {
  if(!isMainMenuCustomized(raw)) {
    return {visible: [], hidden: []};
  }

  const layout = parseMainMenuLayout(raw);
  const visible = layout.visible.includes(MAIN_MENU_ITEMS.SETTINGS) ?
    layout.visible :
    [...layout.visible, MAIN_MENU_ITEMS.SETTINGS];
  const hidden = layout.hidden.filter((id) => id !== MAIN_MENU_ITEMS.SETTINGS);
  return {visible, hidden};
};

const serialize = (visible: number[], hidden: number[]) =>
  `${visible.join(',')};${hidden.join(',')}`;

const persistMainMenuLayout = (visible: number[], hidden: number[]) => {
  setExteralessSetting('OEAppearanceMainMenuLayout', serialize([...visible], [...hidden]));
};

/** Android `MainMenuLayout.save`: writes both halves; Settings stays visible. */
export const saveMainMenuLayout = (visible: number[], hidden: number[]) => {
  const nextVisible = visible.includes(MAIN_MENU_ITEMS.SETTINGS) ? [...visible] : [...visible, MAIN_MENU_ITEMS.SETTINGS];
  persistMainMenuLayout(nextVisible, hidden.filter((id) => id !== MAIN_MENU_ITEMS.SETTINGS));
};

/** Android's editor move: an id leaves both halves and joins the target one. */
export const setMenuItemVisible = (id: number, visible: boolean) => {
  if(id === MAIN_MENU_ITEMS.DIVIDER) return;
  const layout = resolveMainMenuLayout();
  const nextVisible = layout.visible.filter((known) => known !== id);
  const nextHidden = layout.hidden.filter((known) => known !== id);
  (visible ? nextVisible : nextHidden).push(id);
  persistMainMenuLayout(nextVisible, nextHidden);
};

/** Android `MainMenuLayout.reset`: an empty string means "never customized". */
export const resetMainMenuLayout = () => setExteralessSetting('OEAppearanceMainMenuLayout', '');

/**
 * Android `EtgBackup.isIdArray`: a JSON array of exact ints, at most 100,
 * duplicates rejected; -1 (the divider) only where allowed.
 */
export const isMenuIdArray = (value: string, allowDivider: boolean): boolean => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch(e) {
    return false;
  }

  if(!Array.isArray(parsed) || parsed.length > 100) {
    return false;
  }

  const seen = new Set<number>();
  for(const element of parsed) {
    if(typeof element !== 'number' || !Number.isInteger(element)) {
      return false;
    }

    if(element === MAIN_MENU_ITEMS.DIVIDER) {
      if(!allowDivider) {
        return false;
      }
    } else if(seen.has(element)) {
      return false;
    } else {
      seen.add(element);
    }
  }

  return true;
};

/** The `.extera` bridge: an exteraGram half replaces its own half of the key. */
export const applyMainMenuHalf = (half: 'layout' | 'hidden', ids: number[]) => {
  const current = parseMainMenuLayout(exteralessSettings.OEAppearanceMainMenuLayout);
  if(half === 'layout') {
    persistMainMenuLayout(ids, current.hidden);
    return;
  }

  // * Android saves (getLayout(), hidden) — a fresh client keeps its default
  // * visible half, which on the web is the stock menu's own mappable order
  const visible = current.visible.length ? current.visible : [...WEB_MENU_STOCK_ORDER];
  persistMainMenuLayout(visible, ids);
};

/** The web stock's mappable ids in stock order (Settings is forced, not stored). */
export const WEB_MENU_STOCK_ORDER: readonly number[] = [
  MAIN_MENU_ITEMS.SAVED,
  MAIN_MENU_ITEMS.ARCHIVE,
  MAIN_MENU_ITEMS.CONTACTS,
  MAIN_MENU_ITEMS.CALLS
];

/**
 * Applies the layout to the tools menu's pristine button list (FOLD-10/11/12).
 * An uncustomized key returns the list untouched — byte-for-byte stock. A
 * customized one keeps the menu's web-only composites in their stock frame
 * (the items before the first id-mapped one, the items between them, and the
 * items after the last one), lays the id-mapped items out in the visible
 * order, skips ids without a web backing (the pill-registry rule), and turns
 * a DIVIDER into a hairline after the previous item. Settings was already
 * forced visible by `resolveMainMenuLayout`.
 */
export const applyMainMenuLayoutToButtons = <T extends {oeMenuId?: number, separatorDown?: boolean}>(
  buttons: readonly T[],
  raw: string = exteralessSettings.OEAppearanceMainMenuLayout
): T[] => {
  if(!isMainMenuCustomized(raw)) {
    return [...buttons];
  }

  const layout = resolveMainMenuLayout(raw);
  const mappedIndexes = buttons.map((button, index) => button.oeMenuId !== undefined ? index : -1).filter((index) => index >= 0);
  if(!mappedIndexes.length) {
    return [...buttons];
  }

  const pre = buttons.slice(0, mappedIndexes[0]);
  const middleWebOnly = buttons.slice(mappedIndexes[0], mappedIndexes[mappedIndexes.length - 1])
    .filter((button) => button.oeMenuId === undefined);
  const post = buttons.slice(mappedIndexes[mappedIndexes.length - 1] + 1);
  const byId = new Map(buttons.filter((button) => button.oeMenuId !== undefined).map((button) => [button.oeMenuId as number, button]));

  // * the same item objects are reused on every open (the menu toggle tracks
  // * them by identity), so the divider marks reset before each application
  for(const item of byId.values()) {
    item.separatorDown = undefined;
  }

  const out: T[] = [...pre, ...middleWebOnly];
  for(const id of layout.visible) {
    if(id === MAIN_MENU_ITEMS.DIVIDER) {
      const previous = out[out.length - 1];
      if(previous) {
        previous.separatorDown = true;
      }

      continue;
    }

    const item = byId.get(id);
    if(item) {
      out.push(item);
    }
  }

  return [...out, ...post];
};

/** The type helper for the store's pick. */
export type MainMenuLayoutSettings = Pick<ExteralessSettings, 'OEAppearanceMainMenuLayout'>;
