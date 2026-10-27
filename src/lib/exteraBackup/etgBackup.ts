/**
 * The `.extera` import/export contract, ported from exteraless
 * `backup/EtgBackup.java` (a byte-port of exteraGram 12.9.0
 * `PreferencesUtils`). JSON, top-level sections named after the
 * SharedPreferences files (`exteraconfig`, `pillstackconfig`, `mainconfig`),
 * pretty-printed; values validated like the Android reader does — a foreign
 * file is untrusted.
 *
 * Keys with a web target are read from and applied to the exteraless settings
 * store; the rest of the Android key set is recognized by name and reported as
 * unsupported — never applied, never faked.
 */
import {OE_DEFAULTS, clampExteralessSetting, exteralessSettings, setExteralessSetting, getStickerTimeMode, setStickerTimeMode} from '@stores/exteralessSettings';
import type {ExteralessSettings, ExteralessSettingsKey} from '@stores/exteralessSettings';
import {isArchiveHidden, setArchiveHidden} from '@stores/exteralessPreferences';
import {PLUGINS_DEVELOPER_MODE_KEY, pluginsManager} from '@plugins/manager';
import {invisibleEncryptor} from './invisibleEncryptor';

export const EXTENSION = '.extera';

export const SECTION_EXTERA = 'exteraconfig';
export const SECTION_PILLS = 'pillstackconfig';
export const SECTION_MAIN = 'mainconfig';

export type BackupSection = typeof SECTION_EXTERA | typeof SECTION_PILLS | typeof SECTION_MAIN;

type Kind = 'bool' | 'int' | 'float' | 'string';

type SupportedEntry = {
  section: BackupSection,
  /** the key the exteraGram format uses */
  key: string,
  kind: Kind,
  min?: number,
  max?: number,
  /** HideArchive uses Web K's native setting; StickerTimeMode composes two Android flags. */
  storeKey: ExteralessSettingsKey | 'HideArchive' | 'StickerTimeMode',
  /** int keys with different numbering: our value ↔ exteraGram's */
  toEtg?: (ours: number) => number | boolean | null,
  toOurs?: (etg: number) => number | null
};

/** The Android key set the format carries beyond the web's reach: recognized, reported, never applied. */
export const KNOWN_UNSUPPORTED_KEYS: string[] = [
  // exteraconfig (Neko/Na/Android-bound targets)
  'uploadSpeedBoost',
  'archiveOnPull', 'disableUnarchiveSwipe',
  'doNotUseProxy', 'centerTitle', 'hideStories',
  'hideDialogsSearchBar', 'hideAllChats',
  'iosNavigationBarStyle', 'iosChatHeader', 'profileMusicCard', 'useSystemFonts',
  'gooeyAvatarAnimation', 'navigationDrawer', 'immersiveDrawerAnimation', 'showFeedTab',
  'hideKeyboardOnScroll', 'inlineMathResult',
  'showOnlineStatus',
  'wideChannelPosts', 'wideFeedPosts', 'showCopyPhotoButton', 'showSaveMessageButton',
  'showRepeatMessageButton', 'showClearButton', 'showHistoryButton', 'showReportButton',
  'showDetailsButton', 'groupMessageMenu', 'extendedFramesPerSecond', 'cameraStabilization',
  'cameraMirrorMode', 'rememberLastUsedCamera', 'startWithWideAngleCamera', 'staticZoom',
  'hideCameraTile', 'preferOriginalQuality', 'swipeToPip', 'unmuteWithVolumeButtons',
  'pauseOnMinimizeVideo', 'useSystemIconShape', 'infiniteScrolling', 'useGoogleCrashlytics',
  'inAppVibration', 'titleText', 'downloadSpeedBoost', 'tabletMode', 'glassOutlineStyle',
  'doubleTapSeekDuration', 'cameraType', 'videoMessagesCamera',
  'translationProvider', 'tabIcons', 'doubleTapAction', 'doubleTapActionOutOwner',
  'predictiveBackIntensity', 'flashWarmth', 'flashIntensity',
  'dividerStyle', 'bottomNavigationBarMode',
  'unlimitedRecentStickers', 'quickAdminShortcuts', 'mainMenuLayout', 'mainMenuHiddenItems',
  'tabCounter', 'targetLang',
  // * the plugin flags with a web target moved to SUPPORTED; the two without
  // * one (compact view, art options) stay recognized-but-unsupported
  'pluginsCompactView', 'pluginsDisableArtOpts',
  // mainconfig (NagramX)
  'ChatSwipeAction', 'mediaColumnsCount', 'bubbleRadius', 'fons_size'
];

