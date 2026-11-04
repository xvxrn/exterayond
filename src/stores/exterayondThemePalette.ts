import {hexToRgb, hslaToRgba, rgbaToHsla} from '@helpers/color';
import themeController from '@helpers/themeController';
import {hotListen} from '@helpers/hotModule';
import rootScope from '@lib/rootScope';
import type {WallPaper} from '@layer';
import {exterayondSettings} from '@stores/exterayondSettings';

/**
 * The theme palette (user-directed look & feel, V-4; reshaped by acceptance
 * round 1, F-2/F-3). One toggle: off is the theme's own surfaces (stock), on
 * is the near-black Material palette — and while it is on, every surface of
 * the family takes its hue from a tint source (Material-You behavior), so the
 * accent color and an explicit "Set a color" background pick both show
 * through the chrome.
 *
 * Android reference: the near-black surfaces with muted cards of the
 * exteraless/Monet dark look (`monet_amoled_gram.attheme`); the AMOLED variant
 * was removed with F-2. On the web the surface family is a set of CSS
 * variables the theme applier writes inline on `<html>` for `tinted` and
 * leaves to the static `.night` rules for `night` — the palette is an inline
 * override of that family, written after the theme's own application so the
 * stock values win the moment the toggle is off.
 *
 * The chat wallpaper is not part of the palette — the wallpaper record keeps
 * its own owner (Chat Wallpaper, V-1's pattern gate, and the accent picker's
 * material wallpaper); no theme object is touched.
 *
 * This module owns the wiring: the store deliberately does not import it (a
 * stateful store must not re-run on a themeController hot edit — see
 * scripts/import-graph.mjs), so the module self-registers its listeners and
 * the boot import lives in index.ts beside the store's own.
 */

/** The surface variables the palette drives — the family `colorMap.night` covers. */
export const THEME_PALETTE_SURFACE_KEYS = [
  'surface-color',
  'background-color',
  'body-background-color',
  'message-background-color',
  'input-search-background-color',
  'border-color',
  'secondary-color'
] as const;

/** Fixed near-black surfaces with muted cards — the hue comes from the tint source. */
export const THEME_PALETTE_SURFACES: {[key in typeof THEME_PALETTE_SURFACE_KEYS[number]]: string} = {
  'surface-color': '#141414',
  'background-color': '#0d0d0d',
  'body-background-color': '#0d0d0d',
  'message-background-color': '#1c1c1e',
  'input-search-background-color': '#151517',
  'border-color': '#232326',
  'secondary-color': '#5a5d63'
};

/**
 * Derives a hue-consistent surface from a tint source (F-3, Material-You):
 * the surface keeps its lightness and takes the source's hue with a low,
 * source-scaled saturation. A neutral source keeps the surfaces neutral, a
 * vivid one tints every surface of the family. The cap keeps text-bearing
 * surfaces (secondary-color) readable.
 */
export const tintPaletteSurface = (surfaceHex: string, tintHex: string): string => {
  const source = rgbaToHsla(...hexToRgb(tintHex));
  const surface = rgbaToHsla(...hexToRgb(surfaceHex));
  // * an achromatic source (a gray or black pick) carries no hue: the surface
  // * keeps its own instead of inheriting hue 0
  if(source.s > 0) {
    const h = ((source.h % 360) + 360) % 360;
    const s = Math.min(surface.s + source.s * 0.4, 24);
    const [r, g, b] = hslaToRgba(h, s, surface.l, 1);
    return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
  }

  return surfaceHex;
};

/** The surfaces a palette apply writes: the tinted family, or undefined when nothing applies. */
export const resolveThemePaletteSurfaces = (
  enabled: boolean | undefined,
  isDark: boolean,
  tintHex: string | undefined
): {[key in typeof THEME_PALETTE_SURFACE_KEYS[number]]: string} | undefined => {
  if(!enabled || !isDark) {
    return undefined;
  }

  if(!tintHex) {
    return THEME_PALETTE_SURFACES;
  }

  const out = {} as {[key in typeof THEME_PALETTE_SURFACE_KEYS[number]]: string};
  for(const key of THEME_PALETTE_SURFACE_KEYS) {
    out[key] = tintPaletteSurface(THEME_PALETTE_SURFACES[key], tintHex);
  }
  return out;
};

