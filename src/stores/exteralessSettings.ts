import {batch, createEffect, createRoot} from 'solid-js';
import {createStore, unwrap} from 'solid-js/store';
import {hotEffect} from '@helpers/hotModule';
import rootScope from '@lib/rootScope';

/**
 * exteraless Preferences — the `OE*` settings store.
 *
 * Keys, types, defaults and ranges are the Android configs verbatim
 * (`TMessagesProj/src/main/kotlin/app/exteraless/`, read via
 * `git -C .research/android show HEAD:<path>`); the record is a namespaced
 * browser record with no account or session material. Only the settings with
 * a wired web behavior live here — the rest arrive with their slices,
 * classified in docs/exteraless-map.md.
 */

/** Android `AppearanceConfig.AVATAR_CORNERS_MAX`. */
export const OE_AVATAR_CORNERS_MAX = 28;

/**
 * Android `AppearanceConfig.sectionRadius` default. On the web this is the
 * neutral value: it keeps Web K's own stock section radius, so the slider at
 * its Android default does not restyle every card on first run.
 */
export const OE_SECTION_RADIUS_STOCK = 20;

/** Android `UIUtil.fabCornerRadius`: the Material squircle is 16 of a 56 FAB. */
export const OE_FAB_SQUIRCLE_RADIUS = '28.571%';

/**
 * Android `ChatsConfig.stickerShape`: 0 as-is, 1 rounded (dp(6)), 2 as the
 * message bubble (the bubble's big corner radius).
 */
export const OE_STICKER_SHAPE_ROUNDED_RADIUS = '6px';
export const OE_STICKER_SHAPE_BUBBLE_RADIUS = '15px';

/** Android `PlayerStyle.COVER_SIZE_MIN`/`COVER_SIZE_MAX` (a percentage). */
export const OE_PLAYER_COVER_SIZE_MIN = 60;
export const OE_PLAYER_COVER_SIZE_MAX = 100;
/** Android `PlayerStyle.COVER_RADIUS_MAX`. */
export const OE_PLAYER_COVER_RADIUS_MAX = 48;

