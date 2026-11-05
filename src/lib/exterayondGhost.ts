/**
 * Ghost Mode — the suppression state and its decisions, ported from
 * exteraless @8b7ec40: the ghost block of `NekoConfig.java` (the five
 * essentials, their locks, `isGhostModeActive`/`setGhostMode`) and
 * `AyuGhostUtils.interceptRequest` (which request kinds each flag withholds
 * or rewrites). Client-side suppression only: the client withholds or
 * rewrites its own outgoing read-receipt / typing / status / story packets,
 * exactly as the Android client does at the same call level — nothing here
 * claims to unsend a packet or to change what the server learned before the
 * mode was on.
 *
 * The module is worker-safe (no DOM, no Solid): the gating managers run in
 * the shared worker, and the tab-side settings store pushes the flags through
 * `appMessagesManager.setExterayondGhostFlags` — the `setSortByUnread`
 * pattern (once per account session on `user_auth`/`account_switched`, and
 * on every change). Android has no per-flag aliases in `EtgBackup`, so no
 * `.extera` keys exist for any of them.
 */

export type ExterayondGhostFlags = {
  /** Android `NekoConfig.sendReadMessagePackets` (default true) — GHOST-02. */
  sendReadMessagePackets: boolean,
  /** Android `NekoConfig.sendReadStoriesPackets` (default true) — GHOST-03. */
  sendReadStoriesPackets: boolean,
  /** Android `NekoConfig.sendOnlinePackets` (default true) — GHOST-04. */
  sendOnlinePackets: boolean,
  /**
   * Android `NekoConfig.sendUploadProgress` (default true) — GHOST-05. At the
   * pinned revision the flag blocks `messages.setTyping` entirely
   * (`AyuGhostUtils.interceptRequest` accepts only `TL_messages_setTyping` /
   * `TL_messages_setEncryptedTyping` under this branch), which covers both
   * typing indicators and upload-progress actions.
   */
  sendUploadProgress: boolean,
  /**
   * Android `NekoConfig.sendOfflinePacketAfterOnline` (default false) —
   * GHOST-06: after a message-send request completes, go offline again. Its
   * per-send hook waits on the web send pipeline; the flag already takes part
   * in the master-toggle state like on Android.
   */
  sendOfflinePacketAfterOnline: boolean
};

/** Android `NekoConfig` ghost-block defaults: every packet sends (stock behavior). */
export const GHOST_FLAG_DEFAULTS: ExterayondGhostFlags = {
  sendReadMessagePackets: true,
  sendReadStoriesPackets: true,
  sendOnlinePackets: true,
  sendUploadProgress: true,
  sendOfflinePacketAfterOnline: false
};

/** The master-toggle keys, `NekoConfig.ghostToggleItems`' order. */
export const GHOST_ESSENTIAL_KEYS: readonly (keyof ExterayondGhostFlags)[] = [
  'sendReadMessagePackets',
  'sendReadStoriesPackets',
  'sendOnlinePackets',
  'sendUploadProgress',
  'sendOfflinePacketAfterOnline'
];

/**
 * A flag's value counts as the ghost state when it equals
 * `(key === 'sendOfflinePacketAfterOnline')` — the one essential whose ghost
 * value is `true` (NekoConfig.isGhostModeActive/setGhostMode's comparison).
 */
export const isFlagInGhostState = (key: keyof ExterayondGhostFlags, value: boolean): boolean =>
  (key === 'sendOfflinePacketAfterOnline') === value;

/**
 * Android `NekoConfig.isGhostModeActive`: every UNLOCKED essential sits in
 * its ghost state. Locked flags are skipped entirely — a flag locked in its
 * non-ghost value does not deactivate the mode (and a fully locked set is
 * vacuously active).
 */
export const isGhostModeActive = (
  flags: ExterayondGhostFlags,
  locked: Partial<Record<keyof ExterayondGhostFlags, boolean>> = {}
): boolean => {
  for(const key of GHOST_ESSENTIAL_KEYS) {
    if(locked[key]) continue;
    if(!isFlagInGhostState(key, flags[key])) {
      return false;
    }
  }

  return true;
};

/**
 * Android `NekoConfig.setGhostMode`'s target for one flag:
 * `(item == sendOfflinePacketAfterOnline) == enabled`.
 */
export const ghostModeTarget = (key: keyof ExterayondGhostFlags, enabled: boolean): boolean =>
  (key === 'sendOfflinePacketAfterOnline') === enabled;

/**
 * Android `NekoConfig.setGhostMode`: unlocked essentials move to their ghost
 * (enabled) or stock (disabled) targets; locked ones keep their values.
 */
export const applyGhostMode = (
  flags: ExterayondGhostFlags,
  locked: Partial<Record<keyof ExterayondGhostFlags, boolean>>,
  enabled: boolean
): ExterayondGhostFlags => {
  const next = {...flags};
  for(const key of GHOST_ESSENTIAL_KEYS) {
    if(!locked[key]) {
      next[key] = ghostModeTarget(key, enabled);
    }
  }

  return next;
};

/**
 * GHOST-02: read receipts (`messages.readHistory`, `channels.readHistory`,
 * `messages.readDiscussion`, `messages.readMessageContents`,
 * `channels.readMessageContents`; `messages.getMessagesViews` is rewritten to
 * `increment = false` instead of blocked). Android's secret-chat
 * `messages.readEncryptedHistory` has no web counterpart — Web K implements
 * no secret chats.
 */
export const ghostSuppressesReadReceipts = (flags: ExterayondGhostFlags): boolean =>
  !flags.sendReadMessagePackets;

/**
 * GHOST-03: story reads (`stories.readStories`, `stories.incrementStoryViews`).
 */
export const ghostSuppressesStoryReads = (flags: ExterayondGhostFlags): boolean =>
  !flags.sendReadStoriesPackets;

/**
 * GHOST-04: the outgoing `account.updateStatus` rewrite. With
 * `sendOnlinePackets` off, Android does not block the request — it forces
 * `offline = true` (`interceptRequest`), so the status pings keep flowing and
 * keep announcing offline. The local self status follows what the server is
 * told (Android's self status cells show offline while the flag is on).
 */
export const ghostStatusToAnnounce = (offline: boolean, flags: ExterayondGhostFlags): boolean =>
  flags.sendOnlinePackets ? offline : true;

/**
 * GHOST-05: typing/upload progress (`messages.setTyping` in full — see the
 * flag's doc above).
 */
export const ghostBlocksTyping = (flags: ExterayondGhostFlags): boolean =>
  !flags.sendUploadProgress;

/**
 * The worker-side state. The tab-side store is the single writer (through
 * `setExterayondGhostFlags`); the managers only read.
 */
let ghostFlags: ExterayondGhostFlags = {...GHOST_FLAG_DEFAULTS};

export const setExterayondGhostFlags = (flags: ExterayondGhostFlags) => {
  ghostFlags = {...flags};
};

export const getExterayondGhostFlags = (): ExterayondGhostFlags => ghostFlags;
