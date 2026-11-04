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

import {PILL_IDS, PILL_DEFAULT_ACTIVE, WEB_PILL_REGISTRY, nextPillIndex, parsePillIds, resolvePillLayout, getVisiblePillIds, getHubPillGroups, setPillActive, resetPillLayout} from '@stores/exterayondPills';
import {OE_DEFAULTS, exterayondSettings, setExterayondSetting} from '@stores/exterayondSettings';
import {etgBackup} from '@lib/exteraBackup/etgBackup';
import {bubbleRadiusToCss} from '@stores/exterayondSettings';
import rootScope from '@lib/rootScope';

// * a backup apply also writes the native archive flag, which rides the managers
const originalManagers = rootScope.managers;
beforeEach(() => {
  rootScope.managers = {appStateManager: {setByKey: vi.fn(() => Promise.resolve())}} as any;
});
afterEach(() => {
  rootScope.managers = originalManagers;
});

const RESET_STORAGE = () => {
  (localStorage as unknown as {_data: Map<string, string>})._data.clear();
  for(const key of Object.keys(OE_DEFAULTS) as Array<keyof typeof OE_DEFAULTS>) {
    setExterayondSetting(key, OE_DEFAULTS[key]);
  }
};

describe('pill stack layout (PillStackConfig contract)', () => {
  beforeEach(RESET_STORAGE);

  it('the defaults are the Android PillStackConfig values', () => {
    expect(OE_DEFAULTS.OEPillActivePills).toBe('5,6');
    expect(OE_DEFAULTS.OEPillHiddenPills).toBe('');
    expect(OE_DEFAULTS.OEPillInfiniteScrolling).toBe(true);
    expect(OE_DEFAULTS.OEPillLastActiveId).toBe(-1);
    expect(PILL_DEFAULT_ACTIVE).toBe('5,6');
  });

  it('parsePillIds follows Android parseList: trim, ints only, distinct', () => {
    expect(parsePillIds('5,6')).toEqual([5, 6]);
    expect(parsePillIds(' 5 , 6 , 5 ')).toEqual([5, 6]);
    expect(parsePillIds('')).toEqual([]);
    expect(parsePillIds('5,x,6')).toEqual([5, 6]);
    expect(parsePillIds('5,,6')).toEqual([5, 6]);
  });

  it('resolvePillLayout reads an id listed in both strings as active', () => {
    setExterayondSetting('OEPillActivePills', '5,6');
    setExterayondSetting('OEPillHiddenPills', '6,7');
    const layout = resolvePillLayout();
    expect(layout.active).toEqual([5, 6]);
    // * Android loadConfig filters the hidden list by !active.contains(it)
    expect(layout.hidden).toEqual([7]);
  });

  it('the strip renders only registered pills, the stored strings keep the rest', () => {
    // * PROXY(6) has no web counterpart; like Android's registry, an
    // * unregistered id is skipped by the strip and kept in the layout
    setExterayondSetting('OEPillActivePills', '5,6');
    expect(getVisiblePillIds()).toEqual([PILL_IDS.CACHE]);
    expect(exterayondSettings.OEPillActivePills).toBe('5,6');
    expect(WEB_PILL_REGISTRY.map((pill) => pill.id)).toEqual([5]);
  });

  it('setPillActive moves a pill between the lists like Android setPillActive', () => {
    setExterayondSetting('OEPillActivePills', '5,6');
    setPillActive(5, false);
    expect(resolvePillLayout()).toEqual({active: [6], hidden: [5]});
    setPillActive(5, true);
    expect(resolvePillLayout()).toEqual({active: [6, 5], hidden: []});
    // * moving an already-active pill to active is a no-op move
    setPillActive(5, true);
    expect(resolvePillLayout()).toEqual({active: [6, 5], hidden: []});
  });

  it('resetPillLayout restores the default active list', () => {
    setExterayondSetting('OEPillActivePills', '');
    setExterayondSetting('OEPillHiddenPills', '1,2,3,4,5,6');
    resetPillLayout();
    expect(resolvePillLayout()).toEqual({active: [5, 6], hidden: []});
  });

  it('the hub groups show registered pills only, active first in layout order', () => {
    setExterayondSetting('OEPillActivePills', '5,6');
    // * an id listed as both hidden and active reads active (Android loadConfig)
    setExterayondSetting('OEPillHiddenPills', '5');
    expect(getHubPillGroups()).toEqual({active: [PILL_IDS.CACHE], hidden: []});
    setPillActive(PILL_IDS.CACHE, false);
    expect(getHubPillGroups()).toEqual({active: [], hidden: [PILL_IDS.CACHE]});
  });
});

