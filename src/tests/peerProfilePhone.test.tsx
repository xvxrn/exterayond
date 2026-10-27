import {render} from 'solid-js/web';
import {createStore} from 'solid-js/store';
import '@helpers/peerIdPolyfill';
import PeerProfile from '@components/peerProfile';
import {exteralessSettings, setExteralessSetting} from '@stores/exteralessSettings';
import formatUserPhone from '@components/wrappers/formatUserPhone';

const mocks = vi.hoisted(() => ({
  peer: undefined as any,
  copyPhone: vi.fn(),
  copiedText: vi.fn(),
  baseDc: vi.fn(() => Promise.resolve(4)),
  collectible: vi.fn((_options: any) => {}),
  safeOpen: vi.fn(),
  contextMenu: vi.fn((_options: any) => ({destroy: vi.fn()}))
}));

vi.hoisted(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {configurable: true, value: () => 'data:image/webp;base64,'});
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {configurable: true, value: (): null => null});
});

vi.mock('@lib/rootScope', () => ({default: {
  myId: 1,
  managers: {},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  dispatchEventSingle: vi.fn()
}}));
vi.mock('@stores/peers', () => ({usePeer: () => mocks.peer, useChat: vi.fn()}));
vi.mock('@stores/fullPeers', () => ({useFullPeer: () => () => ({})}));
vi.mock('@stores/appState', () => ({appState: {}, useAppConfig: () => ({fragment_prefixes: ['888']})}));
vi.mock('@lib/solidjs/hotReloadGuard', () => ({
  useHotReloadGuard: () => ({
    i18n: (key: string, args: any[] = []) => [key, ...args].join(' '),
    toastNew: vi.fn(),
    rootScope: {myId: 1, managers: {apiManager: {getBaseDcId: mocks.baseDc}}, addEventListener: vi.fn(), removeEventListener: vi.fn()}
  })
}));
vi.mock('@helpers/copyContact', () => ({copyPhoneNumber: mocks.copyPhone, copyUsername: vi.fn()}));
vi.mock('@components/popups/collectibleInfo', () => ({default: mocks.collectible}));
vi.mock('@helpers/dom/safeWindowOpen', () => ({default: mocks.safeOpen}));
vi.mock('@helpers/dom/createContextMenu', () => ({default: mocks.contextMenu}));

// Unrelated profile surfaces are outside this focused component fixture.
vi.mock('@components/badge', () => ({default: vi.fn()}));
vi.mock('@components/section', () => ({default: vi.fn()}));
vi.mock('@components/skeleton', () => ({Skeleton: vi.fn()}));
vi.mock('@stores/communities', () => ({useCommunity: vi.fn(), useCommunityFull: vi.fn()}));
vi.mock('@hooks/usePeerTranslation', () => ({default: vi.fn()}));
vi.mock('@components/checkboxFieldTsx', () => ({default: vi.fn()}));
vi.mock('@components/stories/store', () => ({StoriesProvider: vi.fn(), useStories: vi.fn()}));
vi.mock('@components/wrappers/starsRating', () => ({wrapStarsRatingLevel: vi.fn()}));
vi.mock('@components/generateVerifiedIcon', () => ({default: vi.fn()}));
vi.mock('@components/iconTsx', () => ({IconTsx: vi.fn()}));
vi.mock('@components/avatarNew', () => ({StoriesSegments: vi.fn()}));
vi.mock('@lib/richTextProcessor/wrapEmojiText', () => ({default: vi.fn(), EmojiTextTsx: vi.fn()}));
vi.mock('@helpers/solid/wrapSolidComponent', () => ({wrapSolidComponent: vi.fn()}));
vi.mock('@components/popups/starGiftInfo', () => ({default: vi.fn()}));
vi.mock('@components/savedMusicActions', () => ({openSavedMusicTab: vi.fn()}));
vi.mock('@components/ripple', () => ({default: () => ({element: undefined as HTMLElement, dispose: vi.fn()})}));
vi.mock('@components/wrappers/photo', () => ({default: vi.fn()}));
vi.mock('@components/buttonTsx', () => ({default: vi.fn()}));
vi.mock('@components/popups/addBotToChat', () => ({default: vi.fn()}));
vi.mock('@components/popups/reportAd', () => ({showPeerReport: vi.fn()}));
vi.mock('@components/communities/communityPeerDialogList', () => ({default: vi.fn()}));
vi.mock('@lib/solidjs/hotReloadGuardProvider', () => ({hotReloadGuard: vi.fn()}));
vi.mock('@components/blockUser', () => ({default: vi.fn(), unblockUser: vi.fn()}));
vi.mock('@components/shareContact', () => ({default: vi.fn(), canShareContact: vi.fn()}));
vi.mock('@components/buttonMenuToggle', () => ({default: vi.fn(), filterButtonMenuItems: vi.fn()}));
vi.mock('@components/chat/joinChat', () => ({default: vi.fn()}));
vi.mock('@components/popups/deleteDialog', () => ({default: vi.fn()}));
vi.mock('@components/groupCall/hooks', () => ({useCurrentGroupCall: vi.fn()}));
vi.mock('@components/rtmp/hooks', () => ({useCurrentRtmpCall: vi.fn()}));
vi.mock('@components/addContact', () => ({default: vi.fn()}));
vi.mock('@components/popups/mute', () => ({default: vi.fn()}));

