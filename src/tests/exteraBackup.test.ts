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
import {OE_DEFAULTS, exteralessSettings, setExteralessSetting, getStickerTimeMode, setStickerTimeMode} from '@stores/exteralessSettings';
import {setAppSettingsSilent} from '@stores/appSettings';
import rootScope from '@lib/rootScope';

const originalManagers = rootScope.managers;
beforeEach(() => {
  rootScope.managers = {appStateManager: {setByKey: vi.fn(() => Promise.resolve())}} as any;
  setAppSettingsSilent('showArchiveInChatList', true);
});
afterEach(() => {
  rootScope.managers = originalManagers;
});

const FLUSH = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('exteraless .extera backup (EtgBackup contract)', () => {
  it('uses the Android boolean aliases for MD3 sliders/switches and rejects non-booleans', () => {
    const root = {exteraconfig: {newSliderStyle: true, newSwitchStyle: true, newLoadingStyle: false, newNavigationBarStyle: true}};
    expect(applyExteraBackup(root).applied).toBe(4);
    expect(exteralessSettings.SliderStyle).toBe(2);
    expect(exteralessSettings.SwitchStyle).toBe(3);
    const exported = JSON.parse(etgBackup.buildBackup(false, exteralessSettings));
    expect(exported.exteraconfig.newSliderStyle).toBe(true);
    expect(exported.exteraconfig.newSwitchStyle).toBe(true);
    expect(exported.exteraconfig.newLoadingStyle).toBe(false);
    expect(applyExteraBackup({exteraconfig: {newSwitchStyle: false, newSliderStyle: false}}).applied).toBe(2);
    expect(exteralessSettings.SwitchStyle).toBe(0);
    expect(exteralessSettings.SliderStyle).toBe(0);
    expect(applyExteraBackup({exteraconfig: {newSliderStyle: 2, newSwitchStyle: 'true'}}).applied).toBe(0);
    expect(exported.exteraconfig).not.toHaveProperty('md3Player');
    expect(exported.exteraconfig).not.toHaveProperty('m3ListItems');
  });
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
    expect(parsed.exteraconfig.filterZalgo).toBe(false);
    expect(parsed.exteraconfig.replaceEditedWithIcon).toBe(true);
    expect(parsed.exteraconfig.hideShareButton).toBe(false);
    expect(parsed.exteraconfig.showIdAndDc).toBe(1);
    expect(parsed.exteraconfig.disableGreetingSticker).toBe(true);
    expect(applyExteraBackup({exteraconfig: {showIdAndDc: 2}}).applied).toBe(1);
    expect(exteralessSettings.IdDcType).toBe(2);
    expect(applyExteraBackup({exteraconfig: {showIdAndDc: 3}}).applied).toBe(0);
    expect(applyExteraBackup({exteraconfig: {showIdAndDc: true}}).applied).toBe(0);
    expect(applyExteraBackup({exteraconfig: {filterZalgo: true}}).applied).toBe(1);
    expect(exteralessSettings.ZalgoFilter).toBe(true);
    expect(applyExteraBackup({exteraconfig: {filterZalgo: 1}}).applied).toBe(0);
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

  it('round trips all sticker-time modes and gives the composite mode precedence', () => {
    for(const mode of [0, 1, 2]) {
      setStickerTimeMode((mode + 1) % 3);
      const result = applyExteraBackup({[SECTION_EXTERA]: {hideStickerTime: true, stickerTimeMode: mode}});
      expect(result.applied).toBe(2);
      expect(result.unsupported).toEqual([]);
      expect(getStickerTimeMode()).toBe(mode);
      expect(exteralessSettings.HideTimeForSticker).toBe(mode === 2);
      expect(exteralessSettings.OEChatsStickerTimeSide).toBe(mode === 1);
      const parsed = JSON.parse(etgBackup.buildBackup(false, exteralessSettings));
      expect(parsed.exteraconfig.stickerTimeMode).toBe(mode);
      expect(parsed.exteraconfig.hideStickerTime).toBe(mode === 2);
    }
    for(const value of [-1, 3, 1.5, true]) {
      expect(applyExteraBackup({[SECTION_EXTERA]: {stickerTimeMode: value}}).applied).toBe(0);
      expect(getStickerTimeMode()).toBe(2);
    }
    const supplied = {...OE_DEFAULTS, OEChatsStickerTimeSide: true};
    expect(JSON.parse(etgBackup.buildBackup(false, supplied)).exteraconfig.stickerTimeMode).toBe(1);
  });

  it('applies the sticker mode through the supplied backup writer', () => {
    const apply = vi.fn();
    etgBackup.applyBackup({[SECTION_EXTERA]: {stickerTimeMode: 1}}, apply);
    expect(apply.mock.calls).toEqual([['HideTimeForSticker', false], ['OEChatsStickerTimeSide', true]]);
    expect(getStickerTimeMode()).toBe(0);
  });

  it('round trips sender visibility and message tails independently with Android aliases', () => {
    const result = applyExteraBackup({[SECTION_EXTERA]: {hideSendAsPeer: true, removeMessageTail: false}});
    expect(result.applied).toBe(2);
    expect(result.unsupported).not.toContain('hideSendAsPeer');
    expect(exteralessSettings.hideSendAsChannel).toBe(true);
    expect(exteralessSettings.OEChatsRemoveMessageTail).toBe(false);
    const saved = JSON.parse(etgBackup.buildBackup(false, exteralessSettings)).exteraconfig;
    expect(saved.hideSendAsPeer).toBe(true);
    expect(saved.removeMessageTail).toBe(false);
    expect(applyExteraBackup({[SECTION_EXTERA]: {hideSendAsPeer: 'true'}}).applied).toBe(0);
    applyExteraBackup({[SECTION_EXTERA]: {hideSendAsPeer: false, removeMessageTail: true}});
    expect(exteralessSettings.hideSendAsChannel).toBe(false);
    expect(exteralessSettings.OEChatsRemoveMessageTail).toBe(true);
  });

  it('round trips relative last seen and header status visibility independently', () => {
    const result = applyExteraBackup({[SECTION_EXTERA]: {relativeLastSeen: true, hideActionBarStatus: true}});
    expect(result.applied).toBe(2);
    expect(exteralessSettings.OERelativeLastSeen).toBe(true);
    expect(exteralessSettings.OEAppearanceHideActionBarStatus).toBe(true);
    const saved = JSON.parse(etgBackup.buildBackup(false, exteralessSettings)).exteraconfig;
    expect(saved.relativeLastSeen).toBe(true);
    expect(saved.hideActionBarStatus).toBe(true);
    applyExteraBackup({[SECTION_EXTERA]: {relativeLastSeen: false, hideActionBarStatus: false}});
    expect(exteralessSettings.OERelativeLastSeen).toBe(false);
    expect(exteralessSettings.OEAppearanceHideActionBarStatus).toBe(false);
  });

  it('maps stickerShape to the sticker corner setting both ways, 0..2', () => {
    for(const shape of [0, 1, 2]) {
      setExteralessSetting('OEChatsStickerShape', shape);
      const parsed = JSON.parse(etgBackup.buildBackup(false, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>));
      expect(parsed.exteraconfig.stickerShape).toBe(shape);

      setExteralessSetting('OEChatsStickerShape', (shape + 1) % 3);
      const result = applyExteraBackup({[SECTION_EXTERA]: {stickerShape: shape}});
      expect(result.applied).toBe(1);
      expect(exteralessSettings.OEChatsStickerShape).toBe(shape);
      expect(result.unsupported).not.toContain('stickerShape');
    }
  });

  it('preserves fractional sticker sizes and rejects invalid backup sizes', () => {
    expect(applyExteraBackup({[SECTION_EXTERA]: {stickerSize: 12.75}}).applied).toBe(1);
    expect(exteralessSettings.stickerSize).toBe(12.75);
    expect(JSON.parse(etgBackup.buildBackup(false, exteralessSettings)).exteraconfig.stickerSize).toBe(12.75);
    for(const value of [3, 21, true, '14']) {
      expect(applyExteraBackup({[SECTION_EXTERA]: {stickerSize: value}}).applied).toBe(0);
      expect(exteralessSettings.stickerSize).toBe(12.75);
    }
  });

  it('round trips mention punctuation and each reaction-visibility category independently', () => {
    for(const [alias, key] of [
      ['addCommaAfterMention', 'OEAddCommaAfterMention'],
      ['hideReactionsInPrivateChats', 'OEChatsHideReactionsPrivate'],
      ['hideReactionsInChannels', 'OEChatsHideReactionsChannels'],
      ['hideReactionsInGroups', 'OEChatsHideReactionsGroups']
    ] as const) {
      for(const value of [true, false]) {
        expect(applyExteraBackup({[SECTION_EXTERA]: {[alias]: value}}).applied).toBe(1);
        expect(exteralessSettings[key]).toBe(value);
        expect(JSON.parse(etgBackup.buildBackup(false, exteralessSettings)).exteraconfig[alias]).toBe(value);
      }
    }
  });

  it('round trips the three independent reply preferences', () => {
    for(const [alias, key] of [
      ['replyColors', 'OEChatsReplyColors'],
      ['replyEmoji', 'OEChatsReplyEmoji'],
      ['replyBackground', 'OEChatsReplyBackground']
    ] as const) {
      expect(applyExteraBackup({[SECTION_EXTERA]: {[alias]: false}}).applied).toBe(1);
      expect(exteralessSettings[key]).toBe(false);
      expect(JSON.parse(etgBackup.buildBackup(false, exteralessSettings)).exteraconfig[alias]).toBe(false);
      expect(applyExteraBackup({[SECTION_EXTERA]: {[alias]: true}}).applied).toBe(1);
      expect(exteralessSettings[key]).toBe(true);
    }
  });

  it('counts stickerShape as known and no longer lists it as unsupported', () => {
    const read = etgBackup.readBackup(JSON.stringify({[SECTION_EXTERA]: {stickerShape: 2}}));
    expect(read).not.toBeNull();
    expect(read!.knownCount).toBe(1);
    expect(read!.unsupported).toEqual([]);
  });

  it('rejects an out-of-range or non-integer stickerShape like an untrusted file', () => {
    for(const bad of [-1, 3, 1.5, '1', null]) {
      setExteralessSetting('OEChatsStickerShape', 2);
      const result = applyExteraBackup({[SECTION_EXTERA]: {stickerShape: bad}});
      expect(result.applied).toBe(0);
      expect(exteralessSettings.OEChatsStickerShape).toBe(2);
    }
  });

  it('leaves the ChatsConfig toggles EtgBackup never carries out of the format', () => {
    // * hideCallButton, hideChannelSearchButton, stripTrackingOnOpen and
    // * stripTrackingOnPaste exist in ChatsConfig but not in EtgBackup's table
    const result = applyExteraBackup({[SECTION_EXTERA]: {
      hideCallButton: true,
      hideChannelSearchButton: true,
      stripTrackingOnOpen: false,
      stripTrackingOnPaste: false
    }});
    expect(result.applied).toBe(0);
    expect(exteralessSettings.OEChatsHideCallButton).toBe(OE_DEFAULTS.OEChatsHideCallButton);
    expect(exteralessSettings.OEChatsHideChannelSearchButton).toBe(OE_DEFAULTS.OEChatsHideChannelSearchButton);
    expect(exteralessSettings.OEChatsStripTrackingOnOpen).toBe(OE_DEFAULTS.OEChatsStripTrackingOnOpen);
    expect(exteralessSettings.OEChatsStripTrackingOnPaste).toBe(OE_DEFAULTS.OEChatsStripTrackingOnPaste);
  });

  it('maps hideFloatingButton to the new-chat floating button preference', () => {
    setExteralessSetting('DisableDialogsFloatingButton', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>));
    expect(parsed.exteraconfig.hideFloatingButton).toBe(true);

    setExteralessSetting('DisableDialogsFloatingButton', false);
    const result = applyExteraBackup({[SECTION_EXTERA]: {hideFloatingButton: true}});
    expect(result.applied).toBe(1);
    expect(exteralessSettings.DisableDialogsFloatingButton).toBe(true);
    expect(result.unsupported).not.toContain('hideFloatingButton');
  });

  it('rejects a non-boolean hideFloatingButton instead of trusting it', () => {
    const result = applyExteraBackup({[SECTION_EXTERA]: {hideFloatingButton: 'yes'}});
    expect(result.applied).toBe(0);
    expect(exteralessSettings.DisableDialogsFloatingButton).toBe(false);
  });

  it('maps formatTimeWithSeconds to the showSeconds setting in both directions', () => {
    setExteralessSetting('showSeconds', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>));
    expect(parsed.exteraconfig.formatTimeWithSeconds).toBe(true);

    setExteralessSetting('showSeconds', false);
    const result = applyExteraBackup({[SECTION_EXTERA]: {formatTimeWithSeconds: true}});
    expect(result.applied).toBe(1);
    expect(exteralessSettings.showSeconds).toBe(true);
    expect(result.unsupported).not.toContain('formatTimeWithSeconds');
  });

  it('carries the plugin flags with web targets', () => {
    const backup = etgBackup.buildBackup(false, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
    const parsed = JSON.parse(backup);
    expect(typeof parsed.exteraconfig.pluginsSafeMode).toBe('boolean');
    expect(typeof parsed.exteraconfig.pluginsDevMode).toBe('boolean');

    const result = applyExteraBackup({exteraconfig: {pluginsSafeMode: true, pluginsDevMode: true}});
    expect(result.applied).toBe(2);
    expect(localStorage.getItem('pluginsSafeMode')).toBe('true');
  });

  it('names exterayond exports with the compatible .extera extension', () => {
    expect(etgBackup.generateBackupName()).toMatch(/^exterayond-[A-Za-z0-9]{4}\.extera$/);
    expect(EXTENSION).toBe('.extera');
  });
});

describe('local own-phone visibility backup', () => {
  it('round-trips the Android hidePhoneNumber alias and rejects non-booleans', () => {
    setExteralessSetting('HidePhone', false);
    const backup = etgBackup.buildBackup(false, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
    expect(JSON.parse(backup).exteraconfig.hidePhoneNumber).toBe(false);

    setExteralessSetting('HidePhone', true);
    applyExteraBackup(JSON.parse(backup));
    expect(exteralessSettings.HidePhone).toBe(false);

    for(const invalid of [0, 1, 'false', null]) {
      applyExteraBackup({exteraconfig: {hidePhoneNumber: invalid}});
      expect(exteralessSettings.HidePhone).toBe(false);
    }
    setExteralessSetting('HidePhone', OE_DEFAULTS.HidePhone);
  });
});
