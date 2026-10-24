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
      OEAppearanceCustomThemes: true,
      OEChatsRemoveMessageTail: true,
      OEChatsHideCallButton: false,
      OEChatsHideChannelSearchButton: false,
      OEChatsStickerShape: 1,
      OEChatsStickerTimeSide: false,
      OEChatsShowResultsBeforeVoting: false,
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
  });

  test('boolean settings reject non-boolean values', async() => {
    const {clampExteralessSetting, OE_DEFAULTS} = await loadStore();
    expect(clampExteralessSetting('OEChatsHideCallButton', true)).toBe(true);
    expect(clampExteralessSetting('OEChatsHideCallButton', 1 as any)).toBe(OE_DEFAULTS.OEChatsHideCallButton);
    expect(clampExteralessSetting('OEChatsRemoveMessageTail', 'yes' as any)).toBe(OE_DEFAULTS.OEChatsRemoveMessageTail);
  });

  test('a persisted record is loaded back', async() => {
    localStorageStub.setItem(STORAGE_KEY, JSON.stringify({
      OEAppearanceAvatarCorners: 12,
      OEAppearanceSectionRadius: 0
    }));

    const {exteralessSettings} = await loadStore();
    expect(exteralessSettings.OEAppearanceAvatarCorners).toBe(12);
    expect(exteralessSettings.OEAppearanceSectionRadius).toBe(0);
  });

  test('a corrupt or untrusted record falls back to defaults and clamps', async() => {
    localStorageStub.setItem(STORAGE_KEY, JSON.stringify({
      OEAppearanceAvatarCorners: 500,
      OEAppearanceSectionRadius: 'not a number',
      OEChatsRemoveMessageTail: 'yes',
      somethingElse: true
    }));

    const {exteralessSettings} = await loadStore();
    expect(exteralessSettings.OEAppearanceAvatarCorners).toBe(28);
    expect(exteralessSettings.OEAppearanceSectionRadius).toBe(20);
    expect(exteralessSettings.OEChatsRemoveMessageTail).toBe(true);
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
});
