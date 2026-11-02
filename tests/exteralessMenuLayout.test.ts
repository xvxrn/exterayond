import {beforeEach, describe, expect, it, vi} from 'vitest';

// * the store is reloaded per test like the settings store's own tests do
vi.hoisted(() => {
  vi.stubGlobal('localStorage', {
    _data: new Map<string, string>(),
    getItem(this: {_data: Map<string, string>}, k: string): string | null {
      return this._data.get(k) ?? null;
    },
    setItem(this: {_data: Map<string, string>}, k: string, v: string): void {
      this._data.set(k, v);
    },
    removeItem(this: {_data: Map<string, string>}, k: string): void {
      this._data.delete(k);
    },
    clear(this: {_data: Map<string, string>}): void {
      this._data.clear();
    }
  } as unknown as Storage);
});

import {
  MAIN_MENU_ITEMS,
  WEB_MENU_ITEM_IDS,
  WEB_MENU_STOCK_ORDER,
  addMenuDivider,
  applyMainMenuHalf,
  applyMainMenuLayoutToButtons,
  getEditorMainMenuLayout,
  getEditorVisibleEntries,
  isMenuIdArray,
  moveMenuEntry,
  parseMainMenuLayout,
  removeMenuDivider,
  resolveMainMenuLayout,
  resetMainMenuLayout,
  setMenuItemVisible
} from '@stores/exteralessMenuLayout';
import {OE_DEFAULTS, exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';

const RESET_STORAGE = () => {
  (localStorage as unknown as {_data: Map<string, string>})._data.clear();
  for(const key of Object.keys(OE_DEFAULTS) as Array<keyof typeof OE_DEFAULTS>) {
    setExteralessSetting(key, OE_DEFAULTS[key]);
  }
};

const USER_LAYOUT = '14,18,8,17,106;2,6,11,105,3,10,102,101';

describe('main menu layout (MainMenuLayout contract)', () => {
  beforeEach(RESET_STORAGE);

  it('the default is the Android "not customized" empty string', () => {
    expect(OE_DEFAULTS.OEAppearanceMainMenuLayout).toBe('');
    expect(parseMainMenuLayout('').visible).toEqual([]);
    // * ids in neither list are hidden (Android parse)
    expect(parseMainMenuLayout('').hidden).toEqual(expect.arrayContaining([...WEB_MENU_ITEM_IDS]));
  });

  it('parseMainMenuLayout reads the Android "visible;hidden" id scheme', () => {
    const layout = parseMainMenuLayout(USER_LAYOUT);
    expect(layout.visible).toEqual([14, 18, 8, 17, 106]);
    // * ids in neither list join the hidden half (Android parse)
    expect(layout.hidden).toEqual([2, 6, 11, 105, 3, 10, 102, 101, 107, 108, 109, 110, 111]);
  });

  it('parse drops unknown ids and duplicates, keeps dividers in the visible half only', () => {
    const layout = parseMainMenuLayout('14,999,14,-1,8;8,-1,6');
    expect(layout.visible).toEqual([14, -1, 8]);
    // * an id in both halves reads visible; the hidden half keeps the raw
    // * order and then takes every id listed in neither (Android parse)
    expect(layout.hidden).toEqual([8, 6, 2, 3, 10, 11, 18, 17, 101, 102, 105, 106, 107, 108, 109, 110, 111]);
  });

  it('resolve keeps Settings at its own position and appends it when hidden', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', USER_LAYOUT);
    const layout = resolveMainMenuLayout();
    // * 18/17/106 stay in the string (unbacked ids are the consumer's skip)
    expect(layout.visible).toEqual([14, 18, 8, 17, 106]);
    expect(layout.hidden).not.toContain(MAIN_MENU_ITEMS.SETTINGS);

    setExteralessSetting('OEAppearanceMainMenuLayout', '14,6;2,8,11');
    expect(resolveMainMenuLayout().visible).toEqual([14, 6, MAIN_MENU_ITEMS.SETTINGS]);
  });

  it('an uncustomized key means the stock menu (resolve yields no lists)', () => {
    expect(resolveMainMenuLayout()).toEqual({visible: [], hidden: []});
    setExteralessSetting('OEAppearanceMainMenuLayout', '14,6;2,8,11');
    expect(resolveMainMenuLayout().visible.length).toBeGreaterThan(0);
  });

  it('the editor read lists the stock halves on an uncustomized key (the hub screen)', () => {
    // * Android's editor shows the current layout when the key is empty
    // * (parse()'s getDefaultLayout branch) — the hub's Visible/Hidden lists
    // * must offer the stock items, not two empty sections
    expect(getEditorMainMenuLayout()).toEqual({
      visible: [...WEB_MENU_STOCK_ORDER, MAIN_MENU_ITEMS.SETTINGS],
      hidden: []
    });
    setExteralessSetting('OEAppearanceMainMenuLayout', USER_LAYOUT);
    expect(getEditorMainMenuLayout()).toEqual(resolveMainMenuLayout());
  });

  it('the first toggle from an uncustomized key saves the stock layout minus the item', () => {
    // * Android's editor edits the layout it shows and saves the whole thing;
    // * an empty visible half (the old behavior: ";11") would collapse the
    // * menu to Settings alone
    setMenuItemVisible(MAIN_MENU_ITEMS.SAVED, false);
    expect(exteralessSettings.OEAppearanceMainMenuLayout).toBe('14,6,10,8;11');
    expect(resolveMainMenuLayout().visible).toEqual([14, 6, 10, MAIN_MENU_ITEMS.SETTINGS]);
    expect(resolveMainMenuLayout().hidden).toContain(MAIN_MENU_ITEMS.SAVED);

    // * and back: the move rejoins the target half at its end
    setMenuItemVisible(MAIN_MENU_ITEMS.SAVED, true);
    expect(resolveMainMenuLayout().visible).toEqual([14, 6, 10, MAIN_MENU_ITEMS.SETTINGS, MAIN_MENU_ITEMS.SAVED]);
    expect(resolveMainMenuLayout().hidden).not.toContain(MAIN_MENU_ITEMS.SAVED);
  });

  it('setMenuItemVisible moves an id between the halves', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', USER_LAYOUT);
    setMenuItemVisible(MAIN_MENU_ITEMS.CONTACTS, true);
    expect(resolveMainMenuLayout().visible).toEqual([14, 18, 8, 17, 106, MAIN_MENU_ITEMS.CONTACTS]);
    expect(resolveMainMenuLayout().hidden).not.toContain(MAIN_MENU_ITEMS.CONTACTS);
    setMenuItemVisible(MAIN_MENU_ITEMS.CONTACTS, false);
    expect(resolveMainMenuLayout().visible).not.toContain(MAIN_MENU_ITEMS.CONTACTS);
    expect(resolveMainMenuLayout().hidden).toContain(MAIN_MENU_ITEMS.CONTACTS);
    // * the divider id is never a movable item
    setMenuItemVisible(MAIN_MENU_ITEMS.DIVIDER, true);
    expect(resolveMainMenuLayout().visible).not.toContain(-1);
  });

  it('reset returns to the Android "not customized" empty string', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', USER_LAYOUT);
    resetMainMenuLayout();
    expect(exteralessSettings.OEAppearanceMainMenuLayout).toBe('');
    expect(resolveMainMenuLayout()).toEqual({visible: [], hidden: []});
  });
});

