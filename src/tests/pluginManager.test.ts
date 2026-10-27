import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.hoisted(() => {
  vi.stubGlobal('localStorage', {
    _data: new Map<string, string>(),
    getItem(this: {_data: Map<string, string>}, k: string): string | null {
      return this._data.get(k) ?? null;
    },
    setItem(this: {_data: Map<string, string>}, k: string, v: string): void {
      this._data.set(k, v);
    },
    removeItem(this: {_data: Map<string, string>}, k: string): void {
      this._data.delete(k);
    },
    clear(this: {_data: Map<string, string>}): void {
      this._data.clear();
    }
  } as unknown as Storage);
});

import {pluginsManager, PYTHON_UNSUPPORTED_REASON} from '@plugins/manager';
import {
  getEffectivePermissions,
  permissionStorage,
  PluginTrustLevel,
  trustLevel,
  checkPermission
} from '@plugins/permissions';

const PY_PLUGIN = [
  '__id__ = \'example_plugin\'',
  '__name__ = \'Example Plugin\'',
  '__permissions__ = [\'ui\', \'messages.read\', \'network\']',
  'def on_plugin_load(): pass'
].join('\n');

const JS_PLUGIN = [
  '__id__ = \'js_plugin\'',
  '__name__ = \'JS Plugin\'',
  '__permissions__ = [\'ui\']',
  'elyx.onAppEvent("START", () => {})'
].join('\n');

describe('plugin manager and permissions', () => {
  beforeEach(() => {
    (localStorage as unknown as {_data: Map<string, string>})._data.clear();
  });

  it('installs a plugin from its source and replaces by id', () => {
    const first = pluginsManager.install('example_plugin.plugin', PY_PLUGIN);
    expect(first.ok).toBe(true);
    expect(first.record?.name).toBe('Example Plugin');

    const again = pluginsManager.install('renamed.py', PY_PLUGIN.replace('\'Example Plugin\'', '\'Example Plugin v2\''));
    if(!again.ok) throw new Error(again.error);
    expect(pluginsManager.getRecords()).toHaveLength(1);
    expect(pluginsManager.getRecord('example_plugin')?.name).toBe('Example Plugin v2');
  });

  it('surfaces Python payloads as unsupported without hiding their metadata', () => {
    const result = pluginsManager.install('botile.plugin', PY_PLUGIN);
    expect(result.ok).toBe(true);
    expect(result.record?.engine).toBe('python');
    expect(result.record.unsupportedReason).toBe(PYTHON_UNSUPPORTED_REASON);
    expect(result.record.permissions).toContain('network');
  });

  it('keeps grants, levels and settings keyed like Android', () => {
    const result = pluginsManager.install('js_plugin.js', JS_PLUGIN);
    expect(result.ok).toBe(true);

    permissionStorage.setGranted('js_plugin', ['ui', 'messages.read']);
    expect(permissionStorage.hasRecord('js_plugin')).toBe(true);
    expect(localStorage.getItem('plugin_perms_js_plugin')).toBe('messages.read');

    trustLevel.setLevel('js_plugin', PluginTrustLevel.TRUSTED);
    expect(localStorage.getItem('plugin_level_js_plugin')).toBe('2');

    pluginsManager.setSetting('js_plugin', 'showBadge', true);
    expect(pluginsManager.getSettings('js_plugin')).toEqual({showBadge: true});
  });

  it('the trust level clamps the effective permissions', () => {
    pluginsManager.install('clamped.js', JS_PLUGIN);
    permissionStorage.setGranted('clamped', ['ui', 'messages.read', 'hooks', 'native']);

    trustLevel.setLevel('clamped', PluginTrustLevel.ISOLATED);
    expect(getEffectivePermissions('clamped')).toEqual(['ui']);

    trustLevel.setLevel('clamped', PluginTrustLevel.GATED);
    expect(getEffectivePermissions('clamped')).toEqual(['ui', 'messages.read']);

    trustLevel.setLevel('clamped', PluginTrustLevel.TRUSTED);
    expect(getEffectivePermissions('clamped')).toContain('hooks');
  });

  it('no consent record means ui-only, even with granted keys in the file', () => {
    pluginsManager.install('no_record.js', JS_PLUGIN);
    expect(getEffectivePermissions('no_record')).toEqual(['ui']);
    expect(checkPermission('no_record', 'ui')).toBe(true);
    expect(checkPermission('no_record', 'messages.read')).toBe(false);
  });

  it('the watchdog trips safe mode on the third crash', () => {
    pluginsManager.install('crasher.js', JS_PLUGIN);
    pluginsManager.reportCrash('crasher');
    pluginsManager.reportCrash('crasher');
    expect(pluginsManager.isSafeMode()).toBe(false);
    pluginsManager.reportCrash('crasher');
    expect(pluginsManager.isSafeMode()).toBe(true);
    expect(localStorage.getItem('pluginsSafeModeAuto')).toBe('true');
  });

  it('uninstall removes everything the plugin owned', () => {
    pluginsManager.install('gone.js', JS_PLUGIN);
    permissionStorage.setGranted('gone', ['ui', 'network']);
    trustLevel.setLevel('gone', PluginTrustLevel.GATED);
    pluginsManager.setSetting('gone', 'k', 1);

    pluginsManager.uninstall('gone');

    expect(pluginsManager.getRecord('gone')).toBeUndefined();
    expect(localStorage.getItem('plugin_payload_gone')).toBeNull();
    expect(localStorage.getItem('plugin_perms_gone')).toBeNull();
    expect(localStorage.getItem('plugin_level_gone')).toBeNull();
    expect(localStorage.getItem('plugin_settings_gone')).toBeNull();
  });
});
