import type {MyDialogFilter} from '@lib/storages/filters';
import makeDialogFilter from '@/tests/helpers/dialogFilter';

const mocks = vi.hoisted(() => {
  type Listener = (payload: any) => unknown;

  const filters = new Map<number, MyDialogFilter>();
  const listeners = new Map<string, Listener[]>();

  const rootScope = {
    managers: {
      dialogsStorage: {
        getFolderUnreadCount: vi.fn(async() => ({
          unreadUnmutedCount: 0,
          unreadCount: 0,
          unreadMentionsCount: 0
        })),
        getFolder: vi.fn(async() => ({dialogs: []}))
      },
      filtersStorage: {
        getFilter: vi.fn(async(filterId: number) => filters.get(filterId)),
        getDialogFilters: vi.fn(async() => Array.from(filters.values())),
        isFilterIdAvailable: vi.fn(async() => true)
      }
    },
    addEventListener: vi.fn((event: string, listener: Listener) => {
      const eventListeners = listeners.get(event) || [];
      eventListeners.push(listener);
      listeners.set(event, eventListeners);
    }),
    dispatchEvent: vi.fn(),
    // * the settings store broadcasts on this; the folders store hears it like
    // * the real rootScope's local listeners
    dispatchEventSingle: vi.fn((event: string, payload: any) =>
      Promise.all((listeners.get(event) || []).map((listener) => listener(payload)))
    )
  };

  return {
    filters,
    listeners,
    rootScope,
    async emit(event: string, payload: any) {
      await Promise.all((listeners.get(event) || []).map((listener) => listener(payload)));
    }
  };
});

vi.mock('@lib/rootScope', () => ({default: mocks.rootScope}));