vi.mock('@appManagers/utils/communities/getLinkedCommunityId', () => ({default: vi.fn()}));
vi.mock('@helpers/clipboard', () => ({copyTextToClipboard: mocks.copiedText}));
vi.mock('@lib/accounts/bindManagersToAccount', () => ({bindManagersToSession: (value: unknown) => value}));
vi.mock('@helpers/dom/anchorCopy', () => ({default: vi.fn()}));
vi.mock('@helpers/detectLanguageForTranslation', () => ({default: vi.fn()}));
vi.mock('@helpers/getWebFileLocation', () => ({default: vi.fn()}));
vi.mock('@helpers/prepareTextWithEntitiesForCopying', () => ({default: vi.fn()}));
vi.mock('@helpers/getBotPrivacyPolicy', () => ({openBotPrivacyPolicy: vi.fn()}));
vi.mock('@environment/groupCallSupport', () => ({default: vi.fn()}));
vi.mock('@environment/liveStreamSupport', () => ({default: vi.fn()}));
vi.mock('@environment/callSupport', () => ({default: vi.fn()}));

let dispose: () => void;
let host: HTMLDivElement;
const originalSurfaces = new Map<string, unknown>();

beforeEach(() => {
  vi.clearAllMocks();
  for(const key of [
    'AutoAvatar', 'UnofficialWarning', 'PersonalChannel', 'BotMainApp',
    'LinkedCommunity', 'BotVerification', 'BotPermissions'
  ] as const) {
    originalSurfaces.set(key, PeerProfile[key]);
    PeerProfile[key] = (() => null) as typeof PeerProfile[typeof key];
  }
  originalSurfaces.set('MainSection', PeerProfile.MainSection);
  PeerProfile.MainSection = () => <PeerProfile.Phone />;
  setExteralessSetting('HidePhone', true);
  setExteralessSetting('IdDcType', 1);
  host = document.createElement('div');
  document.body.append(host);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  host?.remove();
  for(const [key, original] of originalSurfaces) {
    (PeerProfile as unknown as Record<string, unknown>)[key] = original;
  }
  originalSurfaces.clear();
  vi.restoreAllMocks();
  setExteralessSetting('HidePhone', true);
});

function mount(peerId: number, phone?: string, isDialog = false) {
  const [peer, setPeer] = createStore({_: 'user', pFlags: {}, phone, id: Math.abs(peerId), photo: undefined as any});
  mocks.peer = peer;
  dispose = render(() => <PeerProfile
    peerId={peerId as PeerId}
    isDialog={isDialog}
    scrollable={undefined}
    setCollapsedOn={host}
  />, host);
  return setPeer;
}

const row = () => host.querySelector<HTMLElement>('.row');

