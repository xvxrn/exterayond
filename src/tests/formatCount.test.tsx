import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createSignal} from 'solid-js';
import {render} from 'solid-js/web';

// * only the motion gate: with movement off the badge writes its text in place,
// * so these tests see exactly what `formatCount` returns
vi.mock('@helpers/liteMode', () => ({default: {isAvailable: () => false}}));

import Badge from '@components/badge';
import formatCount from '@helpers/number/formatCount';
import formatNumber from '@helpers/number/formatNumber';
import rootScope from '@lib/rootScope';
import {applyExteraBackup, SECTION_EXTERA} from '@lib/exteraBackup/etgBackup';
import {
  exteralessSettings,
  resetExteralessSettings,
  setExteralessSetting
} from '@stores/exteralessSettings';

/**
 * `DisableNumberRounding`: the formatter, the Badge that mounts it, and the
 * single `exteraless_settings_updated` refresh that imperative owners listen
 * for — all against the real store and the real rootScope event bus.
 */

const NBSP = '\u00a0';
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const nbspCount = (value: string) => (value.match(/\u00a0/g) || []).length;

describe('formatCount', () => {
  beforeEach(() => {
    resetExteralessSettings();
  });

  it('off is stock formatNumber byte for byte, decimals included', () => {
    // * the stock strings are pinned, so a change to formatNumber itself shows up
    const cases: Array<[value: number, decimals: number, stock: string]> = [
      [0, 2, '0'],
      [999, 2, '999'],
      [1000, 2, '1K'],
      [1234567, 2, '1.23M'],
      [-1000, 2, '-1K'],
      [-1234567, 2, '-1.23M'],
      [1234.5678, 0, '1K'],
      [1234.5678, 1, '1.2K'],
      [1234.5678, 2, '1.23K'],
      [1234.5678, 3, '1.235K'],
      [1234567, 0, '1M'],
      [1234567, 3, '1.235M']
    ];

    for(const [value, decimals, stock] of cases) {
      expect(formatNumber(value, decimals), `${value} at ${decimals}`).toBe(stock);
      expect(formatCount(value, decimals)).toBe(formatNumber(value, decimals));
    }

    expect(formatCount(1234567)).toBe(formatNumber(1234567));
  });

  it('on is every digit, grouped by exactly one NBSP per thousand', () => {
    setExteralessSetting('DisableNumberRounding', true);
    const cases: Array<[value: number, exact: string, nbsps: number]> = [
      [0, '0', 0],
      [999, '999', 0],
      [1000, '1' + NBSP + '000', 1],
      [1234567, '1' + NBSP + '234' + NBSP + '567', 2],
      [-1000, '-1' + NBSP + '000', 1],
      [-1234567, '-1' + NBSP + '234' + NBSP + '567', 2],
      [1000000, '1' + NBSP + '000' + NBSP + '000', 2],
      [1234.5678, '1' + NBSP + '234.5678', 1]
    ];

    for(const [value, exact, nbsps] of cases) {
      const text = formatCount(value);
      expect(text, `${value}`).toBe(exact);
      expect(nbspCount(text)).toBe(nbsps);
      expect(text.includes(' ')).toBe(false);
    }

    // * the exact path ignores the stock decimals: no rounding, no unit suffix
    for(const decimals of [0, 1, 2, 3, -1]) {
      expect(formatCount(1234567, decimals)).toBe('1' + NBSP + '234' + NBSP + '567');
    }

    expect(formatCount(1234.5678, 0)).toBe('1' + NBSP + '234.5678');
  });
});

