import {createEffect, createRoot} from 'solid-js';
import {createStore, unwrap} from 'solid-js/store';

/**
 * exteraless Preferences — the `OE*` settings store.
 *
 * Keys, types, defaults and ranges are the Android configs verbatim
 * (`TMessagesProj/src/main/kotlin/app/exteraless/appearance/AppearanceConfig.kt`,
 * read via `git -C .research/android show HEAD:<path>`); the record is a
 * namespaced browser record with no account or session material. Only the
 * settings with a wired web behavior live here — the rest arrive with their
 * slices, classified in docs/exteraless-map.md.
 */

/** Android `AppearanceConfig.AVATAR_CORNERS_MAX`. */
export const OE_AVATAR_CORNERS_MAX = 28;

/**
 * Android `AppearanceConfig.sectionRadius` default. On the web this is the
 * neutral value: it keeps Web K's own stock section radius, so an untouched
 * exterayond looks exactly like stock tweb.
 */
export const OE_SECTION_RADIUS_STOCK = 20;

export const OE_DEFAULTS = {
  OEAppearanceAvatarCorners: OE_AVATAR_CORNERS_MAX,
  OEAppearanceSectionRadius: OE_SECTION_RADIUS_STOCK
} as const;

export type ExteralessSettingsKey = keyof typeof OE_DEFAULTS;
export type ExteralessSettings = {[K in ExteralessSettingsKey]: number};

const RANGES: {[K in ExteralessSettingsKey]: readonly [min: number, max: number]} = {
  OEAppearanceAvatarCorners: [0, OE_AVATAR_CORNERS_MAX],
  OEAppearanceSectionRadius: [0, OE_AVATAR_CORNERS_MAX]
};

const STORAGE_KEY = 'exterayond-exteraless-settings';

/** A value out of range (or of the wrong type) is clamped back, like an untrusted import. */
export const clampExteralessSetting = (key: ExteralessSettingsKey, value: number) => {
  const [min, max] = RANGES[key];
  if(!Number.isFinite(value)) {
    return OE_DEFAULTS[key];
  }

  return Math.max(min, Math.min(max, Math.round(value)));
};

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

  const out: Partial<ExteralessSettings> = {};
  if(parsed && typeof parsed === 'object') {
    for(const key of Object.keys(OE_DEFAULTS) as ExteralessSettingsKey[]) {
      const value = parsed[key];
      out[key] = clampExteralessSetting(key, typeof value === 'number' ? value : NaN);
    }
  }

  return out;
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

/** Sets one setting (clamped) and writes the whole record back. */
const setExteralessSetting = (key: ExteralessSettingsKey, value: number) => {
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

if(typeof document !== 'undefined') {
  // * one effect owns the custom properties: every consumer reads them in CSS
  createRoot(() => {
    createEffect(() => {
      const {OEAppearanceAvatarCorners, OEAppearanceSectionRadius} = unwrap(exteralessSettings);
      const style = document.documentElement.style;
      style.setProperty('--oe-avatar-radius', avatarCornersToRadiusPercent(OEAppearanceAvatarCorners));
      const sectionRadius = sectionRadiusToCss(OEAppearanceSectionRadius);
      if(sectionRadius === undefined) {
        style.removeProperty('--oe-section-radius');
      } else {
        style.setProperty('--oe-section-radius', sectionRadius);
      }
    });
  });
}

export {
  exteralessSettings,
  setExteralessSettings,
  setExteralessSetting,
  useExteralessSettings
};