export const OE_DEFAULTS = {
  OEAppearanceAvatarCorners: OE_AVATAR_CORNERS_MAX,
  OEAppearanceSectionRadius: OE_SECTION_RADIUS_STOCK,
  OEAppearanceSingleCornerRadius: false,
  OEAppearanceSquareFab: true,
  OEAppearanceSeparateHeaders: true,
  OEAppearanceHideActionBarStatus: false,
  OEAppearanceSenderMiniAvatars: true,
  OEAppearanceCustomThemes: true,
  OEAppearanceGlassMessageMenu: true,
  /**
   * Android AppearanceConfig.centerTitle, migrated to NaConfig's
   * centerActionBarTitle: the sidebar header title is centered.
   */
  OEAppearanceCenterTitle: false,
  /**
   * Android NekoConfig.typeface (`TypefaceUseDefault`, default true): the
   * interface uses the platform's fonts instead of the bundled Roboto.
   */
  TypefaceUseDefault: true,
  OEAppearanceNewChatHeaderStyle: false,
  OEAppearanceNewLoadingStyle: true,
  SliderStyle: 2,
  SwitchStyle: 2,
  OEAppearanceNewNavigationBarStyle: false,
  OEAppearanceM3ListItems: false,
  /**
   * Android NaConfig folder-tab counter mode: 0 all chats, 1 except muted
   * (the effective default through NaConfig's legacy preference), 2 off.
   */
  IgnoreUnreadCount: 1,
  OEAppearanceMd3Player: true,
  OEAppearanceMd3MiniPlayer: true,
  /**
   * Android `PlayerStyleEditor` keys (`AppearanceConfig.kt` 281–323). Cover
   * style: 0 card, 1 wide, 2 full, 3 disc; title align: 0 start, 1 centered;
   * title size: 0 small, 1 medium, 2 large; controls size: 0 compact,
   * 1 normal, 2 large. Android EtgBackup exports none of them.
   */
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
  /** Android `NaConfig.disableDialogsFloatingButton`; the persisted name is the contract. */
  DisableDialogsFloatingButton: false,
  /** Android `NekoConfig.disableNumberRounding`: exact counts instead of `1.2K`/`1.2M`. */
  DisableNumberRounding: false,
  /** Android NaConfig.ZalgoFilter. */
  ZalgoFilter: false,
  /** Android NaConfig keys and defaults. */
  UseEditedIcon: true,
  HideShareButtonInChannel: false,
  /**
   * Android NaConfig.HideGiftButtonInChannel: the channel "can't write" plate
   * loses its gift button (ChatActivity's bottomChannelButtonsLayout BUTTON_GIFT).
   */
  HideGiftButtonInChannel: false,
  /** Android NaConfig: 0 hidden, 1 Telegram API, 2 Bot API. */
  IdDcType: 1,
  DontSendGreetingSticker: true,
  DontAutoPlayNextVoice: false,
  HidePremiumSection: false,
  HideHelpSection: true,
  DisableTrending: true,
  hideGroupSticker: false,
  hideSendAsChannel: false,
  /** Android NaConfig; only preselects an available revoke checkbox. */
  DeleteChatForBothSides: true,
  /** Android NekoConfig.confirmAVMessage: a recording's release pauses for preview instead of sending. */
  ConfirmAVMessage: false,
  AskBeforeCalling: true,
  /** Android NekoConfig.repeatConfirm: the "Repeat" action asks before it forwards (default true). */
  repeatConfirm: true,
  /** Android NekoConfig.showRepeat: the message menu gains the "Repeat" action. */
  showRepeat: false,
  DisableClickCommandToSend: false,
  DateOfForwardedMsg: false,
  ShowTimeHint: false,
  ConfirmAllLinks: false,
  SkipOpenLinkConfirm: false,
  /** Android NekoConfig.disableLinkPreviewByDefault: fresh compositions skip the preview fetch and send with no_webpage. */
  DisableLinkPreviewByDefault: false,
  /**
   * Android NaConfig.FixLinkPreview (default true): the URL used to fetch the
   * composer's link preview is rewritten by the page preview rules
   * (x.com → fixupx.com); the sent text is never rewritten.
   */
  FixLinkPreview: true,
  /**
   * Android NaConfig.HideStoriesFromHeader (default true): the dialogs' stories
   * strip in the chat list header is never shown (DialogsActivity.updateStoriesVisibility).
   */
  HideStoriesFromHeader: true,
  /**
   * Android NaConfig.DisableGlobalSearch (default false): the chat list search
   * shows no server-wide results — only the user's own chats, contacts and
   * their messages (DialogsSearchAdapter.globalResultsAllowed).
   */
  DisableGlobalSearch: false,
  /**
   * Android NekoConfig.hideAllTab (default false): the folder tab bar drops
   * the "All chats" tab while real folders remain (FilterTabsView).
   */
  HideAllTab: false,
  /**
   * Android ChatsConfig.wideChannelPosts (default false): a broadcast
   * channel's posts stretch their bubble to the full row width
   * (ChatMessageCell.applyWideChannelPostWidth).
   */
  OEChatsWideChannelPosts: false,
  /**
   * Android ChatsConfig.wideFeedPosts (default false): the same treatment in
   * the Feed. Web K has no feed, so the flag is a documented no-op kept in
   * the record for `.extera` backup compatibility (no UI row).
   */
  OEChatsWideFeedPosts: false,
  /**
   * Android NaConfig: the page a hashtag search opens on — 0 this chat,
   * 1 my messages, 2 public posts. The chat key applies everywhere, the
   * channel key to public broadcast channels.
   */
  SearchHashtagDefaultPageChat: 0,
  SearchHashtagDefaultPageChannel: 0,
  /** Neko float, 4..20; 14 preserves Web K's default sticker dimensions. */
  stickerSize: 14,
  OEChatsStickerShape: 1,
  OEChatsBottomButton: 1,
  OEChatsAlwaysSendInHD: true,
  OEChatsKeepAttachButton: false,
  /**
   * Android ChatsConfig.hideCameraTile. Web K's attach menu has no camera
   * tile, so the setting's outcome is the base's permanent behavior; the key
   * stays in the record for `.extera` backup compatibility (no UI row).
   */
  OEChatsHideCameraTile: false,
  OEChatsStickerTimeSide: false,
  HideTimeForSticker: false,
  OEChatsShowResultsBeforeVoting: false,
  OEChatsStripTrackingOnOpen: true,
  OEChatsStripTrackingOnPaste: true,
  OEChatsReplyColors: true,
  OEChatsReplyEmoji: true,
  OEChatsReplyBackground: true,
  OEChatsHideReactionsChannels: false,
  OEChatsHideReactionsGroups: false,
  OEChatsHideReactionsPrivate: false,
  OEChatsPauseVoice: false,
  OEChatsPauseRound: false,
  /** Android NekoConfig.autoPauseVideo: pause video playback when the tab hides. */
  AutoPauseVideo: true,
  OERelativeLastSeen: false,
  OEAddCommaAfterMention: true,
  /** Android `NekoConfig.showSeconds`: the persisted name is the contract, so no OE* alias. */
  showSeconds: false,
  /** Android `NekoConfig.hidePhone`: local display only. */
  HidePhone: true
} as const;