describe('Badge with formatCount', () => {
  beforeEach(() => {
    resetExteralessSettings();
  });

  it('updates the mounted text in place on a toggle and a count change, then disposes', async() => {
    const [count, setCount] = createSignal(1000);
    const container = document.createElement('div');
    document.body.append(container);
    const dispose = render(() => <Badge tag="span" count={count()} format={formatCount} />, container);
    const badge = container.querySelector('.badge') as HTMLElement;
    await flush();
    expect(badge.textContent).toBe('1K');

    setExteralessSetting('DisableNumberRounding', true);
    await flush();
    expect(badge.textContent).toBe('1' + NBSP + '000');
    expect(container.querySelector('.badge')).toBe(badge);
    expect(badge.textContent.includes(' ')).toBe(false);

    setCount(1234567);
    await flush();
    expect(badge.textContent).toBe('1' + NBSP + '234' + NBSP + '567');
    expect(container.querySelector('.badge')).toBe(badge);

    setExteralessSetting('DisableNumberRounding', false);
    await flush();
    expect(badge.textContent).toBe('1.23M');
    expect(container.querySelector('.badge')).toBe(badge);
    // * motion is off: no roll DOM is left behind
    expect(badge.querySelector('.animated-counter')).toBeNull();
    expect(badge.classList.contains('is-rolling')).toBe(false);

    dispose();
    expect(badge.isConnected).toBe(false);
    expect(container.querySelector('.badge')).toBeNull();
    setCount(1000);
    setExteralessSetting('DisableNumberRounding', true);
    await flush();
    expect(badge.textContent).toBe('1.23M');
    expect(container.querySelector('.badge')).toBeNull();
  });
});

describe('count refresh events', () => {
  let events: Array<{key: string, value: boolean | number}>;
  let listener: (event: {key: string, value: boolean | number}) => void;

  beforeEach(() => {
    resetExteralessSettings();
    document.body.replaceChildren();
    events = [];
    listener = (event) => events.push(event);
    rootScope.addEventListener('exteraless_settings_updated', listener);
  });

  afterEach(() => {
    rootScope.removeEventListener('exteraless_settings_updated', listener);
    resetExteralessSettings();
  });

  it('an unrelated setting and a no-op count write refresh nothing', () => {
    setExteralessSetting('showSeconds', true);
    setExteralessSetting('HidePhone', false);
    setExteralessSetting('DisableNumberRounding', false);
    setExteralessSetting('DisableNumberRounding', false);
    expect(events).toEqual([]);
  });

  it('a count toggle and a reset each refresh once', () => {
    setExteralessSetting('DisableNumberRounding', true);
    expect(events).toEqual([{key: 'DisableNumberRounding', value: true}]);

    events.splice(0);
    setExteralessSetting('DisableNumberRounding', true);
    expect(events).toEqual([]);

    setExteralessSetting('DisableNumberRounding', false);
    expect(events).toEqual([{key: 'DisableNumberRounding', value: false}]);

    setExteralessSetting('DisableNumberRounding', true);
    events.splice(0);
    resetExteralessSettings();
    expect(exteralessSettings.DisableNumberRounding).toBe(false);
    expect(events).toEqual([{key: 'DisableNumberRounding', value: false}]);

    events.splice(0);
    resetExteralessSettings();
    expect(events).toEqual([]);
  });

  it('a backup import emits the count change even when an unrelated key follows it', () => {
    const applied = applyExteraBackup({[SECTION_EXTERA]: {
      disableNumberRounding: true,
      formatTimeWithSeconds: true
    }});
    expect(applied.applied).toBe(2);
    expect(events).toEqual([{key: 'DisableNumberRounding', value: true}]);

    // * the unrelated key applied after the import must not replace/swallow it
    events.splice(0);
    setExteralessSetting('HidePhone', false);
    expect(events).toEqual([]);

    events.splice(0);
    applyExteraBackup({[SECTION_EXTERA]: {
      disableNumberRounding: false,
      formatTimeWithSeconds: false
    }});
    setExteralessSetting('OEChatsRemoveMessageTail', false);
    expect(events).toEqual([{key: 'DisableNumberRounding', value: false}]);
  });

  it('a rejected backup value refreshes nothing', () => {
    const applied = applyExteraBackup({[SECTION_EXTERA]: {
      disableNumberRounding: 'yes',
      formatTimeWithSeconds: true
    }});
    expect(applied.applied).toBe(1);
    expect(exteralessSettings.DisableNumberRounding).toBe(false);
    expect(events).toEqual([]);
  });
});
