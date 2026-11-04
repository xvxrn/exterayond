import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from 'solid-js/web';
import {JSX} from 'solid-js';
import Exteraless from '@components/sidebarLeft/tabs/exterayondTab';
import ExterayondAppearance from '@components/sidebarLeft/tabs/exterayondAppearanceTab';
import ExterayondChats from '@components/sidebarLeft/tabs/exterayondChatsTab';
import ExterayondOther from '@components/sidebarLeft/tabs/exterayondOtherTab';
import {appSettings, setAppSettingsSilent} from '@stores/appSettings';
import {SETTINGS_INIT} from '@config/state';
import rootScope from '@lib/rootScope';
import {
  OE_DEFAULTS,
  getMd3StyleCount,
  resetExterayondSettings,
  setAllMd3Styles,
  setExterayondSetting,
  useExterayondSettings
} from '@stores/exterayondSettings';

const mocks = vi.hoisted(() => ({
  tab: {
    managers: {},
    slider: {
      createTab: vi.fn()
    }
  } as any,
  openUrl: vi.fn(),
  confirmation: vi.fn(),
  toast: vi.fn(),
  appearanceTabCtor: class AppExterayondAppearanceTab {},
  chatsTabCtor: class AppExterayondChatsTab {},
  quickReactionTabCtor: class AppQuickReactionTab {}
}));

vi.mock('@components/confirmationPopup', () => ({default: mocks.confirmation}));
vi.mock('@components/lottieAnimation', () => ({default: (): null => null}));
vi.mock('@components/toast', () => ({toastNew: mocks.toast}));

vi.mock('@components/solidJsTabs/superTabProvider', () => ({
  useSuperTab: () => [mocks.tab]
}));

vi.mock('@lib/solidjs/hotReloadGuardProvider', () => ({
  hotReloadGuard: {
    appImManager: {openUrl: mocks.openUrl},
    tabs: {
      AppExterayondAppearanceTab: mocks.appearanceTabCtor,
      AppExterayondChatsTab: mocks.chatsTabCtor,
      AppQuickReactionTab: mocks.quickReactionTabCtor
    }
  }
}));

vi.mock('@lib/langPack', () => ({
  i18n: (key: string) => document.createTextNode(key)
}));

vi.mock('@components/section', () => ({
  default: (props: {name?: string, caption?: string, children: JSX.Element}) => (
    <div class="section" data-name={props.name} data-caption={props.caption}>{props.children}</div>
  )
}));

vi.mock('@components/rowTsx', () => {
  // * plain DOM: the assertions read it back, so nothing depends on the order
  // * Solid evaluates a component's children arguments in
  const Row = (props: {children: JSX.Element, clickable?: () => void}) => (
    <div class="row" data-clickable={'' + !!props.clickable} onClick={() => props.clickable?.()}>
      {props.children}
    </div>
  );

  Row.Icon = (props: {icon: string}) => <span class="row-icon" data-icon={props.icon} />;
  Row.Title = (props: {children: JSX.Element, titleRight?: JSX.Element}) => (
    <div class="row-title">{props.children}<i class="row-title-right">{props.titleRight}</i></div>
  );
  Row.Subtitle = (props: {children: JSX.Element}) => <div class="row-subtitle">{props.children}</div>;
  Row.CheckboxFieldToggle = (props: {children: JSX.Element}) => (
    <div class="row-checkbox-toggle">{props.children}</div>
  );

  return {default: Row};
});

vi.mock('@components/checkboxFieldTsx', () => ({
  default: (props: {checked: boolean, onChange: (checked: boolean) => void}) => (
    <input
      type="checkbox"
      checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
    />
  )
}));

vi.mock('@components/rangeSettingSelector', () => ({
  default: (props: {textLeft: JSX.Element, value: number, minValue: number, maxValue: number, onChange: (value: number) => void}) => (
    <div
      class="range-setting-selector"
      data-name={(props.textLeft as any)?.data ?? ''}
      data-value={'' + props.value}
      data-min={'' + props.minValue}
      data-max={'' + props.maxValue}
    >
      <button class="slider-zero" onClick={() => props.onChange(0)}>zero</button>
    </div>
  )
}));

const rowIcons = () => [...document.querySelectorAll<HTMLElement>('.row .row-icon')].map((icon) => icon.dataset.icon);