// * FOLD-10/12 in the hub editor: Android's editor reorders by long-press
// * drag inside the visible section and manages dividers with an add button
// * and a click on the divider row (OpenExteraAppNavigationActivity:114-124,
// * 361-370, 403-420); the desktop adaptation moves entries with the row's
// * up/down buttons and does the same to the dividers.
describe('the editor reorder and dividers (FOLD-10/12)', () => {
  beforeEach(RESET_STORAGE);

  it('the displayed entries are the backed ids and the dividers, unbacked ids skipped', () => {
    expect(getEditorVisibleEntries()).toEqual([...WEB_MENU_STOCK_ORDER, MAIN_MENU_ITEMS.SETTINGS]);

    setExteralessSetting('OEAppearanceMainMenuLayout', USER_LAYOUT);
    // * 18 (Profile), 17 (QR) and 106 (Feed) have no web backing
    expect(getEditorVisibleEntries()).toEqual([MAIN_MENU_ITEMS.ARCHIVE, MAIN_MENU_ITEMS.SETTINGS]);

    setExteralessSetting('OEAppearanceMainMenuLayout', '11,-1,14,8;2');
    expect(getEditorVisibleEntries()).toEqual([
      MAIN_MENU_ITEMS.SAVED, MAIN_MENU_ITEMS.DIVIDER, MAIN_MENU_ITEMS.ARCHIVE, MAIN_MENU_ITEMS.SETTINGS
    ]);
  });

  it('moveMenuEntry swaps displayed neighbors and keeps Settings at its position', () => {
    // * the stock editor layout: Saved, Archive, Contacts, Calls, Settings
    moveMenuEntry(1, 'up');
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('14,11,6,10,8');
    expect(getEditorVisibleEntries()).toEqual([14, 11, 6, 10, 8]);

    // * the entry now at index 1 is Saved — it moves down past Contacts
    moveMenuEntry(1, 'down');
    expect(getEditorVisibleEntries()).toEqual([14, 6, 11, 10, 8]);
    // * Settings keeps its own position (save's ensureSettingsVisibility)
    moveMenuEntry(4, 'up');
    expect(getEditorVisibleEntries()).toEqual([14, 6, 11, 8, 10]);
  });

  it('moveMenuEntry clamps at the ends and is a no-op outside the range', () => {
    moveMenuEntry(0, 'up');
    expect(getEditorVisibleEntries()).toEqual([...WEB_MENU_STOCK_ORDER, MAIN_MENU_ITEMS.SETTINGS]);
    moveMenuEntry(-1, 'down');
    moveMenuEntry(99, 'up');
    expect(exteralessSettings.OEAppearanceMainMenuLayout).toBe('');
    moveMenuEntry(4, 'down');
    expect(getEditorVisibleEntries()).toEqual([...WEB_MENU_STOCK_ORDER, MAIN_MENU_ITEMS.SETTINGS]);
  });

  it('moveMenuEntry splices across unbacked ids between the displayed neighbors', () => {
    // * visible = Saved, Profile(unbacked), Contacts, Calls, Settings
    setExteralessSetting('OEAppearanceMainMenuLayout', '11,18,6,10,8;');
    moveMenuEntry(1, 'up'); // * Contacts moves above Saved; Profile drifts along
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('6,11,18,10,8');
    expect(getEditorVisibleEntries()).toEqual([6, 11, 10, 8]);
  });

  it('moveMenuEntry moves a divider like any displayed entry', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', '11,-1,14,8;2');
    moveMenuEntry(1, 'down');
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,14,-1,8');
    moveMenuEntry(2, 'up');
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,-1,14,8');
  });

  it('addMenuDivider appends to the end of the visible half (Android ID_ADD_DIVIDER)', () => {
    addMenuDivider();
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,14,6,10,8,-1');
    expect(getEditorVisibleEntries()).toEqual([11, 14, 6, 10, 8, -1]);
    // * the parser keeps dividers in the visible half only; a second one is fine
    addMenuDivider();
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,14,6,10,8,-1,-1');
  });

  it('removeMenuDivider removes the nth divider, unknown ordinals are no-ops', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', '11,-1,14,-1,8;2');
    removeMenuDivider(0);
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,14,-1,8');
    // * only ordinal 0 exists now — 1 is a no-op
    removeMenuDivider(1);
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,14,-1,8');
    removeMenuDivider(0);
    // * no dividers left, further removals are no-ops
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,14,8');
    removeMenuDivider(0);
    expect(exteralessSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('11,14,8');
  });
});

