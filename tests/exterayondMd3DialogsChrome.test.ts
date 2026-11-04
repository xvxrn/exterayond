/**
 * The ninth MD3 part (packet 065, `OEAppearanceMd3Dialogs`, root class
 * `oe-md3-dialogs`): the emitted chrome rules and their gate. The compile
 * audit proves off = stock (every rule is anchored at the root class, so
 * nothing can match without it), color-only (custom properties only —
 * direction-neutral by construction), that a search field inside a dialog
 * card takes a surface of its own (the pinned reference's
 * `dialogSearchBackground` distinction — packet 069), and that the menu rule
 * declares the reactions container directly so the dual-toggle with
 * `oe-no-glass-menus` resolves by sheet order (packet 069). The jsdom gate
 * proves the root class survives theme switches and theme-palette applies.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as sass from 'sass';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');

type CssBlock = {selector: string, declarations: string[]};

const parseBlocks = (css: string): CssBlock[] => {
  const blocks: CssBlock[] = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while((match = rule.exec(css))) {
    // * a selector group is emitted as one rule — expand it so every selector
    // * is matched (and ordered) on its own
    const declarations = match[2].split(';').map((declaration) => declaration.trim()).filter(Boolean);
    for(const selector of match[1].split(',').map((s) => s.trim()).filter(Boolean)) {
      blocks.push({selector, declarations});
    }
  }

  return blocks;
};

// * the three owner files of the ninth part, compiled standalone the same way
// * the packet verified them (the partials only `@use` their own shared kit)
const compilePartials = (): CssBlock[] => {
  const partials = [
    'src/scss/partials/popups/_popup.scss',
    'src/scss/partials/_button.scss',
    'src/scss/partials/_inputSearch.scss'
  ];
  const blocks: CssBlock[] = [];
  for(const partial of partials) {
    const result = sass.compile(path.resolve(rootDir, partial), {
      loadPaths: [
        path.resolve(rootDir, 'src/scss'),
        path.resolve(rootDir, 'src/scss/partials'),
        path.resolve(rootDir, 'src/scss/partials/popups')
      ]
    });
    blocks.push(...parseBlocks(result.css));
  }

  return blocks;
};

describe('the ninth MD3 part chrome (compiled rules)', () => {
  const blocks = compilePartials();
  const md3Blocks = blocks.filter(({selector}) => selector.includes('oe-md3-dialogs'));

  test('every rule is anchored at the root class — off matches nothing (stock byte-for-byte)', () => {
    expect(md3Blocks.length).toBeGreaterThanOrEqual(4);
    for(const {selector} of md3Blocks) {
      expect(selector.startsWith(':root.oe-md3-dialogs')).toBe(true);
    }
  });

  test('every rule is color-only: custom properties, no physical or shape declarations (RTL-neutral)', () => {
    for(const {declarations} of md3Blocks) {
      expect(declarations.length).toBeGreaterThan(0);
      for(const declaration of declarations) {
        expect(declaration.startsWith('--')).toBe(true);
      }
    }
  });

  test('a search field inside a dialog card takes a distinct surface from the card', () => {
    // * the pinned reference gives the dialog search field its own, lighter
    // * surface (`dialogSearchBackground` n1_900 against `dialogBackground`
    // * n2_800_80 in monet_dark_gram.attheme); the same mix on both would
    // * dissolve the borderless pill into the card it sits on
    const value = (selector: string, property: string) =>
      md3Blocks.find(({selector: s}) => s === selector)?.declarations
        .find((declaration) => declaration.startsWith(property))
        ?.split(':')[1]?.trim();

    const card = value(':root.oe-md3-dialogs .popup-container', '--popup-background-color');
    const field = value(':root.oe-md3-dialogs .popup-container .input-search', '--input-search-background-color');
    const standaloneField = value(':root.oe-md3-dialogs .input-search', '--input-search-background-color');

    expect(card).toBeTruthy();
    expect(standaloneField).toBeTruthy();
    // * the in-dialog override exists and differs from the card it sits on
    expect(field).toBeTruthy();
    expect(field).not.toBe(card);
    // * the in-dialog step is stronger in the accent than the card's 8% mix
    expect(field).toContain('12%');
    expect(card).toContain('8%');
    // * fields outside dialogs keep the packet's declared role
    expect(standaloneField).toContain('8%');
  });

  test('the menu rule declares the reactions container, so the dual-toggle resolves by sheet order', () => {
    // * oe-no-glass-menus writes --menu-background-color on the reactions
    // * container itself; an element declaration beats an inherited value at
    // * any sheet order, so the ninth part must declare on the same element
    // * for its (later, equal-specificity) rule to win the documented
    // * dual-toggle resolution
    const md3 = md3Blocks.find(({selector}) => selector === ':root.oe-md3-dialogs .btn-menu-reactions-container');
    expect(md3).toBeTruthy();
    expect(md3!.declarations.some((declaration) => declaration.startsWith('--menu-background-color'))).toBe(true);

    const noGlass = blocks.find(({selector}) => selector === ':root.oe-no-glass-menus .btn-menu-reactions-container');
    expect(noGlass).toBeTruthy();
    expect(noGlass!.declarations.some((declaration) => declaration.startsWith('--menu-background-color'))).toBe(true);

    // * same class-level specificity (":root" + two classes) and later in the
    // * sheet: the MD3 declaration wins when both toggles are on
    const classTokens = (selector: string) => selector.split('').filter((ch) => ch === '.').length;
    expect(classTokens(':root.oe-md3-dialogs .btn-menu-reactions-container')).toBe(
      classTokens(':root.oe-no-glass-menus .btn-menu-reactions-container')
    );
    expect(blocks.indexOf(md3!)).toBeGreaterThan(blocks.indexOf(noGlass!));
  });
});

describe('the ninth MD3 part class gate (jsdom)', () => {
  // * the store is module state over localStorage: every test re-evaluates it
  const localStorageStub = vi.hoisted(() => {
    const values: Record<string, string> = {};
    return {
      values,
      getItem: (key: string): string | null => key in values ? values[key] : null,
      setItem: (key: string, value: string): void => {
        values[key] = value;
      },
      removeItem: (key: string): void => {
        delete values[key];
      },
      clear: (): void => {
        for(const key of Object.keys(values)) delete values[key];
      }
    };
  });

  vi.stubGlobal('localStorage', localStorageStub);

  const loadStore = () => {
    vi.resetModules();
    return import('@stores/exterayondSettings');
  };

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    localStorageStub.clear();
  });

  test('the root class survives theme switches and palette applies; off restores stock', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    const root = document.documentElement;

    setExterayondSetting('OEAppearanceMd3Dialogs', true);
    await flush();
    expect(root.classList.contains('oe-md3-dialogs')).toBe(true);

    // * theme switches toggle only their own classes (themeController's
    //   `classList.toggle('night', …)`); the ninth part's class stands
    root.classList.add('night'); // * night
    root.classList.remove('night'); // * day
    root.classList.add('night'); // * tinted (dark too)
    await flush();
    expect(root.classList.contains('oe-md3-dialogs')).toBe(true);

    // * the theme palette writes its surface family inline on the same root
    // * and never touches the class attribute — the chrome and the palette
    // * coexist (the tonal mixes derive from the palette's own surface)
    const {applyThemePalette} = await import('@stores/exterayondThemePalette');
    applyThemePalette(true, true, undefined, root);
    expect(root.style.getPropertyValue('--surface-color')).toBe('#141414');
    expect(root.classList.contains('oe-md3-dialogs')).toBe(true);

    // * clearing the palette restores its foreign values, the class stands
    applyThemePalette(false, true, undefined, root);
    expect(root.style.getPropertyValue('--surface-color')).toBe('');
    expect(root.classList.contains('oe-md3-dialogs')).toBe(true);

    // * the toggle off — and reset — return the chrome to stock
    setExterayondSetting('OEAppearanceMd3Dialogs', false);
    await flush();
    expect(root.classList.contains('oe-md3-dialogs')).toBe(false);

    setExterayondSetting('OEAppearanceMd3Dialogs', true);
    await flush();
    resetExterayondSettings();
    await flush();
    expect(root.classList.contains('oe-md3-dialogs')).toBe(false);

    root.classList.remove('night');
  });

  test('both live toggles together: the palette surfaces and the chrome class coexist', async() => {
    const {setExterayondSetting, exterayondSettings} = await loadStore();
    const root = document.documentElement;
    root.classList.add('night');
    // * the palette binds its live listener at import — import it after the
    // * store so both live on the same (fresh) module graph
    await import('@stores/exterayondThemePalette');

    try {
      setExterayondSetting('OEAppearanceThemePalette', true);
      setExterayondSetting('OEAppearanceMd3Dialogs', true);
      await flush();

      expect(exterayondSettings.OEAppearanceThemePalette).toBe(true);
      expect(root.classList.contains('oe-md3-dialogs')).toBe(true);
      // * the palette's surface stands inline; the MD3 mixes consume it
      expect(root.style.getPropertyValue('--surface-color')).toBe('#141414');
      // * the palette never claims the ninth part's own variables
      expect(root.style.getPropertyValue('--popup-background-color')).toBe('');
      expect(root.style.getPropertyValue('--menu-background-color')).toBe('');

      // * the palette off leaves the chrome on
      setExterayondSetting('OEAppearanceThemePalette', false);
      await flush();
      expect(root.style.getPropertyValue('--surface-color')).toBe('');
      expect(root.classList.contains('oe-md3-dialogs')).toBe(true);
    } finally {
      root.classList.remove('night');
    }
  });
});
