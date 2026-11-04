import {createEffect, createMemo, createRoot, createSignal, untrack} from 'solid-js';
import {createStore, reconcile} from 'solid-js/store';
import indexOfAndSplice from '@helpers/array/indexOfAndSplice';
import rootScope from '@lib/rootScope';
import {FOLDER_ID_ALL, FOLDER_ID_ARCHIVE, REAL_FOLDERS} from '@appManagers/constants';
import type {MyDialogFilter} from '@lib/storages/filters';
import type {ReadingManagers} from '@lib/managers';
import {bindManagersToSession} from '@lib/accounts/bindManagersToAccount';
import {clampExterayondSetting, exterayondSettings} from '@stores/exterayondSettings';

export type StoredFolder = {
  id: number,
  notifications?: {
    count: number,
    muted: boolean
  },
  chatsCount: number | null,
  filter: MyDialogFilter
};

async function getNotificationCountForFilter(filterId: number, managers: ReadingManagers) {
  const {
    unreadUnmutedCount,
    unreadCount,
    unreadMentionsCount
  } = await managers.dialogsStorage.getFolderUnreadCount(filterId);

  // * exteraless IgnoreUnreadCount (Android NaConfig): the only counter
  // * readers in the Android source turn the tab counters off at 2
  // * (`DialogsActivity.getTabCounter`) and otherwise read the filter's own
  // * count; "All chats" (0) counts muted chats too, "except muted" (1, the
  // * effective default) is the stock behavior — the All tab keeps Web K's
  // * unmuted count.
  const mode = clampExterayondSetting('IgnoreUnreadCount', exterayondSettings.IgnoreUnreadCount);
  if(mode === 2) {
    return {count: 0, muted: false};
  }

  return {
    count: mode === 0 || filterId !== FOLDER_ID_ALL ? unreadCount : unreadUnmutedCount,
    muted: !unreadUnmutedCount && !!unreadCount && !unreadMentionsCount
  };
}

async function getFolderItemsInOrder(folderItems: StoredFolder[], managers: ReadingManagers) {
  const filters = new Map<number, MyDialogFilter>();

  const filtersPromises = folderItems
  .filter((item) => item.id)
  .map((item) => managers.filtersStorage.getFilter(item.id));

  const filtersArr = (
    await Promise.all(filtersPromises)
  ).filter(Boolean);

  for(const filter of filtersArr) {
    filters.set(filter.id, filter);
  }

  return folderItems.sort((a, b) => {
    if(!a.id || !b.id) return 0;
    return filters.get(a.id)?.localId - filters.get(b.id)?.localId;
  });
}

const isAllTabHidden = () => clampExterayondSetting('HideAllTab', exterayondSettings.HideAllTab) === true;

/**
 * exteraless HideAllTab (Android NekoConfig.hideAllTab): the tab bar drops the
 * "All chats" tab while real folders remain, like Android's FilterTabsView not
 * adding the default tab. The filter lives on the shared folderItems list —
 * the horizontal tab bar, the folder rail and every index-based click path
 * (tab clicks, swipes, the back-stack pop) read the same array, so their
 * indexes stay aligned.
 */
const visibleFolderItems = (items: StoredFolder[]) => {
  if(!isAllTabHidden()) return items;
  const real = items.filter((item) => item.id !== FOLDER_ID_ALL);
  return real.length ? real : items;
};

