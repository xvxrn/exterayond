/**
 * TRANS-05 — the translator mode's decisions, ported from exteraless
 * @8b7ec40: `NaConfig.translatorMode` ("TranslatorMode", int 0..2, default 0)
 * and the `MessageHelper` decisions its consumers call —
 * `shouldKeepOriginalForManualTranslation` (DialogTrans.kt's `startTrans`,
 * MessageTrans.kt's manual branch) and `shouldKeepOriginalForDisplay`
 * (MessageObject's translated display) — with `MessageTrans.kt`'s
 * TRANSLATION_SEPARATOR and `buildTranslatedDisplayText`'s join.
 *
 * On Android the mode decides how a translation lands relative to its
 * original: 0 replaces the original with the translation, 1 keeps the
 * original for manual translations, 2 keeps it for every translation. On the
 * web the manual-translation surface is the translate popup (GEN-01's sheet
 * analog; its two cards always show both sides, exactly like Android's
 * `TranslateAlert2`), so the mode's first wired consumer is the popup's
 * takeaway — the copy action, which under modes 1/2 carries
 * `original + separator + translation`, the same text Android's
 * `startTrans` alert shows and the inline pipeline renders into the message.
 * The inline-into-message pipeline itself (per-message providers, caching,
 * auto-translate — TRANS-02/04/06/07/13/14 territory) waits on a web
 * message-render primitive and is deliberately not built here.
 *
 * Pure decisions only: no DOM, no managers, no providers. Android's
 * `EtgBackup` exports no translator keys (verified against its alias table),
 * so no `.extera` alias exists for the mode.
 */

/** Android 0: the translation replaces the original ("Off"). */
export const TRANSLATOR_MODE_OFF = 0;
/** Android 1: the original stays for manual translations ("Manual Only"). */
export const TRANSLATOR_MODE_MANUAL_ONLY = 1;
/** Android 2: the original stays for every translation ("On"). */
export const TRANSLATOR_MODE_ALL = 2;

/** Android `MessageTransKt.TRANSLATION_SEPARATOR`. */
export const TRANSLATION_SEPARATOR = '\n\n--------\n\n';

/**
 * Android's load-time clamp: `if (translatorMode.Int() !in 0..2)
 * translatorMode.setConfigInt(0)` — an untrusted value falls back to off.
 */
export const clampTranslatorMode = (value: number): number =>
  Number.isInteger(value) && value >= TRANSLATOR_MODE_OFF && value <= TRANSLATOR_MODE_ALL ?
    value :
    TRANSLATOR_MODE_OFF;

/**
 * Android `MessageHelper.shouldKeepOriginalForManualTranslation`: whether a
 * manual translation keeps the original beside it.
 */
export const shouldKeepOriginalForManualTranslation = (mode: number): boolean =>
  mode === TRANSLATOR_MODE_MANUAL_ONLY || mode === TRANSLATOR_MODE_ALL;

/**
 * Android `MessageHelper.shouldKeepOriginalForDisplay`: whether a rendered
 * translation shows the original — all translations under mode 2, manual
 * ones only under mode 1. (The web consumer is the future inline render;
 * the popup's cards are the sheet analog and always show both sides.)
 */
export const shouldKeepOriginalForDisplay = (mode: number, manualTranslated: boolean, autoTranslated: boolean): boolean => {
  if(mode === TRANSLATOR_MODE_ALL) {
    return manualTranslated || autoTranslated;
  }

  return mode === TRANSLATOR_MODE_MANUAL_ONLY && manualTranslated;
};

/**
 * Android `MessageHelper.buildTranslatedDisplayText(CharSequence, String,
 * boolean)`: the takeaway text — the translation alone, or the original and
 * the translation joined by the separator. An empty translation falls back
 * to the original.
 */
export const buildTranslatedDisplayText = (originalText: string, translatedText: string, keepOriginal: boolean): string => {
  if(!translatedText) {
    return originalText;
  }

  if(!keepOriginal || !originalText) {
    return translatedText;
  }

  return originalText + TRANSLATION_SEPARATOR + translatedText;
};
