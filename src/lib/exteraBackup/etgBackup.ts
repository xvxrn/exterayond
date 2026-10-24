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
import {OE_DEFAULTS, clampExteralessSetting, exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';
import type {ExteralessSettingsKey} from '@stores/exteralessSettings';
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
  /** the store setting this key carries */
  storeKey: ExteralessSettingsKey,
  /** int keys with different numbering: our value ↔ exteraGram's */
  toEtg?: (ours: number) => number | null,
  toOurs?: (etg: number) => number | null
};

/** The Android key set the format carries beyond the web's reach: recognized, reported, never applied. */
export const KNOWN_UNSUPPORTED_KEYS: string[] = [
  // exteraconfig (Neko/Na/Android-bound targets)
  'disableNumberRounding', 'formatTimeWithSeconds', 'filterZalgo', 'uploadSpeedBoost',
  'hidePhoneNumber', 'hideArchiveFolder', 'archiveOnPull', 'disableUnarchiveSwipe',
  'doNotUseProxy', 'centerTitle', 'hideStories', 'hideFloatingButton',
  'hideDialogsSearchBar', 'hideAllChats', 'newLoadingStyle', 'newNavigationBarStyle',
  'iosNavigationBarStyle', 'iosChatHeader', 'profileMusicCard', 'useSystemFonts',
  'gooeyAvatarAnimation', 'navigationDrawer', 'immersiveDrawerAnimation', 'showFeedTab',
  'hideStickerTime', 'disableGreetingSticker', 'hideKeyboardOnScroll', 'inlineMathResult',
  'hideSendAsPeer', 'replaceEditedWithIcon', 'showOnlineStatus', 'hideShareButton',
  'wideChannelPosts', 'wideFeedPosts', 'showCopyPhotoButton', 'showSaveMessageButton',
  'showRepeatMessageButton', 'showClearButton', 'showHistoryButton', 'showReportButton',
  'showDetailsButton', 'groupMessageMenu', 'extendedFramesPerSecond', 'cameraStabilization',
  'cameraMirrorMode', 'rememberLastUsedCamera', 'startWithWideAngleCamera', 'staticZoom',
  'hideCameraTile', 'preferOriginalQuality', 'swipeToPip', 'unmuteWithVolumeButtons',
  'pauseOnMinimizeVideo', 'useSystemIconShape', 'infiniteScrolling', 'useGoogleCrashlytics',
  'inAppVibration', 'titleText', 'downloadSpeedBoost', 'tabletMode', 'glassOutlineStyle',
  'stickerShape', 'doubleTapSeekDuration', 'cameraType', 'videoMessagesCamera',
  'translationProvider', 'tabIcons', 'doubleTapAction', 'doubleTapActionOutOwner',
  'predictiveBackIntensity', 'flashWarmth', 'flashIntensity', 'stickerSize',
  'newSliderStyle', 'newSwitchStyle', 'dividerStyle', 'bottomNavigationBarMode',
  'unlimitedRecentStickers', 'quickAdminShortcuts', 'mainMenuLayout', 'mainMenuHiddenItems',
  'tabCounter', 'targetLang',
  // plugins travel separately but the .extera may carry their flags
  'pluginsSafeMode', 'pluginsDevMode', 'pluginsCompactView', 'pluginsDisableArtOpts',
  // mainconfig (NagramX)
  'ChatSwipeAction', 'mediaColumnsCount', 'bubbleRadius', 'fons_size'
];

const SUPPORTED: SupportedEntry[] = [
  {section: SECTION_EXTERA, key: 'relativeLastSeen', kind: 'bool', storeKey: 'OERelativeLastSeen'},
  {section: SECTION_EXTERA, key: 'singleCornerRadius', kind: 'bool', storeKey: 'OEAppearanceSingleCornerRadius'},
  {section: SECTION_EXTERA, key: 'hideActionBarStatus', kind: 'bool', storeKey: 'OEAppearanceHideActionBarStatus'},
  {section: SECTION_EXTERA, key: 'senderMiniAvatars', kind: 'bool', storeKey: 'OEAppearanceSenderMiniAvatars'},
  {section: SECTION_EXTERA, key: 'squareFab', kind: 'bool', storeKey: 'OEAppearanceSquareFab'},
  {section: SECTION_EXTERA, key: 'sectionsSeparatedHeaders', kind: 'bool', storeKey: 'OEAppearanceSeparateHeaders'},
  {section: SECTION_EXTERA, key: 'newChatHeaderStyle', kind: 'bool', storeKey: 'OEAppearanceNewChatHeaderStyle'},
  {section: SECTION_EXTERA, key: 'customThemes', kind: 'bool', storeKey: 'OEAppearanceCustomThemes'},
  {section: SECTION_EXTERA, key: 'glassMessageMenu', kind: 'bool', storeKey: 'OEAppearanceGlassMessageMenu'},
  {section: SECTION_EXTERA, key: 'addCommaAfterMention', kind: 'bool', storeKey: 'OEAddCommaAfterMention'},
  {section: SECTION_EXTERA, key: 'removeMessageTail', kind: 'bool', storeKey: 'OEChatsRemoveMessageTail'},
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
  {
    section: SECTION_EXTERA, key: 'stickerTimeMode', kind: 'int', min: 0, max: 2,
    storeKey: 'OEChatsStickerTimeSide',
    // * web holds the bool half of the Android three modes: 0 overlay, 1 side,
    // * 2 hidden (NagramX's half — no web target)
    toOurs: (etg) => etg === 2 ? null : (etg === 1 ? 1 : 0),
    toEtg: (ours) => ours ? 1 : 0
  },
  {section: SECTION_EXTERA, key: 'bottomButton', kind: 'int', min: 0, max: 2, storeKey: 'OEChatsBottomButton'},
  {section: SECTION_EXTERA, key: 'avatarCorners', kind: 'float', min: 0, max: 28, storeKey: 'OEAppearanceAvatarCorners'},
  {section: SECTION_EXTERA, key: 'sectionRadius', kind: 'float', min: 0, max: 28, storeKey: 'OEAppearanceSectionRadius'}
];

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
  buildBackup(encrypt: boolean, settings: typeof OE_DEFAULTS & Record<string, boolean | number>): string {
    const root: Record<string, Record<string, unknown>> = {};
    for(const entry of SUPPORTED) {
      const ours = settings[entry.storeKey];
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

    const json = JSON.stringify(root, null, 2);
    return encrypt ? invisibleEncryptor.encode(json) : json;
  },

  generateBackupName(): string {
    let suffix = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for(let i = 0; i < 4; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return `exteraless-${suffix}${EXTENSION}`;
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

      if(entry.kind === 'bool') {
        apply(entry.storeKey, value as boolean);
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

      // * a remapped key can land on a boolean setting (stickerTimeMode →
      // * stickerTimeSide): the store kind decides the shape
      if(typeof OE_DEFAULTS[entry.storeKey] === 'boolean') {
        apply(entry.storeKey, numeric !== 0);
      } else {
        apply(entry.storeKey, clampExteralessSetting(entry.storeKey, entry.kind === 'float' ? Math.round(numeric) : numeric));
      }

      applied++;
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