const useFoldersStore = createRoot(() => {
  const [selectedFolderId, _setSelectedFolderId] = createSignal<number>(FOLDER_ID_ALL);
  const [folderItems, setFolderItems] = createStore<StoredFolder[]>([]);
  const selectedFolderIndex = createMemo(() => folderItems.findIndex(({id}) => id === selectedFolderId()));

  let setSelectedFolderId: (index: number, dontAnimate?: boolean) => any;
  const [onClick, setOnClick] = createSignal<typeof setSelectedFolderId>();

  createEffect(() => {
    setSelectedFolderId = onClick();
  });

  function updateFolderItem(folderId: number, payload: Partial<StoredFolder>) {
    const idx = folderItems.findIndex((item) => item.id === folderId);
    if(idx === -1) {
      return;
    }

    const folderItem = folderItems[idx];
    setFolderItems(idx, reconcile({...folderItem, ...payload}));
  }

  async function updateFolderNotifications(folderId: number) {
    updateFolderItem(folderId, {
      notifications: await getNotificationCountForFilter(folderId, rootScope.managers)
    });
  }

  function updateAllFolderNotifications() {
    for(const folderItem of folderItems) {
      if(!folderItem.id) continue;
      updateFolderNotifications(folderItem.id);
    }
  }

  async function makeFolderItemPayload(filter: MyDialogFilter): Promise<StoredFolder> {
    const [notifications, folder] = await Promise.all([
      getNotificationCountForFilter(filter.id, rootScope.managers),
      rootScope.managers.dialogsStorage.getFolder(filter.id)
    ]);

    return {
      id: filter.id,
      notifications: notifications,
      chatsCount: folder?.dialogs?.length || 0,
      filter
    };
  }

  async function updateOrAddFolder(filter: MyDialogFilter) {
    const managers = bindManagersToSession(rootScope.managers);
    const items = [...folderItems];
    const existingItem = items.find((item) => item.id === filter.id);

    if(existingItem) {
      updateFolderItem(filter.id, await makeFolderItemPayload(filter));
      return;
    }

    const [payload, orderedFolderItems] = await Promise.all([
      makeFolderItemPayload(filter),
      getFolderItemsInOrder(items, managers)
    ]);

    items.push(payload);
    setFolderItems(visibleFolderItems(orderedFolderItems));
  }

  function deleteFolder(filterId: number) {
    const items = [...folderItems];
    const existingItemIndex = items.findIndex((item) => item.id === filterId);

    if(existingItemIndex === -1) return;

    items.splice(existingItemIndex, 1);
    const length = items.length;
    setFolderItems(visibleFolderItems(items));

    const selectedId = untrack(selectedFolderId);
    if(length >= selectedId || selectedId === filterId) {
      setSelectedFolderId(0);
    }
  }

  function updateItemsOrder(order: number[]) {
    order = [...order];
    indexOfAndSplice(order, FOLDER_ID_ARCHIVE);

    const items = [...folderItems];

    items.sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);

      if(aIndex === -1) return -1;
      if(bIndex === -1) return 1;

      return aIndex - bIndex;
    });

    setFolderItems(visibleFolderItems(items));
  }

  let lastHydrationId = 0;
  let listenersInited = false;
  async function hydrateFilters(filters: MyDialogFilter[]) {
    const managers = bindManagersToSession(rootScope.managers);
    const hydrationId = ++lastHydrationId;
    const folderFilters = filters.filter((filter) => filter.id !== FOLDER_ID_ARCHIVE);
    const items = await Promise.all(folderFilters.map(makeFolderItemPayload));
    const orderedItems = await getFolderItemsInOrder(items, managers);

    if(hydrationId !== lastHydrationId) {
      return;
    }

    setFolderItems(visibleFolderItems(orderedItems));
    if(!listenersInited) {
      listenersInited = true;
      initListeners();
    }
  }

  // * the tab goes to another account: these folders are not its, and a hydration still on its way is for the
  // * previous account - the lists they open are gone already
  function resetForAccountSwitch() {
    ++lastHydrationId;
    setFolderItems([]);
    _setSelectedFolderId(FOLDER_ID_ALL);
  }

  function initListeners() {
    rootScope.addEventListener('dialog_flush', ({dialog}) => {
      if(!dialog) return;
      updateAllFolderNotifications();
    });

    rootScope.addEventListener('folder_unread', (filter) => {
      if(filter.id < 0) return;
      updateFolderNotifications(filter.id);
    });

    // * the counter mode is Android's restart-hint setting; the badges here
    // * recompute live instead. updateAllFolderNotifications skips the All
    // * folder's falsy id, so this refreshes every real folder itself
    rootScope.addEventListener('exterayond_settings_updated', ({key}) => {
      if(key === 'IgnoreUnreadCount') {
        for(const folderItem of folderItems) {
          if(folderItem.id === undefined) continue;
          updateFolderNotifications(folderItem.id);
        }

        return;
      }

      // * exteraless HideAllTab: the All tab leaves and joins the bar live.
      // * Hiding moves the selection through the same click path the tab bar
      // * uses, so the open chat list follows it; unhiding rebuilds the list
      // * from the filters like a hydration does
      if(key !== 'HideAllTab') return;

      const items = [...folderItems];
      const filtered = visibleFolderItems(items);
      if(filtered.length !== items.length) {
        setFolderItems(filtered);
        const selected = untrack(selectedFolderId);
        if(!filtered.some((item) => item.id === selected)) {
          onClick()?.(0);
        }

        return;
      }

      if(!isAllTabHidden() && !items.some((item) => item.id === FOLDER_ID_ALL)) {
        const managers = bindManagersToSession(rootScope.managers);
        void managers.filtersStorage.getDialogFilters().then((filters) => {
          // * the toggle may have flipped again while the filters were read
          if(!isAllTabHidden()) hydrateFilters(filters);
        });
      }
    });

    const onFilterUpsert = (filter: MyDialogFilter) => {
      if(REAL_FOLDERS.has(filter.id)) return;
      return updateOrAddFolder(filter);
    };

    rootScope.addEventListener('filter_update', onFilterUpsert);
    rootScope.addEventListener('filter_new', onFilterUpsert);

    rootScope.addEventListener('filter_delete', (filter) => {
      deleteFolder(filter.id);
    });

    rootScope.addEventListener('filter_order', (order) => {
      updateItemsOrder(order);
    });

    rootScope.addEventListener('filter_joined', (filter) => {
      setSelectedFolderId(filter.id);
    });

      rootScope.addEventListener('premium_toggle', async(isPremium) => {
        if(isPremium) {
          return;
        }

        const isFolderAvailable = await rootScope.managers.filtersStorage.isFilterIdAvailable(selectedFolderId());
        if(!isFolderAvailable) {
          // * the All tab is hidden: the closest fallback is the first visible
          // * folder, through the same click path the tab bar uses
          if(isAllTabHidden()) {
            onClick()?.(0);
            return;
          }

          setSelectedFolderId(FOLDER_ID_ALL);
        }
      });
  }

  return {
    selectedFolderId,
    setSelectedFolderId: _setSelectedFolderId,
    selectedFolderIndex,
    folderItems,
    hydrateFilters,
    resetForAccountSwitch,
    onClick,
    setOnClick
  };
});

export default function useFolders() {
  return useFoldersStore;
}