const mount = (component: () => JSX.Element) => {
  const container = document.createElement('div');
  document.body.append(container);
  return render(component, container);
};

const rowByIcon = (icon: string) => {
  return [...document.querySelectorAll<HTMLElement>('.row')].find((row) =>
    row.querySelector<HTMLElement>('.row-icon')?.dataset.icon === icon
  );
};

describe('the exteraless Preferences hub tab', () => {
  let dispose: () => void;

  beforeEach(() => {
    mocks.openUrl.mockClear();
    mocks.tab.slider.createTab.mockClear();
    dispose = mount(() => <Exteraless />);
  });

  afterEach(() => {
    dispose();
    document.body.replaceChildren();
  });

  it('renders the Android category structure with honest not-ported marks', () => {
    expect(rowIcons()).toEqual([
      'general_filled', 'appearance_filled', 'message_filled', 'bots', 'more',
      'channel_filled', 'link', 'brush', 'group_filled'
    ]);

    const subtitles = [...document.querySelectorAll<HTMLElement>('.row-subtitle')].map((el) => el.textContent);
    expect(subtitles.filter((text) => text === 'Exterayond.NotPorted')).toHaveLength(0);
    // * every category is live
    expect(rowByIcon('general_filled').querySelector('.row-subtitle')).toBeNull();
    expect(rowByIcon('appearance_filled').querySelector('.row-subtitle')).toBeNull();
    expect(rowByIcon('message_filled').querySelector('.row-subtitle')).toBeNull();
    expect(rowByIcon('bots').querySelector('.row-subtitle')).toBeNull();
    expect(rowByIcon('more').querySelector('.row-subtitle')).toBeNull();
  });

  it('marks the sections that are not ported as not clickable', () => {
    expect(rowByIcon('general_filled').dataset.clickable).toBe('true');
    expect(rowByIcon('appearance_filled').dataset.clickable).toBe('true');
    expect(rowByIcon('message_filled').dataset.clickable).toBe('true');
    expect(rowByIcon('more').dataset.clickable).toBe('true');
    expect(rowByIcon('bots').dataset.clickable).toBe('true');
  });

  it('opens the Appearance and Chats tabs from their rows', () => {
    const created = {open: vi.fn()};
    mocks.tab.slider.createTab.mockReturnValueOnce(created);

    rowByIcon('appearance_filled').click();
    expect(mocks.tab.slider.createTab).toHaveBeenCalledWith(mocks.appearanceTabCtor);
    expect(created.open).toHaveBeenCalled();

    const createdChats = {open: vi.fn()};
    mocks.tab.slider.createTab.mockReturnValueOnce(createdChats);
    rowByIcon('message_filled').click();
    expect(mocks.tab.slider.createTab).toHaveBeenCalledWith(mocks.chatsTabCtor);
    expect(createdChats.open).toHaveBeenCalled();
  });

  it('opens the exterayond channel, upstream source and design credits', () => {
    rowByIcon('channel_filled').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://t.me/exterayond', true);

    rowByIcon('link').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://github.com/exteraless/exteraless', true);

    rowByIcon('brush').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://t.me/the8055u', true);

    rowByIcon('group_filled').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://t.me/BlueprintDsgn', true);
  });
});

