/**
 * The theme palette and the custom accent preset (V-4, reshaped by
 * acceptance round 1 F-2/F-3): the single toggle's surface resolution, the
 * accent-driven Material tint, the variables a palette apply writes (and that
 * a clear removes only its own), and the accent-preset composition the picker
 * feeds into the stock apply pipeline — including the material wallpaper.
 */
import {
  applyThemePalette,
  resolveThemePaletteSurfaces,
  THEME_PALETTE_SURFACES,
  THEME_PALETTE_SURFACE_KEYS,
  tintPaletteSurface,
  watchBootThemeClass
} from '@stores/exterayondThemePalette';
import {
  accentPresetFromColor,
  CUSTOM_ACCENT_PRESET_ID,
  materialWallpaperFromAccent,
  presetThemeId
} from '@config/themePresets';
import {exterayondSettings, resetExterayondSettings, setExterayondSetting} from '@stores/exterayondSettings';

describe('theme palette resolution', () => {
  test('off and light themes resolve nothing, on resolves the fixed surfaces', () => {
    expect(resolveThemePaletteSurfaces(false, true, undefined)).toBeUndefined();
    expect(resolveThemePaletteSurfaces(undefined, true, undefined)).toBeUndefined();
    expect(resolveThemePaletteSurfaces(true, false, undefined)).toBeUndefined();
    expect(resolveThemePaletteSurfaces(true, true, undefined)).toBe(THEME_PALETTE_SURFACES);
  });

  test('a tint source hue-tints every surface of the family', () => {
    const tinted = resolveThemePaletteSurfaces(true, true, '#8774e1')!;
    expect(tinted).not.toBe(THEME_PALETTE_SURFACES);
    for(const key of THEME_PALETTE_SURFACE_KEYS) {
      expect(tinted[key]).not.toBe(THEME_PALETTE_SURFACES[key]);
    }
    // * the tint is hue-consistent: every surface shares the source's hue
    // * and keeps its lightness family (near-black stays near-black)
    expect(tinted['background-color']).toBe(tintPaletteSurface(THEME_PALETTE_SURFACES['background-color'], '#8774e1'));
    // * the near-black background gains a subtle purple cast, not brightness
    const bg = tinted['background-color'];
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
    expect(Math.max(r, g, b)).toBeLessThan(0x20);
    expect(b).toBeGreaterThan(r);
  });
});