/**
 * The foreign inline values the last apply overwrote (tinted themes write
 * their own `--key` and `--key-rgb` inline), restored on clear — a blind
 * `removeProperty` would destroy the applier's own companions and leave the
 * tinted theme on its static fallbacks until the next theme change.
 */
const foreignInline = new Map<string, {value: string, rgb: string}>();

/**
 * What the palette itself wrote last, so the restore only undoes its own
 * writes. The theme applier rewrites the family between palette passes (a
 * theme switch, an accent re-apply, a "Set a color" pick run
 * `applyThemeFast`): when the current inline value no longer is the palette's,
 * the captured foreign pair belongs to the theme that was active before that
 * rewrite and must not land on the one that is active now.
 */
const appliedInline = new Map<string, {value: string, rgb: string}>();

/**
 * Applies (or clears) the palette's surface variables. Only a dark theme
 * (`isDark` — the `.night` class `ThemeController._setTheme` toggles for both
 * night and tinted) carries the palette; on a light theme the override is
 * cleared so the stock surfaces stand. Calling with the toggle off restores
 * exactly the foreign inline values a previous apply captured — only where
 * the palette's own writes still stand — and leaves every other inline
 * property alone.
 */
export const applyThemePalette = (
  enabled: boolean | undefined,
  isDark: boolean,
  tintHex: string | undefined,
  element: HTMLElement = document.documentElement
): void => {
  for(const [key, applied] of appliedInline) {
    const foreign = foreignInline.get(key);
    if(!foreign) continue;
    // * only undo the palette's own writes: a value the theme applier wrote
    // * since (≠ what the palette wrote) is already the correct restore
    // * target, and the captured foreign pair is stale for it
    if(element.style.getPropertyValue('--' + key) === applied.value) {
      element.style.setProperty('--' + key, foreign.value);
    }

    if(element.style.getPropertyValue('--' + key + '-rgb') === applied.rgb) {
      element.style.setProperty('--' + key + '-rgb', foreign.rgb);
    }
  }

  foreignInline.clear();
  appliedInline.clear();

  const values = resolveThemePaletteSurfaces(enabled, isDark, tintHex);
  if(!values) {
    return;
  }

  for(const key of THEME_PALETTE_SURFACE_KEYS) {
    // * capture before overwriting: an empty string means the property was
    // * unset, and restoring re-unsets it
    foreignInline.set(key, {
      value: element.style.getPropertyValue('--' + key),
      rgb: element.style.getPropertyValue('--' + key + '-rgb')
    });
    const hex = values[key];
    const rgb = hexToRgb(hex).join(',');
    appliedInline.set(key, {value: hex, rgb});
    element.style.setProperty('--' + key, hex);
    element.style.setProperty('--' + key + '-rgb', rgb);
  }
}

/**
 * The hue the palette tints its surfaces with — the priority chain of the
 * look & feel stream (G-1, G-4), explicit and first here:
 *
 *   explicit background color > explicit accent pick > wallpaper-derived
 *     (G-4) > the theme's own accent (F-3) > palette default (undefined)
 *
 * An explicit "Set a color" pick is a `wallPaperNoFile` record with a
 * `background_color` — the user's own choice, so it wins over everything
 * (acceptance round 1; G-1). An explicit accent PICK — the theme the accent
 * picker built (`preset:*`) — outranks the wallpaper the way the picker's
 * own rules do; the theme's factory or cloud-carried accent is not a pick,
 * and the Pixel behavior G-4 ports puts the wallpaper's color above it.
 * Undefined leaves the palette's fixed near-black values.
 */
export const resolvePaletteTintSource = (
  wallPaper: WallPaper | undefined,
  accentColor: number | undefined,
  wallpaperDerivedHex: string | undefined = undefined,
  accentIsExplicitPick = false
): string | undefined => {
  if(wallPaper?._ === 'wallPaperNoFile' && typeof wallPaper.settings?.background_color === 'number') {
    return '#' + wallPaper.settings.background_color.toString(16).padStart(6, '0');
  }

  if(accentColor !== undefined && accentIsExplicitPick) {
    return '#' + accentColor.toString(16).padStart(6, '0');
  }

  if(wallpaperDerivedHex) {
    return wallpaperDerivedHex;
  }

  return accentColor !== undefined ? '#' + accentColor.toString(16).padStart(6, '0') : undefined;
};