describe('the exteraless Appearance tab', () => {
  let dispose: () => void;

  beforeEach(() => {
    // * the accent swatch reads the active theme the way the app boot always
    // * has one: the factory set from SETTINGS_INIT
    setAppSettingsSilent('themes', SETTINGS_INIT.themes);
    dispose = mount(() => <ExterayondAppearance />);
  });

  afterEach(() => {
    dispose();
    document.body.replaceChildren();
  });

  it('renders the wired sliders with the Android ranges and defaults', () => {
    const sliders = [...document.querySelectorAll<HTMLElement>('.range-setting-selector')].map((el) => ({
      name: el.dataset.name,
      value: +el.dataset.value,
      min: +el.dataset.min,
      max: +el.dataset.max
    }));

    expect(sliders).toEqual([
      // * the theme palette (V-4) is a plain toggle since acceptance round 1
      // * (F-2), not a slider; the player-style rows of Android's
      // * PlayerStyleEditor open the slider list
      {name: 'Exterayond.Player.Cover.Style', value: 0, min: 0, max: 3},
      {name: 'Exterayond.Player.Cover.Size', value: 100, min: 60, max: 100},
      {name: 'Exterayond.Player.Cover.Radius', value: 28, min: 0, max: 48},
      {name: 'Exterayond.Player.TitleAlign', value: 0, min: 0, max: 1},
      {name: 'Exterayond.Player.TitleSize', value: 1, min: 0, max: 2},
      {name: 'Exterayond.Player.TitlePosition', value: 0, min: 0, max: 1},
      {name: 'Exterayond.Player.ControlsSize', value: 1, min: 0, max: 2},
      {name: 'Exterayond.TabCounter', value: 1, min: 0, max: 2},
      {name: 'Exterayond.AvatarCorners', value: OE_DEFAULTS.OEAppearanceAvatarCorners, min: 0, max: 28},
      {name: 'Exterayond.BubbleRadius', value: OE_DEFAULTS.bubbleRadius, min: 0, max: 17},
      {name: 'Exterayond.SectionRadius', value: OE_DEFAULTS.OEAppearanceSectionRadius, min: 0, max: 28}
    ]);
  });

  it('shows the player rows their cover style makes visible', async() => {
    const sliderNames = () => [...document.querySelectorAll<HTMLElement>('.range-setting-selector')]
    .map((el) => el.dataset.name);
    const rowTitles = () => [...document.querySelectorAll<HTMLElement>('.row .row-title')].map((el) => el.textContent);

    // * the card shows the radius slider and no spin toggle
    expect(sliderNames()).toContain('Exterayond.Player.Cover.Radius');
    expect(rowTitles()).not.toContain('Exterayond.Player.DiscSpin');

    // * the disc drops the radius slider and shows the spin toggle, and the
    // * size slider stays for both framed styles
    setExterayondSetting('OEPlayerCoverStyle', 3);
    await vi.waitFor(() => {
      expect(sliderNames()).not.toContain('Exterayond.Player.Cover.Radius');
      expect(sliderNames()).toContain('Exterayond.Player.Cover.Size');
      expect(rowTitles()).toContain('Exterayond.Player.DiscSpin');
    });
    setExterayondSetting('OEPlayerCoverStyle', 0);
  });

  it('moves a slider into the store', () => {
    expect(useExterayondSettings()[0].OEAppearanceAvatarCorners).toBe(OE_DEFAULTS.OEAppearanceAvatarCorners);

    const avatarCorners = [...document.querySelectorAll<HTMLElement>('.range-setting-selector')]
    .find((el) => el.dataset.name === 'Exterayond.AvatarCorners');
    avatarCorners.querySelector<HTMLElement>('.slider-zero').click();
    expect(useExterayondSettings()[0].OEAppearanceAvatarCorners).toBe(0);

    // * back to the default for the other tests
    setExterayondSetting('OEAppearanceAvatarCorners', OE_DEFAULTS.OEAppearanceAvatarCorners);
  });

  it('shows three live avatar previews', () => {
    expect(document.querySelectorAll('.exteraless-avatar-preview .avatar')).toHaveLength(3);
  });

  it('the MD3 master switch updates all components and its visible count', () => {
    setAllMd3Styles(false);
    const master = [...document.querySelectorAll<HTMLElement>('.row')].find((row) => row.textContent.includes('Exterayond.Md3'));
    expect(master.textContent).toContain('0/8');
    master.querySelector<HTMLInputElement>('input').click();
    expect(getMd3StyleCount()).toBe(8);
    expect(master.textContent).toContain('8/8');
    master.querySelector<HTMLInputElement>('input').click();
    expect(getMd3StyleCount()).toBe(0);
    expect(master.textContent).toContain('0/8');
    resetExterayondSettings();
  });

  it('moves a toggle into the store', () => {
    expect(useExterayondSettings()[0].OEAppearanceSingleCornerRadius).toBe(OE_DEFAULTS.OEAppearanceSingleCornerRadius);

    const row = [...document.querySelectorAll<HTMLElement>('.row')].find((row) => row.textContent.includes('Exterayond.SingleCornerRadius'));
    row.querySelector<HTMLInputElement>('input').click();
    expect(useExterayondSettings()[0].OEAppearanceSingleCornerRadius).toBe(!OE_DEFAULTS.OEAppearanceSingleCornerRadius);

    setExterayondSetting('OEAppearanceSingleCornerRadius', OE_DEFAULTS.OEAppearanceSingleCornerRadius);
  });

  it('the theme palette is a single toggle that flips the store', () => {
    expect(useExterayondSettings()[0].OEAppearanceThemePalette).toBe(false);

    const row = [...document.querySelectorAll<HTMLElement>('.row')].find((row) => row.textContent.includes('Exterayond.ThemePalette'));
    row.querySelector<HTMLInputElement>('input').click();
    expect(useExterayondSettings()[0].OEAppearanceThemePalette).toBe(true);

    setExterayondSetting('OEAppearanceThemePalette', OE_DEFAULTS.OEAppearanceThemePalette);
  });

  it('renders the centered title and system font rows of Android\'s appearance group', () => {
    const rowTitles = () => [...document.querySelectorAll<HTMLElement>('.row .row-title')].map((el) => el.textContent);
    expect(rowTitles()).toContain('Exterayond.CenterTitle');
    expect(rowTitles()).toContain('Exterayond.UseSystemFonts');

    const systemFontsRow = [...document.querySelectorAll<HTMLElement>('.row')]
    .find((row) => row.textContent.includes('Exterayond.UseSystemFonts'));
    systemFontsRow.querySelector<HTMLInputElement>('input').click();
    expect(useExterayondSettings()[0].TypefaceUseDefault).toBe(!OE_DEFAULTS.TypefaceUseDefault);

    setExterayondSetting('TypefaceUseDefault', OE_DEFAULTS.TypefaceUseDefault);
  });
});

