/**
 * The pill stack strip (`@components/sidebarLeft/pillStack`, PILLS-01..04)
 * against the real search-field contract: the mount renders only registered
 * pills, the field's text hides it, a store layout change rebuilds it live,
 * the one-pill switch is inert, and a failed cache collection is contained.
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// * jsdom's localStorage is unbacked here; the store reads it at import time,
// * so the stub installs before the first import (the pills test's harness)
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

// * the collectors are the Data & Storage tab's own module, extracted verbatim
// * for the pill; the test stands in for the CacheStorage layer itself
const collectors = vi.hoisted(() => ({
  files: vi.fn(),
  chunks: vi.fn()
}));
vi.mock('@components/sidebarLeft/tabs/dataAndStorage/cachedSizes', () => ({
  collectCachedFilesSizes: collectors.files,
  collectCachedVideoStreamChunksSize: collectors.chunks
}));

vi.mock('@lib/langPack', () => ({
  i18n: (key: string) => {
    const el = document.createElement('span');
    el.dataset.langKey = key;
    el.textContent = key;
    return el;
  },
  I18n: {
    format: (key: string) => key
  }
}));

import rootScope from '@lib/rootScope';
import {getMiddleware} from '@helpers/middleware';
import type {MiddlewareHelper} from '@helpers/middleware';
import type InputSearch from '@components/inputSearch';
import {attachPillStackStrip} from '@components/sidebarLeft/pillStack';
import type {PillStackStrip} from '@components/sidebarLeft/pillStack';
import {OE_DEFAULTS, exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';

const originalManagers = rootScope.managers;
let middlewareHelper: MiddlewareHelper;

const makeInputSearch = (): InputSearch => {
  const input = document.createElement('input');
  const container = document.createElement('div');
  container.className = 'input-search';
  container.append(input);
  document.body.append(container);
  return {input, container} as unknown as InputSearch;
};

const attachStrip = (inputSearch = makeInputSearch()): {strip: PillStackStrip, input: HTMLInputElement} => {
  const strip = attachPillStackStrip(inputSearch, middlewareHelper.get(), () => {});
  return {strip, input: inputSearch.input};
};

const RESET_STORAGE = () => {
  (localStorage as unknown as {_data: Map<string, string>})._data.clear();
  for(const key of Object.keys(OE_DEFAULTS) as Array<keyof typeof OE_DEFAULTS>) {
    setExteralessSetting(key, OE_DEFAULTS[key]);
  }
};

// * the cache pill's first value arrives through a dynamic import
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  rootScope.managers = originalManagers;
  middlewareHelper?.destroy();
  middlewareHelper = getMiddleware();
  RESET_STORAGE();
  collectors.files.mockResolvedValue({totalSize: 1024, collectedSizeByTypes: {images: 1024, videos: 0, stickers: 0, other: 0}});
  collectors.chunks.mockResolvedValue(0);
});

afterEach(() => {
  middlewareHelper?.destroy();
  document.body.textContent = '';
});

describe('the pill strip mount (PillStackController.attach)', () => {
  it('renders the registered pills only, with the visible one in the tab order', async() => {
    const {strip} = attachStrip();
    // * the default layout is '5,6' — CACHE(5) is the only registered id, so
    // * PROXY(6) renders nothing (the PillRegistry.createPill null rule)
    const pills = [...strip.container.querySelectorAll('.oe-pill')] as HTMLButtonElement[];
    expect(pills).toHaveLength(1);
    expect(pills[0].classList.contains('oe-pill-cache')).toBe(true);
    expect(strip.container.classList.contains('has-pills')).toBe(true);
    expect(strip.container.classList.contains('is-hidden')).toBe(false);
    expect(pills[0].tabIndex).toBe(0);
    expect(pills[0].getAttribute('aria-hidden')).toBe('false');
    expect(pills[0].getAttribute('aria-label')).toBe('Exteraless.PillStack.CacheName');
    // * the collectors ran once for the initial value
    await flush();
    expect(collectors.files).toHaveBeenCalledTimes(1);
    expect(collectors.chunks).toHaveBeenCalledTimes(1);
  });

  it('hides while the field holds text and returns when it empties', () => {
    const {strip, input} = attachStrip();
    input.value = 'query';
    input.dispatchEvent(new Event('input'));
    expect(strip.container.classList.contains('is-hidden')).toBe(true);

    // * the clear button's path goes through InputField.value → a simulated
    // * 'input' event — the same listener must see it
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(strip.container.classList.contains('is-hidden')).toBe(false);
  });

  it('a layout change through the store rebuilds the strip live', () => {
    const {strip} = attachStrip();
    // * the cache pill moves to the hidden list (the hub's click move)
    setExteralessSetting('OEPillActivePills', '');
    setExteralessSetting('OEPillHiddenPills', '5');
    expect(strip.container.querySelectorAll('.oe-pill')).toHaveLength(0);
    expect(strip.container.classList.contains('has-pills')).toBe(false);

    setExteralessSetting('OEPillActivePills', '5');
    setExteralessSetting('OEPillHiddenPills', '');
    const pills = [...strip.container.querySelectorAll('.oe-pill')] as HTMLButtonElement[];
    expect(pills).toHaveLength(1);
    expect(pills[0].classList.contains('is-hidden-pill')).toBe(false);
  });

  it('the one-pill switch is inert and persists nothing (PILLS-03 at count 1)', () => {
    const {strip, input} = attachStrip();
    const before = exteralessSettings.OEPillLastActiveId;

    // * a wheel notch over the strip
    strip.container.dispatchEvent(new WheelEvent('wheel', {deltaY: 100, cancelable: true}));
    // * the keyboard equivalent on the focused pill
    const pill = strip.container.querySelector('.oe-pill') as HTMLButtonElement;
    pill.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true, cancelable: true}));

    expect(exteralessSettings.OEPillLastActiveId).toBe(before);
    expect(pill.classList.contains('is-hidden-pill')).toBe(false);
    expect(input.value).toBe('');
  });

  it('the switch persists the new pill id when the layout carries more than one', () => {
    // * a dormant second registration is not possible today — the switch is
    // * driven through nextPillIndex, covered in exteralessPills.test.ts;
    // * here the wheel path must at least not throw and must not persist
    const {strip} = attachStrip();
    const wheel = new WheelEvent('wheel', {deltaY: -100, cancelable: true});
    strip.container.dispatchEvent(wheel);
    expect(exteralessSettings.OEPillLastActiveId).toBe(-1);
  });
});

describe('the cache pill value (PILLS-06, CachePill.onUpdateData)', () => {
  it('a failed cache collection is contained — the pill keeps its name, nothing rejects', async() => {
    const {strip} = attachStrip();
    // * the mount refresh resolved: the value element carries the formatted
    // * size's text (the renderer copies the i18n element's textContent) and
    // * the label carries the name (the ': value' suffix comes with data)
    await flush();
    const pill = strip.container.querySelector('.oe-pill') as HTMLButtonElement;
    const valueEl = pill.querySelector('.oe-pill-value') as HTMLElement;
    expect(valueEl.textContent).toBe('FileSize.KB');
    expect(pill.getAttribute('aria-label')).toBe('Exteraless.PillStack.CacheName: FileSize.KB');

    // * Firefox private mode (or denied storage) rejects the collectors; the
    // * rebuild a layout change triggers refreshes again. Without a catch in
    // * the renderer this file fails on the unhandled rejection.
    collectors.files.mockRejectedValueOnce(new Error('no cache storage'));
    collectors.chunks.mockRejectedValueOnce(new Error('no cache storage'));
    strip.rebuild();
    await flush();
    expect(strip.container.querySelectorAll('.oe-pill')).toHaveLength(1);
  });
});

describe('the strip teardown (middleware.onClean)', () => {
  it('a disposed strip stops listening to the field and the store', () => {
    const {strip, input} = attachStrip();
    middlewareHelper.destroy();

    input.value = 'query';
    input.dispatchEvent(new Event('input'));
    expect(strip.container.classList.contains('is-hidden')).toBe(false);

    // * the store listener is gone too: a layout change rebuilds nothing
    setExteralessSetting('OEPillActivePills', '');
    expect(strip.container.querySelectorAll('.oe-pill')).toHaveLength(1);
  });
});