describe('the .extera main-menu aliases (EtgBackup.addMainMenuEntries)', () => {
  beforeEach(RESET_STORAGE);

  it('isMenuIdArray is Android isIdArray: exact ints, no dupes, divider where allowed', () => {
    expect(isMenuIdArray('[14,18,8]', true)).toBe(true);
    expect(isMenuIdArray('[14,18,8]', false)).toBe(true);
    expect(isMenuIdArray('[14,-1,8]', true)).toBe(true);
    expect(isMenuIdArray('[14,-1,8]', false)).toBe(false);
    expect(isMenuIdArray('[14,14]', true)).toBe(false);
    expect(isMenuIdArray('[14,18.5]', true)).toBe(false);
    expect(isMenuIdArray('["14"]', true)).toBe(false);
    expect(isMenuIdArray('14,18', true)).toBe(false);
    expect(isMenuIdArray('[14,18]', true)).toBe(true);
  });

  it('the layout half replaces the visible half; the hidden half keeps the stock visible on a fresh client', () => {
    applyMainMenuHalf('layout', [14, 8]);
    expect(exteralessSettings.OEAppearanceMainMenuLayout.startsWith('14,8;')).toBe(true);

    RESET_STORAGE();
    applyMainMenuHalf('hidden', [2, 6]);
    // * Android saves (getLayout(), hidden): the fresh visible half is the
    // * stock menu's own mappable order
    expect(resolveMainMenuLayout().visible).toEqual([...WEB_MENU_STOCK_ORDER, MAIN_MENU_ITEMS.SETTINGS]);
    expect(resolveMainMenuLayout().hidden).toEqual(expect.arrayContaining([2, 6]));
  });
});

