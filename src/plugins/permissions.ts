/**
 * The plugin permission model, ported from exteraless
 * `plugins/PluginPermissions.java` and `plugins/PluginTrustLevel.java`.
 *
 * The same honest boundary the Android model states: plugins run in the same
 * process and can reach the app directly, so the model makes a plugin's
 * intentions visible and limits accidental harm — it is not a wall against an
 * attacker. Storage keys match the Android ones (`plugin_perms_<id>`,
 * `plugin_level_<id>`) so grants travel with the same names.
 */
import {logger} from '@lib/logger';

const log = logger('plugins');

export const PERMISSION_UI = 'ui';
export const ALL_PERMISSIONS = [
  PERMISSION_UI,
  'messages.read',
  'messages.send',
  'network',
  'files',
  'intents',
  'settings',
  'hooks',
  'native'
] as const;

export type PluginPermission = (typeof ALL_PERMISSIONS)[number];

/** Everything but `ui` is asked of the user. */
export const REQUESTABLE_PERMISSIONS: readonly PluginPermission[] = ALL_PERMISSIONS.slice(1);

const KNOWN: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

/** Root permission: with `hooks` a plugin can technically do everything else. */
export const isDangerousPermission = (perm: string): boolean =>
  perm === 'hooks' || perm === 'native';

export const isKnownPermission = (perm: string | undefined): boolean =>
  !!perm && KNOWN.has(perm);

/** Short English text for logs and as the locale fallback. */
export const describePermission = (perm: string): string => {
  switch(perm) {
    case PERMISSION_UI: return 'user interface';
    case 'messages.read': return 'read messages and updates';
    case 'messages.send': return 'send, edit and delete messages';
    case 'network': return 'network access';
    case 'files': return 'files outside its own directory';
    case 'intents': return 'intercept links and intents';
    case 'settings': return 'app settings';
    case 'hooks': return 'Java hooks (full control)';
    case 'native': return 'load native libraries (full control)';
    default: return perm;
  }
};

/** Drop unknown keys and duplicates; keep the spec's order. */
export const sanitizePermissions = (perms: Iterable<string> | null | undefined): PluginPermission[] => {
  const out: PluginPermission[] = [];
  if(!perms) return out;
  const set = new Set(perms);
  for(const key of ALL_PERMISSIONS) {
    if(set.has(key)) out.push(key);
  }

  return out;
};

// * ── storage: same pref names as Android ────────────────────────────────────

const GRANTS_PREFIX = 'plugin_perms_';
const LEVEL_PREFIX = 'plugin_level_';

const readRaw = (key: string): string | null => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch(e) {
    return null;
  }
};

const writeRaw = (key: string, value: string | null): void => {
  try {
    if(value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
  } catch(e) {
    // * a blocked storage keeps the grants for the session
  }
};

export const permissionStorage = {
  hasRecord: (pluginId: string): boolean => readRaw(GRANTS_PREFIX + pluginId) !== null,

  /** The stored grants, or null when there is no record at all. */
  getStored: (pluginId: string): PluginPermission[] | null => {
    const raw = readRaw(GRANTS_PREFIX + pluginId);
    if(raw === null) return null;
    const out: PluginPermission[] = [];
    for(const part of raw.split(',')) {
      const key = part.trim();
      if(key.length && KNOWN.has(key) && !out.includes(key as PluginPermission)) {
        out.push(key as PluginPermission);
      }
    }

    return out;
  },

  /**
   * Writes the user's consent. A record appears even when empty — its presence
   * is what distinguishes a parsed plugin from one that never saw the prompt.
   */
  setGranted: (pluginId: string, perms: Iterable<string>): void => {
    const clean = sanitizePermissions(perms).filter((p) => p !== PERMISSION_UI);
    writeRaw(GRANTS_PREFIX + pluginId, clean.join(','));
  },

  clear: (pluginId: string): void => writeRaw(GRANTS_PREFIX + pluginId, null)
};

// * ── trust levels ───────────────────────────────────────────────────────────

export const PluginTrustLevel = {
  ISOLATED: 0,
  GATED: 1,
  TRUSTED: 2,
  /** New installs: rights come later, and consciously. */
  DEFAULT: 0
} as const;

export type PluginTrustLevelValue = (typeof PluginTrustLevel)[keyof typeof PluginTrustLevel];

const clampLevel = (value: number): PluginTrustLevelValue =>
  Math.max(PluginTrustLevel.ISOLATED, Math.min(PluginTrustLevel.TRUSTED, value)) as PluginTrustLevelValue;

export const trustLevel = {
  getLevel: (pluginId: string): PluginTrustLevelValue => {
    const raw = readRaw(LEVEL_PREFIX + pluginId);
    if(raw === null) return PluginTrustLevel.DEFAULT;
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? clampLevel(value) : PluginTrustLevel.DEFAULT;
  },

  setLevel: (pluginId: string, level: number): void => {
    writeRaw(LEVEL_PREFIX + pluginId, String(clampLevel(level)));
  },

  clear: (pluginId: string): void => writeRaw(LEVEL_PREFIX + pluginId, null)
};

/**
 * What a plugin really has, with the trust level applied: ISOLATED means UI
 * only whatever was granted; GATED loses `hooks` and `native` — the two
 * permissions that are the way out of the gate; only TRUSTED keeps them.
 */
export const getEffectivePermissions = (pluginId: string): PluginPermission[] => {
  const stored = permissionStorage.getStored(pluginId) ?? [];
  // * ui is implied and never stored; the list keeps the spec's order
  const raw = (permissionStorage.hasRecord(pluginId) ?
    [...stored, PERMISSION_UI] :
    [PERMISSION_UI]).filter((p, i, a) => a.indexOf(p) === i)
    .sort((a, b) => ALL_PERMISSIONS.indexOf(a as PluginPermission) - ALL_PERMISSIONS.indexOf(b as PluginPermission)) as PluginPermission[];

  const level = trustLevel.getLevel(pluginId);
  if(level === PluginTrustLevel.ISOLATED) {
    return [PERMISSION_UI];
  }

  if(level !== PluginTrustLevel.TRUSTED) {
    return raw.filter((p) => p !== 'hooks' && p !== 'native') as PluginPermission[];
  }

  return raw as PluginPermission[];
};

export const hasEffectivePermission = (pluginId: string, perm: PluginPermission): boolean =>
  getEffectivePermissions(pluginId).includes(perm);

// * ── the check every facade call passes through ─────────────────────────────

const loggedDenials = new Set<string>();

/** One log line per (plugin, perm) pair — the check sits on hot paths. */
export const checkPermission = (pluginId: string, perm: PluginPermission): boolean => {
  if(hasEffectivePermission(pluginId, perm)) return true;

  const key = pluginId + '|' + perm;
  if(!loggedDenials.has(key)) {
    loggedDenials.add(key);
    log.warn(`denied ${perm} to ${pluginId}`);
  }

  return false;
};

export const resetDenialLog = (pluginId: string): void => {
  for(const key of [...loggedDenials]) {
    if(key.startsWith(pluginId + '|')) loggedDenials.delete(key);
  }
};