export type ExteralessSettingsKey = keyof typeof OE_DEFAULTS;
/** The stored kind of a setting: `number` for sliders, `boolean` for switches. */
export type ExteralessSettings = {[K in ExteralessSettingsKey]: (typeof OE_DEFAULTS)[K] extends boolean ? boolean : number};
export type ExteralessSettingValue<K extends ExteralessSettingsKey> = ExteralessSettings[K];

type NumericKey = {
  [K in ExteralessSettingsKey]: (typeof OE_DEFAULTS)[K] extends number ? K : never
}[ExteralessSettingsKey];

const NUMERIC_RANGES: {[K in NumericKey]: readonly [min: number, max: number]} = {
  OEAppearanceAvatarCorners: [0, OE_AVATAR_CORNERS_MAX],
  OEAppearanceSectionRadius: [0, OE_AVATAR_CORNERS_MAX],
  SliderStyle: [0, 2],
  SwitchStyle: [0, 3],
  OEChatsStickerShape: [0, 2],
  OEChatsBottomButton: [0, 2],
  IdDcType: [0, 2],
  IgnoreUnreadCount: [0, 2],
  SearchHashtagDefaultPageChat: [0, 2],
  SearchHashtagDefaultPageChannel: [0, 2],
  stickerSize: [4, 20],
  OEPlayerCoverStyle: [0, 3],
  OEPlayerCoverSize: [OE_PLAYER_COVER_SIZE_MIN, OE_PLAYER_COVER_SIZE_MAX],
  OEPlayerCoverRadius: [0, OE_PLAYER_COVER_RADIUS_MAX],
  OEPlayerTitleAlign: [0, 1],
  OEPlayerTitleSize: [0, 2],
  OEPlayerControlsSize: [0, 2]
};

/** A value of the wrong type or out of range falls back like an untrusted import. */
const clampAnySetting = (key: ExteralessSettingsKey, value: unknown): boolean | number => {
  const fallback = OE_DEFAULTS[key];
  if(typeof fallback === 'number') {
    const [min, max] = NUMERIC_RANGES[key as NumericKey];
    if(typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, key === 'stickerSize' ? value : Math.round(value)));
  }

  return typeof value === 'boolean' ? value : fallback;
};

export const clampExteralessSetting = <K extends ExteralessSettingsKey>(key: K, value: ExteralessSettingValue<K>): ExteralessSettingValue<K> => {
  return clampAnySetting(key, value) as ExteralessSettingValue<K>;
};

const STORAGE_KEY = 'exterayond-exteraless-settings';