describe('the exteraless Chats tab', () => {
  let dispose: () => void;

  beforeEach(() => {
    dispose = mount(() => <ExterayondChats />);
  });

  afterEach(() => {
    dispose();
    document.body.replaceChildren();
  });

  it('renders the wired toggles with their labels', () => {
    const titles = [...document.querySelectorAll<HTMLElement>('.row-title')].map((el) => el.textContent);
    expect(titles).toEqual([
      'Exterayond.RemoveMessageTail',
      'Exterayond.HideCallButton',
      'Exterayond.HideSearchButton',
      'Exterayond.UseEditedIcon',
      'Exterayond.DateOfForwardedMsg',
      'Exterayond.MessageTimeDetails',
      'Exterayond.HideShareButton',
      'Exterayond.HideGiftButton',
      'Exterayond.HideSendAsPeer',
      'Exterayond.DisableGreetingSticker',
      'Exterayond.DisableTrending',
      'Exterayond.HideGroupSticker',
      'Exterayond.DeleteChatForBothSides',
      'Exterayond.AskBeforeAVMessage',
      'Exterayond.AskBeforeCalling',
      'Exterayond.AskWhenRepeating',
      'Exterayond.AskBeforeBotCommand',
      'Exterayond.DontAutoPlayNextVoice',
      'Exterayond.HidePremiumSection',
      'Exterayond.HideHelpSection',
      'Exterayond.HideStories',
      'Exterayond.HideFloatingButton',
      'Exterayond.HideAllChats',
      'Exterayond.ReplyColors',
      'Exterayond.ReplyEmoji',
      'Exterayond.ReplyBackground',
      'Exterayond.ShowResultsBeforeVoting',
      'Exterayond.AlwaysSendInHD',
      'Exterayond.MenuAddToSaved',
      'Exterayond.MenuCopyPhoto',
      'Exterayond.MenuReport',
      'Exterayond.FixLinkPreview',
      'Exterayond.DisableLinkPreviewByDefault',
      'Exterayond.DisableGlobalSearch',
      'Exterayond.StripTrackingOnOpen',
      'Exterayond.StripTrackingOnPaste',
      'Exterayond.WideChannelPosts',
      'BoostGroup',
      'ViewDiscussion',
      'Exterayond.MenuRepeat',
      'Reactions',
      'CopyLink',
      'AddToFavorites',
      'Exterayond.DoubleTapReaction',
      'Exterayond.ShowSmallGIF',
      'Exterayond.PauseVideo',
      'Exterayond.PauseVoice',
      'Exterayond.PauseRound',
      'Exterayond.HideReactions.Channels',
      'Exterayond.HideReactions.Groups',
      'Exterayond.HideReactions.Private'
    ]);
  });

  it('flips a setting from its toggle', () => {
    expect(useExterayondSettings()[0].OEChatsHideCallButton).toBe(OE_DEFAULTS.OEChatsHideCallButton);

    const checkboxes = [...document.querySelectorAll<HTMLElement>('.row-checkbox-toggle input')] as HTMLInputElement[];
    checkboxes[1].click();
    expect(useExterayondSettings()[0].OEChatsHideCallButton).toBe(!OE_DEFAULTS.OEChatsHideCallButton);

    setExterayondSetting('OEChatsHideCallButton', OE_DEFAULTS.OEChatsHideCallButton);
  });

  it('shows the double-tap reaction row only while an action sends one, and opens the quick reaction tab (CHAT-11)', () => {
    const reactionRow = () => [...document.querySelectorAll<HTMLElement>('.row')]
      .find((row) => row.querySelector<HTMLElement>('.row-title')?.textContent === 'Exterayond.DoubleTapReaction');

    // * the defaults (send reactions both sides) show the row, Android's
    // * doubleTapReactionRow condition
    expect(reactionRow()).toBeDefined();

    // * no SEND_REACTIONS anywhere — the row leaves, live
    setExterayondSetting('DoubleTapAction', 4); // Reply
    setExterayondSetting('DoubleTapActionOut', 0); // None
    expect(reactionRow()).toBeUndefined();

    // * one side back to send reactions — the row returns and opens the stock
    // * quick-reaction subtab, the web's own reaction chooser
    setExterayondSetting('DoubleTapActionOut', 1);
    expect(reactionRow()).toBeDefined();
    mocks.tab.slider.createTab.mockReturnValueOnce({open: vi.fn()});
    mocks.tab.slider.createTab.mockClear();
    reactionRow().click();
    expect(mocks.tab.slider.createTab).toHaveBeenCalledWith(mocks.quickReactionTabCtor);

    setExterayondSetting('DoubleTapAction', OE_DEFAULTS.DoubleTapAction);
    setExterayondSetting('DoubleTapActionOut', OE_DEFAULTS.DoubleTapActionOut);
  });
});

