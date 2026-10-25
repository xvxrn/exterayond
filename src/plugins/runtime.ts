/**
 * The plugin runtime — the web face of the `elyx_runtime` facade. Plugins are
 * plain JS speaking the contract's names (base_plugin, on_app_event,
 * create_settings, ui/alert, ui/bulletin, plugin settings); every surface
 * passes the permission check, the way the Android SDK's gates do. The
 * documented web extension points here: app events, the message context menu,
 * bulletins and alerts, and the per-plugin settings store.
 */
import {
  ALL_PERMISSIONS,
  checkPermission
} from './permissions';
import type {PluginPermission} from './permissions';
import {
  ENGINE_JS,
  ENGINE_PYTHON,
  pluginsManager
} from './manager';
import type {PluginRecord} from './manager';
import {logger} from '@lib/logger';

const log = logger('plugins');

export type MenuItemData = {
  icon?: string,
  text: string,
  onClick: () => void,
  /** destructive items render red, like the Android menu's red option */
  red?: boolean
};

export type AppEventName = 'START' | 'STOP' | 'PAUSE' | 'RESUME';

type PluginInstance = {
  record: PluginRecord,
  settingsModels: unknown[],
  menuItems: MenuItemData[],
  eventHandlers: Map<AppEventName, Set<() => void>>
};

const instances = new Map<string, PluginInstance>();

const notifyMenuChange = (): void => {
  for(const callback of menuChangeListeners) callback();
};

const menuChangeListeners = new Set<() => void>();

/** The object handed to a plugin's code as `elyx`. */
const buildFacade = (instance: PluginInstance) => {
  const id = instance.record.id;
  const gate = (perm: PluginPermission): boolean => checkPermission(id, perm);

  return {
    base_plugin: {
      /** `create_settings()` returns the settings model the hub renders. */
      createSettings(models: unknown[]): void {
        instance.settingsModels = Array.isArray(models) ? models : [];
      },
      onPluginLoad(callback: () => void): void {
        if(gate('ui')) setTimeout(callback, 0);
      },
      onPluginUnload(callback: () => void): void {
        if(gate('ui')) instanceUnloadCallbacks.add(callback);
      }
    },

    onAppEvent(event: AppEventName, callback: () => void): void {
      if(!gate('messages.read')) return;
      let set = instance.eventHandlers.get(event);
      if(!set) instance.eventHandlers.set(event, set = new Set());
      set.add(callback);
    },

    menu: {
      /** A message context-menu item; `ui` covers it, like on Android. */
      add(item: MenuItemData): void {
        if(!gate('ui') || !item || typeof item.text !== 'string' || typeof item.onClick !== 'function') {
          return;
        }
        instance.menuItems.push(item);
        notifyMenuChange();
      },
      clear(): void {
        instance.menuItems = [];
        notifyMenuChange();
      }
    },

    ui: {
      /** `ui/alert` — the AlertDialogBuilder stand-in. */
      alert(text: string, options?: {title?: string, onConfirm?: () => void}): void {
        if(!gate('ui')) return;
        const result = window.confirm(options?.title ? `${options.title}\n\n${text}` : text);
        if(result) options?.onConfirm?.();
      },
      /** `ui/bulletin` — a bulletin is the web's toast. */
      bulletin(text: string): void {
        if(!gate('ui')) return;
        void import('@components/toast').then(({toast}) => toast(text));
      }
    },

    settings: {
      get(key: string): unknown {
        return pluginsManager.getSettings(id)[key];
      },
      set(key: string, value: unknown): void {
        pluginsManager.setSetting(id, key, value);
      }
    },

    network: {
      /** `send_request` — fetch under the plugin's network permission. */
      async request(url: string, options?: RequestInit): Promise<Response | undefined> {
        if(!gate('network')) return undefined;
        try {
          return await fetch(url, options);
        } catch(e) {
          log.error(`request failed for ${id}`, e);
          return undefined;
        }
      }
    }
  };
};

