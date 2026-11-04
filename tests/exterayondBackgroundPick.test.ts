/*
 * G-1 — the "Set a color" pick must actually repaint, live, and the explicit
 * color must win over the palette's accent tint and the accent-bundled
 * wallpaper. The flow runs the real persistence (`setWallpaperForCurrentTheme`)
 * against the real `appChatBackground` dedup guards (the canvas renderers are
 * mocked and spied), and the real `applyThemeFast` re-apply that lands the
 * `theme_changed` the palette re-derives its tint from.
 */
import {describe, test, expect, beforeAll, vi} from 'vitest';
import rootScope from '@lib/rootScope';
import {setAppSettingsSilent} from '@stores/appSettings';
import {SETTINGS_INIT} from '@config/state';
import type {WallPaper} from '@layer';

const gradientCreate = vi.hoisted(() => vi.fn(() => {
  const canvas = document.createElement('canvas');
  return {gradientRenderer: {cleanup: vi.fn()}, canvas};
}));
const patternGetInstance = vi.hoisted(() => vi.fn(() => {
  const canvas = document.createElement('canvas');
  return {
    createCanvas: () => canvas,
    renderToCanvas: () => Promise.resolve(),
    cleanup: vi.fn()
  };
}));

vi.mock('@components/chat/gradientRenderer', () => ({
  default: {create: gradientCreate}
}));
vi.mock('@components/chat/patternRenderer', () => ({
  default: {getInstance: patternGetInstance, resizeInstancesOf: vi.fn()}
}));
vi.mock('@lib/chatBackgroundStore', () => ({
  default: {getBackground: vi.fn(() => undefined), saveWallPaperToCache: vi.fn(), setBackgroundUrlToCache: vi.fn()}
}));
vi.mock('@lib/appDownloadManager', () => ({default: {}}));
vi.mock('@helpers/dom/renderImageFromUrl', () => ({default: vi.fn()}));
vi.mock('@helpers/averageColor', () => ({
  averageColorFromCanvas: vi.fn(() => [1, 2, 3]),
  averageColorFromImage: vi.fn(() => [1, 2, 3]),
  averageColor: vi.fn(() => Promise.resolve(new Uint8ClampedArray([1, 2, 3])))
}));

const makePick = (color: number): WallPaper => ({
  _: 'wallPaperNoFile',
  id: 0,
  pFlags: {},
  settings: {
    _: 'wallPaperSettings',
    background_color: color,
    pFlags: {}
  }
});

describe('the background color pick repaints live', () => {
  beforeAll(() => {
    (rootScope as any).managers = {
      appStateManager: {setByKey: () => Promise.resolve()},
      apiManager: {setThemeParams: () => Promise.resolve()}
    };
    setAppSettingsSilent('themes', SETTINGS_INIT.themes.map((t) => structuredClone(t)));
    setAppSettingsSilent('theme', 'night');
  });

  test('each pick lands a canvas render with its own colors', async() => {
    const {default: themeController} = await import('@helpers/themeController');
    const {default: appChatBackground} = await import('@components/chat/bubbles/chatBackground');

    appChatBackground.attach();
    gradientCreate.mockClear();

    // * the first render (boot-equivalent)
    await appChatBackground.setBackground({transition: 'instant'});
    const rendersAfterBoot = gradientCreate.mock.calls.length;

    // * pick A — the exact sequence backgroundColor.tsx runs (persist, then re-apply)
    await themeController.setWallpaperForCurrentTheme(makePick(0xcc4444), 'hsla(0, 50%, 50%, .4)');
    await appChatBackground.setBackground({transition: 'fade'});

    // * pick B — a second pick replaces the first (no reference-equality short-circuit)
    await themeController.setWallpaperForCurrentTheme(makePick(0x445566), 'hsla(270, 50%, 50%, .4)');
    await appChatBackground.setBackground({transition: 'fade'});

    expect(gradientCreate.mock.calls.length).toBeGreaterThan(rendersAfterBoot + 1);
    const calls = gradientCreate.mock.calls as unknown as string[][];
    expect(calls[calls.length - 2][0]).toBe('#cc4444');
    expect(calls[calls.length - 1][0]).toBe('#445566');
  });

  test('the pick re-tints the palette chrome through the fast re-apply', async() => {
    const {default: themeController} = await import('@helpers/themeController');
    const {paletteTintSource} = await import('@stores/exterayondThemePalette');

    document.documentElement.classList.add('night');
    try {
      await themeController.setWallpaperForCurrentTheme(makePick(0x0088ff), 'hsla(205, 100%, 50%, .4)');

      // * the real re-apply applyCurrentTheme runs — it dispatches the
      // * `theme_changed` the palette listens on
      themeController.applyThemeFast();

      expect(paletteTintSource()).toBe('#0088ff');
      // * the chrome follows the pick's hue, not the fixed palette: the
      // * mid-gray surface of the family takes the blue (the near-black
      // * surfaces keep their lightness, so read the hue on a lighter one)
      const secondary = document.documentElement.style.getPropertyValue('--secondary-color');
      expect(secondary).not.toBe('#5a5d63');
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(secondary.slice(i, i + 2), 16));
      expect(b).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(g);
    } finally {
      document.documentElement.classList.remove('night');
    }
  });
});

