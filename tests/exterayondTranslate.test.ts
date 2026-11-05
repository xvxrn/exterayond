/**
 * TRANS-05 (packet 085): the translator mode's decisions of
 * `@lib/exterayondTranslate` against the pinned Android contracts
 * (`NaConfig.translatorMode`, `MessageHelper.shouldKeepOriginal*`,
 * `buildTranslatedDisplayText`, `MessageTrans.kt`'s separator @8b7ec40),
 * plus source contracts pinning the first wired consumer (the translate
 * popup's copy) and the hub row.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

import {
  buildTranslatedDisplayText,
  clampTranslatorMode,
  shouldKeepOriginalForDisplay,
  shouldKeepOriginalForManualTranslation,
  TRANSLATION_SEPARATOR,
  TRANSLATOR_MODE_ALL,
  TRANSLATOR_MODE_MANUAL_ONLY,
  TRANSLATOR_MODE_OFF
} from '@lib/exterayondTranslate';

describe('the translator mode decisions (MessageHelper ports)', () => {
  it('the modes are Android\'s 0/1/2 and the separator is MessageTrans\'s verbatim', () => {
    expect(TRANSLATOR_MODE_OFF).toBe(0);
    expect(TRANSLATOR_MODE_MANUAL_ONLY).toBe(1);
    expect(TRANSLATOR_MODE_ALL).toBe(2);
    expect(TRANSLATION_SEPARATOR).toBe('\n\n--------\n\n');
  });

  it('the load-time clamp falls back to off outside 0..2 (NaConfig)', () => {
    for(const value of [0, 1, 2]) {
      expect(clampTranslatorMode(value), '' + value).toBe(value);
    }
    for(const value of [-1, 3, 1.5, NaN, Infinity]) {
      expect(clampTranslatorMode(value), '' + value).toBe(TRANSLATOR_MODE_OFF);
    }
  });

  it('shouldKeepOriginalForManualTranslation is true for 1 and 2 (startTrans\'s appendOriginal)', () => {
    expect(shouldKeepOriginalForManualTranslation(TRANSLATOR_MODE_OFF)).toBe(false);
    expect(shouldKeepOriginalForManualTranslation(TRANSLATOR_MODE_MANUAL_ONLY)).toBe(true);
    expect(shouldKeepOriginalForManualTranslation(TRANSLATOR_MODE_ALL)).toBe(true);
  });

  it('shouldKeepOriginalForDisplay is Android\'s truth table', () => {
    // * mode 2: every translation keeps the original
    expect(shouldKeepOriginalForDisplay(TRANSLATOR_MODE_ALL, true, false)).toBe(true);
    expect(shouldKeepOriginalForDisplay(TRANSLATOR_MODE_ALL, false, true)).toBe(true);
    expect(shouldKeepOriginalForDisplay(TRANSLATOR_MODE_ALL, false, false)).toBe(false);
    // * mode 1: manual translations only
    expect(shouldKeepOriginalForDisplay(TRANSLATOR_MODE_MANUAL_ONLY, true, false)).toBe(true);
    expect(shouldKeepOriginalForDisplay(TRANSLATOR_MODE_MANUAL_ONLY, false, true)).toBe(false);
    // * mode 0: nothing keeps the original
    expect(shouldKeepOriginalForDisplay(TRANSLATOR_MODE_OFF, true, true)).toBe(false);
  });

  it('buildTranslatedDisplayText joins with the separator, falls back like Android', () => {
    expect(buildTranslatedDisplayText('original', 'translation', false)).toBe('translation');
    expect(buildTranslatedDisplayText('original', 'translation', true)).toBe('original' + TRANSLATION_SEPARATOR + 'translation');
    // * an empty translation falls back to the original; an empty original
    // * cannot be kept
    expect(buildTranslatedDisplayText('original', '', true)).toBe('original');
    expect(buildTranslatedDisplayText('', 'translation', true)).toBe('translation');
    expect(buildTranslatedDisplayText('', '', true)).toBe('');
  });
});

describe('the wired surfaces (source contracts, packet 085)', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const popupSource = read('src/components/popups/translate/parts.tsx');
  const bodySource = read('src/components/popups/translate/bodyContent.tsx');
  const generalSource = read('src/components/sidebarLeft/tabs/exterayondGeneralTab.tsx');
  const storeSource = read('src/stores/exterayondSettings.ts');

  it('the popup copy carries the original under the keep-original modes (the startTrans analog)', () => {
    expect(popupSource).toContain('shouldKeepOriginalForManualTranslation(exterayondSettings.translatorMode)');
    expect(popupSource).toContain('buildTranslatedDisplayText(props.originalTextWithEntities.text, text, true)');
    // * the original side the popup shows feeds the join
    expect(bodySource).toContain('originalTextWithEntities={originalTextWithEntities}');
  });

  it('the store keeps Android\'s key with the 0..2 range and no backup alias', () => {
    expect(storeSource).toContain('translatorMode: 0');
    expect(storeSource).toContain('translatorMode: [0, 2]');
    // * EtgBackup exports no translator keys — the alias table must not gain one
    const backupSource = read('src/lib/exteraBackup/etgBackup.ts');
    expect(backupSource.includes('translatorMode')).toBe(false);
  });

  it('the General tab renders the mode selector in a Translate section', () => {
    expect(generalSource).toContain('<Section name="Exterayond.Translate"');
    expect(generalSource).toContain('textLeft={i18n(\'Exterayond.Translate.Mode\')}');
    expect(generalSource).toContain('value={exterayondSettings.translatorMode}');
    expect(generalSource).toContain('onChange={(value) => setExterayondSetting(\'translatorMode\', value)}');
  });
});
