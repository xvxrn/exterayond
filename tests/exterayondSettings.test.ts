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

const STORAGE_KEY = 'exterayond-settings';

// * the store is module state over localStorage: every test re-evaluates it
// * against the storage the test has set up
const loadStore = () => {
  vi.resetModules();
  return import('@stores/exterayondSettings');
};

describe('exterayond settings store', () => {
  beforeEach(() => {
    localStorageStub.clear();
  });

  test('defaults are the Android config values', async() => {
    const {OE_DEFAULTS, OE_AVATAR_CORNERS_MAX, OE_SECTION_RADIUS_STOCK, exterayondSettings} = await loadStore();
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
      OEAppearanceCenterTitle: false,
      TypefaceUseDefault: true,
      OEAppearanceNewChatHeaderStyle: false,
      OEAppearanceNewLoadingStyle: true,
      SliderStyle: 2,
      SwitchStyle: 2,
      OEAppearanceNewNavigationBarStyle: false,
      OEAppearanceM3ListItems: false,
      IgnoreUnreadCount: 1,
      OEAppearanceMd3Player: true,
      OEAppearanceMd3MiniPlayer: true,
      OEPlayerCoverStyle: 0,
      OEPlayerCoverSize: 100,
      OEPlayerCoverRadius: 28,
      OEPlayerDiscSpin: true,
      OEPlayerTitleAlign: 0,
      OEPlayerTitleSize: 1,
      OEPlayerTitleAbove: false,
      OEPlayerShowModes: true,
      OEPlayerShowSource: true,
      OEPlayerWavy: true,
      OEPlayerControlsSize: 1,
      OEChatsRemoveMessageTail: true,
      OEChatsHideCallButton: false,
      OEChatsHideChannelSearchButton: false,
      DisableDialogsFloatingButton: false,
      OEChatsStickerShape: 1,
      OEChatsBottomButton: 1,
      OEChatsAlwaysSendInHD: true,
      OEChatsKeepAttachButton: false,
      OEChatsHideCameraTile: false,
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
      DoubleTapAction: 1,
      DoubleTapActionOut: 1,
      AutoPauseVideo: true,
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
      HideGiftButtonInChannel: false,
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
      ConfirmAVMessage: false,
      AskBeforeCalling: true,
      repeatConfirm: true,
      showRepeat: false,
      DisableClickCommandToSend: false,
      DateOfForwardedMsg: false,
      ShowTimeHint: false,
      ConfirmAllLinks: false,
      SkipOpenLinkConfirm: false,
      FixLinkPreview: true,
      DisableLinkPreviewByDefault: false,
      DisableGlobalSearch: false,
      SortByUnread: false,
      OEAppearanceWallpaperPattern: true,
      OEAppearanceAttachedSidebar: false,
      OEAppearanceThemePalette: false,
      HideAllTab: false,
      OEChatsWideChannelPosts: false,
      OEChatsWideFeedPosts: false,
      HideStoriesFromHeader: true,
      SearchHashtagDefaultPageChat: 0,
      SearchHashtagDefaultPageChannel: 0,
      OEPillActivePills: '5,6',
      OEPillHiddenPills: '',
      OEPillInfiniteScrolling: true,
      OEPillLastActiveId: -1,
      OEAppearanceMainMenuLayout: '',
      showAddToSavedMessages: false,
      CopyPhoto: false,
      showReport: false,
      showMessageDetails: false,
      showViewHistory: false,
      bubbleRadius: 17
    });
    expect(OE_AVATAR_CORNERS_MAX).toBe(28);
    expect(OE_SECTION_RADIUS_STOCK).toBe(20);
    expect(exterayondSettings.OEAppearanceAvatarCorners).toBe(28);
    expect(exterayondSettings.OEAppearanceSectionRadius).toBe(20);
    expect(exterayondSettings.OEChatsRemoveMessageTail).toBe(true);
  });

  test('clamps out-of-range and non-finite values', async() => {
    const {clampExterayondSetting, OE_DEFAULTS} = await loadStore();
    expect(clampExterayondSetting('OEAppearanceAvatarCorners', 999)).toBe(28);
    expect(clampExterayondSetting('OEAppearanceAvatarCorners', -3)).toBe(0);
    expect(clampExterayondSetting('OEAppearanceAvatarCorners', 14.6)).toBe(15);
    expect(clampExterayondSetting('OEAppearanceSectionRadius', NaN)).toBe(OE_DEFAULTS.OEAppearanceSectionRadius);
    expect(clampExterayondSetting('OEAppearanceSectionRadius', Infinity)).toBe(OE_DEFAULTS.OEAppearanceSectionRadius);
    expect(clampExterayondSetting('stickerSize', 12.75)).toBe(12.75);
    expect(clampExterayondSetting('stickerSize', -1)).toBe(4);
    expect(clampExterayondSetting('stickerSize', 100)).toBe(20);
    expect(clampExterayondSetting('stickerSize', NaN)).toBe(14);
    expect(clampExterayondSetting('OEPlayerCoverStyle', 4)).toBe(3);
    expect(clampExterayondSetting('OEPlayerCoverStyle', -1)).toBe(0);
    expect(clampExterayondSetting('OEPlayerCoverSize', 40)).toBe(60);
    expect(clampExterayondSetting('OEPlayerCoverRadius', 99)).toBe(48);
    expect(clampExterayondSetting('OEPlayerTitleAlign', 2)).toBe(1);
    expect(clampExterayondSetting('OEPlayerTitleSize', 3)).toBe(2);
    expect(clampExterayondSetting('OEPlayerControlsSize', -5)).toBe(0);
    // * the theme palette is a boolean since acceptance round 1 (F-2): numbers
    // * and strings fall back like any non-boolean value
    expect(clampExterayondSetting('OEAppearanceThemePalette', true)).toBe(true);
    expect(clampExterayondSetting('OEAppearanceThemePalette', 1 as any)).toBe(false);
    expect(clampExterayondSetting('OEAppearanceThemePalette', 'yes' as any)).toBe(false);
  });

  test('the player style mappings follow Android PlayerStyle', async() => {
    const {playerCoverSizeFraction, playerControlsScale, playerTitleSizes, getPlayerCoverStyle} = await loadStore();
    expect(playerCoverSizeFraction(100)).toBe(1);
    expect(playerCoverSizeFraction(60)).toBe(0.6);
    expect(playerCoverSizeFraction(85)).toBe(0.85);
    // * PlayerStyle.controlsScale: 0 compact 0.84, 1 normal 1, 2 large 1.14
    expect(playerControlsScale(0)).toBe(0.84);
    expect(playerControlsScale(1)).toBe(1);
    expect(playerControlsScale(2)).toBe(1.14);
    // * PlayerSheet.applyStyle title sizes: 0 22/15, 1 26/16, 2 31/17
    expect(playerTitleSizes(0)).toEqual([22, 15]);
    expect(playerTitleSizes(1)).toEqual([26, 16]);
    expect(playerTitleSizes(2)).toEqual([31, 17]);
    expect(getPlayerCoverStyle(2)).toBe(2);
    expect(getPlayerCoverStyle(9)).toBe(3);
  });

  test('link modes match the Android two-flag contract and All wins conflicts', async() => {
    const {getOpenLinkConfirmation, setOpenLinkConfirmation, setExterayondSetting, exterayondSettings, resetExterayondSettings} = await loadStore();
    expect(getOpenLinkConfirmation()).toBe(0);
    setOpenLinkConfirmation(1);
    expect(exterayondSettings.ConfirmAllLinks).toBe(true);
    expect(exterayondSettings.SkipOpenLinkConfirm).toBe(false);
    setExterayondSetting('SkipOpenLinkConfirm', true);
    expect(getOpenLinkConfirmation()).toBe(1);
    setOpenLinkConfirmation(2);
    expect(exterayondSettings.ConfirmAllLinks).toBe(false);
    expect(exterayondSettings.SkipOpenLinkConfirm).toBe(true);
    for(const value of [-1, 3, 0.5, NaN]) setOpenLinkConfirmation(value);
    expect(getOpenLinkConfirmation()).toBe(2);
    resetExterayondSettings();
    expect(getOpenLinkConfirmation()).toBe(0);
  });

  test('the hashtag search page follows the Android chat/channel key split', async() => {
    const {getHashtagSearchType, setExterayondSetting, resetExterayondSettings} = await loadStore();
    // * 0 is the stock default: no type picked, the search opens on this chat
    expect(getHashtagSearchType(false)).toBeUndefined();
    expect(getHashtagSearchType(true)).toBeUndefined();
    setExterayondSetting('SearchHashtagDefaultPageChat', 1);
    setExterayondSetting('SearchHashtagDefaultPageChannel', 2);
    expect(getHashtagSearchType(false)).toBe('my');
    expect(getHashtagSearchType(true)).toBe('public');
    setExterayondSetting('SearchHashtagDefaultPageChat', 2);
    expect(getHashtagSearchType(false)).toBe('public');
    // * out-of-range values clamp to the ends of the Android 0..2 range
    setExterayondSetting('SearchHashtagDefaultPageChat', 5);
    expect(getHashtagSearchType(false)).toBe('public');
    setExterayondSetting('SearchHashtagDefaultPageChannel', -1);
    expect(getHashtagSearchType(true)).toBeUndefined();
    resetExterayondSettings();
    expect(getHashtagSearchType(true)).toBeUndefined();
    expect(getHashtagSearchType(false)).toBeUndefined();
  });

  test('the wallpaper pattern gate draws only pattern records while enabled', async() => {
    const {wallpaperDrawsPattern, setExterayondSetting, resetExterayondSettings} = await loadStore();
    const pattern = {_: 'wallPaper', slug: 'pattern', pFlags: {pattern: true}} as any;
    const image = {_: 'wallPaper', slug: 'photo1', pFlags: {}} as any;

    // * the default is stock: pattern records draw, everything else never does
    expect(wallpaperDrawsPattern(pattern)).toBe(true);
    expect(wallpaperDrawsPattern(image)).toBe(false);
    expect(wallpaperDrawsPattern(undefined)).toBe(false);
    // * an explicit override cannot make a non-pattern record draw
    expect(wallpaperDrawsPattern(image, true)).toBe(false);

    // * off is Android's intensity 0: no pattern layer, the gradient only
    setExterayondSetting('OEAppearanceWallpaperPattern', false);
    expect(wallpaperDrawsPattern(pattern)).toBe(false);

    resetExterayondSettings();
    expect(wallpaperDrawsPattern(pattern)).toBe(true);
  });

  test('the wallpaper pattern toggle announces itself on the live channel', async() => {
    const {setExterayondSetting} = await loadStore();
    const rootScope = (await import('@lib/rootScope')).default;
    const events: string[] = [];
    const listener = ({key}: {key: string}) => events.push(key);
    rootScope.addEventListener('exterayond_settings_updated', listener);

    setExterayondSetting('OEAppearanceWallpaperPattern', false);
    setExterayondSetting('OEAppearanceWallpaperPattern', false); // * unchanged: no event
    setExterayondSetting('SortByUnread', true); // * not a live key: no event
    expect(events).toEqual(['OEAppearanceWallpaperPattern']);

    setExterayondSetting('OEAppearanceWallpaperPattern', true);
    expect(events).toEqual(['OEAppearanceWallpaperPattern', 'OEAppearanceWallpaperPattern']);
    rootScope.removeEventListener('exterayond_settings_updated', listener);
  });

  test('the double-tap action follows the direction and keeps the Android enum (CHAT-10)', async() => {
    const {
      resolveDoubleTapAction,
      DOUBLE_TAP_ACTIONS,
      DOUBLE_TAP_INCOMING_OPTIONS,
      DOUBLE_TAP_OUTGOING_OPTIONS,
      doubleTapActionLangKey,
      setExterayondSetting
    } = await loadStore();

    // * the direction picks the key (ChatActivity.onDoubleClick's isOutOwner branch)
    expect(resolveDoubleTapAction(false, {DoubleTapAction: 4, DoubleTapActionOut: 0} as any)).toBe(4);
    expect(resolveDoubleTapAction(true, {DoubleTapAction: 4, DoubleTapActionOut: 0} as any)).toBe(0);
    // * the live store is the default source
    setExterayondSetting('DoubleTapActionOut', DOUBLE_TAP_ACTIONS.FORWARD);
    expect(resolveDoubleTapAction(true)).toBe(DOUBLE_TAP_ACTIONS.FORWARD);
    setExterayondSetting('DoubleTapActionOut', 1);

    // * the enum is Android's DoubleTap.kt verbatim
    expect(DOUBLE_TAP_ACTIONS).toEqual({
      NONE: 0,
      SEND_REACTIONS: 1,
      SHOW_REACTIONS: 2,
      TRANSLATE: 3,
      REPLY: 4,
      SAVE: 5,
      REPEAT: 6,
      REPEAT_AS_COPY: 7,
      EDIT: 8,
      TRANSLATE_LLM: 9,
      DELETE: 10,
      FORWARD: 11,
      DOWNLOAD: 12
    });

    // * the hub lists are Android's showDoubleTapOptions minus the LLM
    // * translate (no web provider); the outgoing list alone appends Edit
    expect(DOUBLE_TAP_INCOMING_OPTIONS).not.toContain(DOUBLE_TAP_ACTIONS.TRANSLATE_LLM);
    expect(DOUBLE_TAP_INCOMING_OPTIONS).not.toContain(DOUBLE_TAP_ACTIONS.EDIT);
    expect(DOUBLE_TAP_OUTGOING_OPTIONS).toContain(DOUBLE_TAP_ACTIONS.EDIT);
    expect(DOUBLE_TAP_INCOMING_OPTIONS[0]).toBe(DOUBLE_TAP_ACTIONS.NONE);
    expect(DOUBLE_TAP_OUTGOING_OPTIONS[DOUBLE_TAP_OUTGOING_OPTIONS.length - 1]).toBe(DOUBLE_TAP_ACTIONS.DELETE);

    // * an imported Android-only value passes through and labels as Disable
    // * in the selector's fallback, never faked into another action
    expect(resolveDoubleTapAction(false, {DoubleTapAction: 9, DoubleTapActionOut: 1} as any)).toBe(9);
    expect(doubleTapActionLangKey(9)).toBe('Disable');
    expect(doubleTapActionLangKey(DOUBLE_TAP_ACTIONS.SEND_REACTIONS)).toBe('Exterayond.DoubleTap.SendReactions');
    expect(doubleTapActionLangKey(DOUBLE_TAP_ACTIONS.REPEAT)).toBe('Exterayond.MenuRepeat');
  });

  test('the custom themes gate drops the peer theme and wallpaper when off', async() => {
    const {resolveChatThemeOverride} = await loadStore();
    const wallPaper = {_: 'wallPaper', id: 7, pFlags: {}, settings: {_: 'wallPaperSettings', pFlags: {}}} as any;
    const theme = {_: 'theme', emoticon: '🎉', settings: []} as any;
    const getThemeByEmoticon = (emoticon: string) => emoticon === '🎉' ? theme : undefined;

    // * on (the default, stock Web K): a channel theme emoticon replaces the wallpaper
    const themed = {_: 'channelFull', wallpaper: wallPaper, theme_emoticon: '🎉'} as any;
    expect(resolveChatThemeOverride(themed, true, getThemeByEmoticon)).toEqual({theme, wallPaper: undefined});

    // * a wallpaper-only chat keeps its wallpaper; a userFull reads its own theme field
    const plain = {_: 'channelFull', wallpaper: wallPaper} as any;
    expect(resolveChatThemeOverride(plain, true, getThemeByEmoticon)).toEqual({theme: undefined, wallPaper});
    const userFull = {_: 'userFull', theme: {_: 'chatTheme', emoticon: '🎉'}} as any;
    expect(resolveChatThemeOverride(userFull, true, getThemeByEmoticon).theme).toBe(theme);

    // * an emoticon with no account theme keeps the wallpaper record
    const unknownEmoticon = {_: 'channelFull', wallpaper: wallPaper, theme_emoticon: '🐍'} as any;
    expect(resolveChatThemeOverride(unknownEmoticon, true, getThemeByEmoticon)).toEqual({theme: undefined, wallPaper});

    // * an emoticon carried by the wallpaper record itself resolves too
    const recordEmoticon = {_: 'channelFull', wallpaper: {...wallPaper, settings: {_: 'wallPaperSettings', pFlags: {}, emoticon: '🎉'}}} as any;
    expect(resolveChatThemeOverride(recordEmoticon, true, getThemeByEmoticon).theme).toBe(theme);

    // * off drops both — Android ChatActivity.setupChatTheme's early return
    expect(resolveChatThemeOverride(themed, false, getThemeByEmoticon)).toEqual({theme: undefined, wallPaper: undefined});
    expect(resolveChatThemeOverride(undefined, true, getThemeByEmoticon)).toEqual({theme: undefined, wallPaper: undefined});
  });

  test('Forced MD3 composes eight Android settings and resets their original defaults', async() => {
    const {getMd3StyleCount, setAllMd3Styles, exterayondSettings, setExterayondSetting, resetExterayondSettings} = await loadStore();
    expect(getMd3StyleCount()).toBe(5);
    setAllMd3Styles(false);
    expect(getMd3StyleCount()).toBe(0);
    expect(exterayondSettings.SwitchStyle).toBe(0);
    setAllMd3Styles(true);
    expect(getMd3StyleCount()).toBe(8);
    expect(exterayondSettings.SliderStyle).toBe(2);
    expect(exterayondSettings.SwitchStyle).toBe(3);
    setExterayondSetting('SwitchStyle', 2);
    expect(getMd3StyleCount()).toBe(8);
    resetExterayondSettings();
    expect(getMd3StyleCount()).toBe(5);
  });

  test('boolean settings reject non-boolean values', async() => {
    const {clampExterayondSetting, OE_DEFAULTS} = await loadStore();
    expect(clampExterayondSetting('OEChatsHideCallButton', true)).toBe(true);
    expect(clampExterayondSetting('OEChatsHideCallButton', 1 as any)).toBe(OE_DEFAULTS.OEChatsHideCallButton);
    expect(clampExterayondSetting('DisableDialogsFloatingButton', true)).toBe(true);
    expect(clampExterayondSetting('DisableDialogsFloatingButton', 'yes' as any)).toBe(false);
    expect(clampExterayondSetting('showSeconds', 1 as any)).toBe(false);
    expect(clampExterayondSetting('showSeconds', 'yes' as any)).toBe(false);
    expect(clampExterayondSetting('HidePhone', 'yes' as any)).toBe(true);
    expect(clampExterayondSetting('OEChatsRemoveMessageTail', 'yes' as any)).toBe(OE_DEFAULTS.OEChatsRemoveMessageTail);
  });

  test('reset restores defaults and clears only the exterayond preferences record', async() => {
    const {OE_DEFAULTS, exterayondSettings, setExterayondSetting, resetExterayondSettings} = await loadStore();
    localStorageStub.setItem('unrelated-preferences', 'keep');
    localStorageStub.setItem('plugin_settings_example', 'keep');
    setExterayondSetting('OEAppearanceAvatarCorners', 4);
    setExterayondSetting('OEChatsRemoveMessageTail', false);
    setExterayondSetting('OEChatsBottomButton', 2);
    setExterayondSetting('showSeconds', true);
    setExterayondSetting('HidePhone', false);

    resetExterayondSettings();

    expect({...exterayondSettings}).toEqual(OE_DEFAULTS);
    expect(localStorageStub.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorageStub.getItem('unrelated-preferences')).toBe('keep');
    expect(localStorageStub.getItem('plugin_settings_example')).toBe('keep');
    expect({...((await loadStore()).exterayondSettings)}).toEqual(OE_DEFAULTS);
  });

  test('reset applies defaults in memory when browser storage refuses removal', async() => {
    const {OE_DEFAULTS, exterayondSettings, setExterayondSetting, resetExterayondSettings} = await loadStore();
    setExterayondSetting('OEAppearanceAvatarCorners', 4);
    const remove = vi.spyOn(localStorageStub, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    try {
      expect(() => resetExterayondSettings()).not.toThrow();
      expect({...exterayondSettings}).toEqual(OE_DEFAULTS);
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

    const {exterayondSettings} = await loadStore();
    expect(exterayondSettings.OEAppearanceAvatarCorners).toBe(12);
    expect(exterayondSettings.OEAppearanceSectionRadius).toBe(0);
    expect(exterayondSettings.showSeconds).toBe(true);
  });

  test('a corrupt or untrusted record falls back to defaults and clamps', async() => {
    localStorageStub.setItem(STORAGE_KEY, JSON.stringify({
      OEAppearanceAvatarCorners: 500,
      OEAppearanceSectionRadius: 'not a number',
      OEChatsRemoveMessageTail: 'yes',
      showSeconds: 'yes',
      somethingElse: true
    }));

    const {exterayondSettings} = await loadStore();
    expect(exterayondSettings.OEAppearanceAvatarCorners).toBe(28);
    expect(exterayondSettings.OEAppearanceSectionRadius).toBe(20);
    expect(exterayondSettings.OEChatsRemoveMessageTail).toBe(true);
    expect(exterayondSettings.showSeconds).toBe(false);
  });

  test('garbage storage is ignored', async() => {
    localStorageStub.setItem(STORAGE_KEY, 'not json at all');
    const {exterayondSettings} = await loadStore();
    expect(exterayondSettings.OEAppearanceAvatarCorners).toBe(28);
  });

  test('a legacy pre-rename record migrates to the new key and is removed', async() => {
    localStorageStub.setItem('exterayond-exteraless-settings', JSON.stringify({OEAppearanceAvatarCorners: 10}));
    const {exterayondSettings} = await loadStore();
    expect(exterayondSettings.OEAppearanceAvatarCorners).toBe(10);
    expect(JSON.parse(localStorageStub.getItem(STORAGE_KEY)).OEAppearanceAvatarCorners).toBe(10);
    expect(localStorageStub.getItem('exterayond-exteraless-settings')).toBeNull();
  });

  test('the new key wins over a stale legacy record', async() => {
    localStorageStub.setItem('exterayond-exteraless-settings', JSON.stringify({OEAppearanceAvatarCorners: 5}));
    localStorageStub.setItem(STORAGE_KEY, JSON.stringify({OEAppearanceAvatarCorners: 12}));
    const {exterayondSettings} = await loadStore();
    expect(exterayondSettings.OEAppearanceAvatarCorners).toBe(12);
    expect(localStorageStub.getItem('exterayond-exteraless-settings')).not.toBeNull();
  });

  test('setting a value clamps it and writes the record back', async() => {
    const {setExterayondSetting} = await loadStore();
    setExterayondSetting('OEAppearanceAvatarCorners', 100);
    setExterayondSetting('OEChatsRemoveMessageTail', false);
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

  test('forum avatars scale with avatarCorners by the Android CORNER_TYPE_FORUM 42/64', async() => {
    const {avatarForumRadiusToCss} = await loadStore();
    // * the default 28 keeps Web K's own forum radius (the variable is unset)
    expect(avatarForumRadiusToCss(28, false)).toBeUndefined();
    expect(avatarForumRadiusToCss(28, true)).toBeUndefined();
    // * Android: value = size * corners / 56, forum = value * 42 / 64
    expect(avatarForumRadiusToCss(14, false)).toBe(25 * 42 / 64 + '%');
    expect(avatarForumRadiusToCss(0, false)).toBe('0%');
    // * singleCornerRadius unifies the shapes: the plain radius
    expect(avatarForumRadiusToCss(14, true)).toBe('25%');
    // * out-of-range input clamps like the store would
    expect(avatarForumRadiusToCss(99, false)).toBeUndefined();
  });

  test('sectionRadius keeps Web K stock at the Android default, applies pixels otherwise', async() => {
    const {sectionRadiusToCss} = await loadStore();
    expect(sectionRadiusToCss(20)).toBeUndefined();
    expect(sectionRadiusToCss(21)).toBe('21px');
    expect(sectionRadiusToCss(0)).toBe('0px');
    expect(sectionRadiusToCss(28)).toBe('28px');
  });
});

describe('the per-message Report contexts (W-3, ChatActivity:50200)', () => {
  test('showReport broadens the stock chat gate to any chat peer or a bot, never a human chat', async() => {
    const {verifyReportContext} = await loadStore();
    // * the stock gate: the web's own isChannel (channels and supergroups)
    expect(verifyReportContext(true, false, false, false)).toBe(true);
    // * with the setting off nothing beyond the stock gate shows
    expect(verifyReportContext(false, true, false, false)).toBe(false);
    expect(verifyReportContext(false, false, true, false)).toBe(false);

    // * Android `currentChat != null || currentUser.bot`: any chat peer or a
    // * bot — a basic group, and a bot conversation — with the setting on
    expect(verifyReportContext(false, true, false, true)).toBe(true);
    expect(verifyReportContext(false, false, true, true)).toBe(true);
    expect(verifyReportContext(true, true, false, true)).toBe(true);

    // * a private conversation with a human is never a Report context
    expect(verifyReportContext(false, false, false, true)).toBe(false);
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
    const {setExterayondSetting} = await loadStore();
    const root = document.documentElement;

    // * Android defaults: circle avatars, squircle FAB, no message tails
    expect(root.style.getPropertyValue('--oe-avatar-radius')).toBe('50%');
    expect(root.style.getPropertyValue('--oe-fab-radius')).toBe('28.571%');
    expect(root.style.getPropertyValue('--oe-section-radius')).toBe('');
    expect(root.classList.contains('oe-remove-message-tail')).toBe(true);
    expect(root.classList.contains('oe-single-corner-radius')).toBe(false);
    expect(root.classList.contains('oe-hide-title-status')).toBe(false);
    setExterayondSetting('OEAppearanceHideActionBarStatus', true);
    await flush();
    expect(root.classList.contains('oe-hide-title-status')).toBe(true);
    setExterayondSetting('OEAppearanceHideActionBarStatus', false);
    await flush();
    expect(root.classList.contains('oe-hide-title-status')).toBe(false);

    setExterayondSetting('OEAppearanceAvatarCorners', 7);
    await flush();
    expect(root.style.getPropertyValue('--oe-avatar-radius')).toBe('12.5%');

    setExterayondSetting('OEChatsRemoveMessageTail', false);
    await flush();
    expect(root.classList.contains('oe-remove-message-tail')).toBe(false);

    setExterayondSetting('OEAppearanceSquareFab', false);
    await flush();
    expect(root.style.getPropertyValue('--oe-fab-radius')).toBe('');

    setExterayondSetting('OEAppearanceSingleCornerRadius', true);
    await flush();
    expect(root.classList.contains('oe-single-corner-radius')).toBe(true);

    setExterayondSetting('OEAppearanceSectionRadius', 8);
    await flush();
    expect(root.style.getPropertyValue('--oe-section-radius')).toBe('8px');
  });

  test('the floating new-chat preference is a live root class and reset clears it', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    const root = document.documentElement;

    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(false);

    setExterayondSetting('DisableDialogsFloatingButton', true);
    await flush();
    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(true);

    setExterayondSetting('DisableDialogsFloatingButton', false);
    await flush();
    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(false);

    setExterayondSetting('DisableDialogsFloatingButton', true);
    await flush();
    resetExterayondSettings();
    await flush();
    expect(root.classList.contains('oe-hide-new-chat-button')).toBe(false);
  });

  test('the centered header title and the system font follow the Android defaults and reset', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    const root = document.documentElement;

    // * Android defaults: OEAppearanceCenterTitle false, TypefaceUseDefault true
    expect(root.classList.contains('oe-center-title')).toBe(false);
    expect(root.classList.contains('oe-system-font')).toBe(true);

    setExterayondSetting('OEAppearanceCenterTitle', true);
    setExterayondSetting('TypefaceUseDefault', false);
    await flush();
    expect(root.classList.contains('oe-center-title')).toBe(true);
    expect(root.classList.contains('oe-system-font')).toBe(false);

    setExterayondSetting('OEChatsWideChannelPosts', true);
    await flush();
    expect(root.classList.contains('oe-wide-posts')).toBe(true);

    resetExterayondSettings();
    await flush();
    expect(root.classList.contains('oe-center-title')).toBe(false);
    expect(root.classList.contains('oe-system-font')).toBe(true);
    expect(root.classList.contains('oe-wide-posts')).toBe(false);
  });

  test('the stories strip hiding follows the Android default and resets off', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    const root = document.documentElement;

    // * Android NaConfig.HideStoriesFromHeader defaults to true: the strip is hidden
    expect(root.classList.contains('oe-hide-stories')).toBe(true);

    setExterayondSetting('HideStoriesFromHeader', false);
    await flush();
    expect(root.classList.contains('oe-hide-stories')).toBe(false);

    setExterayondSetting('HideStoriesFromHeader', true);
    await flush();
    expect(root.classList.contains('oe-hide-stories')).toBe(true);

    resetExterayondSettings();
    await flush();
    expect(root.classList.contains('oe-hide-stories')).toBe(true);
  });

  test('reaction visibility updates live and reset clears all three categories', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    const flags = [
      ['OEChatsHideReactionsPrivate', 'oe-hide-reactions-private'],
      ['OEChatsHideReactionsChannels', 'oe-hide-reactions-channels'],
      ['OEChatsHideReactionsGroups', 'oe-hide-reactions-groups']
    ] as const;
    for(const [key, className] of flags) {
      setExterayondSetting(key, true);
      await flush();
      expect(document.documentElement.classList.contains(className)).toBe(true);
    }
    resetExterayondSettings();
    await flush();
    for(const [, className] of flags) expect(document.documentElement.classList.contains(className)).toBe(false);
  });

  test('hiding the sender selector applies live and reset restores it', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    setExterayondSetting('hideSendAsChannel', true);
    await flush();
    expect(document.documentElement.classList.contains('oe-hide-send-as')).toBe(true);
    resetExterayondSettings();
    await flush();
    expect(document.documentElement.classList.contains('oe-hide-send-as')).toBe(false);
    expect(document.documentElement.classList.contains('oe-remove-message-tail')).toBe(true);
  });

  test('the attached sidebar is a live root class and reset restores the float', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    const root = document.documentElement;

    // * the default is stock: the sidebar floats
    expect(root.classList.contains('oe-attached-sidebar')).toBe(false);

    setExterayondSetting('OEAppearanceAttachedSidebar', true);
    await flush();
    expect(root.classList.contains('oe-attached-sidebar')).toBe(true);

    setExterayondSetting('OEAppearanceAttachedSidebar', false);
    await flush();
    expect(root.classList.contains('oe-attached-sidebar')).toBe(false);

    setExterayondSetting('OEAppearanceAttachedSidebar', true);
    await flush();
    resetExterayondSettings();
    await flush();
    expect(root.classList.contains('oe-attached-sidebar')).toBe(false);
  });

  test('the attached sidebar toggle raises the one-shot layout animation class', async() => {
    const {setExterayondSetting} = await loadStore();
    const root = document.documentElement;

    setExterayondSetting('OEAppearanceAttachedSidebar', true);
    await flush();
    expect(root.classList.contains('oe-attached-sidebar')).toBe(true);
    expect(root.classList.contains('oe-sidebar-layout-animate')).toBe(true);

    // * the class drops once the transition settles (500ms after the flip)
    await new Promise((resolve) => setTimeout(resolve, 550));
    expect(root.classList.contains('oe-sidebar-layout-animate')).toBe(false);

    // * effect re-runs without a flip (another setting changed) re-add nothing
    setExterayondSetting('OEAppearanceAvatarCorners', 7);
    await flush();
    expect(root.classList.contains('oe-sidebar-layout-animate')).toBe(false);
    setExterayondSetting('OEAppearanceAvatarCorners', 28);
  });

  test('the channel gift button hiding is off by default, live, and reset clears it', async() => {
    const {setExterayondSetting, resetExterayondSettings} = await loadStore();
    const root = document.documentElement;

    // * Android NaConfig.HideGiftButtonInChannel defaults to false: stock plate
    expect(root.classList.contains('oe-hide-channel-gift-button')).toBe(false);

    setExterayondSetting('HideGiftButtonInChannel', true);
    await flush();
    expect(root.classList.contains('oe-hide-channel-gift-button')).toBe(true);

    setExterayondSetting('HideGiftButtonInChannel', false);
    await flush();
    expect(root.classList.contains('oe-hide-channel-gift-button')).toBe(false);

    setExterayondSetting('HideGiftButtonInChannel', true);
    await flush();
    resetExterayondSettings();
    await flush();
    expect(root.classList.contains('oe-hide-channel-gift-button')).toBe(false);
  });
});