describe('the palette tint priority chain (G-1, G-4)', () => {
  test('an explicit pick wins over everything, an explicit accent pick over the wallpaper', async() => {
    const {resolvePaletteTintSource} = await import('@stores/exterayondThemePalette');

    const patternRecord = {
      _: 'wallPaper',
      id: '',
      slug: 'pattern',
      access_hash: '',
      pFlags: {default: true, pattern: true},
      document: undefined as undefined,
      settings: {_: 'wallPaperSettings', pFlags: {}, intensity: 50, background_color: 0xdbddbb}
    } as const;
    const imageRecord = {_: 'wallPaper', id: 777, slug: 'img', access_hash: '', pFlags: {}, document: undefined as undefined} as const;

    // * an explicit "Set a color" pick beats the accent and the derived level
    expect(resolvePaletteTintSource(makePick(0xcc4444), 0x8774e1, '#334455', true)).toBe('#cc4444');
    // * an explicit accent PICK (the picker's preset theme) beats the wallpaper
    expect(resolvePaletteTintSource(patternRecord, 0x8774e1, '#334455', true)).toBe('#8774e1');
    // * the theme's factory accent is not a pick: the wallpaper's color wins (G-4)
    expect(resolvePaletteTintSource(imageRecord, 0x8774e1, '#334455', false)).toBe('#334455');
    // * with nothing derived, the theme's own accent still tints (F-3)
    expect(resolvePaletteTintSource(patternRecord, 0x8774e1, undefined, false)).toBe('#8774e1');
    // * neither — the fixed palette
    expect(resolvePaletteTintSource(undefined, undefined, undefined, false)).toBeUndefined();
    // * a low pick pads to six digits (leading zero colors)
    expect(resolvePaletteTintSource(makePick(0x008dd0), undefined)).toBe('#008dd0');
  });

  test('an accent committed over a pick keeps the pick (the material wallpaper never replaces it)', async() => {
    const {default: themeController} = await import('@helpers/themeController');
    await themeController.setWallpaperForCurrentTheme(makePick(0x336699), 'hsla(210, 50%, 50%, .4)');

    // * the state an accent commit builds: presetToThemeSettings falls back to
    // * the current wallpaper (buildAccentPresetTheme), so the pick survives
    const {accentPresetFromColor} = await import('@config/themePresets');
    const preset = accentPresetFromColor(0x8774e1, 'baseThemeNight');
    expect(preset.wallpaper).toBeUndefined();

    const settings = themeController.getThemeSettings(themeController.getTheme());
    expect((settings?.wallpaper as WallPaper)?._).toBe('wallPaperNoFile');
    expect((settings?.wallpaper as any)?.settings?.background_color).toBe(0x336699);
  });

  test('the wallpaper-derived tint applies and clears live (G-4)', async() => {
    const {default: themeController} = await import('@helpers/themeController');
    const {paletteTintSource, tintPaletteSurface} = await import('@stores/exterayondThemePalette');
    const {setAppSettingsSilent} = await import('@stores/appSettings');
    const {setExterayondSetting} = await import('@stores/exterayondSettings');

    // * the factory night theme (id '', its accent is not a pick) with an
    // * image wallpaper: the derived level stands between the explicit picks
    // * and the theme's own accent
    const night = structuredClone(SETTINGS_INIT.themes.find((t) => t.name === 'night')!);
    night.settings = night.settings.map((s) => ({
      ...s,
      wallpaper: {_: 'wallPaper', id: 777, slug: 'img', access_hash: '', pFlags: {}, document: undefined as undefined}
    }));
    setAppSettingsSilent('themes', [night]);
    setAppSettingsSilent('theme', 'night');
    // * the palette (and its tint chain) stands only while the toggle is on
    setExterayondSetting('OEAppearanceThemePalette', true);
    document.documentElement.classList.add('night');

    try {
      const secondaryBase = () => {
        themeController.applyThemeFast();
        return document.documentElement.style.getPropertyValue('--secondary-color');
      };

      // * the theme's own accent tints the family first (F-3)
      expect(paletteTintSource()).toBe('#8774e1');
      const accentTinted = secondaryBase();
      expect(accentTinted).toBe(tintPaletteSurface('#5a5d63', '#8774e1'));

      // * the renderer's announcement applies the derived hue over it
      // * let the renders the earlier tests staged settle (they announce
      // * their own samples/clears when they land)
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(paletteTintSource()).toBe('#8774e1');
      rootScope.dispatchEventSingle('exteraless_wallpaper_tint', {hex: '#3355aa', key: '777'});
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(paletteTintSource()).toBe('#3355aa');
      const derived = secondaryBase();
      expect(derived).toBe(tintPaletteSurface('#5a5d63', '#3355aa'));

      // * a render of a record without an image clears the level: the
      // * theme's own accent tints again
      await new Promise((resolve) => setTimeout(resolve, 0));
      rootScope.dispatchEventSingle('exteraless_wallpaper_tint', {hex: undefined, key: '0'});
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(paletteTintSource()).toBe('#8774e1');
      expect(secondaryBase()).toBe(accentTinted);
    } finally {
      document.documentElement.classList.remove('night');
      setExterayondSetting('OEAppearanceThemePalette', false);
    }
  });
});
