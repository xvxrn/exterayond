/**
 * Ghost Mode (packets 081–082): the suppression decisions of
 * `@lib/exterayondGhost` against the pinned Android contracts
 * (`NekoConfig`'s ghost block and `AyuGhostUtils.interceptRequest` @8b7ec40),
 * the settings store's push of the flags into the worker, and source
 * contracts pinning the manager gates.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {
  applyGhostMode,
  ghostBlocksTyping,
  ghostModeTarget,
  ghostOfflineAfterSendApplies,
  ghostReadAfterSendApplies,
  ghostStatusToAnnounce,
  ghostSuppressesReadReceipts,
  ghostSuppressesStoryReads,
  GHOST_ESSENTIAL_KEYS,
  GHOST_FLAG_DEFAULTS,
  GHOST_OFFLINE_AFTER_SEND_DELAY,
  isFlagInGhostState,
  isGhostModeActive,
  setExterayondGhostFlags,
  getExterayondGhostFlags,
  type ExterayondGhostFlags,
  type ExterayondGhostSendMethod
} from '@lib/exterayondGhost';

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

// * the store and the rootScope must come from one module graph: every test
// * re-evaluates both, so the store's listeners land on the test's rootScope
const loadFresh = async() => {
  vi.resetModules();
  const store = await import('@stores/exterayondSettings');
  const {default: rootScope} = await import('@lib/rootScope');
  // * rootScope forwards dispatched events through the worker port; in the
  // * test environment the port is a no-op shell (appCommunitiesManager.test's
  // * pattern), spied on the same fresh module instance the rootScope uses
  const {default: MTProtoMessagePort} = await import('@lib/mainWorker/mainMessagePort');
  vi.spyOn(MTProtoMessagePort, 'getInstance').mockReturnValue({invokeVoid: vi.fn()} as any);
  return {store, rootScope};
};

describe('the Ghost Mode decisions (NekoConfig ghost block)', () => {
  it('defaults are stock: every packet sends (markReadAfterSend standalone-defaults on like Android)', () => {
    expect(GHOST_FLAG_DEFAULTS).toEqual({
      sendReadMessagePackets: true,
      sendReadStoriesPackets: true,
      sendOnlinePackets: true,
      sendUploadProgress: true,
      sendOfflinePacketAfterOnline: false,
      markReadAfterSend: true
    });
    // * the master toggle's item list stays the five essentials — GHOST-07 is
    // * a standalone config outside ghostToggleItems, like Android's
    expect(GHOST_ESSENTIAL_KEYS).not.toContain('markReadAfterSend');
  });

  it('the ghost state of each flag follows Android\'s (key == offlineAfterOnline) == value', () => {
    expect(isFlagInGhostState('sendReadMessagePackets', false)).toBe(true);
    expect(isFlagInGhostState('sendReadMessagePackets', true)).toBe(false);
    expect(isFlagInGhostState('sendOfflinePacketAfterOnline', true)).toBe(true);
    expect(isFlagInGhostState('sendOfflinePacketAfterOnline', false)).toBe(false);
  });

  it('isGhostModeActive is true exactly when every unlocked essential sits in its ghost state', () => {
    const ghost: ExterayondGhostFlags = {
      sendReadMessagePackets: false,
      sendReadStoriesPackets: false,
      sendOnlinePackets: false,
      sendUploadProgress: false,
      sendOfflinePacketAfterOnline: true,
      markReadAfterSend: true
    };
    expect(isGhostModeActive(ghost)).toBe(true);

    // * one deviation each — including the offline-after-online flag whose
    // * ghost value is inverted — deactivates the mode
    for(const key of GHOST_ESSENTIAL_KEYS) {
      const deviating = {...ghost, [key]: !ghost[key]} as ExterayondGhostFlags;
      expect(isGhostModeActive(deviating), key).toBe(false);
    }
  });

  it('locked flags are skipped by the active check (NekoConfig.isGhostModeActive)', () => {
    const stock = {...GHOST_FLAG_DEFAULTS};
    // * every flag locked in its non-ghost value: the mode still reads active
    const allLocked = {
      sendReadMessagePackets: true,
      sendReadStoriesPackets: true,
      sendOnlinePackets: true,
      sendUploadProgress: true,
      sendOfflinePacketAfterOnline: true
    };
    expect(isGhostModeActive(stock, allLocked)).toBe(true);
    // * one unlocked deviation decides
    expect(isGhostModeActive(stock, {
      sendReadMessagePackets: true,
      sendReadStoriesPackets: true,
      sendOnlinePackets: true,
      sendUploadProgress: false,
      sendOfflinePacketAfterOnline: true
    })).toBe(false);
  });

  it('setGhostMode targets unlocked essentials and keeps locked values', () => {
    const stock = {...GHOST_FLAG_DEFAULTS};
    expect(applyGhostMode(stock, {}, true)).toEqual({
      sendReadMessagePackets: false,
      sendReadStoriesPackets: false,
      sendOnlinePackets: false,
      sendUploadProgress: false,
      sendOfflinePacketAfterOnline: true,
      markReadAfterSend: true
    });
    expect(applyGhostMode(applyGhostMode(stock, {}, true), {}, false)).toEqual(stock);

    // * Android: (item == sendOfflinePacketAfterOnline) == enabled, per flag
    for(const key of GHOST_ESSENTIAL_KEYS) {
      expect(ghostModeTarget(key, true)).toBe(key === 'sendOfflinePacketAfterOnline');
      expect(ghostModeTarget(key, false)).toBe(key !== 'sendOfflinePacketAfterOnline');
    }

    // * the locked offline-after-online keeps the mode's value through both
    // * directions; the unlocked ones move
    const locked = {
      sendReadMessagePackets: false,
      sendReadStoriesPackets: false,
      sendOnlinePackets: false,
      sendUploadProgress: false,
      sendOfflinePacketAfterOnline: true,
      markReadAfterSend: true
    };
    expect(applyGhostMode(locked, {sendOfflinePacketAfterOnline: true}, false)).toEqual({
      sendReadMessagePackets: true,
      sendReadStoriesPackets: true,
      sendOnlinePackets: true,
      sendUploadProgress: true,
      sendOfflinePacketAfterOnline: true,
      markReadAfterSend: true
    });
  });

  it('each flag maps onto Android\'s intercepted request kinds', () => {
    const flags = {...GHOST_FLAG_DEFAULTS};
    expect(ghostSuppressesReadReceipts(flags)).toBe(false);
    expect(ghostSuppressesStoryReads(flags)).toBe(false);
    expect(ghostBlocksTyping(flags)).toBe(false);
    expect(ghostSuppressesReadReceipts({...flags, sendReadMessagePackets: false})).toBe(true);
    expect(ghostSuppressesStoryReads({...flags, sendReadStoriesPackets: false})).toBe(true);
    expect(ghostBlocksTyping({...flags, sendUploadProgress: false})).toBe(true);
  });

  it('the status rewrite forces offline instead of dropping the request (GHOST-04)', () => {
    const flags = {...GHOST_FLAG_DEFAULTS};
    expect(ghostStatusToAnnounce(false, flags)).toBe(false);
    expect(ghostStatusToAnnounce(true, flags)).toBe(true);
    // * sendOnlinePackets off: an online ping is rewritten, an offline one passes
    const noOnline = {...flags, sendOnlinePackets: false};
    expect(ghostStatusToAnnounce(false, noOnline)).toBe(true);
    expect(ghostStatusToAnnounce(true, noOnline)).toBe(true);
  });

  it('the offline-after-send hook applies to every online request (GHOST-06, handleOfflineAfterSend)', () => {
    // * Android `AyuGhostUtils.OFFLINE_DELAY_MS` — the delayed offline packet's
    // * verbatim gap
    expect(GHOST_OFFLINE_AFTER_SEND_DELAY).toBe(1000);
    const flags: ExterayondGhostFlags = {...GHOST_FLAG_DEFAULTS, sendOfflinePacketAfterOnline: true};
    // * Android's isOnlineRequest: every send kind plus the edit
    const online: ExterayondGhostSendMethod[] = [
      'messages.sendMessage',
      'messages.sendMedia',
      'messages.sendMultiMedia',
      'messages.forwardMessages',
      'messages.sendInlineBotResult',
      'messages.sendScheduledMessages',
      'messages.editMessage'
    ];
    for(const method of online) {
      expect(ghostOfflineAfterSendApplies(method, flags), method).toBe(true);
    }

    // * the flag off is stock
    const stock = {...GHOST_FLAG_DEFAULTS};
    for(const method of online) {
      expect(ghostOfflineAfterSendApplies(method, stock), method).toBe(false);
    }
  });

  it('the read-after-send hook needs the suppression and a message-send request (GHOST-07, handleReadAfterSend)', () => {
    // * Android's condition: markReadAfterSend && !sendReadMessagePackets
    const flags: ExterayondGhostFlags = {...GHOST_FLAG_DEFAULTS, sendReadMessagePackets: false};
    const sends: ExterayondGhostSendMethod[] = [
      'messages.sendMessage',
      'messages.sendMedia',
      'messages.sendMultiMedia',
      'messages.forwardMessages',
      'messages.sendInlineBotResult',
      'messages.sendScheduledMessages'
    ];
    for(const method of sends) {
      expect(ghostReadAfterSendApplies(method, flags), method).toBe(true);
    }

    // * an edit is an online request for GHOST-06 only — isMessageSendRequest
    // * excludes it, so no read-after-send
    expect(ghostReadAfterSendApplies('messages.editMessage', flags)).toBe(false);

    // * the read receipts still on (the stock default) suppresses nothing,
    // * so the hook must not double-mark reads
    expect(ghostReadAfterSendApplies('messages.sendMessage', GHOST_FLAG_DEFAULTS)).toBe(false);

    // * markReadAfterSend off (Android default true) disables the hook alone
    expect(ghostReadAfterSendApplies('messages.sendMessage', {
      ...flags,
      markReadAfterSend: false
    })).toBe(false);
  });

  it('the worker-side state answers what the last push set', () => {
    expect(getExterayondGhostFlags()).toEqual(GHOST_FLAG_DEFAULTS);
    const next: ExterayondGhostFlags = {...GHOST_FLAG_DEFAULTS, sendOnlinePackets: false};
    setExterayondGhostFlags(next);
    expect(getExterayondGhostFlags()).toEqual(next);
    expect(getExterayondGhostFlags()).not.toBe(next);
  });

  it('the essential row\'s checkbox value round-trips through the store value (packet 083)', () => {
    // * the hub's onChange stores `isFlagInGhostState(key, checked)` — the
    // * formula read of its own inverse must hand back the checked state
    for(const key of GHOST_ESSENTIAL_KEYS) {
      for(const checked of [true, false]) {
        const stored = isFlagInGhostState(key, checked);
        expect(isFlagInGhostState(key, stored), `${key} from checked=${checked}`).toBe(checked);
      }
    }
  });
});

describe('the store pushes the flags into the worker', () => {
  beforeEach(() => {
    localStorageStub.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a changed essential reaches appMessagesManager.setExterayondGhostFlags', async() => {
    const {store, rootScope} = await loadFresh();
    const setGhostFlags = vi.fn();
    (rootScope as any).managers = {
      appMessagesManager: {setExterayondGhostFlags: setGhostFlags, setSortByUnread: vi.fn()}
    };

    store.setExterayondSetting('sendOnlinePackets', false as never);
    expect(setGhostFlags).toHaveBeenCalledTimes(1);
    expect(setGhostFlags).toHaveBeenCalledWith({
      sendReadMessagePackets: true,
      sendReadStoriesPackets: true,
      sendOnlinePackets: false,
      sendUploadProgress: true,
      sendOfflinePacketAfterOnline: false,
      markReadAfterSend: true
    });
  });

  it('GHOST-07\'s flag rides the push and the master toggle never moves it (packet 084)', async() => {
    const {store, rootScope} = await loadFresh();
    const payloads: ExterayondGhostFlags[] = [];
    (rootScope as any).managers = {
      appMessagesManager: {
        setExterayondGhostFlags: (flags: ExterayondGhostFlags) => payloads.push(flags),
        setSortByUnread: vi.fn()
      },
      appUsersManager: {updateMyOnlineStatus: vi.fn()}
    };

    // * the standalone default pushes with the essentials
    store.setExterayondSetting('sendReadMessagePackets', false as never);
    expect(payloads[payloads.length - 1].markReadAfterSend).toBe(true);

    // * toggling the flag itself pushes (the worker's send hook reads it)...
    store.setExterayondSetting('markReadAfterSend', false as never);
    expect(payloads[payloads.length - 1]).toEqual({...GHOST_FLAG_DEFAULTS, sendReadMessagePackets: false, markReadAfterSend: false});

    // * ...while the master toggle leaves it exactly where the user set it
    store.setExterayondGhostMode(true);
    expect(store.exterayondSettings.markReadAfterSend).toBe(false);
    expect(payloads[payloads.length - 1].markReadAfterSend).toBe(false);
    expect(payloads[payloads.length - 1].sendReadMessagePackets).toBe(false);
    expect(store.isExterayondGhostModeActive()).toBe(true);
  });

  it('a lock change stays tab-side (the worker never sees the locks)', async() => {
    const {store, rootScope} = await loadFresh();
    const setGhostFlags = vi.fn();
    (rootScope as any).managers = {
      appMessagesManager: {setExterayondGhostFlags: setGhostFlags, setSortByUnread: vi.fn()}
    };

    store.setExterayondSetting('sendUploadProgressLocked', true as never);
    expect(setGhostFlags).not.toHaveBeenCalled();
  });

  it('the flags ride the session events like the GEN-12 flag does', async() => {
    const {store, rootScope} = await loadFresh();
    const setGhostFlags = vi.fn();
    (rootScope as any).managers = {
      // * rootScope forwards dispatched events through the port, asking the
      // * apiManager for the account number first
      apiManager: {getAccountNumber: () => Promise.resolve(0)},
      appMessagesManager: {setExterayondGhostFlags: setGhostFlags, setSortByUnread: vi.fn()}
    };

    // * the payload shape only needs rootScope's own {id} listener to hold
    rootScope.dispatchEvent('user_auth', {id: 0 as UserId} as any);
    rootScope.dispatchEvent('account_switched', {} as any);
    expect(setGhostFlags).toHaveBeenCalledTimes(2);
    expect(setGhostFlags).toHaveBeenCalledWith(GHOST_FLAG_DEFAULTS);
    // * let the event-forwarding microtasks settle while the port spy lives
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('a reset that touched the flags re-pushes the defaults once', async() => {
    const {store, rootScope} = await loadFresh();
    const setGhostFlags = vi.fn();
    (rootScope as any).managers = {
      appMessagesManager: {setExterayondGhostFlags: setGhostFlags, setSortByUnread: vi.fn()}
    };

    store.setExterayondSetting('sendReadMessagePackets', false as never);
    setGhostFlags.mockClear();
    store.resetExterayondSettings();
    expect(setGhostFlags).toHaveBeenCalledTimes(1);
    expect(setGhostFlags).toHaveBeenCalledWith(GHOST_FLAG_DEFAULTS);
  });

  it('the master toggle moves the unlocked essentials and asks for a status request (GHOST-01)', async() => {
    const {store, rootScope} = await loadFresh();
    const setGhostFlags = vi.fn();
    const updateStatus = vi.fn();
    (rootScope as any).managers = {
      apiManager: {getAccountNumber: () => Promise.resolve(0)},
      appMessagesManager: {setExterayondGhostFlags: setGhostFlags, setSortByUnread: vi.fn()},
      appUsersManager: {updateMyOnlineStatus: updateStatus}
    };

    // * entering: every unlocked essential takes its ghost target...
    store.setExterayondGhostMode(true);
    expect(store.isExterayondGhostModeActive()).toBe(true);
    expect(store.exterayondSettings.sendReadMessagePackets).toBe(false);
    expect(store.exterayondSettings.sendOfflinePacketAfterOnline).toBe(true);
    // * ...and Android's toggleGhostMode sends the online packet, which the
    // * just-enabled suppression rewrites to offline inside the manager
    expect(updateStatus).toHaveBeenCalledWith(false);

    // * leaving goes back to stock, still with the status request
    updateStatus.mockClear();
    store.setExterayondGhostMode(false);
    expect(store.isExterayondGhostModeActive()).toBe(false);
    expect(store.exterayondSettings.sendReadMessagePackets).toBe(true);
    expect(store.exterayondSettings.sendOfflinePacketAfterOnline).toBe(false);
    expect(updateStatus).toHaveBeenCalledWith(false);
  });

  it('the master toggle keeps the locked essentials (GHOST-12)', async() => {
    const {store, rootScope} = await loadFresh();
    (rootScope as any).managers = {
      apiManager: {getAccountNumber: () => Promise.resolve(0)},
      appMessagesManager: {setExterayondGhostFlags: vi.fn(), setSortByUnread: vi.fn()},
      appUsersManager: {updateMyOnlineStatus: vi.fn()}
    };

    store.setExterayondSetting('sendUploadProgressLocked', true as never);
    store.setExterayondGhostMode(true);
    expect(store.exterayondSettings.sendUploadProgress).toBe(true);
    // * Android's active check skips locked flags entirely: one essential
    // * locked outside the ghost state does not deactivate the mode
    expect(store.isExterayondGhostModeActive()).toBe(true);
  });

  it('the flags the master toggle pushes activate the real suppression (packet 083)', async() => {
    const {store, rootScope} = await loadFresh();
    const ghost = await import('@lib/exterayondGhost');
    const payloads: ExterayondGhostFlags[] = [];
    (rootScope as any).managers = {
      apiManager: {getAccountNumber: () => Promise.resolve(0)},
      appMessagesManager: {
        setExterayondGhostFlags: (flags: ExterayondGhostFlags) => payloads.push(flags),
        setSortByUnread: vi.fn()
      },
      appUsersManager: {updateMyOnlineStatus: vi.fn()}
    };

    // * entering: the last push is the full ghost state, and the worker-side
    // * gates read exactly that payload — every predicate must agree
    store.setExterayondGhostMode(true);
    expect(store.isExterayondGhostModeActive()).toBe(true);
    const entering = payloads[payloads.length - 1];
    expect(ghost.isGhostModeActive(entering)).toBe(true);
    expect(ghost.ghostSuppressesReadReceipts(entering)).toBe(true);
    expect(ghost.ghostSuppressesStoryReads(entering)).toBe(true);
    expect(ghost.ghostBlocksTyping(entering)).toBe(true);
    // * the toggle's online packet is rewritten to offline under these flags
    expect(ghost.ghostStatusToAnnounce(false, entering)).toBe(true);

    // * leaving: the last push is stock again — nothing suppresses
    store.setExterayondGhostMode(false);
    const leaving = payloads[payloads.length - 1];
    expect(ghost.isGhostModeActive(leaving)).toBe(false);
    expect(ghost.ghostSuppressesReadReceipts(leaving)).toBe(false);
    expect(ghost.ghostSuppressesStoryReads(leaving)).toBe(false);
    expect(ghost.ghostBlocksTyping(leaving)).toBe(false);
    expect(ghost.ghostStatusToAnnounce(false, leaving)).toBe(false);
  });

  it('a reset pushes stock flags, so the suppression deactivates in the worker (packet 083)', async() => {
    const {store, rootScope} = await loadFresh();
    const ghost = await import('@lib/exterayondGhost');
    const payloads: ExterayondGhostFlags[] = [];
    (rootScope as any).managers = {
      appMessagesManager: {
        setExterayondGhostFlags: (flags: ExterayondGhostFlags) => payloads.push(flags),
        setSortByUnread: vi.fn()
      }
    };

    store.setExterayondSetting('sendReadStoriesPackets', false as never);
    store.resetExterayondSettings();
    const pushed = payloads[payloads.length - 1];
    expect(pushed).toEqual(GHOST_FLAG_DEFAULTS);
    expect(ghost.ghostSuppressesStoryReads(pushed)).toBe(false);
    expect(ghost.isGhostModeActive(pushed)).toBe(false);
  });
});

describe('the manager gates (source contracts)', () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const messagesSource = read('src/lib/appManagers/appMessagesManager.ts');
  const usersSource = read('src/lib/appManagers/appUsersManager.ts');
  const storiesSource = read('src/lib/appManagers/appStoriesManager.ts');
  const storeSource = read('src/stores/exterayondSettings.ts');

  it('readHistory skips the server call without latching it (GHOST-02)', () => {
    expect(messagesSource).toContain('const suppressReadReceipts = ghostSuppressesReadReceipts(getExterayondGhostFlags())');
    expect(messagesSource).toContain('const skipServerCall = suppressReadReceipts ||');
    expect(messagesSource).toContain('if(!suppressReadReceipts && !(historyStorage.triedToReadMaxId >= maxId))');
  });

  it('readMessages skips both readMessageContents invokes, keeping the local apply (GHOST-02)', () => {
    expect(messagesSource.match(/if\(!suppressRead\) \{/g)?.length).toBe(2);
  });

  it('setTyping blocks whole and getMessagesViews rewrites increment (GHOST-05/02)', () => {
    expect(messagesSource).toContain('if(ghostBlocksTyping(getExterayondGhostFlags()))');
    expect(messagesSource).toContain('const increment = !ghostSuppressesReadReceipts(getExterayondGhostFlags())');
  });

  it('updateMyOnlineStatus rewrites through the decision helper (GHOST-04)', () => {
    expect(usersSource).toContain('offline = ghostStatusToAnnounce(offline, getExterayondGhostFlags())');
  });

  it('both story requests are gated by the story flag (GHOST-03)', () => {
    expect(storiesSource).toContain('if(TEST_READ || ghostSuppressesStoryReads(getExterayondGhostFlags()))');
    expect(storiesSource).toContain('if(ghostSuppressesStoryReads(getExterayondGhostFlags()))');
  });

  it('the store pushes on flag changes and on the session events', () => {
    expect(storeSource).toContain('(GHOST_WORKER_KEYS as readonly ExterayondSettingsKey[]).includes(key) && previous !== clamped');
    expect(storeSource).toContain(`hotListen(import.meta.hot, rootScope, 'user_auth', pushWorkerState)`);
    expect(storeSource).toContain(`hotListen(import.meta.hot, rootScope, 'account_switched', pushWorkerState)`);
  });

  it('every send and edit invoke passes through the send hook (packet 084, the documented call sites)', () => {
    // * the hook is the web's "message went out" point: one call per send
    // * invoke site (sendText's two branches, sendFile, sendGrouped,
    // * sendOther's two branches, forwardMessages, sendScheduledMessages,
    // * and both editMessage invokes)
    const calls = messagesSource.match(/(?:this\.)?exteraGhostSendHook\(/g) ?? [];
    expect(calls.length).toBe(10);

    // * each Android request kind is covered by a literal at its site — the
    // * ternary sites (sendText's text/media, sendGrouped's media/album)
    // * name theirs inside the hook call, so a bounded window over the
    // * whitespace-stripped source finds every kind right after a hook open
    const flat = messagesSource.replace(/\s+/g, '');
    for(const method of [
      'messages.sendMessage',
      'messages.sendMedia',
      'messages.sendMultiMedia',
      'messages.forwardMessages',
      'messages.sendInlineBotResult',
      'messages.sendScheduledMessages',
      'messages.editMessage'
    ]) {
      expect(new RegExp(`exteraGhostSendHook\\(.{0,120}?${method}'`, 's').test(flat), method).toBe(true);
    }

    // * the drift direction the hook count alone cannot catch: a NEW send or
    // * edit invoke added without passing its promise through the hook. Every
    // * send-kind invoke literal keeps this pinned count (one per site, the
    // * ternary sites matching on their first literal) — a new invoke site
    // * must wrap its promise AND bump both pins consciously
    const kinds = 'sendMessage|sendMedia|sendMultiMedia|forwardMessages|sendInlineBotResult|sendScheduledMessages|editMessage';
    const invokeCount = flat.match(new RegExp(`invokeApi(?:After)?\\(.{0,60}?'(?:messages\\.(?:${kinds}))'`, 'g'))?.length ?? 0;
    expect(invokeCount, 'send/edit invoke literals').toBe(10);
  });

  it('the hook reads the worker flags live and carries both consumers (packet 084)', () => {
    expect(messagesSource).toContain('const flags = getExterayondGhostFlags();');
    expect(messagesSource).toContain('if(ghostReadAfterSendApplies(method, flags)) {');
    expect(messagesSource).toContain('if(ghostOfflineAfterSendApplies(method, flags)) {');
    expect(messagesSource).toContain('GHOST_OFFLINE_AFTER_SEND_DELAY);');
    expect(messagesSource).toContain('this.appUsersManager.updateMyOnlineStatus(true)');
  });

  it('the read-after-send bypasses the GHOST-02 gate with a direct invoke (packet 084)', () => {
    // * Android's markReadOnServer builds the read request outside the
    // * interceptor's read branch — the direct invoke here does the same. The
    // * assertions read the bypass's own body (the normal readHistory carries
    // * the same invoke literals, so a file-wide check would pass with the
    // * bypass deleted)
    const bypass = messagesSource.slice(
      messagesSource.indexOf('private exteraGhostReadAfterSend'),
      messagesSource.indexOf('public cantForwardDeleteMids')
    );
    expect(bypass).not.toBe('');
    expect(bypass).toContain('this.getHistoryStorage(peerId).maxId');
    expect(bypass.replace(/\s+/g, '')).toContain(`this.apiManager.invokeApi('channels.readHistory',{`);
    expect(bypass.replace(/\s+/g, '')).toContain(`this.apiManager.invokeApi('messages.readHistory',{`);
    expect(bypass.replace(/\s+/g, '')).toContain(`processLocalUpdate({_:'updatePts'`);
  });

  it('the section heading carries Android\'s GhostEssentialsHeader wording (packet 083)', () => {
    const langSource = read('src/lang.ts');
    expect(langSource).toContain(`'Exterayond.Ghost': 'Ghost essentials'`);
    expect(langSource).toContain(`'Exterayond.Ghost.Title': 'Ghost Mode'`);
  });
});