const instanceUnloadCallbacks = new Set<() => void>();

const dispatchEvent = (event: AppEventName): void => {
  for(const instance of instances.values()) {
    instance.eventHandlers.get(event)?.forEach((callback) => {
      try {
        callback();
      } catch(e) {
        log.error(`event handler failed for ${instance.record.id}`, e);
      }
    });
  }
};

export const pluginsRuntime = {
  /** Whether the plugin can load at all: global switch, safe mode, record. */
  canLoad(record: PluginRecord): boolean {
    if(!pluginsManager.isGloballyEnabled()) return false;
    if(pluginsManager.isSafeMode()) return false;
    if(!pluginsManager.isEnabled(record.id)) return false;
    if(record.engine !== ENGINE_JS) return false;
    return true;
  },

  load(id: string): {ok: boolean, error?: string} {
    const record = pluginsManager.getRecord(id);
    if(!record) return {ok: false, error: 'not installed'};
    if(record.engine === ENGINE_PYTHON) {
      return {ok: false, error: record.unsupportedReason ?? 'unsupported engine'};
    }
    if(!this.canLoad(record)) {
      return {ok: false, error: pluginsManager.isSafeMode() ? 'safe mode' : 'disabled'};
    }

    const payload = pluginsManager.getPayload(id);
    if(payload === null) return {ok: false, error: 'no payload'};

    const instance: PluginInstance = {
      record,
      settingsModels: [],
      menuItems: [],
      eventHandlers: new Map()
    };

    try {
      // * the same honest boundary as the Android SDK: same process, visible
      // * intentions, no wall against a hostile author. The dunder metadata
      // * block stays in the payload (it is ordinary assignment syntax); make
      // * the assignments declarations so strict mode keeps them legal
      const code = `"use strict";\n${payload.replace(/^(__(\w+)__\s*=)/gm, 'var $1')}`;
      const factory = new Function('elyx', code);
      factory(buildFacade(instance));
      instances.set(id, instance);
      pluginsManager.clearStrikes(id);
      notifyMenuChange();
      return {ok: true};
    } catch(e) {
      const error = (e as Error)?.message ?? String(e);
      log.error(`load failed for ${id}`, e);
      pluginsManager.reportCrash(id);
      return {ok: false, error};
    }
  },

  unload(id: string): void {
    const instance = instances.get(id);
    if(!instance) return;
    instance.menuItems = [];
    instance.eventHandlers.clear();
    instances.delete(id);
    const callbacks = [...instanceUnloadCallbacks];
    instanceUnloadCallbacks.clear();
    callbacks.forEach((callback) => {
      try {
        callback();
      } catch(e) {}
    });
    notifyMenuChange();
  },

  /** Reloads every enabled JS plugin (the boot path and safe-mode recovery). */
  loadAll(): void {
    for(const record of pluginsManager.getRecords()) {
      if(record.engine !== ENGINE_JS) continue;
      const result = this.load(record.id);
      if(!result.ok) {
        log.warn(`not loaded: ${record.id} (${result.error})`);
      }
    }
  },

  getInstance(id: string): PluginInstance | undefined {
    return instances.get(id);
  },

  getSettingsModels(id: string): unknown[] {
    return instances.get(id)?.settingsModels ?? [];
  },

  /**
   * The message context menu's extension point: the items of every loaded
   * plugin with the `ui` permission, in install order.
   */
  menuItemsFor(): MenuItemData[] {
    const items: MenuItemData[] = [];
    for(const instance of instances.values()) {
      items.push(...instance.menuItems);
    }

    return items;
  },

  onMenuChange(callback: () => void): () => void {
    menuChangeListeners.add(callback);
    return () => menuChangeListeners.delete(callback);
  },

  appEvent(event: AppEventName): void {
    dispatchEvent(event);
  },

  /** The permission keys, re-exported for the install dialog. */
  ALL_PERMISSIONS
};