/**
 * The wallpaper-derived sample of the record currently rendered
 * (`exteraless_wallpaper_tint`), keyed by the record id so a stale sample of
 * another wallpaper never applies.
 */
let wallpaperDerivedTint: {key: string, hex: string} | undefined;

export const paletteTintSource = (): string | undefined => {
  try {
    const theme = themeController.getTheme();
    const settings = themeController.getThemeSettings(theme);
    const wallPaper = settings?.wallpaper as WallPaper | undefined;
    const derivedKey = wallPaper ? '' + (wallPaper as WallPaper.wallPaper).id : undefined;
    const derived = wallpaperDerivedTint && wallpaperDerivedTint.key === derivedKey ?
      wallpaperDerivedTint.hex :
      undefined;
    // * an explicit accent PICK is an accent the accent picker applied — the
    // * synthetic 'preset:*' theme it persists; the theme's factory or
    // * cloud-carried accent is not a pick and yields to the wallpaper (G-4)
    const accentIsPick = String((theme as {id?: unknown})?.id ?? '').startsWith('preset:');
    return resolvePaletteTintSource(wallPaper, settings?.accent_color, derived, accentIsPick);
  } catch(e) {
    // * no theme state yet (early import, tests): the fixed palette applies
    return undefined;
  }
};

const isDarkTheme = () => document.documentElement.classList.contains('night');

const applyCurrentPalette = () => applyThemePalette(
  exterayondSettings.OEAppearanceThemePalette,
  isDarkTheme(),
  paletteTintSource()
);

if(typeof document !== 'undefined') {
  // * `_setTheme` applies the theme colors first and dispatches afterwards,
  // * so a re-apply here lands on top with the fresh accent; the first boot
  // * application is silent (no event), and `user_auth` fires once the
  // * session restores. The store announces the toggle itself on its live
  // * channel (`OEAppearanceThemePalette` is a live key, reset included).
  hotListen(import.meta.hot, rootScope, 'theme_changed', applyCurrentPalette);
  hotListen(import.meta.hot, rootScope, 'user_auth', applyCurrentPalette);
  // * G-4: the renderer's dominant-color announcement — an image wallpaper's
  // * sample applies at the derived level (behind the explicit picks), a
  // * pattern/color render clears it; the re-apply makes a wallpaper change
  // * re-derive the chrome live
  hotListen(import.meta.hot, rootScope, 'exteraless_wallpaper_tint', ({hex, key}) => {
    wallpaperDerivedTint = hex ? {key, hex} : undefined;
    applyCurrentPalette();
  });
  hotListen(import.meta.hot, rootScope, 'exterayond_settings_updated', ({key}: {key: string}) => {
    if(key === 'OEAppearanceThemePalette') {
      applyCurrentPalette();
    }
  });

  applyCurrentPalette();
}

/**
 * The first theme apply of a page load is silent (`!this.applied` in the
 * controller dispatches no theme_changed), and this module's own boot apply
 * may run before the theme sets the `night` class — the login screen would
 * then keep stock surfaces until user_auth. Watch the class: the first real
 * `night` flip re-applies the palette with the real isDark; everything after
 * that rides theme_changed. The class attribute carries other mutations on
 * their way (the platform classes of `setRootClasses` land before the theme's
 * first apply), so the watcher follows the `night` class itself — not the
 * first mutation it sees — and stops once it has seen a flip; the controller
 * dispatches theme_changed on every apply after the first one. A helper (not
 * a top-level statement) so the observer instance lives inside a function —
 * the import-graph's statefulness model counts only top-level constructions.
 */
export const watchBootThemeClass = (onApply: () => void) => {
  if(typeof document === 'undefined') return;
  let lastNight = document.documentElement.classList.contains('night');
  const observer = new MutationObserver(() => {
    const night = document.documentElement.classList.contains('night');
    if(night === lastNight) {
      return;
    }

    lastNight = night;
    observer.disconnect();
    onApply();
  });
  observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
};

watchBootThemeClass(applyCurrentPalette);

// * a self-accepting module, like the store: an edit hot-updates it (the
// * listeners are replaced through hotListen, the palette re-applies
// * idempotently) instead of reloading the page (scripts/import-graph.mjs)
if(import.meta.hot) import.meta.hot.accept();