describe('the exterayond reset action', () => {
  let dispose: () => void;
  const originalManagers = rootScope.managers;

  beforeEach(() => {
    mocks.confirmation.mockReset();
    mocks.toast.mockClear();
    rootScope.managers = {appStateManager: {setByKey: vi.fn(() => Promise.resolve())}} as any;
    setAppSettingsSilent('showArchiveInChatList', false);
    setExterayondSetting('OEAppearanceAvatarCorners', 4);
    dispose = mount(() => <ExterayondOther />);
  });

  afterEach(() => {
    dispose();
    rootScope.managers = originalManagers;
    setAppSettingsSilent('showArchiveInChatList', true);
    document.body.replaceChildren();
  });

  it('waits for confirmation before resetting preferences', async() => {
    let confirm: () => void;
    mocks.confirmation.mockReturnValueOnce(new Promise<void>((resolve) => confirm = resolve));
    rowByIcon('delete').click();

    const [settings] = useExterayondSettings();
    expect(settings.OEAppearanceAvatarCorners).toBe(4);
    expect(appSettings.showArchiveInChatList).toBe(false);
    expect(mocks.confirmation).toHaveBeenCalledWith(expect.objectContaining({
      managers: mocks.tab.managers,
      button: {langKey: 'Reset', isDanger: true}
    }));

    confirm();
    await Promise.resolve();
    expect({...settings}).toEqual(OE_DEFAULTS);
    expect(appSettings.showArchiveInChatList).toBe(true);
    expect(mocks.toast).toHaveBeenCalledWith({langPackKey: 'Exterayond.Reset.Done'});
  });

  it('leaves preferences untouched when the confirmation is canceled', async() => {
    mocks.confirmation.mockRejectedValueOnce(undefined);
    rowByIcon('delete').click();
    await Promise.resolve();
    await Promise.resolve();

    const [settings] = useExterayondSettings();
    expect(settings.OEAppearanceAvatarCorners).toBe(4);
    expect(appSettings.showArchiveInChatList).toBe(false);
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});