const SUPPORTED: SupportedEntry[] = [
  {section: SECTION_EXTERA, key: 'disableGreetingSticker', kind: 'bool', storeKey: 'DontSendGreetingSticker'},
  {section: SECTION_EXTERA, key: 'showIdAndDc', kind: 'int', min: 0, max: 2, storeKey: 'IdDcType'},
  {section: SECTION_EXTERA, key: 'replaceEditedWithIcon', kind: 'bool', storeKey: 'UseEditedIcon'},
  {section: SECTION_EXTERA, key: 'hideShareButton', kind: 'bool', storeKey: 'HideShareButtonInChannel'},
  {section: SECTION_EXTERA, key: 'filterZalgo', kind: 'bool', storeKey: 'ZalgoFilter'},
  {section: SECTION_EXTERA, key: 'hideArchiveFolder', kind: 'bool', storeKey: 'HideArchive'},
  {section: SECTION_EXTERA, key: 'hidePhoneNumber', kind: 'bool', storeKey: 'HidePhone'},
  {section: SECTION_EXTERA, key: 'disableNumberRounding', kind: 'bool', storeKey: 'DisableNumberRounding'},
  {section: SECTION_EXTERA, key: 'formatTimeWithSeconds', kind: 'bool', storeKey: 'showSeconds'},
  {section: SECTION_EXTERA, key: 'relativeLastSeen', kind: 'bool', storeKey: 'OERelativeLastSeen'},
  {section: SECTION_EXTERA, key: 'singleCornerRadius', kind: 'bool', storeKey: 'OEAppearanceSingleCornerRadius'},
  {section: SECTION_EXTERA, key: 'hideActionBarStatus', kind: 'bool', storeKey: 'OEAppearanceHideActionBarStatus'},
  {section: SECTION_EXTERA, key: 'hideFloatingButton', kind: 'bool', storeKey: 'DisableDialogsFloatingButton'},
  {section: SECTION_EXTERA, key: 'senderMiniAvatars', kind: 'bool', storeKey: 'OEAppearanceSenderMiniAvatars'},
  {section: SECTION_EXTERA, key: 'squareFab', kind: 'bool', storeKey: 'OEAppearanceSquareFab'},
  {section: SECTION_EXTERA, key: 'sectionsSeparatedHeaders', kind: 'bool', storeKey: 'OEAppearanceSeparateHeaders'},
  {section: SECTION_EXTERA, key: 'newChatHeaderStyle', kind: 'bool', storeKey: 'OEAppearanceNewChatHeaderStyle'},
  {section: SECTION_EXTERA, key: 'newLoadingStyle', kind: 'bool', storeKey: 'OEAppearanceNewLoadingStyle'},
  {section: SECTION_EXTERA, key: 'newNavigationBarStyle', kind: 'bool', storeKey: 'OEAppearanceNewNavigationBarStyle'},
  {section: SECTION_EXTERA, key: 'newSliderStyle', kind: 'bool', storeKey: 'SliderStyle', toEtg: (value) => value === 2, toOurs: (value) => value ? 2 : 0},
  {section: SECTION_EXTERA, key: 'newSwitchStyle', kind: 'bool', storeKey: 'SwitchStyle', toEtg: (value) => value >= 2, toOurs: (value) => value ? 3 : 0},
  {section: SECTION_EXTERA, key: 'customThemes', kind: 'bool', storeKey: 'OEAppearanceCustomThemes'},
  {section: SECTION_EXTERA, key: 'glassMessageMenu', kind: 'bool', storeKey: 'OEAppearanceGlassMessageMenu'},
  {section: SECTION_EXTERA, key: 'addCommaAfterMention', kind: 'bool', storeKey: 'OEAddCommaAfterMention'},
  {section: SECTION_EXTERA, key: 'removeMessageTail', kind: 'bool', storeKey: 'OEChatsRemoveMessageTail'},
  {section: SECTION_EXTERA, key: 'hideSendAsPeer', kind: 'bool', storeKey: 'hideSendAsChannel'},
  {section: SECTION_EXTERA, key: 'replyColors', kind: 'bool', storeKey: 'OEChatsReplyColors'},
  {section: SECTION_EXTERA, key: 'replyEmoji', kind: 'bool', storeKey: 'OEChatsReplyEmoji'},
  {section: SECTION_EXTERA, key: 'replyBackground', kind: 'bool', storeKey: 'OEChatsReplyBackground'},
  {section: SECTION_EXTERA, key: 'hideReactionsInPrivateChats', kind: 'bool', storeKey: 'OEChatsHideReactionsPrivate'},
  {section: SECTION_EXTERA, key: 'hideReactionsInChannels', kind: 'bool', storeKey: 'OEChatsHideReactionsChannels'},
  {section: SECTION_EXTERA, key: 'hideReactionsInGroups', kind: 'bool', storeKey: 'OEChatsHideReactionsGroups'},
  {section: SECTION_EXTERA, key: 'showResultsBeforeVoting', kind: 'bool', storeKey: 'OEChatsShowResultsBeforeVoting'},
  {section: SECTION_EXTERA, key: 'alwaysSendInHD', kind: 'bool', storeKey: 'OEChatsAlwaysSendInHD'},
  {section: SECTION_EXTERA, key: 'pauseOnMinimizeVoice', kind: 'bool', storeKey: 'OEChatsPauseVoice'},
  {section: SECTION_EXTERA, key: 'pauseOnMinimizeRound', kind: 'bool', storeKey: 'OEChatsPauseRound'},
  {section: SECTION_EXTERA, key: 'hideStickerTime', kind: 'bool', storeKey: 'HideTimeForSticker'},
  {section: SECTION_EXTERA, key: 'stickerSize', kind: 'float', min: 4, max: 20, storeKey: 'stickerSize'},
  {section: SECTION_EXTERA, key: 'stickerTimeMode', kind: 'int', min: 0, max: 2, storeKey: 'StickerTimeMode'},
  {section: SECTION_EXTERA, key: 'bottomButton', kind: 'int', min: 0, max: 2, storeKey: 'OEChatsBottomButton'},
  {section: SECTION_EXTERA, key: 'stickerShape', kind: 'int', min: 0, max: 2, storeKey: 'OEChatsStickerShape'},
  {section: SECTION_EXTERA, key: 'avatarCorners', kind: 'float', min: 0, max: 28, storeKey: 'OEAppearanceAvatarCorners'},
  {section: SECTION_EXTERA, key: 'sectionRadius', kind: 'float', min: 0, max: 28, storeKey: 'OEAppearanceSectionRadius'}
];