describe('GEN-07 profile ID and data center', () => {
  it('keeps user IDs stable across formats, copies them, and removes the hidden row', () => {
    PeerProfile.MainSection = () => <PeerProfile.IdAndDc />;
    const setPeer = mount(2);
    setPeer('photo', {_: 'userProfilePhoto', dc_id: 3});
    expect(row().querySelector('.row-title').textContent).toBe('2');
    expect(row().textContent).toContain('Exteraless.ProfileId.Dc 3');
    row().click();
    expect(mocks.copiedText).toHaveBeenCalledWith('2');
    setExteralessSetting('IdDcType', 2);
    expect(row().querySelector('.row-title').textContent).toBe('2');
    setExteralessSetting('IdDcType', 0);
    expect(row()).toBeNull();
    expect(mocks.baseDc).not.toHaveBeenCalled();
  });

  it('formats groups and channels using the Bot API offset, including small IDs', () => {
    PeerProfile.MainSection = () => <PeerProfile.IdAndDc />;
    const setPeer = mount(-123);
    setPeer('_', 'chat');
    expect(row().querySelector('.row-title').textContent).toBe('123');
    setExteralessSetting('IdDcType', 2);
    expect(row().querySelector('.row-title').textContent).toBe('-123');
    setPeer('_', 'channel');
    expect(row().querySelector('.row-title').textContent).toBe('-1000000000123');
    expect(row().textContent).toContain('Exteraless.ProfileId.DcUnknown');
    expect(row().querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('uses the current connection DC for self, and makes no lookup while hidden', async() => {
    PeerProfile.MainSection = () => <PeerProfile.IdAndDc />;
    setExteralessSetting('IdDcType', 0);
    mount(1);
    expect(row()).toBeNull();
    expect(mocks.baseDc).not.toHaveBeenCalled();
    setExteralessSetting('IdDcType', 1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.baseDc).toHaveBeenCalledTimes(1);
    expect(row().textContent).toContain('Exteraless.ProfileId.Dc 4');
  });
});

describe('PeerProfile.Phone local own-number visibility', () => {
  it('removes own phone from the DOM and reacts to the preference in place', () => {
    const phone = '12025550123'; // synthetic reserved example number
    mount(1, phone);
    expect(exteralessSettings.HidePhone).toBe(true);
    expect(row()).toBeNull();
    expect(host.innerHTML).not.toContain(phone);

    setExteralessSetting('HidePhone', false);
    expect(row()?.textContent).toContain(formatUserPhone(phone));
    expect(row()?.querySelector('[dir="ltr"]')).not.toBeNull();
    row().click();
    expect(mocks.copyPhone).toHaveBeenCalledWith(formatUserPhone(phone));
    const menu = mocks.contextMenu.mock.calls[mocks.contextMenu.mock.calls.length - 1][0];
    menu.buttons[0].onClick();
    expect(mocks.copyPhone).toHaveBeenCalledTimes(2);

    setExteralessSetting('HidePhone', true);
    expect(row()).toBeNull();
    expect(host.textContent).not.toContain(formatUserPhone(phone));
    expect(host.querySelector('[hidden], [style*="display: none"]')).toBeNull();
  });

  it('keeps contact numbers visible with hiding enabled or disabled', () => {
    mount(2, '12025550124');
    expect(row()?.textContent).toContain(formatUserPhone('12025550124'));
    setExteralessSetting('HidePhone', false);
    expect(row()?.textContent).toContain(formatUserPhone('12025550124'));
    setExteralessSetting('HidePhone', true);
    row().click();
    expect(mocks.copyPhone).toHaveBeenCalledWith(formatUserPhone('12025550124'));
  });

  it('preserves anonymous phone lookup, fallback copy and information link', () => {
    mount(1, '88800000001'); // synthetic anonymous number
    setExteralessSetting('HidePhone', false);
    row().click();
    expect(mocks.collectible).toHaveBeenCalledWith({peerId: 1, phone: '88800000001', onFail: expect.any(Function)});
    mocks.collectible.mock.calls[0][0].onFail();
    expect(mocks.copyPhone).toHaveBeenCalledWith(formatUserPhone('88800000001'));
    const menu = mocks.contextMenu.mock.calls[mocks.contextMenu.mock.calls.length - 1][0];
    expect(menu.buttons[1].verify()).toBe(true);
    menu.buttons[1].onClick();
    expect(mocks.safeOpen).toHaveBeenCalledWith('https://fragment.com/numbers');
  });

  it.each([1, 2])('renders no missing phone for peer %s, including preference changes', (peerId) => {
    const setPeer = mount(peerId);
    expect(row()).toBeNull();
    setExteralessSetting('HidePhone', false);
    expect(row()).toBeNull();
    setPeer('phone', '12025550125');
    expect(row()).not.toBeNull();
    setPeer('phone', undefined);
    expect(row()).toBeNull();
  });

  it('keeps the existing own-dialog detail guard with either preference value', () => {
    mount(1, '12025550126', true);
    expect(row()).toBeNull();
    setExteralessSetting('HidePhone', false);
    expect(row()).toBeNull();
  });

  it('keeps non-user peers without a phone row', () => {
    mount(-3, '12025550127');
    setExteralessSetting('HidePhone', false);
    expect(row()).toBeNull();
  });
});
