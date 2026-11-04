import type {Dialog, ForumTopic} from '@layer';

import '@helpers/peerIdPolyfill';
import DialogsStorage from '@lib/storages/dialogs';

/**
 * GEN-12 (`SortByUnread`, Android `ChatsHelper.isUnreadSortPriority` + the
 * `MessagesController` dialog comparators): unread-priority dialogs rise above
 * read ones under the pinned band, and the whole index layout switches with
 * the flag without breaking the descending-by-index order the pagination walks
 * (`getOffsetByIndex`) and the UI's offset bookkeeping rely on.
 */

const UNREAD_PRIORITY_MIN_INDEX = 0x40000000 * 0x10000;
const PINNED_DATE = 0x7fff0000;

const peerId = (id: number) => id.toPeerId(false) as PeerId;

const makeDialog = (id: number, fields: Partial<Dialog.dialog> = {}): Dialog.dialog => {
  return {
    _: 'dialog',
    peerId: peerId(id),
    top_message: 0,
    read_inbox_max_id: 0,
    read_outbox_max_id: 0,
    unread_count: 0,
    unread_mentions_count: 0,
    unread_reactions_count: 0,
    folder_id: 0,
    pFlags: {},
    ...fields
  } as Dialog.dialog;
};

const makeStorage = () => {
  const storage = new DialogsStorage() as any;
  const muted = new Set<PeerId>();
  const forumPeerIds = new Set<PeerId>();
  const dates = new Map<PeerId, number>();

  Object.assign(storage, {
    rootScope: {
      dispatchEvent: vi.fn(),
      addEventListener: () => {}
    },
    appPeersManager: {
      isForum: (p: PeerId) => forumPeerIds.has(p),
      isBotforum: () => false,
      isChannel: () => false,
      peerId: undefined
    },
    appNotificationsManager: {
      isPeerLocalMuted: ({peerId: p}: {peerId: PeerId}) => muted.has(p)
    },
    filtersStorage: {
      getFilters: (): Record<number, any> => ({0: {id: 0, localId: 0, pinnedPeerIds: []}}),
      testDialogForFilter: () => true
    },
    appStateManager: {pushToState: () => {}},
    appMessagesManager: {
      getDialogUnreadCount: (dialog: Dialog.dialog) => dialog.unread_count || 0,
      getMessageByPeer: (p: PeerId) => dates.has(p) ? {date: dates.get(p)} : undefined
    },
    timeManager: {getServerTime: () => 0, getServerTimeOffset: () => 0}
  });
  (storage as DialogsStorage).clear(true);
  storage.dialogs = {};

  return {storage, muted, forumPeerIds, dates};
};

/** The activity date comes from the top message; give every dialog one directly. */
const withDate = (dates: Map<PeerId, number>, dialog: Dialog.dialog, date: number) => {
  dates.set(dialog.peerId, date);
};

