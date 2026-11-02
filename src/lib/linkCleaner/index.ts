/**
 * The exteraless link cleaner entry (`app/exteraless/links/LinkCleaner.kt`):
 * an AdGuard URL-tracking filter drives what tracking parameters come off
 * links. The filter ships from the Android source (`LinkCleaner.FILE`,
 * AdGuard's `adguard_url_tracking.txt`) and the engine is a byte-port of
 * `UrlCleaner`/`AdGuardRule`; both ChatsConfig.stripTrackingOnOpen and
 * stripTrackingOnPaste run it through here.
 */
import {exteralessSettings} from '@stores/exteralessSettings';
import {UrlCleaner} from './urlCleaner';

export {UrlCleaner} from './urlCleaner';

let cleaner: UrlCleaner | undefined;
let cleanerPromise: Promise<UrlCleaner | undefined> | undefined;

const loadCleaner = async(): Promise<UrlCleaner | undefined> => {
  if(cleaner) return cleaner;
  cleanerPromise ??= (async() => {
    try {
      const {default: text} = await import('../../assets/adguard_url_tracking.txt?raw');
      // * the AdGuard filter is data, not code — parse, never execute
      cleaner = UrlCleaner.fromAdGuardFilter(text);
      return cleaner;
    } catch(e) {
      console.error('link cleaner: filter load failed', e);
      return undefined;
    }
  })();

  return cleanerPromise;
};

// * two copies of one pattern: `test` on a global regex advances lastIndex
const URL_IN_TEXT = /(?:https?:\/\/|www\.)[^\s<>"']+/;
const URL_IN_TEXT_GLOBAL = new RegExp(URL_IN_TEXT.source, 'gi');

const settingFor = (where: 'open' | 'paste') => where === 'open' ?
  exteralessSettings.OEChatsStripTrackingOnOpen :
  exteralessSettings.OEChatsStripTrackingOnPaste;

/**
 * Cleans one link if the setting for `where` is on. The cleaner loads once,
 * off the hot path; a failed load leaves the URL as it is.
 */
export const cleanLink = async(url: string, where: 'open' | 'paste'): Promise<string> => {
  if(!settingFor(where)) return url;

  const instance = await loadCleaner();
  if(!instance) return url;
  return instance.clean(url);
};

/**
 * The synchronous open-path clean, like `LinkCleaner.clean`: it only sees the
 * already-loaded instance (boot-preloaded by `preloadLinkCleaner`), so an
 * unloaded filter lets the URL pass untouched — the click path cannot wait on
 * a fetch, exactly Android's `getCleaner() ?: url` fallback.
 */
export const cleanLinkSync = (url: string, where: 'open' | 'paste'): string => {
  if(!settingFor(where) || !cleaner) return url;
  return cleaner.clean(url);
};

/**
 * Android boots `LinkCleaner.preloadIfEnabled()`: with either strip setting on
 * the filter is parsed before the first link is opened, so the synchronous
 * clean above actually has an instance.
 */
export const preloadLinkCleaner = (): Promise<UrlCleaner | undefined> | undefined => {
  if(exteralessSettings.OEChatsStripTrackingOnOpen || exteralessSettings.OEChatsStripTrackingOnPaste) {
    return loadCleaner();
  }

  return undefined;
};

const EXTERNAL_ANCHOR_HREF = /^https?:/i;

/**
 * Rewrites an anchor's href with the cleaned URL in place, synchronously, so
 * every way the browser navigates (plain click, middle click, the confirm
 * alert's re-click) reads the cleaned destination. This is the piece of the
 * Android `Browser.openUrl` choke point that plain message anchors have no
 * programmatic path through — they navigate natively. A no-op unless the
 * filter is loaded, the open setting is on and the clean changes the URL; the
 * displayed href restores right after the navigation took the cleaned value
 * (the same pattern as the autologin rewrite beside the click handler), so
 * hover and copy still show the original.
 */
export const stripAnchorTracking = (anchor: HTMLAnchorElement): void => {
  if(!cleaner || !exteralessSettings.OEChatsStripTrackingOnOpen || !anchor?.getAttribute) return;
  const href = anchor.getAttribute('href');
  if(!href || anchor.hasAttribute('download') || anchor.closest('[contenteditable="true"]')) return;
  // * the cleaner only handles absolute http(s) URLs; tg:// and in-page
  // * anchors belong to the app
  if(!EXTERNAL_ANCHOR_HREF.test(href)) return;

  const cleaned = cleaner.clean(href);
  if(cleaned === href) return;

  anchor.setAttribute('href', cleaned);
  setTimeout(() => {
    if(anchor.getAttribute('href') === cleaned) anchor.setAttribute('href', href);
  }, 0);
};

/** Cleans every link in a piece of text (the paste path, like LinkCleaner's paste wrapper). */
export const cleanLinksInText = async(text: string, where: 'open' | 'paste'): Promise<string> => {
  if(!settingFor(where) || !URL_IN_TEXT.test(text)) return text;

  const instance = await loadCleaner();
  if(!instance) return text;
  return text.replace(URL_IN_TEXT_GLOBAL, (url) => instance.clean(url));
};

/** What the filter's `! TimeUpdated:` header says, like LinkCleaner.lastUpdated(). */
export const filterTimeUpdated = (text: string): string | undefined => {
  return /^!\s*TimeUpdated:\s*(\S+)/m.exec(text)?.[1]?.split('T')[0];
};
