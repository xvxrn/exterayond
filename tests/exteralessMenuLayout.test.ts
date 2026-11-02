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
  applyMainMenuHalf,
  applyMainMenuLayoutToButtons,
  isMenuIdArray,
  parseMainMenuLayout,
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