describe('dialog sort by unread (GEN-12)', () => {
  test('the flag-off layout is the stock date index', () => {
    const {storage, dates} = makeStorage();
    const dialog = makeDialog(1);
    withDate(dates, dialog, 1000);

    const index = storage.generateIndexForDialog(dialog, true);
    expect(index).toBe(1000 * 0x10000 + 1);
    expect(index).toBeLessThan(UNREAD_PRIORITY_MIN_INDEX);
  });

  test('an unread dialog takes the priority band, a read one the halved dates', () => {
    const {storage, dates} = makeStorage();
    storage.setSortByUnread(true);

    const read = makeDialog(1);
    const unread = makeDialog(2, {unread_count: 3});
    withDate(dates, read, 1000);
    withDate(dates, unread, 1000);

    const readIndex = storage.generateIndexForDialog(read, true);
    const unreadIndex = storage.generateIndexForDialog(unread, true);

    expect(readIndex).toBe(Math.floor(1000 / 2) * 0x10000 + 1);
    expect(unreadIndex).toBe(UNREAD_PRIORITY_MIN_INDEX + Math.floor(1000 / 2) * 0x10000 + 2);
    expect(unreadIndex).toBeGreaterThan(readIndex);
  });

  test('priority semantics mirror Android: mentions or reactions win, muted unread does not', () => {
    const {storage, muted, forumPeerIds} = makeStorage();
    muted.add(peerId(3));

    expect(storage.hasUnreadSortPriority(makeDialog(1, {unread_count: 5}))).toBe(true);
    expect(storage.hasUnreadSortPriority(makeDialog(2, {unread_mentions_count: 1}))).toBe(true);
    expect(storage.hasUnreadSortPriority(makeDialog(4, {unread_reactions_count: 1}))).toBe(true);
    expect(storage.hasUnreadSortPriority(makeDialog(3, {unread_count: 5}))).toBe(false);
    expect(storage.hasUnreadSortPriority(makeDialog(3, {unread_mentions_count: 1}))).toBe(true);
    expect(storage.hasUnreadSortPriority(makeDialog(5))).toBe(false);

    // * a forum's aggregate dialog reads its cached topics
    const forumDialog = makeDialog(-100, {folder_id: 0});
    const forumPeerId = (-100).toPeerId(true) as PeerId;
    (forumDialog as any).peerId = forumPeerId;
    forumPeerIds.add(forumPeerId);
    expect(storage.hasUnreadSortPriority(forumDialog)).toBe(false);

    const topic = {
      _: 'forumTopic',
      id: 1,
      peerId: forumPeerId,
      unread_count: 2,
      unread_mentions_count: 0,
      unread_reactions_count: 0,
      pFlags: {}
    } as unknown as ForumTopic;
    storage.getForumTopicsCache(forumPeerId).topics.set(1, topic);
    expect(storage.hasUnreadSortPriority(forumDialog)).toBe(true);
  });

  test('the folder array re-sorts on the flag: unread above read, pinned above unread', () => {
    const {storage, muted, dates} = makeStorage();
    muted.add(peerId(4)); // * stays below: unread but muted

    const oldRead = makeDialog(1);
    const newRead = makeDialog(2);
    const unread = makeDialog(3, {unread_count: 1});
    const mutedUnread = makeDialog(4, {unread_count: 1});
    const pinned = makeDialog(5, {pFlags: {pinned: true}});

    const dialogs = [oldRead, newRead, unread, mutedUnread, pinned];
    withDate(dates, oldRead, 1000);
    withDate(dates, newRead, 2000);
    withDate(dates, unread, 500);
    withDate(dates, mutedUnread, 1900);
    withDate(dates, pinned, 100);

    for(const dialog of dialogs) {
      storage.dialogs[dialog.peerId] = dialog;
      storage.processDialogForFilter(dialog, {id: 0, localId: 0, pinnedPeerIds: []});
    }

    expect(storage.getFolder(0).dialogs.map((d: Dialog.dialog) => d.peerId)).toEqual([
      pinned.peerId, // * pinned first, as ever
      newRead.peerId, // * then by date
      mutedUnread.peerId,
      oldRead.peerId,
      unread.peerId
    ]);

    // * with the setting on the unread dialog rises above every read one,
    // * and the pinned one stays on top
    storage.setSortByUnread(true);

    expect(storage.getFolder(0).dialogs.map((d: Dialog.dialog) => d.peerId)).toEqual([
      pinned.peerId,
      unread.peerId,
      newRead.peerId,
      mutedUnread.peerId,
      oldRead.peerId
    ]);

    // * every index keeps descending along the array — the invariant the
    // * pagination walk (`getOffsetByIndex`) and the UI offsets need
    const indexes = storage.getFolder(0).dialogs.map((d: Dialog.dialog) => storage.getDialogIndex(d, 'index_0'));
    for(let i = 1; i < indexes.length; ++i) {
      expect(indexes[i]).toBeLessThan(indexes[i - 1]);
    }

    // * back to stock: the date order returns
    storage.setSortByUnread(false);
    expect(storage.getFolder(0).dialogs.map((d: Dialog.dialog) => d.peerId)).toEqual([
      pinned.peerId,
      newRead.peerId,
      mutedUnread.peerId,
      oldRead.peerId,
      unread.peerId
    ]);

    // * the tabs' chat lists are told to rebuild only after the pass
    expect(storage.rootScope.dispatchEvent).toHaveBeenCalledWith('exterayond_settings_updated', {
      key: 'SortByUnread',
      value: false
    });
  });

  test('a pinned dialog stays above the priority band for any realistic date', () => {
    const {storage, dates} = makeStorage();
    storage.setSortByUnread(true);

    const pinned = makeDialog(1, {pFlags: {pinned: true}});
    withDate(dates, pinned, 100);
    const unread = makeDialog(2, {unread_count: 1});
    withDate(dates, unread, 2_000_000_000); // * year 2033

    const pinnedIndex = storage.generateIndexForDialog(pinned, true);
    const unreadIndex = storage.generateIndexForDialog(unread, true);

    expect(pinnedIndex).toBe(PINNED_DATE * 0x10000);
    expect(storage.hasStoredUnreadSortPriority(pinnedIndex)).toBe(true);
    expect(storage.hasStoredUnreadSortPriority(unreadIndex)).toBe(true);
    expect(unreadIndex).toBeGreaterThan(UNREAD_PRIORITY_MIN_INDEX);
    expect(unreadIndex).toBeLessThan(pinnedIndex);
  });

  test('a stored stock index is regenerated once the priority state no longer matches', () => {
    const {storage, dates} = makeStorage();
    const dialog = makeDialog(1);
    withDate(dates, dialog, 3000);
    storage.dialogs[dialog.peerId] = dialog;

    // * generated while read, with the flag on
    storage.setSortByUnread(true);
    const readIndex = storage.generateIndexForDialog(dialog, true);
    expect(storage.hasStoredUnreadSortPriority(readIndex)).toBe(false);
    expect(readIndex).toBe(Math.floor(3000 / 2) * 0x10000 + 1);

    // * the dialog becomes unread: a filter pass must not reuse the stale
    // * read index — it regenerates into the priority band
    dialog.unread_count = 1;
    const newIndex = storage.setDialogIndexInFilter(dialog, 'index_0', {id: 2, localId: 0, pinnedPeerIds: []} as any);
    expect(storage.hasStoredUnreadSortPriority(newIndex)).toBe(true);
    expect(newIndex).toBeGreaterThan(readIndex);
  });
});
