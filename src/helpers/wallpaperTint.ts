import rootScope from '@lib/rootScope';
import type {WallPaper} from '@layer';

/**
 * The wallpaper-derived tint level of the theme palette (user-directed look &
 * feel, G-4 — the Pixel/Material You "appearance color" idea): while the
 * palette toggle is on and the wallpaper is an image, its dominant chromatic
 * color tints the surface family, behind the explicit picks in the priority
 * chain (explicit background color > explicit accent > wallpaper-derived >
 * palette default, see `resolvePaletteTintSource`).
 *
 * The extraction is JS-only canvas sampling — the source is downscaled once,
 * the pixels bucketed by hue weighted by saturation, and the winning bucket's
 * mean color returned. A gray-dominant image carries no hue and yields
 * undefined, leaving the palette at its default. No server, no workers.
 *
 * The chat background renderer owns the hook point: it already decodes every
 * wallpaper for the canvas layers, so it samples the same decoded image at
 * render time and announces the result on `exteraless_wallpaper_tint`; every
 * wallpaper change re-renders and therefore re-derives. Samples are cached
 * per wallpaper record so theme re-renders do not resample.
 */

/** The hue-bucket count of the histogram (10° buckets). */
const HUE_BUCKETS = 36;

/** Pixels below this saturation carry no usable hue; a gray-dominant image yields no tint. */
const MIN_SATURATION = 0.12;

/**
 * The dominant chromatic color of raw RGBA pixels. Pure decision logic (the
 * bucketing, the gray skip, the mean) — the canvas plumbing around it is
 * `dominantColorFromSource`.
 */
export const dominantColorFromPixels = (
  pixels: {data: ArrayLike<number>, width: number, height: number}
): string | undefined => {
  const buckets = new Array<number[]>(HUE_BUCKETS);
  let totalWeight = 0;

  for(let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i] / 255, g = pixels.data[i + 1] / 255, b = pixels.data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if(s < MIN_SATURATION) {
      continue;
    }

    let h: number;
    if(d === 0) {
      h = 0;
    } else if(max === r) {
      h = ((g - b) / d) % 6;
    } else if(max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h = ((h * 60) % 360 + 360) % 360;

    const bucket = Math.min(HUE_BUCKETS - 1, Math.floor(h / (360 / HUE_BUCKETS)));
    (buckets[bucket] ??= []).push(i);
    totalWeight += s;
  }

  if(!totalWeight) {
    return undefined;
  }

  let bestBucket = 0;
  let bestWeight = 0;
  for(let i = 0; i < HUE_BUCKETS; ++i) {
    const members = buckets[i];
    if(!members) {
      continue;
    }

    let weight = 0;
    for(const index of members) {
      const r = pixels.data[index] / 255, g = pixels.data[index + 1] / 255, b = pixels.data[index + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const d = max - min;
      weight += d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    }

    if(weight > bestWeight) {
      bestWeight = weight;
      bestBucket = i;
    }
  }

  const members = buckets[bestBucket];
  let r = 0, g = 0, b = 0;
  for(const index of members) {
    r += pixels.data[index];
    g += pixels.data[index + 1];
    b += pixels.data[index + 2];
  }

  return '#' + [r / members.length, g / members.length, b / members.length]
    .map((c) => Math.round(c).toString(16).padStart(2, '0'))
    .join('');
};

/** The sample size cap of the downscale: a wallpaper's hue needs no more. */
const SAMPLE_MAX = 48;

/**
 * The canvas plumbing of `dominantColorFromPixels`: the source drawn into a
 * small offscreen canvas, then sampled.
 */
export const dominantColorFromSource = (source: HTMLImageElement): string | undefined => {
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  if(!width || !height) {
    return undefined;
  }

  const scale = Math.min(1, SAMPLE_MAX / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if(!context) {
    return undefined;
  }

  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return dominantColorFromPixels(context.getImageData(0, 0, canvas.width, canvas.height));
};

/** The samples taken so far, keyed by wallpaper record id. */
const samples = new Map<string, string | undefined>();

/**
 * The cached sample of a wallpaper record: the same record is not resampled
 * on a theme re-render, a new one is.
 */
export const dominantColorCached = (key: string, source: HTMLImageElement): string | undefined => {
  if(samples.has(key)) {
    return samples.get(key);
  }

  const hex = dominantColorFromSource(source);
  samples.set(key, hex);
  // * a bounded cache: wallpapers churn by the pick, the records are few
  if(samples.size > 8) {
    const oldest = samples.keys().next().value;
    if(oldest !== undefined) {
      samples.delete(oldest);
    }
  }

  return hex;
};

/**
 * The renderer's announcement: the dominant color of the wallpaper currently
 * rendered, or undefined for a record that carries no image (a pattern or a
 * color-only wallpaper — its colors are already in the record, and the
 * palette's derived level falls through to the default). The theme palette
 * listens and re-applies, so a wallpaper change re-derives the chrome live.
 */
export const dispatchWallpaperTint = (wallPaper: WallPaper, image: HTMLImageElement | undefined): void => {
  const key = '' + (wallPaper as WallPaper.wallPaper).id;
  const hex = image ? dominantColorCached(key, image) : undefined;
  rootScope.dispatchEventSingle('exteraless_wallpaper_tint', {hex, key});
};