const readPersisted = (): Partial<ExteralessSettings> => {
  let raw: string;
  try {
    raw = globalThis.localStorage?.getItem(STORAGE_KEY);
  } catch(e) {
    return {};
  }

  if(!raw) {
    return {};
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch(e) {
    return {};
  }

  const out = {} as Record<ExteralessSettingsKey, boolean | number>;
  if(parsed && typeof parsed === 'object') {
    for(const key of Object.keys(OE_DEFAULTS) as ExteralessSettingsKey[]) {
      out[key] = clampAnySetting(key, parsed[key]);
    }
  }

  return out as Partial<ExteralessSettings>;
};

const persist = (settings: ExteralessSettings) => {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch(e) {
    // * a full or blocked localStorage keeps the settings for the session
  }
};

const [exteralessSettings, setExteralessSettings] = createStore<ExteralessSettings>({
  ...OE_DEFAULTS,
  ...readPersisted()
});

/**
 * The settings whose consumers re-read the store from this event; no new bus,
 * no effect per row or message.
 */
const LIVE_EVENT_KEYS: ExteralessSettingsKey[] = ['DisableNumberRounding', 'IgnoreUnreadCount', 'HideAllTab'];

/** Sets one setting (validated) and writes the whole record back. */
const setExteralessSetting = <K extends ExteralessSettingsKey>(key: K, value: ExteralessSettingValue<K>) => {
  const clamped = clampExteralessSetting(key, value);
  const previous = exteralessSettings[key];
  setExteralessSettings({[key]: clamped} as Partial<ExteralessSettings>);
  persist(unwrap(exteralessSettings));
  if(LIVE_EVENT_KEYS.includes(key) && previous !== clamped) {
    rootScope.dispatchEventSingle('exteraless_settings_updated', {key, value: clamped});
  }
};

/** Reset this client's OE preferences; Telegram settings and account data have other records. */
const resetExteralessSettings = () => {
  const previous = {...exteralessSettings};
  setExteralessSettings({...OE_DEFAULTS});
  try {
    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch(e) {
    // Some storage implementations refuse removal but still allow replacement.
    persist(unwrap(exteralessSettings));
  }

  for(const key of LIVE_EVENT_KEYS) {
    if(previous[key] !== OE_DEFAULTS[key]) {
      rootScope.dispatchEventSingle('exteraless_settings_updated', {key, value: OE_DEFAULTS[key]});
    }
  }
};

const useExteralessSettings = () => [exteralessSettings, setExteralessSetting] as const;

/** Android ChatsConfig composes its side flag with NekoConfig.HideTimeForSticker. */
export const getStickerTimeMode = (settings: Pick<ExteralessSettings, 'HideTimeForSticker' | 'OEChatsStickerTimeSide'> = exteralessSettings) =>
  settings.HideTimeForSticker ? 2 : settings.OEChatsStickerTimeSide ? 1 : 0;

export const getOpenLinkConfirmation = () => exteralessSettings.ConfirmAllLinks ? 1 : exteralessSettings.SkipOpenLinkConfirm ? 2 : 0;

/**
 * Android's hashtag search default page (`ChatActivity`, per open): a public
 * broadcast channel reads `SearchHashtagDefaultPageChannel`, everything else
 * `SearchHashtagDefaultPageChat`; 0 this chat (Web K's stock default), 1 my
 * messages, 2 public posts. Out-of-range values clamp like the store does.
 */
export const getHashtagSearchType = (publicChannel: boolean): 'my' | 'public' | undefined => {
  const key: 'SearchHashtagDefaultPageChannel' | 'SearchHashtagDefaultPageChat' =
    publicChannel ? 'SearchHashtagDefaultPageChannel' : 'SearchHashtagDefaultPageChat';
  const page = clampExteralessSetting(key, exteralessSettings[key]);
  return page === 1 ? 'my' : page === 2 ? 'public' : undefined;
};

const MD3_BOOLEAN_KEYS = [
  'OEAppearanceNewLoadingStyle', 'OEAppearanceNewChatHeaderStyle',
  'OEAppearanceNewNavigationBarStyle', 'OEAppearanceM3ListItems',
  'OEAppearanceMd3Player', 'OEAppearanceMd3MiniPlayer'
] as const;

export const getMd3StyleCount = () => MD3_BOOLEAN_KEYS.filter((key) => exteralessSettings[key]).length +
  Number(exteralessSettings.SliderStyle === 2) + Number(exteralessSettings.SwitchStyle >= 2);

export const setAllMd3Styles = (enabled: boolean) => batch(() => {
  for(const key of MD3_BOOLEAN_KEYS) setExteralessSetting(key, enabled);
  setExteralessSetting('SliderStyle', enabled ? 2 : 0);
  setExteralessSetting('SwitchStyle', enabled ? 3 : 0);
});

export const setOpenLinkConfirmation = (mode: number) => {
  if(!Number.isInteger(mode) || mode < 0 || mode > 2) return;
  batch(() => {
    setExteralessSetting('ConfirmAllLinks', mode === 1);
    setExteralessSetting('SkipOpenLinkConfirm', mode === 2);
  });
};

export const setStickerTimeMode = (mode: number, apply: typeof setExteralessSetting = setExteralessSetting) => {
  if(!Number.isInteger(mode) || mode < 0 || mode > 2) return;
  batch(() => {
    apply('HideTimeForSticker', mode === 2);
    apply('OEChatsStickerTimeSide', mode === 1);
  });
};

/** Android tablet sizing, normalized to Web K's stock size at the default 14. */
export const getStickerScale = (value = exteralessSettings.stickerSize) => 1 + (value - 14) / 16;

/**
 * avatarCorners 0..28 → the avatar border-radius percentage: 28 = the stock
 * circle (50%), 0 = square. Android scales every avatar's round radius by
 * corners/28 (`ImageReceiver.applyRoundRadiusInternal`); the single CSS choke
 * point `.avatar` (scss/partials/_avatar.scss) plays that role on the web.
 */
export const avatarCornersToRadiusPercent = (corners: number) => {
  return clampExteralessSetting('OEAppearanceAvatarCorners', corners) / OE_AVATAR_CORNERS_MAX * 50 + '%';
};

/**
 * sectionRadius 0..28dp → the section-card border radius. The Android default
 * keeps Web K's stock radius (no property set, the SCSS fallback applies);
 * every other value applies directly as pixels.
 */
export const sectionRadiusToCss = (radius: number) => {
  const clamped = clampExteralessSetting('OEAppearanceSectionRadius', radius);
  return clamped === OE_SECTION_RADIUS_STOCK ? undefined : clamped + 'px';
};

/**
 * stickerShape 0..2 → the sticker media's border radius: 0 as-is, 1 rounded
 * (dp(6), `ChatMessageCell`), 2 as the message bubble ($bubble-border-radius-big).
 */
export const stickerShapeToCss = (shape: number) => {
  const clamped = clampExteralessSetting('OEChatsStickerShape', shape);
  if(clamped === 1) {
    return OE_STICKER_SHAPE_ROUNDED_RADIUS;
  }

  return clamped === 2 ? OE_STICKER_SHAPE_BUBBLE_RADIUS : '0px';
};

/** Android `PlayerStyle.coverSize()`: a 60..100 percentage as a 0.6..1 fraction. */
export const playerCoverSizeFraction = (value = exteralessSettings.OEPlayerCoverSize) =>
  clampExteralessSetting('OEPlayerCoverSize', value) / 100;

/** Android `PlayerStyle.controlsScale()`: 0 compact 0.84, 1 normal 1, 2 large 1.14. */
export const playerControlsScale = (value = exteralessSettings.OEPlayerControlsSize) => {
  const clamped = clampExteralessSetting('OEPlayerControlsSize', value);
  return clamped === 0 ? 0.84 : clamped === 2 ? 1.14 : 1;
};

/**
 * Android `PlayerSheet.applyStyle` title sizes: 0 small 22/15, 1 medium 26/16,
 * 2 large 31/17 (title/artist, dp).
 */
export const playerTitleSizes = (value = exteralessSettings.OEPlayerTitleSize): readonly [title: number, artist: number] => {
  const clamped = clampExteralessSetting('OEPlayerTitleSize', value);
  return clamped === 0 ? [22, 15] : clamped === 2 ? [31, 17] : [26, 16];
};

/** Android `PlayerStyle.coverStyle()`: card, wide, full, disc. */
export const getPlayerCoverStyle = (value = exteralessSettings.OEPlayerCoverStyle) =>
  clampExteralessSetting('OEPlayerCoverStyle', value);

if(typeof document !== 'undefined') {
  // * one effect owns the custom properties and the root classes: every
  // * consumer reads them in CSS. The store's properties are read directly —
  // * an unwrap() snapshot would track nothing and freeze the effect at its
  // * first run. hotEffect keeps a hot edit of this module from running a
  // * second root
  hotEffect(import.meta.hot, () => createRoot((dispose) => {
    createEffect(() => {
      const {classList, style} = document.documentElement;

      // * every property read here is what the effect tracks
      style.setProperty('--oe-avatar-radius', avatarCornersToRadiusPercent(exteralessSettings.OEAppearanceAvatarCorners));
      classList.toggle('oe-single-corner-radius', exteralessSettings.OEAppearanceSingleCornerRadius);
      classList.toggle('oe-hide-title-status', exteralessSettings.OEAppearanceHideActionBarStatus);

      if(exteralessSettings.OEAppearanceSquareFab) {
        style.setProperty('--oe-fab-radius', OE_FAB_SQUIRCLE_RADIUS);
      } else {
        style.removeProperty('--oe-fab-radius');
      }

      const sectionRadius = sectionRadiusToCss(exteralessSettings.OEAppearanceSectionRadius);
      if(sectionRadius === undefined) {
        style.removeProperty('--oe-section-radius');
      } else {
        style.setProperty('--oe-section-radius', sectionRadius);
      }

      classList.toggle('oe-separate-headers', exteralessSettings.OEAppearanceSeparateHeaders);

      classList.toggle('oe-remove-message-tail', exteralessSettings.OEChatsRemoveMessageTail);

      classList.toggle('oe-sticker-time-side', exteralessSettings.OEChatsStickerTimeSide);
      classList.toggle('oe-hide-sticker-time', exteralessSettings.HideTimeForSticker);
      classList.toggle('oe-hide-new-chat-button', exteralessSettings.DisableDialogsFloatingButton);
      classList.toggle('oe-edited-icon', exteralessSettings.UseEditedIcon);
      classList.toggle('oe-hide-channel-share-button', exteralessSettings.HideShareButtonInChannel);
      classList.toggle('oe-hide-channel-gift-button', exteralessSettings.HideGiftButtonInChannel);
      classList.toggle('oe-hide-call-button', exteralessSettings.OEChatsHideCallButton);
      classList.toggle('oe-hide-send-as', exteralessSettings.hideSendAsChannel);
      classList.toggle('oe-hide-channel-search-button', exteralessSettings.OEChatsHideChannelSearchButton);
      classList.toggle('oe-hide-stories', exteralessSettings.HideStoriesFromHeader);
      classList.toggle('oe-wide-posts', exteralessSettings.OEChatsWideChannelPosts);
      classList.toggle('oe-hide-reactions-private', exteralessSettings.OEChatsHideReactionsPrivate);
      classList.toggle('oe-hide-reactions-channels', exteralessSettings.OEChatsHideReactionsChannels);
      classList.toggle('oe-hide-reactions-groups', exteralessSettings.OEChatsHideReactionsGroups);

      // * the replyColors / replyEmoji / replyBackground trio defaults to true;
      // * the classes mark only the off states, so the default adds nothing
      classList.toggle('oe-no-glass-menus', !exteralessSettings.OEAppearanceGlassMessageMenu);
      classList.toggle('oe-center-title', exteralessSettings.OEAppearanceCenterTitle);
      classList.toggle('oe-system-font', exteralessSettings.TypefaceUseDefault);
      classList.toggle('oe-new-chat-header', exteralessSettings.OEAppearanceNewChatHeaderStyle);
      classList.toggle('oe-md3-loading', exteralessSettings.OEAppearanceNewLoadingStyle);
      classList.toggle('oe-md3-sliders', exteralessSettings.SliderStyle === 2);
      classList.toggle('oe-md3-switches', exteralessSettings.SwitchStyle >= 2);
      classList.toggle('oe-md3-navigation', exteralessSettings.OEAppearanceNewNavigationBarStyle);
      classList.toggle('oe-md3-list-items', exteralessSettings.OEAppearanceM3ListItems);
      classList.toggle('oe-md3-mini-player', exteralessSettings.OEAppearanceMd3MiniPlayer);
      classList.toggle('oe-no-reply-colors', !exteralessSettings.OEChatsReplyColors);
      classList.toggle('oe-no-reply-emoji', !exteralessSettings.OEChatsReplyEmoji);
      classList.toggle('oe-no-reply-background', !exteralessSettings.OEChatsReplyBackground);

      style.setProperty('--oe-sticker-radius', stickerShapeToCss(exteralessSettings.OEChatsStickerShape));
    });

    return dispose;
  }));
}

export {
  exteralessSettings,
  setExteralessSettings,
  setExteralessSetting,
  resetExteralessSettings,
  useExteralessSettings
};

// * a self-accepting module, like the other singletons: an edit hot-updates it
// * (the dev transform keeps the store across evaluations) instead of
// * reloading the page (scripts/import-graph.mjs)
if(import.meta.hot) import.meta.hot.accept();
