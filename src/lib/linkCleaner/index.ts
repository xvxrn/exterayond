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
