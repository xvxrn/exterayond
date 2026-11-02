/*
 * G-4 — the theme-from-wallpaper extractor: the dominant chromatic color of
 * an image wallpaper (the decision logic — hue bucketing weighted by
 * saturation, the gray skip, the bucket mean), the per-record sample cache,
 * and the renderer's announcement event.
 */
import {describe, test, expect, vi} from 'vitest';
import {dominantColorFromPixels, dominantColorCached, dispatchWallpaperTint} from '@helpers/wallpaperTint';
import rootScope from '@lib/rootScope';
import type {WallPaper} from '@layer';

const px = (rgb: [number, number, number], times = 1): number[] => {
  const out: number[] = [];
  for(let i = 0; i < times; ++i) out.push(rgb[0], rgb[1], rgb[2], 255);
  return out;
};

describe('the wallpaper dominant color', () => {
  test('the most weighted hue bucket wins and its mean is the sample', () => {
    // * four red pixels against two blue: red dominates
    const hex = dominantColorFromPixels({
      data: [...px([200, 30, 40], 4), ...px([30, 40, 200], 2)],
      width: 6,
      height: 1
    });
    expect(hex).toBe('#c81e28');
  });

  test('a gray-dominant image yields no tint', () => {
    expect(dominantColorFromPixels({
      data: [...px([128, 128, 128], 4), ...px([60, 60, 60], 4)],
      width: 8,
      height: 1
    })).toBeUndefined();
  });

  test('near-gray pixels are skipped, chromatic minority wins', () => {
    // * six grays against two chromatic pixels: the grays carry no hue, the
    // * chromatic pair is the sample
    const hex = dominantColorFromPixels({
      data: [...px([120, 120, 120], 6), ...px([40, 180, 90], 2)],
      width: 8,
      height: 1
    });
    expect(hex).toBe('#28b45a');
  });
});

describe('the sample cache', () => {
  test('the same record is not resampled', () => {
    // * jsdom has no 2d context (the repo's test pattern: getContext → null):
    // * the first call samples (one getContext), the cached second must not
    const getContext = vi.fn((): null => null);
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {configurable: true, value: getContext});
    const img = {naturalWidth: 4, naturalHeight: 4, width: 4, height: 4} as HTMLImageElement;
    try {
      expect(dominantColorCached('cache-test', img)).toBeUndefined();
      expect(dominantColorCached('cache-test', img)).toBeUndefined();
      expect(getContext).toHaveBeenCalledTimes(1);
    } finally {
      delete (HTMLCanvasElement.prototype as {getContext?: unknown}).getContext;
    }
  });
});

describe('the renderer announcement', () => {
  test('an image wallpaper announces its sample, a record without one clears it', () => {
    const listener = vi.fn();
    rootScope.addEventListener('exteraless_wallpaper_tint', listener);

    const imageRecord = {_: 'wallPaper', id: 777, pFlags: {}, access_hash: '', slug: 'img', document: undefined} as WallPaper;
    dispatchWallpaperTint(imageRecord, undefined);
    expect(listener).toHaveBeenLastCalledWith({hex: undefined, key: '777'});

    // * a no-image call clears the level the same way
    const colorRecord = {
      _: 'wallPaperNoFile', id: 0, pFlags: {},
      settings: {_: 'wallPaperSettings', pFlags: {}, background_color: 0x112233}
    } as WallPaper;
    dispatchWallpaperTint(colorRecord, undefined);
    expect(listener).toHaveBeenLastCalledWith({hex: undefined, key: '0'});

    rootScope.removeEventListener('exteraless_wallpaper_tint', listener);
  });
});
