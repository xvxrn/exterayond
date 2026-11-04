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
import {OE_DEFAULTS, exterayondSettings, setExterayondSetting, getStickerTimeMode, setStickerTimeMode} from '@stores/exterayondSettings';
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
  it('the message-menu toggles round-trip under their Android aliases (packet 055)', () => {
    const root = {exteraconfig: {showSaveMessageButton: true, showCopyPhotoButton: true, showReportButton: true, showDetailsButton: true}};
    const applied = applyExteraBackup(root);
    expect(applied.applied).toBe(3);
    expect(applied.unsupported).toEqual(['showDetailsButton']);
    expect(exterayondSettings.showAddToSavedMessages).toBe(true);
    expect(exterayondSettings.CopyPhoto).toBe(true);
    expect(exterayondSettings.showReport).toBe(true);
    const exported = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(exported.exteraconfig.showSaveMessageButton).toBe(true);
    expect(exported.exteraconfig.showCopyPhotoButton).toBe(true);
    expect(exported.exteraconfig.showReportButton).toBe(true);
    expect(exported.exteraconfig).not.toHaveProperty('showDetailsButton');
  });

  it('uses the Android boolean aliases for MD3 sliders/switches and rejects non-booleans', () => {
    const root = {exteraconfig: {newSliderStyle: true, newSwitchStyle: true, newLoadingStyle: false, newNavigationBarStyle: true}};
    expect(applyExteraBackup(root).applied).toBe(4);
    expect(exterayondSettings.SliderStyle).toBe(2);
    expect(exterayondSettings.SwitchStyle).toBe(3);
    const exported = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(exported.exteraconfig.newSliderStyle).toBe(true);
    expect(exported.exteraconfig.newSwitchStyle).toBe(true);
    expect(exported.exteraconfig.newLoadingStyle).toBe(false);
    expect(applyExteraBackup({exteraconfig: {newSwitchStyle: false, newSliderStyle: false}}).applied).toBe(2);
    expect(exterayondSettings.SwitchStyle).toBe(0);
    expect(exterayondSettings.SliderStyle).toBe(0);
    expect(applyExteraBackup({exteraconfig: {newSliderStyle: 2, newSwitchStyle: 'true'}}).applied).toBe(0);
    expect(exported.exteraconfig).not.toHaveProperty('md3Player');
    expect(exported.exteraconfig).not.toHaveProperty('m3ListItems');
  });
  beforeEach(() => {
    (localStorage as unknown as {_data: Map<string, string>})._data.clear();
    for(const key of Object.keys(OE_DEFAULTS) as Array<keyof typeof OE_DEFAULTS>) {
      setExterayondSetting(key, OE_DEFAULTS[key]);
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
    const backup = etgBackup.buildBackup(false, exterayondSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
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
    expect(exterayondSettings.IdDcType).toBe(2);
    expect(applyExteraBackup({exteraconfig: {showIdAndDc: 3}}).applied).toBe(0);
    expect(applyExteraBackup({exteraconfig: {showIdAndDc: true}}).applied).toBe(0);
    expect(applyExteraBackup({exteraconfig: {filterZalgo: true}}).applied).toBe(1);
    expect(exterayondSettings.ZalgoFilter).toBe(true);
    expect(applyExteraBackup({exteraconfig: {filterZalgo: 1}}).applied).toBe(0);
  });

  it('reads its own encrypted export and reports no unsupported keys', () => {
    const backup = etgBackup.buildBackup(true, exterayondSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
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
        pauseOnMinimizeVideo: false,
        // out of range: rejected like an untrusted file
        bottomButton: 5,
        // the NagramX half: recognized, unsupported, not applied
        useSystemIconShape: true
      },
      // * bubbleRadius is a supported mainconfig key since packet 056
      [SECTION_MAIN]: {bubbleRadius: 12, mediaColumnsCount: 5}
    };

    const result = applyExteraBackup(root as Record<string, Record<string, unknown>>);
    await FLUSH();

    expect(result.applied).toBe(5);
    expect(exterayondSettings.OEAppearanceAvatarCorners).toBe(10);
    expect(exterayondSettings.OEChatsRemoveMessageTail).toBe(false);
    expect(exterayondSettings.OEChatsStickerTimeSide).toBe(true);
    expect(exterayondSettings.AutoPauseVideo).toBe(false);
    expect(exterayondSettings.bubbleRadius).toBe(12);
    // unknown Android-only key: ignored
    expect(result.unsupported).toContain('mediaColumnsCount');
    // untouched
    expect(exterayondSettings.OEChatsBottomButton).toBe(OE_DEFAULTS.OEChatsBottomButton);
    expect(result.unsupported).toContain('useSystemIconShape');
  });

  it('round trips the pause-on-minimize trio the way Android exports it', async() => {
    setExterayondSetting('AutoPauseVideo', false);
    setExterayondSetting('OEChatsPauseVoice', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(parsed.exteraconfig.pauseOnMinimizeVideo).toBe(false);
    expect(parsed.exteraconfig.pauseOnMinimizeVoice).toBe(true);
    expect(parsed.exteraconfig.pauseOnMinimizeRound).toBe(false);
    setExterayondSetting('AutoPauseVideo', true);
    const result = applyExteraBackup({[SECTION_EXTERA]: {pauseOnMinimizeVideo: true, pauseOnMinimizeRound: true}});
    expect(result.applied).toBe(2);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.AutoPauseVideo).toBe(true);
    expect(exterayondSettings.OEChatsPauseRound).toBe(true);
    expect(applyExteraBackup({[SECTION_EXTERA]: {pauseOnMinimizeVideo: 'yes'}}).applied).toBe(0);
  });

  it('round trips hideStories as the Android stories-header alias', async() => {
    // * Android exports NaConfig.getHideStoriesFromHeader() as "hideStories"
    setExterayondSetting('HideStoriesFromHeader', false);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(parsed.exteraconfig.hideStories).toBe(false);

    const result = applyExteraBackup({[SECTION_EXTERA]: {hideStories: true}});
    expect(result.applied).toBe(1);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.HideStoriesFromHeader).toBe(true);
    // * a non-boolean is rejected like any untrusted value
    expect(applyExteraBackup({[SECTION_EXTERA]: {hideStories: 'off'}}).applied).toBe(0);
  });

  it('round trips hideCameraTile even though the web attach menu has no camera tile', async() => {
    // * Android exports ChatsConfig.hideCameraTile as "hideCameraTile"; on the
    // * web the flag is a documented no-op (the attach menu has no camera
    // * tile), so the alias applies silently instead of reporting unsupported
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(parsed.exteraconfig.hideCameraTile).toBe(false);

    const result = applyExteraBackup({[SECTION_EXTERA]: {hideCameraTile: true}});
    expect(result.applied).toBe(1);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.OEChatsHideCameraTile).toBe(true);
    expect(applyExteraBackup({[SECTION_EXTERA]: {hideCameraTile: 1}}).applied).toBe(0);
  });

  it('round trips hideAllChats as the Android all-chats-tab alias', async() => {
    // * Android exports NekoConfig.hideAllTab as "hideAllChats"
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(parsed.exteraconfig.hideAllChats).toBe(false);

    const result = applyExteraBackup({[SECTION_EXTERA]: {hideAllChats: true}});
    expect(result.applied).toBe(1);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.HideAllTab).toBe(true);
    expect(applyExteraBackup({[SECTION_EXTERA]: {hideAllChats: 'yes'}}).applied).toBe(0);
  });

  it('round trips centerTitle and useSystemFonts as the Android appearance aliases', async() => {
    // * Android exports NaConfig.centerActionBarTitle as "centerTitle"
    // * (EtgBackup.java:325) and NekoConfig.typeface as "useSystemFonts" (:339)
    setExterayondSetting('OEAppearanceCenterTitle', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(parsed.exteraconfig.centerTitle).toBe(true);
    // * Android's default: the platform fonts replace the bundled Roboto
    expect(parsed.exteraconfig.useSystemFonts).toBe(true);

    const result = applyExteraBackup({[SECTION_EXTERA]: {centerTitle: false, useSystemFonts: false}});
    expect(result.applied).toBe(2);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.OEAppearanceCenterTitle).toBe(false);
    expect(exterayondSettings.TypefaceUseDefault).toBe(false);
    expect(applyExteraBackup({[SECTION_EXTERA]: {centerTitle: 'on'}}).applied).toBe(0);
    expect(applyExteraBackup({[SECTION_EXTERA]: {useSystemFonts: 1}}).applied).toBe(0);
  });

  it('round trips the wide posts aliases the way Android exports them', async() => {
    // * Android exports ChatsConfig.wideChannelPosts/wideFeedPosts
    // * (EtgBackup.java:365-366); the web has no feed, so wideFeedPosts is a
    // * documented no-op that still round-trips
    setExterayondSetting('OEChatsWideChannelPosts', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(parsed.exteraconfig.wideChannelPosts).toBe(true);
    expect(parsed.exteraconfig.wideFeedPosts).toBe(false);

    const result = applyExteraBackup({[SECTION_EXTERA]: {wideChannelPosts: false, wideFeedPosts: true}});
    expect(result.applied).toBe(2);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.OEChatsWideChannelPosts).toBe(false);
    expect(exterayondSettings.OEChatsWideFeedPosts).toBe(true);
    expect(applyExteraBackup({[SECTION_EXTERA]: {wideChannelPosts: 'yes'}}).applied).toBe(0);
  });

  it('round trips showRepeatMessageButton as the Android repeat-menu alias', async() => {
    // * Android exports NekoConfig.showRepeat as "showRepeatMessageButton"
    // * (EtgBackup.java:371); NekoConfig.repeatConfirm has no alias
    setExterayondSetting('showRepeat', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(parsed.exteraconfig.showRepeatMessageButton).toBe(true);
    expect(parsed.exteraconfig.repeatConfirm).toBeUndefined();

    const result = applyExteraBackup({[SECTION_EXTERA]: {showRepeatMessageButton: false}});
    expect(result.applied).toBe(1);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.showRepeat).toBe(false);
    expect(applyExteraBackup({[SECTION_EXTERA]: {showRepeatMessageButton: 'on'}}).applied).toBe(0);
  });

  it('round trips the tab counter alias the way Android exports it', async() => {
    // * Android's alias is a boolean: true = counters on (mode 0), false = off
    // * (mode 2); the except-muted mode never round-trips through the format
    setExterayondSetting('IgnoreUnreadCount', 1);
    const exported = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
    expect(exported.exteraconfig.tabCounter).toBe(true);

    const result = applyExteraBackup({[SECTION_EXTERA]: {tabCounter: false}});
    expect(result.applied).toBe(1);
    expect(result.unsupported).toEqual([]);
    expect(exterayondSettings.IgnoreUnreadCount).toBe(2);

    expect(applyExteraBackup({[SECTION_EXTERA]: {tabCounter: true}}).applied).toBe(1);
    expect(exterayondSettings.IgnoreUnreadCount).toBe(0);
    expect(applyExteraBackup({[SECTION_EXTERA]: {tabCounter: 3}}).applied).toBe(0);
    expect(exterayondSettings.IgnoreUnreadCount).toBe(0);
  });

  it('round trips all sticker-time modes and gives the composite mode precedence', () => {
    for(const mode of [0, 1, 2]) {
      setStickerTimeMode((mode + 1) % 3);
      const result = applyExteraBackup({[SECTION_EXTERA]: {hideStickerTime: true, stickerTimeMode: mode}});
      expect(result.applied).toBe(2);
      expect(result.unsupported).toEqual([]);
      expect(getStickerTimeMode()).toBe(mode);
      expect(exterayondSettings.HideTimeForSticker).toBe(mode === 2);
      expect(exterayondSettings.OEChatsStickerTimeSide).toBe(mode === 1);
      const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings));
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
    expect(exterayondSettings.hideSendAsChannel).toBe(true);
    expect(exterayondSettings.OEChatsRemoveMessageTail).toBe(false);
    const saved = JSON.parse(etgBackup.buildBackup(false, exterayondSettings)).exteraconfig;
    expect(saved.hideSendAsPeer).toBe(true);
    expect(saved.removeMessageTail).toBe(false);
    expect(applyExteraBackup({[SECTION_EXTERA]: {hideSendAsPeer: 'true'}}).applied).toBe(0);
    applyExteraBackup({[SECTION_EXTERA]: {hideSendAsPeer: false, removeMessageTail: true}});
    expect(exterayondSettings.hideSendAsChannel).toBe(false);
    expect(exterayondSettings.OEChatsRemoveMessageTail).toBe(true);
  });

  it('round trips relative last seen and header status visibility independently', () => {
    const result = applyExteraBackup({[SECTION_EXTERA]: {relativeLastSeen: true, hideActionBarStatus: true}});
    expect(result.applied).toBe(2);
    expect(exterayondSettings.OERelativeLastSeen).toBe(true);
    expect(exterayondSettings.OEAppearanceHideActionBarStatus).toBe(true);
    const saved = JSON.parse(etgBackup.buildBackup(false, exterayondSettings)).exteraconfig;
    expect(saved.relativeLastSeen).toBe(true);
    expect(saved.hideActionBarStatus).toBe(true);
    applyExteraBackup({[SECTION_EXTERA]: {relativeLastSeen: false, hideActionBarStatus: false}});
    expect(exterayondSettings.OERelativeLastSeen).toBe(false);
    expect(exterayondSettings.OEAppearanceHideActionBarStatus).toBe(false);
  });

  it('maps stickerShape to the sticker corner setting both ways, 0..2', () => {
    for(const shape of [0, 1, 2]) {
      setExterayondSetting('OEChatsStickerShape', shape);
      const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings as typeof OE_DEFAULTS & Record<string, boolean | number>));
      expect(parsed.exteraconfig.stickerShape).toBe(shape);

      setExterayondSetting('OEChatsStickerShape', (shape + 1) % 3);
      const result = applyExteraBackup({[SECTION_EXTERA]: {stickerShape: shape}});
      expect(result.applied).toBe(1);
      expect(exterayondSettings.OEChatsStickerShape).toBe(shape);
      expect(result.unsupported).not.toContain('stickerShape');
    }
  });

  it('preserves fractional sticker sizes and rejects invalid backup sizes', () => {
    expect(applyExteraBackup({[SECTION_EXTERA]: {stickerSize: 12.75}}).applied).toBe(1);
    expect(exterayondSettings.stickerSize).toBe(12.75);
    expect(JSON.parse(etgBackup.buildBackup(false, exterayondSettings)).exteraconfig.stickerSize).toBe(12.75);
    for(const value of [3, 21, true, '14']) {
      expect(applyExteraBackup({[SECTION_EXTERA]: {stickerSize: value}}).applied).toBe(0);
      expect(exterayondSettings.stickerSize).toBe(12.75);
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
        expect(exterayondSettings[key]).toBe(value);
        expect(JSON.parse(etgBackup.buildBackup(false, exterayondSettings)).exteraconfig[alias]).toBe(value);
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
      expect(exterayondSettings[key]).toBe(false);
      expect(JSON.parse(etgBackup.buildBackup(false, exterayondSettings)).exteraconfig[alias]).toBe(false);
      expect(applyExteraBackup({[SECTION_EXTERA]: {[alias]: true}}).applied).toBe(1);
      expect(exterayondSettings[key]).toBe(true);
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
      setExterayondSetting('OEChatsStickerShape', 2);
      const result = applyExteraBackup({[SECTION_EXTERA]: {stickerShape: bad}});
      expect(result.applied).toBe(0);
      expect(exterayondSettings.OEChatsStickerShape).toBe(2);
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
    expect(exterayondSettings.OEChatsHideCallButton).toBe(OE_DEFAULTS.OEChatsHideCallButton);
    expect(exterayondSettings.OEChatsHideChannelSearchButton).toBe(OE_DEFAULTS.OEChatsHideChannelSearchButton);
    expect(exterayondSettings.OEChatsStripTrackingOnOpen).toBe(OE_DEFAULTS.OEChatsStripTrackingOnOpen);
    expect(exterayondSettings.OEChatsStripTrackingOnPaste).toBe(OE_DEFAULTS.OEChatsStripTrackingOnPaste);
  });

  it('maps hideFloatingButton to the new-chat floating button preference', () => {
    setExterayondSetting('DisableDialogsFloatingButton', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings as typeof OE_DEFAULTS & Record<string, boolean | number>));
    expect(parsed.exteraconfig.hideFloatingButton).toBe(true);

    setExterayondSetting('DisableDialogsFloatingButton', false);
    const result = applyExteraBackup({[SECTION_EXTERA]: {hideFloatingButton: true}});
    expect(result.applied).toBe(1);
    expect(exterayondSettings.DisableDialogsFloatingButton).toBe(true);
    expect(result.unsupported).not.toContain('hideFloatingButton');
  });

  it('rejects a non-boolean hideFloatingButton instead of trusting it', () => {
    const result = applyExteraBackup({[SECTION_EXTERA]: {hideFloatingButton: 'yes'}});
    expect(result.applied).toBe(0);
    expect(exterayondSettings.DisableDialogsFloatingButton).toBe(false);
  });

  it('maps formatTimeWithSeconds to the showSeconds setting in both directions', () => {
    setExterayondSetting('showSeconds', true);
    const parsed = JSON.parse(etgBackup.buildBackup(false, exterayondSettings as typeof OE_DEFAULTS & Record<string, boolean | number>));
    expect(parsed.exteraconfig.formatTimeWithSeconds).toBe(true);

    setExterayondSetting('showSeconds', false);
    const result = applyExteraBackup({[SECTION_EXTERA]: {formatTimeWithSeconds: true}});
    expect(result.applied).toBe(1);
    expect(exterayondSettings.showSeconds).toBe(true);
    expect(result.unsupported).not.toContain('formatTimeWithSeconds');
  });

  it('carries the plugin flags with web targets', () => {
    const backup = etgBackup.buildBackup(false, exterayondSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
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
    setExterayondSetting('HidePhone', false);
    const backup = etgBackup.buildBackup(false, exterayondSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);
    expect(JSON.parse(backup).exteraconfig.hidePhoneNumber).toBe(false);

    setExterayondSetting('HidePhone', true);
    applyExteraBackup(JSON.parse(backup));
    expect(exterayondSettings.HidePhone).toBe(false);

    for(const invalid of [0, 1, 'false', null]) {
      applyExteraBackup({exteraconfig: {hidePhoneNumber: invalid}});
      expect(exterayondSettings.HidePhone).toBe(false);
    }
    setExterayondSetting('HidePhone', OE_DEFAULTS.HidePhone);
  });
});
