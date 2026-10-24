import {createEffect, createRoot} from 'solid-js';
import {createStore, unwrap} from 'solid-js/store';
import {hotEffect} from '@helpers/hotModule';

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

export const OE_DEFAULTS = {
  OEAppearanceAvatarCorners: OE_AVATAR_CORNERS_MAX,
  OEAppearanceSectionRadius: OE_SECTION_RADIUS_STOCK,
  OEAppearanceSingleCornerRadius: false,
  OEAppearanceSquareFab: true,
  OEAppearanceSeparateHeaders: true,
  OEAppearanceHideActionBarStatus: false,
  OEAppearanceSenderMiniAvatars: true,
  OEAppearanceCustomThemes: true,
  OEChatsRemoveMessageTail: true,
  OEChatsHideCallButton: false,
  OEChatsHideChannelSearchButton: false,
  OEChatsStickerShape: 1,
  OEChatsBottomButton: 1,
  OEChatsAlwaysSendInHD: true,
  OEChatsKeepAttachButton: false,
  OEChatsStickerTimeSide: false,
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
  OERelativeLastSeen: false,
  OEAddCommaAfterMention: true
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
  OEChatsStickerShape: [0, 2],
  OEChatsBottomButton: [0, 2]
};

/** A value of the wrong type or out of range falls back like an untrusted import. */
const clampAnySetting = (key: ExteralessSettingsKey, value: unknown): boolean | number => {
  const fallback = OE_DEFAULTS[key];
  if(typeof fallback === 'number') {
    const [min, max] = NUMERIC_RANGES[key as NumericKey];
    if(typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, Math.round(value)));
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

/** Sets one setting (validated) and writes the whole record back. */
const setExteralessSetting = <K extends ExteralessSettingsKey>(key: K, value: ExteralessSettingValue<K>) => {
  setExteralessSettings({[key]: clampExteralessSetting(key, value)} as Partial<ExteralessSettings>);
  persist(unwrap(exteralessSettings));
};

const useExteralessSettings = () => [exteralessSettings, setExteralessSetting] as const;

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

      // * the replyColors / replyEmoji / replyBackground trio defaults to true;
      // * the classes mark only the off states, so the default adds nothing
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
  useExteralessSettings
};

// * a self-accepting module, like the other singletons: an edit hot-updates it
// * (the dev transform keeps the store across evaluations) instead of
// * reloading the page (scripts/import-graph.mjs)
if(import.meta.hot) import.meta.hot.accept();
