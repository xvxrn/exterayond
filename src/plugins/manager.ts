/**
 * The plugin manager — the web port of exteraless `plugins/PluginsController`
 * storage responsibilities: records, payloads, enable/disable, install and
 * uninstall, safe mode with the watchdog's strike counter. Runtime keys match
 * the Android prefs names so `.extera` flags and grants travel unchanged.
 */
import {readPluginMetadata} from './metadata';
import type {PluginMetadata} from './metadata';
import {
  PERMISSION_UI,
  permissionStorage,
  resetDenialLog,
  trustLevel
} from './permissions';
import {logger} from '@lib/logger';

const log = logger('plugins');

export const PLUGINS_ENABLED_KEY = 'pluginsEnabled';
export const PLUGINS_SAFE_MODE_KEY = 'pluginsSafeMode';
export const PLUGINS_DEVELOPER_MODE_KEY = 'pluginsDeveloperMode';
export const PLUGINS_SAFE_MODE_AUTO_KEY = 'pluginsSafeModeAuto';
export const WATCHDOG_STRIKES_PREFIX = 'watchdog_strikes_';
/** Three loading crashes in a row trip safe mode, like the Android watchdog. */
const WATCHDOG_STRIKES_LIMIT = 3;

export const ENGINE_PYTHON = 'python';
export const ENGINE_JS = 'js';

export type PluginEngine = typeof ENGINE_PYTHON | typeof ENGINE_JS;

export type PluginRecord = PluginMetadata & {
  /** What the payload runs as: `.plugin`/`.py` stay Python, `.js` runs here. */
  engine: PluginEngine,
  /** The file name the plugin was installed from. */
  fileName: string,
  enabled: boolean,
  /** The last load/validation error; null when everything is fine. */
  loadError?: string,
  /** Python payloads are surfaced as unsupported, never faked. */
  unsupportedReason?: string
};

const RECORDS_KEY = 'exterayond-plugins';
const PAYLOAD_PREFIX = 'plugin_payload_';
const SETTINGS_PREFIX = 'plugin_settings_';
const ENABLED_PREFIX = 'plugin_enabled_';

const readJSON = <T>(key: string): T | null => {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch(e) {
    return null;
  }
};

const writeJSON = (key: string, value: unknown): void => {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch(e) {
    // * a full or blocked storage keeps the records for the session
  }
};

const detectEngine = (fileName: string): PluginEngine =>
  fileName.toLowerCase().endsWith('.js') ? ENGINE_JS : ENGINE_PYTHON;

/**
 * Python plugins need a Python runtime the browser does not have: their
 * metadata is read (the contract's formats stay inspectable) but the payload
 * is stored unloaded and the plugin surfaces as unsupported — never faked.
 */
export const PYTHON_UNSUPPORTED_REASON = 'Python plugins do not run in the browser';