describe('theme palette surface tint', () => {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  test('the surface keeps its lightness and takes the source hue at low saturation', () => {
    const [r, g, b] = channels(tintPaletteSurface('#141414', '#0088ff'));
    // * the near-black surface stays near-black, with a subtle blue cast
    expect(Math.max(r, g, b)).toBeLessThan(0x20);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  test('a neutral source keeps the surfaces neutral', () => {
    expect(tintPaletteSurface('#141414', '#808080')).toBe('#141414');
    expect(tintPaletteSurface('#1c1c1e', '#000000')).toBe('#1c1c1e');
  });

  test('a vivid source saturates no surface past the readability cap', () => {
    // * the secondary text color takes the hue without losing its lightness:
    // * red-tinted, with the unchanged green/blue balance of a capped saturation
    const [r, g, b] = channels(tintPaletteSurface('#5a5d63', '#ff0000'));
    expect(r).toBeGreaterThan(g);
    expect(g).toBe(b);
  });
});

describe('theme palette application', () => {
  // * one element per test: the palette tracks what it wrote per call, not per element
  const root = () => {
    const el = document.createElement('div');
    document.body.append(el);
    return el;
  };

  test('the off toggle and a light theme write nothing', () => {
    const el = root();
    el.style.setProperty('--surface-color', '#212121'); // * a theme applier's own inline value
    applyThemePalette(false, true, undefined, el);
    applyThemePalette(true, false, undefined, el);
    expect(el.style.getPropertyValue('--surface-color')).toBe('#212121');
    expect(el.style.getPropertyValue('--background-color')).toBe('');
  });

  test('a dark theme takes the palette surface family with rgb companions', () => {
    const el = root();
    applyThemePalette(true, true, undefined, el);
    for(const key of THEME_PALETTE_SURFACE_KEYS) {
      expect(el.style.getPropertyValue('--' + key)).toBe(THEME_PALETTE_SURFACES[key]);
      const rgb = el.style.getPropertyValue('--' + key + '-rgb').split(',').map((n) => +n);
      expect(rgb).toHaveLength(3);
      expect(rgb.every((n) => n >= 0 && n <= 255)).toBe(true);
    }
  });

  test('a tint source applies the tinted family', () => {
    const el = root();
    applyThemePalette(true, true, '#8774e1', el);
    expect(el.style.getPropertyValue('--surface-color')).toBe(tintPaletteSurface(THEME_PALETTE_SURFACES['surface-color'], '#8774e1'));
    expect(el.style.getPropertyValue('--background-color')).not.toBe(THEME_PALETTE_SURFACES['background-color']);
  });

  test('clearing removes only the palette writes and leaves foreign values', () => {
    const el = root();
    el.style.setProperty('--surface-color', '#1d2733'); // * a theme applier's own inline value
    el.style.setProperty('--surface-color-rgb', '29,39,51');
    applyThemePalette(true, true, undefined, el);

    applyThemePalette(false, true, undefined, el);
    for(const key of THEME_PALETTE_SURFACE_KEYS) {
      expect(el.style.getPropertyValue('--' + key)).toBe(key === 'surface-color' ? '#1d2733' : '');
      expect(el.style.getPropertyValue('--' + key + '-rgb')).toBe(key === 'surface-color' ? '29,39,51' : '');
    }
    // * a property the palette never wrote stays
    el.style.setProperty('--oe-unrelated', 'keep');
    applyThemePalette(true, true, undefined, el);
    applyThemePalette(false, true, undefined, el);
    expect(el.style.getPropertyValue('--oe-unrelated')).toBe('keep');
  });

  test('a foreign value written between the apply and the clear stands (byte-exact)', () => {
    const el = root();
    el.style.setProperty('--surface-color', '#1d2733');
    el.style.setProperty('--surface-color-rgb', '29,39,51');
    applyThemePalette(true, true, undefined, el);
    // * the theme applier rewrites the family (a theme switch, an accent
    // * re-apply, a "Set a color" pick run applyThemeFast between palette
    // * passes) — its own values are the correct restore target now
    el.style.setProperty('--surface-color', '#17212b');
    el.style.setProperty('--surface-color-rgb', '23,33,43');

    applyThemePalette(false, true, undefined, el);
    expect(el.style.getPropertyValue('--surface-color')).toBe('#17212b');
    expect(el.style.getPropertyValue('--surface-color-rgb')).toBe('23,33,43');
  });

  test('a theme re-apply while the toggle is on re-captures, and the clear restores the new theme', () => {
    const el = root();
    // * theme A's inline values, the palette over them
    el.style.setProperty('--surface-color', '#1d2733');
    el.style.setProperty('--surface-color-rgb', '29,39,51');
    applyThemePalette(true, true, undefined, el);
    // * the theme switches to B: the applier rewrites the family, then
    // * theme_changed re-applies the palette on top
    el.style.setProperty('--surface-color', '#17212b');
    el.style.setProperty('--surface-color-rgb', '23,33,43');
    applyThemePalette(true, true, undefined, el);
    expect(el.style.getPropertyValue('--surface-color')).toBe(THEME_PALETTE_SURFACES['surface-color']);

    // * the toggle off restores the values of the theme that is active now —
    // * byte-exact — never the ones captured under theme A
    applyThemePalette(false, true, undefined, el);
    expect(el.style.getPropertyValue('--surface-color')).toBe('#17212b');
    expect(el.style.getPropertyValue('--surface-color-rgb')).toBe('23,33,43');
  });

  test('a light theme after a dark palette apply keeps the light theme values', () => {
    const el = root();
    el.style.setProperty('--surface-color', '#212121');
    el.style.setProperty('--surface-color-rgb', '33,33,33');
    applyThemePalette(true, true, undefined, el);
    // * the switch to a light theme: the applier writes the day values and
    // * theme_changed re-applies; the palette resolves nothing on light, and
    // * its captured dark values must not land on the light theme
    el.style.setProperty('--surface-color', '#ffffff');
    el.style.setProperty('--surface-color-rgb', '255,255,255');
    applyThemePalette(true, false, undefined, el);
    expect(el.style.getPropertyValue('--surface-color')).toBe('#ffffff');
    expect(el.style.getPropertyValue('--surface-color-rgb')).toBe('255,255,255');

    // * a later clear on the light theme leaves them standing too
    applyThemePalette(false, true, undefined, el);
    expect(el.style.getPropertyValue('--surface-color')).toBe('#ffffff');
  });
});

describe('theme palette wiring', () => {
  // * the store's live channel drives the palette: toggle, reset included
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  test('the store toggle applies the dark surface family and reset clears it', async() => {
    const root = document.documentElement;
    // * the palette only stands on a dark theme (the `.night` class)
    root.classList.add('night');

    try {
      // * no theme state in the test environment: the fixed near-black family
      expect(root.style.getPropertyValue('--surface-color')).toBe('');
      setExterayondSetting('OEAppearanceThemePalette', true);
      await flush();
      expect(exterayondSettings.OEAppearanceThemePalette).toBe(true);
      expect(root.style.getPropertyValue('--surface-color')).toBe('#141414');
      expect(root.style.getPropertyValue('--background-color')).toBe('#0d0d0d');
      expect(root.style.getPropertyValue('--surface-color-rgb')).toBe('20,20,20');

      // * off clears exactly the family it wrote
      setExterayondSetting('OEAppearanceThemePalette', false);
      await flush();
      expect(root.style.getPropertyValue('--surface-color')).toBe('');
      expect(root.style.getPropertyValue('--background-color')).toBe('');

      // * reset restores the off default and clears a left-over apply
      setExterayondSetting('OEAppearanceThemePalette', true);
      await flush();
      resetExterayondSettings();
      await flush();
      expect(root.style.getPropertyValue('--surface-color')).toBe('');
    } finally {
      root.classList.remove('night');
    }
  });
});

describe('the boot theme-class watcher', () => {
  // * the palette's boot apply may run before the theme sets `.night` (the
  // * first theme apply is silent), and the platform classes of
  // * `setRootClasses` land on the same attribute before it — the watcher
  // * follows the `night` class itself, not the first mutation it sees
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  test('an unrelated class mutation does not consume it; the night flip fires once', async() => {
    const root = document.documentElement;
    expect(root.classList.contains('night')).toBe(false);
    const onApply = vi.fn();
    const stop = watchBootThemeClass(onApply);

    try {
      root.classList.add('native-scroll'); // * setRootClasses' platform classes
      await flush();
      expect(onApply).not.toHaveBeenCalled();

      root.classList.add('night'); // * the theme's first (silent) apply
      await flush();
      expect(onApply).toHaveBeenCalledTimes(1);

      root.classList.remove('night'); // * a later switch rides theme_changed
      await flush();
      expect(onApply).toHaveBeenCalledTimes(1);
    } finally {
      root.classList.remove('night', 'native-scroll');
    }
  });
});

describe('custom accent preset', () => {
  test('dark bases derive the bubble gradient, light bases take the solid fill', () => {
    const accent = 0x8774e1;
    const dark = accentPresetFromColor(accent, 'baseThemeNight');
    expect(dark.id).toBe(CUSTOM_ACCENT_PRESET_ID);
    expect(dark.accent_color).toBe(accent);
    expect(dark.message_colors).toHaveLength(2);
    expect(dark.message_colors).not.toContain(accent);

    const tinted = accentPresetFromColor(accent, 'baseThemeTinted');
    expect(tinted.message_colors).toEqual(dark.message_colors);

    const light = accentPresetFromColor(accent, 'baseThemeDay');
    expect(light.message_colors).toEqual([accent]);

    // * the synthetic id marks the theme as a curated source for applyNewTheme
    expect(presetThemeId(dark)).toBe('preset:0');
  });
});

describe('the accent material wallpaper', () => {
  test('dark bases carry four dark accent-hued stops with the dark flag', () => {
    const accent = 0x8774e1;
    const wallPaper = materialWallpaperFromAccent(accent, 'baseThemeNight');
    expect(wallPaper.dark).toBe(true);
    expect(wallPaper.intensity).toBe(40);
    const stops = [
      wallPaper.background_color,
      wallPaper.second_background_color,
      wallPaper.third_background_color,
      wallPaper.fourth_background_color
    ];
    expect(stops).toHaveLength(4);
    // * every stop is a distinct dark derivation of the accent, not the accent itself
    for(const stop of stops) {
      expect(stop).not.toBe(accent);
      const [r, g, b] = [(stop! >> 16) & 0xff, (stop! >> 8) & 0xff, stop! & 0xff];
      expect(Math.max(r, g, b)).toBeLessThan(128);
    }
    expect(new Set(stops).size).toBe(4);
    expect(materialWallpaperFromAccent(accent, 'baseThemeTinted')).toEqual(wallPaper);
  });

  test('light bases carry pastel stops at the day intensity without the dark flag', () => {
    const accent = 0x0088ff;
    const wallPaper = materialWallpaperFromAccent(accent, 'baseThemeDay');
    expect(wallPaper.dark).toBeUndefined();
    expect(wallPaper.intensity).toBe(50);
    for(const stop of [wallPaper.background_color, wallPaper.second_background_color, wallPaper.third_background_color, wallPaper.fourth_background_color]) {
      const [r, g, b] = [(stop! >> 16) & 0xff, (stop! >> 8) & 0xff, stop! & 0xff];
      expect(Math.min(r, g, b)).toBeGreaterThan(64);
    }
  });
});
