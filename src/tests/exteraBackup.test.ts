import {beforeEach, describe, expect, it, vi} from 'vitest';

// * the store is reloaded per test like the settings store's own tests do
vi.hoisted(() => {
  vi.stubGlobal('localStorage', {
    _data: new Map<string, string>(),
    getItem(this: {_data: Map<string, string>}, k: string): string | null {
      return this._data.get(k) ?? null;
    },
    setItem(this: {_data: Map<string, string>}, k: string, v: string): void {
      this._data.set(k, v);
    },
    removeItem(this: {_data: Map<string, string>}, k: string): void {
      this._data.delete(k);
    },
    clear(this: {_data: Map<string, string>}): void {
      this._data.clear();
    }
  } as unknown as Storage);
});

import {invisibleEncryptor} from '@lib/exteraBackup/invisibleEncryptor';
import {etgBackup, applyExteraBackup, SECTION_EXTERA, SECTION_MAIN, EXTENSION} from '@lib/exteraBackup/etgBackup';
import {OE_DEFAULTS, exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';

const FLUSH = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('exteraless .extera backup (EtgBackup contract)', () => {
  beforeEach(() => {
    (localStorage as unknown as {_data: Map<string, string>})._data.clear();
    for(const key of Object.keys(OE_DEFAULTS) as Array<keyof typeof OE_DEFAULTS>) {
      setExteralessSetting(key, OE_DEFAULTS[key]);
    }
  });

  it('wraps JSON in invisible characters and reads it back to the byte', () => {
    const json = JSON.stringify({exteraconfig: {squareFab: true, avatarCorners: 12.5}});
    const wrapped = invisibleEncryptor.encode(json);
    expect(wrapped.startsWith('\u2001\u2002')).toBe(true);
    expect(invisibleEncryptor.isEncrypted(wrapped)).toBe(true);
    expect(invisibleEncryptor.decode(wrapped)).toBe(json);
    expect(invisibleEncryptor.isEncrypted(json)).toBe(false);
  });

  it('builds the exteraGram sections with the format\'s key names', () => {
    const backup = etgBackup.buildBackup(false, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
    const parsed = JSON.parse(backup);
    expect(Object.keys(parsed)).toContain('exteraconfig');
    expect(parsed.exteraconfig.squareFab).toBe(true);
    expect(parsed.exteraconfig.relativeLastSeen).toBe(false);
    expect(parsed.exteraconfig.avatarCorners).toBe(28);
    expect(parsed.exteraconfig.bottomButton).toBe(1);
  });

  it('reads its own encrypted export and reports no unsupported keys', () => {
    const backup = etgBackup.buildBackup(true, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
    const read = etgBackup.readBackup(backup);
    expect(read).not.toBeNull();
    expect(read!.knownCount).toBeGreaterThan(20);
    expect(read!.unsupported).toEqual([]);
  });

  it('applies a trusted file and rejects out-of-range and unknown values', async() => {
    const root = {
      [SECTION_EXTERA]: {
        avatarCorners: 10,
        removeMessageTail: false,
        stickerTimeMode: 1,
        // out of range: rejected like an untrusted file
        bottomButton: 5,
        // the NagramX half: recognized, unsupported, not applied
        pauseOnMinimizeVideo: true
      },
      // unknown Android-only key: ignored
      [SECTION_MAIN]: {bubbleRadius: 12}
    };

    const result = applyExteraBackup(root as Record<string, Record<string, unknown>>);
    await FLUSH();

    expect(result.applied).toBe(3);
    expect(exteralessSettings.OEAppearanceAvatarCorners).toBe(10);
    expect(exteralessSettings.OEChatsRemoveMessageTail).toBe(false);
    expect(exteralessSettings.OEChatsStickerTimeSide).toBe(true);
    // untouched
    expect(exteralessSettings.OEChatsBottomButton).toBe(OE_DEFAULTS.OEChatsBottomButton);
    expect(result.unsupported).toContain('pauseOnMinimizeVideo');
  });

  it('the hidden sticker-time mode has no web target and is reported', () => {
    const root = {[SECTION_EXTERA]: {stickerTimeMode: 2}};
    const result = applyExteraBackup(root);
    expect(result.applied).toBe(0);
    expect(result.unsupported).toContain('stickerTimeMode');
  });

  it('names files like the Android client does', () => {
    expect(etgBackup.generateBackupName()).toMatch(/^exteraless-[A-Za-z0-9]{4}\.extera$/);
    expect(EXTENSION).toBe('.extera');
  });
});
