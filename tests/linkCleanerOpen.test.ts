/**
 * exteraless stripTrackingOnOpen (CHAT-37): the open-path half of the link
 * cleaner. Android cleans at the top of `Browser.openUrl` with the filter
 * preloaded at boot (`LinkCleaner.preloadIfEnabled`); on the web the
 * programmatic opens run `cleanLink(url, 'open')` and plain message anchors —
 * which navigate natively — get their href rewritten synchronously before the
 * browser's default action reads it.
 */

const linkCleanerStorage = vi.hoisted(() => {
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

vi.stubGlobal('localStorage', linkCleanerStorage);

const TRACKED = 'https://example.com/post?fbclid=AbCdEf&id=2';
const CLEANED = 'https://example.com/post?id=2';

const macroTask = () => new Promise((resolve) => setTimeout(resolve, 5));

// * the cleaner and the store must come from one module-graph evaluation: the
// * cleaner reads the store's module state, so a `vi.resetModules()` between
// * the two imports would split the setting the strip follows
const loadModules = () => {
  vi.resetModules();
  return (async() => {
    const cleanerModule = await import('@lib/linkCleaner');
    const store = await import('@stores/exterayondSettings');
    return {cleanerModule, store};
  })();
};

describe('stripTrackingOnOpen — the synchronous clean (Browser.openUrl analog)', () => {
  beforeEach(() => {
    linkCleanerStorage.clear();
  });

  test('an unloaded filter lets the URL pass untouched', async() => {
    const {cleanerModule} = await loadModules();
    // * the setting is on by default (Android's default too) but the filter
    // * only loads on preload — the same `getCleaner() ?: url` fallback
    expect(cleanerModule.cleanLinkSync(TRACKED, 'open')).toBe(TRACKED);
  });

  test('preload follows both strip settings, then the sync clean works', async() => {
    const {cleanerModule, store} = await loadModules();
    store.setExterayondSetting('OEChatsStripTrackingOnOpen', false);
    store.setExterayondSetting('OEChatsStripTrackingOnPaste', false);
    expect(cleanerModule.preloadLinkCleaner()).toBeUndefined();
    expect(cleanerModule.cleanLinkSync(TRACKED, 'open')).toBe(TRACKED);

    store.setExterayondSetting('OEChatsStripTrackingOnOpen', true);
    await cleanerModule.preloadLinkCleaner();
    expect(cleanerModule.cleanLinkSync(TRACKED, 'open')).toBe(CLEANED);
    // * the open path only: the paste setting gates its own, the shared
    // * instance is loaded either way
    store.setExterayondSetting('OEChatsStripTrackingOnOpen', false);
    store.setExterayondSetting('OEChatsStripTrackingOnPaste', true);
    expect(cleanerModule.preloadLinkCleaner()).toBeDefined();
    expect(cleanerModule.cleanLinkSync(TRACKED, 'open')).toBe(TRACKED);
    expect(cleanerModule.cleanLinkSync(TRACKED, 'paste')).toBe(CLEANED);
  });
});

describe('stripAnchorTracking — the native-navigation anchor rewrite', () => {
  const makeAnchor = (href: string) => {
    const anchor = document.createElement('a');
    anchor.href = href;
    document.body.append(anchor);
    return anchor;
  };

  beforeEach(() => {
    linkCleanerStorage.clear();
    document.body.replaceChildren();
  });

  afterEach(async() => {
    await macroTask();
    document.body.replaceChildren();
  });

  test('rewrites a tracked href in place and restores it after the navigation window', async() => {
    const {cleanerModule, store} = await loadModules();
    await cleanerModule.preloadLinkCleaner();
    expect(store.exterayondSettings.OEChatsStripTrackingOnOpen).toBe(true);

    const anchor = makeAnchor(TRACKED);
    cleanerModule.stripAnchorTracking(anchor);
    expect(anchor.getAttribute('href')).toBe(CLEANED);

    // * the displayed href (hover, copy menu) returns to the original
    await macroTask();
    expect(anchor.getAttribute('href')).toBe(TRACKED);
  });

  test('leaves everything the strip does not own untouched', async() => {
    const {cleanerModule} = await loadModules();
    await cleanerModule.preloadLinkCleaner();

    const cleanUrl = makeAnchor('https://example.com/?a=1');       // * nothing the filter names
    const appScheme = makeAnchor('tg://resolve?domain=telegram');  // * the app's own scheme
    const inPage = makeAnchor('#section');                         // * in-page
    const downloaded = makeAnchor(TRACKED);
    downloaded.setAttribute('download', 'file');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    const insideEditable = makeAnchor(TRACKED);
    editable.append(insideEditable);
    document.body.append(editable);

    for(const anchor of [cleanUrl, appScheme, inPage, downloaded, insideEditable]) {
      cleanerModule.stripAnchorTracking(anchor);
    }

    expect(cleanUrl.getAttribute('href')).toBe('https://example.com/?a=1');
    expect(appScheme.getAttribute('href')).toBe('tg://resolve?domain=telegram');
    expect(inPage.getAttribute('href')).toBe('#section');
    expect(downloaded.getAttribute('href')).toBe(TRACKED);
    expect(insideEditable.getAttribute('href')).toBe(TRACKED);
  });

  test('setting off and an unloaded filter are both no-ops', async() => {
    const anchor = makeAnchor(TRACKED);

    // * fresh modules, no preload: the filter is not there yet
    const {cleanerModule: unloaded} = await loadModules();
    unloaded.stripAnchorTracking(anchor);
    expect(anchor.getAttribute('href')).toBe(TRACKED);

    // * loaded filter, setting off: the store decides
    const {cleanerModule, store} = await loadModules();
    await cleanerModule.preloadLinkCleaner();
    store.setExterayondSetting('OEChatsStripTrackingOnOpen', false);
    cleanerModule.stripAnchorTracking(anchor);
    expect(anchor.getAttribute('href')).toBe(TRACKED);
  });
});
