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

import {pluginsManager} from '@plugins/manager';
import {permissionStorage, PluginTrustLevel, trustLevel} from '@plugins/permissions';
import {pluginsRuntime} from '@plugins/runtime';

const makePlugin = (body: string) => [
  '__id__ = \'runtime_plugin\'',
  '__name__ = \'Runtime Plugin\'',
  '__permissions__ = [\'ui\', \'messages.read\', \'network\']',
  body
].join('\n');

describe('plugin runtime (the elyx facade)', () => {
  beforeEach(() => {
    (localStorage as unknown as {_data: Map<string, string>})._data.clear();
    pluginsManager.setSafeMode(false);
    // * the runtime keeps loaded instances in memory across records
    pluginsRuntime.unload('runtime_plugin');
  });

  it('loads a JS plugin and its menus pass the ui gate', () => {
    const install = pluginsManager.install('runtime_plugin.js', makePlugin(`
      elyx.menu.add({text: 'Say hi', onClick: () => window.__clicked = true});
    `));
    expect(install.ok).toBe(true);

    const result = pluginsRuntime.load('runtime_plugin');
    expect(result.ok).toBe(true);
    expect(pluginsRuntime.menuItemsFor()).toHaveLength(1);

    pluginsRuntime.menuItemsFor()[0].onClick();
    expect((window as any).__clicked).toBe(true);
  });

  it('a denied surface stays silent', () => {
    pluginsManager.install('runtime_plugin.js', makePlugin(`
      elyx.menu.add({text: 'x', onClick: () => {}});
      elyx.onAppEvent('START', () => {});
    `));
    // * ISOLATED: only ui survives, and events want messages.read
    trustLevel.setLevel('runtime_plugin', PluginTrustLevel.ISOLATED);
    pluginsRuntime.load('runtime_plugin');

    expect(pluginsRuntime.menuItemsFor()).toHaveLength(1);
    expect((pluginsRuntime.getInstance('runtime_plugin') as any).eventHandlers.get('START')).toBeUndefined();
  });

  it('the settings models and the store round-trip', () => {
    pluginsManager.install('runtime_plugin.js', makePlugin(`
      elyx.settings.set('answer', 42);
      elyx.base_plugin.createSettings([
        {type: 'switch', key: 'answer', text: 'Answer', default: false}
      ]);
    `));
    permissionStorage.setGranted('runtime_plugin', ['ui']);
    pluginsRuntime.load('runtime_plugin');

    expect(pluginsManager.getSettings('runtime_plugin').answer).toBe(42);
    expect(pluginsRuntime.getSettingsModels('runtime_plugin')).toEqual([
      {type: 'switch', key: 'answer', text: 'Answer', default: false}
    ]);
  });

  it('a throwing plugin strikes the watchdog and stays unloaded', () => {
    pluginsManager.install('runtime_plugin.js', '__id__ = "runtime_plugin"\n__name__ = "x"\nthrow new Error("boom")');
    const result = pluginsRuntime.load('runtime_plugin');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('boom');
    expect(pluginsRuntime.getInstance('runtime_plugin')).toBeUndefined();
  });

  it('safe mode and the global switch stop loads', () => {
    pluginsManager.install('runtime_plugin.js', makePlugin(''));
    pluginsManager.setSafeMode(true);
    expect(pluginsRuntime.load('runtime_plugin').error).toBe('safe mode');

    pluginsManager.setSafeMode(false);
    pluginsManager.setGloballyEnabled(false);
    expect(pluginsRuntime.load('runtime_plugin').ok).toBe(false);
    pluginsManager.setGloballyEnabled(true);
  });
});