/**
 * The plugin flags with a web target travel inside the backup but live in the
 * plugin manager's own storage, not the settings store (PluginsConstants).
 */
const PLUGIN_FLAG_KEYS = ['pluginsSafeMode', 'pluginsDevMode'] as const;

const readPluginFlag = (key: typeof PLUGIN_FLAG_KEYS[number]): boolean =>
  key === 'pluginsSafeMode' ?
    pluginsManager.isSafeMode() :
    (() => {
      try {
        return globalThis.localStorage?.getItem(PLUGINS_DEVELOPER_MODE_KEY) === 'true';
      } catch(e) {
        return false;
      }
    })();

const applyPluginFlag = (key: typeof PLUGIN_FLAG_KEYS[number], value: boolean): void => {
  if(key === 'pluginsSafeMode') {
    pluginsManager.setSafeMode(value);
    return;
  }

  try {
    globalThis.localStorage?.setItem(PLUGINS_DEVELOPER_MODE_KEY, value ? 'true' : 'false');
  } catch(e) {}
};

export type ReadBackupResult = {
  root: Record<string, Record<string, unknown>>,
  /** keys the format knows, with a value of the right shape */
  knownCount: number,
  unsupported: string[]
};

export type ApplyResult = {
  applied: number,
  unsupported: string[]
};

const isExpected = (entry: SupportedEntry, value: unknown): boolean => {
  if(entry.kind === 'bool') return typeof value === 'boolean';
  if(entry.kind === 'string') return typeof value === 'string' && value.length <= 1024 * 1024;

  // * like the Android reader: ints are exact integers, floats are finite
  // * numbers, both inside the entry's range
  if(typeof value !== 'number' || !Number.isFinite(value)) return false;
  if(entry.kind === 'int' && !Number.isInteger(value)) return false;
  if(entry.min !== undefined && value < entry.min) return false;
  if(entry.max !== undefined && value > entry.max) return false;
  return true;
};

const sectionOf = (root: Record<string, Record<string, unknown>>, section: string): Record<string, unknown> | undefined => {
  const value = root[section];
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
};

