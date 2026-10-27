/**
 * The exteraless settings store: OE* keys, Android defaults, clamping of
 * untrusted persisted values, and the CSS mappings that drive the two wired
 * behaviors (avatarCorners, sectionRadius).
 */

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

const STORAGE_KEY = 'exterayond-exteraless-settings';

// * the store is module state over localStorage: every test re-evaluates it
// * against the storage the test has set up
const loadStore = () => {
  vi.resetModules();
  return import('@stores/exteralessSettings');
};

describe('exteraless settings store', () => {
  beforeEach(() => {
    localStorageStub.clear();
  });

  test('defaults are the Android config values', async() => {
    const {OE_DEFAULTS, OE_AVATAR_CORNERS_MAX, OE_SECTION_RADIUS_STOCK, exteralessSettings} = await loadStore();
    expect(OE_DEFAULTS).toEqual({
      OEAppearanceAvatarCorners: 28,
      OEAppearanceSectionRadius: 20,
      OEAppearanceSingleCornerRadius: false,
      OEAppearanceSquareFab: true,
      OEAppearanceSeparateHeaders: true,
      OEAppearanceHideActionBarStatus: false,
      OEAppearanceSenderMiniAvatars: true,
      OEAppearanceCustomThemes: true,
      OEAppearanceGlassMessageMenu: true,
      OEAppearanceNewChatHeaderStyle: false,
      OEAppearanceNewLoadingStyle: true,
      SliderStyle: 2,
      SwitchStyle: 2,
      OEAppearanceNewNavigationBarStyle: false,
      OEAppearanceM3ListItems: false,
      OEAppearanceMd3Player: true,
      OEAppearanceMd3MiniPlayer: true,
      OEChatsRemoveMessageTail: true,
      OEChatsHideCallButton: false,
      OEChatsHideChannelSearchButton: false,
      DisableDialogsFloatingButton: false,
      OEChatsStickerShape: 1,
      OEChatsBottomButton: 1,
      OEChatsAlwaysSendInHD: true,
      OEChatsKeepAttachButton: false,
      OEChatsStickerTimeSide: false,
      HideTimeForSticker: false,
      OEChatsShowResultsBeforeVoting: false,
      OEChatsStripTrackingOnOpen: true,
      OEChatsStripTrackingOnPaste: true,
      OEChatsReplyColors: true,
      OEChatsReplyEmoji: true,
      OEChatsReplyBackground: true,
      OEChatsPauseVoice: false,
      OEChatsPauseRound: false,
      OEChatsHideReactionsChannels: false,
      OEChatsHideReactionsGroups: false,
      OEChatsHideReactionsPrivate: false,
      OERelativeLastSeen: false,
      OEAddCommaAfterMention: true,
      showSeconds: false,
      HidePhone: true,
      DisableNumberRounding: false,
      ZalgoFilter: false,
      UseEditedIcon: true,
      HideShareButtonInChannel: false,
      IdDcType: 1,
      DontSendGreetingSticker: true,
      DontAutoPlayNextVoice: false,
      HidePremiumSection: false,
      HideHelpSection: true,
      DisableTrending: true,
      hideGroupSticker: false,
      hideSendAsChannel: false,
      stickerSize: 14,
      DeleteChatForBothSides: true,
      AskBeforeCalling: true,
      DisableClickCommandToSend: false,
      DateOfForwardedMsg: false,
      ShowTimeHint: false,
      ConfirmAllLinks: false,
      SkipOpenLinkConfirm: false
    });
    expect(OE_AVATAR_CORNERS_MAX).toBe(28);
    expect(OE_SECTION_RADIUS_STOCK).toBe(20);
    expect(exteralessSettings.OEAppearanceAvatarCorners).toBe(28);
    expect(exteralessSettings.OEAppearanceSectionRadius).toBe(20);
    expect(exteralessSettings.OEChatsRemoveMessageTail).toBe(true);
  });

  test('clamps out-of-range and non-finite values', async() => {
    const {clampExteralessSetting, OE_DEFAULTS} = await loadStore();
    expect(clampExteralessSetting('OEAppearanceAvatarCorners', 999)).toBe(28);
    expect(clampExteralessSetting('OEAppearanceAvatarCorners', -3)).toBe(0);
    expect(clampExteralessSetting('OEAppearanceAvatarCorners', 14.6)).toBe(15);
    expect(clampExteralessSetting('OEAppearanceSectionRadius', NaN)).toBe(OE_DEFAULTS.OEAppearanceSectionRadius);
    expect(clampExteralessSetting('OEAppearanceSectionRadius', Infinity)).toBe(OE_DEFAULTS.OEAppearanceSectionRadius);
    expect(clampExteralessSetting('stickerSize', 12.75)).toBe(12.75);
    expect(clampExteralessSetting('stickerSize', -1)).toBe(4);
    expect(clampExteralessSetting('stickerSize', 100)).toBe(20);
    expect(clampExteralessSetting('stickerSize', NaN)).toBe(14);
  });

  test('link modes match the Android two-flag contract and All wins conflicts', async() => {
    const {getOpenLinkConfirmation, setOpenLinkConfirmation, setExteralessSetting, exteralessSettings, resetExteralessSettings} = await loadStore();
    expect(getOpenLinkConfirmation()).toBe(0);
    setOpenLinkConfirmation(1);
    expect(exteralessSettings.ConfirmAllLinks).toBe(true);
    expect(exteralessSettings.SkipOpenLinkConfirm).toBe(false);
    setExteralessSetting('SkipOpenLinkConfirm', true);
    expect(getOpenLinkConfirmation()).toBe(1);
    setOpenLinkConfirmation(2);
    expect(exteralessSettings.ConfirmAllLinks).toBe(false);
    expect(exteralessSettings.SkipOpenLinkConfirm).toBe(true);
    for(const value of [-1, 3, 0.5, NaN]) setOpenLinkConfirmation(value);
    expect(getOpenLinkConfirmation()).toBe(2);
    resetExteralessSettings();
    expect(getOpenLinkConfirmation()).toBe(0);
  });

  test('Forced MD3 composes eight Android settings and resets their original defaults', async() => {
    const {getMd3StyleCount, setAllMd3Styles, exteralessSettings, setExteralessSetting, resetExteralessSettings} = await loadStore();
    expect(getMd3StyleCount()).toBe(5);
    setAllMd3Styles(false);
    expect(getMd3StyleCount()).toBe(0);
    expect(exteralessSettings.SwitchStyle).toBe(0);
    setAllMd3Styles(true);
    expect(getMd3StyleCount()).toBe(8);
    expect(exteralessSettings.SliderStyle).toBe(2);
    expect(exteralessSettings.SwitchStyle).toBe(3);
    setExteralessSetting('SwitchStyle', 2);
    expect(getMd3StyleCount()).toBe(8);
    resetExteralessSettings();
    expect(getMd3StyleCount()).toBe(5);
  });

  test('boolean settings reject non-boolean values', async() => {
    const {clampExteralessSetting, OE_DEFAULTS} = await loadStore();
    expect(clampExteralessSetting('OEChatsHideCallButton', true)).toBe(true);
    expect(clampExteralessSetting('OEChatsHideCallButton', 1 as any)).toBe(OE_DEFAULTS.OEChatsHideCallButton);
    expect(clampExteralessSetting('DisableDialogsFloatingButton', true)).toBe(true);
    expect(clampExteralessSetting('DisableDialogsFloatingButton', 'yes' as any)).toBe(false);
    expect(clampExteralessSetting('showSeconds', 1 as any)).toBe(false);
    expect(clampExteralessSetting('showSeconds', 'yes' as any)).toBe(false);
    expect(clampExteralessSetting('HidePhone', 'yes' as any)).toBe(true);
    expect(clampExteralessSetting('OEChatsRemoveMessageTail', 'yes' as any)).toBe(OE_DEFAULTS.OEChatsRemoveMessageTail);
  });

  test('reset restores defaults and clears only the exterayond preferences record', async() => {
    const {OE_DEFAULTS, exteralessSettings, setExteralessSetting, resetExteralessSettings} = await loadStore();
    localStorageStub.setItem('unrelated-preferences', 'keep');
    localStorageStub.setItem('plugin_settings_example', 'keep');
    setExteralessSetting('OEAppearanceAvatarCorners', 4);
    setExteralessSetting('OEChatsRemoveMessageTail', false);
    setExteralessSetting('OEChatsBottomButton', 2);
    setExteralessSetting('showSeconds', true);
    setExteralessSetting('HidePhone', false);

    resetExteralessSettings();

    expect({...exteralessSettings}).toEqual(OE_DEFAULTS);
    expect(localStorageStub.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorageStub.getItem('unrelated-preferences')).toBe('keep');
    expect(localStorageStub.getItem('plugin_settings_example')).toBe('keep');
    expect({...((await loadStore()).exteralessSettings)}).toEqual(OE_DEFAULTS);
  });

  test('reset applies defaults in memory when browser storage refuses removal', async() => {
    const {OE_DEFAULTS, exteralessSettings, setExteralessSetting, resetExteralessSettings} = await loadStore();
    setExteralessSetting('OEAppearanceAvatarCorners', 4);
    const remove = vi.spyOn(localStorageStub, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    try {
      expect(() => resetExteralessSettings()).not.toThrow();
      expect({...exteralessSettings}).toEqual(OE_DEFAULTS);
    } finally {
      remove.mockRestore();
    }
  });

  test('a persisted record is loaded back', async() => {
    localStorageStub.setItem(STORAGE_KEY, JSON.stringify({
      OEAppearanceAvatarCorners: 12,
      OEAppearanceSectionRadius: 0,
      showSeconds: true
    }));

    const {exteralessSettings} = await loadStore();
    expect(exteralessSettings.OEAppearanceAvatarCorners).toBe(12);
    expect(exteralessSettings.OEAppearanceSectionRadius).toBe(0);
    expect(exteralessSettings.showSeconds).toBe(true);
  });

  test('a corrupt or untrusted record falls back to defaults and clamps', async() => {
    localStorageStub.setItem(STORAGE_KEY, JSON.stringify({
      OEAppearanceAvatarCorners: 500,
      OEAppearanceSectionRadius: 'not a number',
      OEChatsRemoveMessageTail: 'yes',
      showSeconds: 'yes',
      somethingElse: true
    }));

    const {exteralessSettings} = await loadStore();
    expect(exteralessSettings.OEAppearanceAvatarCorners).toBe(28);
    expect(exteralessSettings.OEAppearanceSectionRadius).toBe(20);
    expect(exteralessSettings.OEChatsRemoveMessageTail).toBe(true);
    expect(exteralessSettings.showSeconds).toBe(false);
  });

  test('garbage storage is ignored', async() => {
    localStorageStub.setItem(STORAGE_KEY, 'not json at all');
    const {exteralessSettings} = await loadStore();
    expect(exteralessSettings.OEAppearanceAvatarCorners).toBe(28);
  });

  test('setting a value clamps it and writes the record back', async() => {
    const {setExteralessSetting} = await loadStore();
    setExteralessSetting('OEAppearanceAvatarCorners', 100);
    setExteralessSetting('OEChatsRemoveMessageTail', false);
    const persisted = JSON.parse(localStorageStub.getItem(STORAGE_KEY));
    expect(persisted.OEAppearanceAvatarCorners).toBe(28);
    expect(persisted.OEAppearanceSectionRadius).toBe(20);
    expect(persisted.OEChatsRemoveMessageTail).toBe(false);
  });
});

describe('exteraless CSS mappings', () => {
  test('avatarCorners 0..28 maps to 0%..50% border radius', async() => {
    const {avatarCornersToRadiusPercent} = await loadStore();
    expect(avatarCornersToRadiusPercent(28)).toBe('50%');
    expect(avatarCornersToRadiusPercent(14)).toBe('25%');
    expect(avatarCornersToRadiusPercent(0)).toBe('0%');
    // * out-of-range input clamps like the store would
    expect(avatarCornersToRadiusPercent(99)).toBe('50%');
  });

  test('sectionRadius keeps Web K stock at the Android default, applies pixels otherwise', async() => {
    const {sectionRadiusToCss} = await loadStore();
    expect(sectionRadiusToCss(20)).toBeUndefined();
    expect(sectionRadiusToCss(21)).toBe('21px');
    expect(sectionRadiusToCss(0)).toBe('0px');
    expect(sectionRadiusToCss(28)).toBe('28px');
  });
});

describe('exteraless settings application (jsdom)', () => {
  beforeEach(() => {
    localStorageStub.clear();
  });

  // * the store's effect owns the root custom properties and classes; these
  // * are the runtime contract the SCSS choke points read. Solid runs the
  // * effect on its own queue, so every write is awaited a tick
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  test('the effect applies the CSS variables and root classes', async() => {
    const {setExteralessSetting} = await loadStore();
    const root = document.documentElement;

    // * Android defaults: circle avatars, squircle FAB, no message tails
    expect(root.style.getPropertyValue('--oe-avatar-radius')).toBe('50%');
    expect(root.style.getPropertyValue('--oe-fab-radius')).toBe('28.571%');
    expect(root.style.getPropertyValue('--oe-section-radius')).toBe('');
    expect(root.classList.contains('oe-remove-message-tail')).toBe(true);
    expect(root.classList.contains('oe-single-corner-radius')).toBe(false);
    expect(root.classList.contains('oe-hide-title-status')).toBe(false);
    setExteralessSetting('OEAppearanceHideActionBarStatus', true);
    await flush();
    expect(root.classList.contains('oe-hide-title-status')).toBe(true);
    setExteralessSetting('OEAppearanceHideActionBarStatus', false);
    await flush();
    expect(root.classList.contains('oe-hide-title-status')).toBe(false);

    setExteralessSetting('OEAppearanceAvatarCorners', 7);
    await flush();
    expect(root.style.getPropertyValue('--oe-avatar-radius')).toBe('12.5%');

    setExteralessSetting('OEChatsRemoveMessageTail', false);
    await flush();
    expect(root.classList.contains('oe-remove-message-tail')).toBe(false);

    setExteralessSetting('OEAppearanceSquareFab', false);
    await flush();
    expect(root.style.getPropertyValue('--oe-fab-radius')).toBe('');

    setExteralessSetting('OEAppearanceSingleCornerRadius', true);
    await flush();
    expect(root.classList.contains('oe-single-corner-radius')).toBe(true);

    setExteralessSetting('OEAppearanceSectionRadius', 8);
    await flush();
    expect(root.style.getPropertyValue('--oe-section-radius')).toBe('8px');
  });

  test('the floating new-chat preference is a live root class and reset clears it', async() => {
    const {setExteralessSetting, resetExteralessSettings} = await loadStore();
    const root = document.documentElement;

    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(false);

    setExteralessSetting('DisableDialogsFloatingButton', true);
    await flush();
    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(true);

    setExteralessSetting('DisableDialogsFloatingButton', false);
    await flush();
    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(false);

    setExteralessSetting('DisableDialogsFloatingButton', true);
    await flush();
    resetExteralessSettings();
    await flush();
    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(false);
  });

  test('reaction visibility updates live and reset clears all three categories', async() => {
    const {setExteralessSetting, resetExteralessSettings} = await loadStore();
    const flags = [
      ['OEChatsHideReactionsPrivate', 'oe-hide-reactions-private'],
      ['OEChatsHideReactionsChannels', 'oe-hide-reactions-channels'],
      ['OEChatsHideReactionsGroups', 'oe-hide-reactions-groups']
    ] as const;
    for(const [key, className] of flags) {
      setExteralessSetting(key, true);
      await flush();
      expect(document.documentElement.classList.contains(className)).toBe(true);
    }
    resetExteralessSettings();
    await flush();
    for(const [, className] of flags) expect(document.documentElement.classList.contains(className)).toBe(false);
  });

  test('hiding the sender selector applies live and reset restores it', async() => {
    const {setExteralessSetting, resetExteralessSettings} = await loadStore();
    setExteralessSetting('hideSendAsChannel', true);
    await flush();
    expect(document.documentElement.classList.contains('oe-hide-send-as')).toBe(true);
    resetExteralessSettings();
    await flush();
    expect(document.documentElement.classList.contains('oe-hide-send-as')).toBe(false);
    expect(document.documentElement.classList.contains('oe-remove-message-tail')).toBe(true);
  });
});