export const pluginsManager = {
  isGloballyEnabled(): boolean {
    try {
      return (globalThis.localStorage?.getItem(PLUGINS_ENABLED_KEY) ?? 'true') !== 'false';
    } catch(e) {
      return true;
    }
  },

  setGloballyEnabled(enabled: boolean): void {
    try {
      globalThis.localStorage?.setItem(PLUGINS_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch(e) {}
  },

  isSafeMode(): boolean {
    try {
      return globalThis.localStorage?.getItem(PLUGINS_SAFE_MODE_KEY) === 'true';
    } catch(e) {
      return false;
    }
  },

  setSafeMode(on: boolean): void {
    try {
      globalThis.localStorage?.setItem(PLUGINS_SAFE_MODE_KEY, on ? 'true' : 'false');
      if(!on) globalThis.localStorage?.setItem(PLUGINS_SAFE_MODE_AUTO_KEY, 'false');
    } catch(e) {}
  },

  getRecords(): PluginRecord[] {
    return readJSON<PluginRecord[]>(RECORDS_KEY) ?? [];
  },

  getRecord(id: string): PluginRecord | undefined {
    return this.getRecords().find((record) => record.id === id);
  },

  privatePutRecord(record: PluginRecord): void {
    const records = this.getRecords().filter((r) => r.id !== record.id);
    records.push(record);
    writeJSON(RECORDS_KEY, records);
  },

  getPayload(id: string): string | null {
    try {
      return globalThis.localStorage?.getItem(PAYLOAD_PREFIX + id) ?? null;
    } catch(e) {
      return null;
    }
  },

  /**
   * Installs one `.plugin`/`.py`/`.js` payload: metadata is parsed statically,
   * the id is the identity, a re-install of the same id replaces the file.
   */
  // * a flat result: this project compiles with strictNullChecks off, where
  // * union narrowing does not fire
  install(fileName: string, source: string): {ok: boolean, record?: PluginRecord, error?: string} {
    const parsed = readPluginMetadata(source);
    if(!parsed.ok) {
      return {ok: false, error: parsed.error ?? 'invalid metadata'};
    }

    const engine = detectEngine(fileName);
    const record: PluginRecord = {
      ...parsed.meta,
      engine,
      fileName,
      enabled: true,
      ...(engine === ENGINE_PYTHON ? {unsupportedReason: PYTHON_UNSUPPORTED_REASON} : {})
    };

    try {
      globalThis.localStorage?.setItem(PAYLOAD_PREFIX + record.id, source);
      globalThis.localStorage?.setItem(ENABLED_PREFIX + record.id, 'true');
    } catch(e) {
      return {ok: false, error: 'storage refused the payload'};
    }

    this.privatePutRecord(record);
    return {ok: true, record};
  },

  isEnabled(id: string): boolean {
    try {
      return (globalThis.localStorage?.getItem(ENABLED_PREFIX + id) ?? 'true') !== 'false';
    } catch(e) {
      return true;
    }
  },

  setEnabled(id: string, enabled: boolean): void {
    try {
      globalThis.localStorage?.setItem(ENABLED_PREFIX + id, enabled ? 'true' : 'false');
    } catch(e) {}
    const record = this.getRecord(id);
    if(record) {
      record.enabled = enabled;
      this.privatePutRecord(record);
    }
  },

  /** Removes the record, the payload, the grants, the level and the settings. */
  uninstall(id: string): void {
    const records = this.getRecords().filter((r) => r.id !== id);
    writeJSON(RECORDS_KEY, records);
    try {
      globalThis.localStorage?.removeItem(PAYLOAD_PREFIX + id);
      globalThis.localStorage?.removeItem(ENABLED_PREFIX + id);
      globalThis.localStorage?.removeItem(SETTINGS_PREFIX + id);
      globalThis.localStorage?.removeItem(WATCHDOG_STRIKES_PREFIX + id);
    } catch(e) {}
    permissionStorage.clear(id);
    trustLevel.clear(id);
    resetDenialLog(id);
  },

  // * ── per-plugin settings (the facade's store) ─────────────────────────────

  getSettings(id: string): Record<string, unknown> {
    return readJSON<Record<string, unknown>>(SETTINGS_PREFIX + id) ?? {};
  },

  setSetting(id: string, key: string, value: unknown): void {
    const settings = this.getSettings(id);
    settings[key] = value;
    writeJSON(SETTINGS_PREFIX + id, settings);
  },

  // * ── the watchdog: loading crashes strike, the third trips safe mode ──────

  reportCrash(id: string): void {
    let strikes = 0;
    try {
      strikes = parseInt(globalThis.localStorage?.getItem(WATCHDOG_STRIKES_PREFIX + id) ?? '0', 10) || 0;
      globalThis.localStorage?.setItem(WATCHDOG_STRIKES_PREFIX + id, String(strikes + 1));
    } catch(e) {}
    log.error(`plugin ${id} crashed loading (strike ${strikes + 1})`);
    if(strikes + 1 >= WATCHDOG_STRIKES_LIMIT) {
      log.error('tripping safe mode');
      this.setSafeMode(true);
      try {
        globalThis.localStorage?.setItem(PLUGINS_SAFE_MODE_AUTO_KEY, 'true');
      } catch(e) {}
    }
  },

  clearStrikes(id: string): void {
    try {
      globalThis.localStorage?.setItem(WATCHDOG_STRIKES_PREFIX + id, '0');
    } catch(e) {}
  }
};

/** The permission set shown at install time: what the plugin declares, cleaned. */
export const declaredPermissionsOf = (record: PluginRecord): string[] =>
  record.permissions_declared ? record.permissions : [PERMISSION_UI];