describe('bubbleRadius (W-entry, SharedConfig.bubbleRadius)', () => {
  it('the mapping keeps the stock at 17 and clamps the tail side below', () => {
    expect(bubbleRadiusToCss(17)).toBeUndefined();
    expect(bubbleRadiusToCss(12)).toEqual({far: '12px', tail: '6px'});
    expect(bubbleRadiusToCss(4)).toEqual({far: '4px', tail: '4px'});
    expect(bubbleRadiusToCss(0)).toEqual({far: '0px', tail: '0px'});
  });
});

describe('the strip switch (PILLS-03/04, PillStackView.animateToNextPill)', () => {
  it('nextPillIndex wraps with infinite scrolling and clamps at the edges without', () => {
    expect(nextPillIndex(0, 3, 1, true)).toBe(1);
    expect(nextPillIndex(2, 3, 1, true)).toBe(0);
    expect(nextPillIndex(0, 3, -1, true)).toBe(2);
    expect(nextPillIndex(1, 3, -1, true)).toBe(0);
    expect(nextPillIndex(2, 3, 1, false)).toBe(2);
    expect(nextPillIndex(0, 3, -1, false)).toBe(0);
    // * a single pill never switches
    expect(nextPillIndex(0, 1, 1, true)).toBe(0);
    expect(nextPillIndex(0, 0, 1, true)).toBe(0);
  });

  it('OEPillLastActiveId stays in the pill-id domain', async() => {
    setExterayondSetting('OEPillLastActiveId', 5);
    expect(exterayondSettings.OEPillLastActiveId).toBe(5);
    setExterayondSetting('OEPillLastActiveId', 99);
    expect(exterayondSettings.OEPillLastActiveId).toBe(15);
    setExterayondSetting('OEPillLastActiveId', -7);
    expect(exterayondSettings.OEPillLastActiveId).toBe(-1);
  });
});

describe('the pill stack keys in the .extera backup', () => {  beforeEach(RESET_STORAGE);

  it('the layout strings round-trip under the exteraGram names in the pills section', () => {
    setExterayondSetting('OEPillActivePills', '5,6');
    setExterayondSetting('OEPillHiddenPills', '1');
    setExterayondSetting('OEPillInfiniteScrolling', false);
    const exported = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(exported.pillstackconfig.activePills).toBe('5,6');
    expect(exported.pillstackconfig.hiddenPills).toBe('1');
    expect(exported.exteraconfig.infiniteScrolling).toBe(false);

    setExterayondSetting('OEPillActivePills', '5,6,7');
    const applied = etgBackup.applyBackup(exported, (key, value) => setExterayondSetting(key, value as never));
    expect(applied.applied).toBeGreaterThanOrEqual(3);
    expect(exterayondSettings.OEPillActivePills).toBe('5,6');
    expect(exterayondSettings.OEPillHiddenPills).toBe('1');
    expect(exterayondSettings.OEPillInfiniteScrolling).toBe(false);
  });

  it('isPillsLayout rejects duplicates, non-ints and out-of-domain ids', () => {
    const read = (pills: unknown) => etgBackup.readBackup(JSON.stringify({pillstackconfig: {activePills: pills}}));
    expect(read('5,6')?.knownCount).toBe(1);
    expect(read('')?.knownCount).toBe(1);
    expect(read('5,5')?.knownCount).toBe(0);
    expect(read('5,x')?.knownCount).toBe(0);
    expect(read('0')?.knownCount).toBe(0);
    expect(read('-1')?.knownCount).toBe(0);
    expect(read('5.5')?.knownCount).toBe(0);
    expect(read(`${'9,'.repeat(50)}9`)?.knownCount).toBe(0); // * 51 entries
  });
});