describe('folders store recovery', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.filters.clear();
    mocks.listeners.clear();
  });

  it('restores filters after state clear without reloading the tab', async() => {
    const allChats = makeDialogFilter(0, 0);
    const firstFolder = makeDialogFilter(2, 2);
    const secondFolder = makeDialogFilter(3, 3);

    for(const filter of [allChats, firstFolder, secondFolder]) {
      mocks.filters.set(filter.id, filter);
    }

    const useFolders = (await import('@stores/folders')).default;
    const store = useFolders();
    const selectFolder = vi.fn();
    store.setOnClick(() => selectFolder);

    await store.hydrateFilters([allChats, firstFolder, secondFolder]);
    expect(store.folderItems.map(({id}) => id)).toEqual([0, 2, 3]);

    await mocks.emit('filter_delete', firstFolder);
    await mocks.emit('filter_delete', secondFolder);
    expect(store.folderItems.map(({id}) => id)).toEqual([0]);

    await store.hydrateFilters([allChats, firstFolder, secondFolder]);
    expect(store.folderItems.map(({id}) => id)).toEqual([0, 2, 3]);

    await mocks.emit('filter_delete', firstFolder);
    await mocks.emit('filter_delete', secondFolder);
    await mocks.emit('filter_new', firstFolder);
    await mocks.emit('filter_new', secondFolder);

    expect(store.folderItems.map(({id}) => id)).toEqual([0, 2, 3]);
    expect(mocks.listeners.get('filter_new')).toHaveLength(1);
    expect(mocks.listeners.get('filter_delete')).toHaveLength(1);
  });

  it('lets go of the previous account\'s folders at once on a switch, a hydration on its way included', async() => {
    const allChats = makeDialogFilter(0, 0);
    const folder = makeDialogFilter(2, 2);
    for(const filter of [allChats, folder]) {
      mocks.filters.set(filter.id, filter);
    }

    const useFolders = (await import('@stores/folders')).default;
    const store = useFolders();
    store.setOnClick(() => vi.fn());
    await store.hydrateFilters([allChats, folder]);
    store.setSelectedFolderId(2);

    // * the previous account's folders were still being read when the switch came
    const late = store.hydrateFilters([allChats, folder]);
    store.resetForAccountSwitch();
    expect(store.folderItems).toHaveLength(0);
    expect(store.selectedFolderId()).toBe(0);

    await late;
    expect(store.folderItems, 'the previous account\'s folders came back').toHaveLength(0);
  });

  it('the IgnoreUnreadCount modes drive the folder badges live', async() => {
    const allChats = makeDialogFilter(0, 0);
    const folder = makeDialogFilter(2, 2);
    for(const filter of [allChats, folder]) {
      mocks.filters.set(filter.id, filter);
    }

    mocks.rootScope.managers.dialogsStorage.getFolderUnreadCount.mockImplementation(async() => ({
      unreadUnmutedCount: 3,
      unreadCount: 7,
      unreadMentionsCount: 1
    }));

    const useFolders = (await import('@stores/folders')).default;
    const {setExteralessSetting, exteralessSettings} = (await import('@stores/exteralessSettings'));
    const store = useFolders();
    store.setOnClick(() => vi.fn());
    await store.hydrateFilters([allChats, folder]);

    const badge = (id: number) => store.folderItems.find((item) => item.id === id)?.notifications?.count;

    // * the Android effective default (except muted): the All tab keeps Web
    // * K's stock unmuted count, a folder reads its own full count
    expect(exteralessSettings.IgnoreUnreadCount).toBe(1);
    expect(badge(0)).toBe(3);
    expect(badge(2)).toBe(7);

    // * "All chats" counts muted chats on every tab
    setExteralessSetting('IgnoreUnreadCount', 0);
    await vi.waitFor(() => expect(badge(0)).toBe(7));
    expect(badge(2)).toBe(7);

    // * off hides the badges whole
    setExteralessSetting('IgnoreUnreadCount', 2);
    await vi.waitFor(() => expect(badge(0)).toBe(0));
    expect(badge(2)).toBe(0);

    setExteralessSetting('IgnoreUnreadCount', 1);
    await vi.waitFor(() => expect(badge(0)).toBe(3));
    expect(badge(2)).toBe(7);
  });

  it('HideAllTab drops the All tab while real folders remain and restores it live', async() => {
    const allChats = makeDialogFilter(0, 0);
    const firstFolder = makeDialogFilter(2, 2);
    const secondFolder = makeDialogFilter(3, 3);
    for(const filter of [allChats, firstFolder, secondFolder]) {
      mocks.filters.set(filter.id, filter);
    }

    const useFolders = (await import('@stores/folders')).default;
    const {setExteralessSetting, exteralessSettings} = (await import('@stores/exteralessSettings'));
    const store = useFolders();
    const selectFolder = vi.fn();
    store.setOnClick(() => selectFolder);

    await store.hydrateFilters([allChats, firstFolder, secondFolder]);
    expect(store.folderItems.map(({id}) => id)).toEqual([0, 2, 3]);

    // * the stock default: the All tab is there
    expect(exteralessSettings.HideAllTab).toBe(false);

    // * hiding drops the All tab live and moves the selection through the
    // * same click path the tab bar uses
    store.setSelectedFolderId(0);
    setExteralessSetting('HideAllTab', true);
    await vi.waitFor(() => expect(store.folderItems.map(({id}) => id)).toEqual([2, 3]));
    expect(selectFolder).toHaveBeenCalledWith(0);

    // * unhiding rebuilds the list from the filters, All included, in order
    selectFolder.mockClear();
    setExteralessSetting('HideAllTab', false);
    await vi.waitFor(() => expect(store.folderItems.map(({id}) => id)).toEqual([0, 2, 3]));
    expect(selectFolder).not.toHaveBeenCalled();
  });

  it('HideAllTab keeps the All tab when it would leave the bar empty', async() => {
    const allChats = makeDialogFilter(0, 0);
    mocks.filters.set(allChats.id, allChats);

    const useFolders = (await import('@stores/folders')).default;
    const {setExteralessSetting} = (await import('@stores/exteralessSettings'));
    const store = useFolders();
    store.setOnClick(() => vi.fn());

    await store.hydrateFilters([allChats]);
    expect(store.folderItems.map(({id}) => id)).toEqual([0]);

    setExteralessSetting('HideAllTab', true);
    await vi.waitFor(() => expect(store.folderItems.map(({id}) => id)).toEqual([0]));
  });
});