export const etgBackup = {
  /** Builds a backup in the exteraGram format; `encrypt` wraps it in invisible characters. */
  buildBackup(encrypt: boolean, settings: ExteralessSettings): string {
    const root: Record<string, Record<string, unknown>> = {};
    for(const entry of SUPPORTED) {
      const ours = entry.storeKey === 'HideArchive' ? isArchiveHidden() :
        entry.storeKey === 'StickerTimeMode' ? getStickerTimeMode(settings) : settings[entry.storeKey];
      if(ours === undefined) continue;

      let value: unknown = ours;
      if(entry.kind === 'float') value = Number(ours);
      else if(entry.toEtg) {
        const mapped = entry.toEtg(Number(ours));
        if(mapped === null) continue;
        value = mapped;
      }

      (root[entry.section] ??= {})[entry.key] = value;
    }

    (root[SECTION_EXTERA] ??= {})['pluginsSafeMode'] = readPluginFlag('pluginsSafeMode');
    (root[SECTION_EXTERA] ??= {})['pluginsDevMode'] = readPluginFlag('pluginsDevMode');

    const json = JSON.stringify(root, null, 2);
    return encrypt ? invisibleEncryptor.encode(json) : json;
  },

  generateBackupName(): string {
    let suffix = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for(let i = 0; i < 4; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return `exterayond-${suffix}${EXTENSION}`;
  },

  /** Reads and decrypts a `.extera` body; plain JSON is accepted too. */
  readBackup(content: string): ReadBackupResult | null {
    try {
      const text = invisibleEncryptor.isEncrypted(content) ? invisibleEncryptor.decode(content) : content;
      const parsed = JSON.parse(text);
      if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

      const root = parsed as Record<string, Record<string, unknown>>;

      const known = new Map(SUPPORTED.map((entry) => [entry.key, entry]));
      const unsupportedSet = new Set<string>();
      let knownCount = 0;
      for(const sectionName of [SECTION_EXTERA, SECTION_PILLS, SECTION_MAIN]) {
        const section = sectionOf(root, sectionName);
        if(!section) continue;

        for(const key of Object.keys(section)) {
          const entry = known.get(key);
          if(entry) {
            // * a supported key counts once it has a value of the right shape,
            // * like the Android reader's countKnownKeys
            if(isExpected(entry, section[key])) {
              knownCount++;
            }
          } else if(KNOWN_UNSUPPORTED_KEYS.includes(key)) {
            unsupportedSet.add(key);
          }
        }
      }

      return {root, knownCount, unsupported: [...unsupportedSet]};
    } catch(e) {
      return null;
    }
  },

  /** Applies everything that passed validation; returns the count and the unsupported key names. */
  applyBackup(root: Record<string, Record<string, unknown>>, apply: (key: ExteralessSettingsKey, value: boolean | number) => void): ApplyResult {
    let applied = 0;
    const unsupported: string[] = [];

    for(const entry of SUPPORTED) {
      const section = sectionOf(root, entry.section);
      if(!section) continue;
      const value = section[entry.key];
      if(!isExpected(entry, value)) continue;

      if(entry.storeKey === 'HideArchive') {
        void setArchiveHidden(value as boolean);
        applied++;
        continue;
      }

      if(entry.storeKey === 'StickerTimeMode') {
        setStickerTimeMode(value as number, apply);
        applied++;
        continue;
      }

      if(entry.kind === 'bool') {
        apply(entry.storeKey, entry.toOurs ? entry.toOurs(Number(value)) : value as boolean);
        applied++;
        continue;
      }

      let numeric = value as number;
      if(entry.toOurs) {
        const mapped = entry.toOurs(numeric);
        if(mapped === null) {
          unsupported.push(entry.key);
          continue;
        }

        numeric = mapped;
      }

      // * The store kind decides the shape of a remapped numeric value.
      if(typeof OE_DEFAULTS[entry.storeKey] === 'boolean') {
        apply(entry.storeKey, numeric !== 0);
      } else {
        apply(entry.storeKey, clampExteralessSetting(entry.storeKey, numeric));
      }

      applied++;
    }

    // * the plugin flags: applied to the manager, counted like the rest
    const extera = sectionOf(root, SECTION_EXTERA);
    if(extera) {
      for(const key of PLUGIN_FLAG_KEYS) {
        const value = extera[key];
        if(typeof value === 'boolean') {
          applyPluginFlag(key, value);
          applied++;
        }
      }
    }
    for(const key of KNOWN_UNSUPPORTED_KEYS) {
      if(
        sectionOf(root, SECTION_EXTERA)?.[key] !== undefined ||
        sectionOf(root, SECTION_PILLS)?.[key] !== undefined ||
        sectionOf(root, SECTION_MAIN)?.[key] !== undefined
      ) {
        unsupported.push(key);
      }
    }

    return {applied, unsupported};
  }
};

// * ── the store-connected facade the hub uses ───────────────────────────────

export const buildExteraBackup = (encrypt: boolean): string =>
  etgBackup.buildBackup(encrypt, exteralessSettings as typeof OE_DEFAULTS & Record<string, boolean | number>);

export const applyExteraBackup = (root: Record<string, Record<string, unknown>>): ApplyResult =>
  etgBackup.applyBackup(root, (key, value) => setExteralessSetting(key, value as never));