type FakeButton = {name: string, oeMenuId?: number, separatorDown?: boolean};

describe('applyMainMenuLayoutToButtons (the tools menu consumption)', () => {
  beforeEach(RESET_STORAGE);

  const stock: FakeButton[] = [
    {name: 'addAccount'},
    {name: 'createANew'},
    {name: 'saved', oeMenuId: 11},
    {name: 'archive', oeMenuId: 14},
    {name: 'stories'},
    {name: 'contacts', oeMenuId: 6},
    {name: 'calls', oeMenuId: 10},
    {name: 'settings', oeMenuId: 8},
    {name: 'more'}
  ];

  it('an uncustomized key returns the stock list untouched', () => {
    expect(applyMainMenuLayoutToButtons(stock).map((button) => button.name)).toEqual(stock.map((button) => button.name));
  });

  it('a customized key lays the mapped items out and keeps the web-only frame', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', USER_LAYOUT);
    const out = applyMainMenuLayoutToButtons(stock);
    // * 18/17/106 have no web backing and render nothing; 14 and 8 do;
    // * Settings is forced in; stories/addAccount/createANew/more keep the frame
    expect(out.map((button) => button.name)).toEqual(['addAccount', 'createANew', 'stories', 'archive', 'settings', 'more']);
  });

  it('a DIVIDER in the visible half marks the previous item with a hairline', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', '14,-1,8;6,11,10');
    const out = applyMainMenuLayoutToButtons(stock);
    const archive = out.find((button) => button.name === 'archive');
    expect(archive?.separatorDown).toBe(true);
    expect(out.find((button) => button.name === 'settings')?.separatorDown).toBeUndefined();
  });

  it('the divider marks reset between applications', () => {
    setExteralessSetting('OEAppearanceMainMenuLayout', '14,-1,8;6,11,10');
    applyMainMenuLayoutToButtons(stock);
    setExteralessSetting('OEAppearanceMainMenuLayout', '14,8;6,11,10');
    const out = applyMainMenuLayoutToButtons(stock);
    expect(out.find((button) => button.name === 'archive')?.separatorDown).toBeUndefined();
  });
});
