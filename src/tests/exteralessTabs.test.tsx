import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from 'solid-js/web';
import {JSX} from 'solid-js';
import Exteraless from '@components/sidebarLeft/tabs/exteralessTab';
import ExteralessAppearance from '@components/sidebarLeft/tabs/exteralessAppearanceTab';
import {
  OE_DEFAULTS,
  setExteralessSetting,
  useExteralessSettings
} from '@stores/exteralessSettings';

const mocks = vi.hoisted(() => ({
  tab: {
    slider: {
      createTab: vi.fn()
    }
  } as any,
  openUrl: vi.fn(),
  appearanceTabCtor: class AppExteralessAppearanceTab {}
}));

vi.mock('@components/solidJsTabs/superTabProvider', () => ({
  useSuperTab: () => [mocks.tab]
}));

vi.mock('@lib/solidjs/hotReloadGuardProvider', () => ({
  hotReloadGuard: {
    tabs: {
      AppExteralessAppearanceTab: mocks.appearanceTabCtor
    }
  }
}));

vi.mock('@lib/appImManager', () => ({
  default: {openUrl: mocks.openUrl}
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

  return {default: Row};
});

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

  it('renders the Android category structure with honest not-ported marks', () => {    expect(rowIcons()).toEqual([
      'general_filled', 'appearance_filled', 'message_filled', 'bots', 'more',
      'channel_filled', 'link', 'brush', 'group_filled'
    ]);

    const subtitles = [...document.querySelectorAll<HTMLElement>('.row-subtitle')].map((el) => el.textContent);
    expect(subtitles.filter((text) => text === 'Exteraless.NotPorted')).toHaveLength(4);
    // * the Appearance row is the one working category — it has no not-ported mark
    expect(rowByIcon('appearance_filled').querySelector('.row-subtitle')).toBeNull();
  });

  it('marks the sections that are not ported as not clickable', () => {
    expect(rowByIcon('general_filled').dataset.clickable).toBe('false');
    expect(rowByIcon('appearance_filled').dataset.clickable).toBe('true');
  });

  it('opens the Appearance tab from its row', () => {
    const created = {open: vi.fn()};
    mocks.tab.slider.createTab.mockReturnValueOnce(created);

    rowByIcon('appearance_filled').click();
    expect(mocks.tab.slider.createTab).toHaveBeenCalledWith(mocks.appearanceTabCtor);
    expect(created.open).toHaveBeenCalled();
  });

  it('opens the exteraless links and design credits', () => {
    rowByIcon('channel_filled').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://t.me/exteraless');

    rowByIcon('link').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://github.com/exteraless/exteraless');

    rowByIcon('brush').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://t.me/the8055u');

    rowByIcon('group_filled').click();
    expect(mocks.openUrl).toHaveBeenCalledWith('https://t.me/BlueprintDsgn');
  });
});

describe('the exteraless Appearance tab', () => {
  let dispose: () => void;

  beforeEach(() => {
    dispose = mount(() => <ExteralessAppearance />);
  });

  afterEach(() => {
    dispose();
    document.body.replaceChildren();
  });

  it('renders the two wired sliders with the Android ranges and defaults', () => {
    const sliders = [...document.querySelectorAll<HTMLElement>('.range-setting-selector')].map((el) => ({
      name: el.dataset.name,
      value: +el.dataset.value,
      min: +el.dataset.min,
      max: +el.dataset.max
    }));

    expect(sliders).toEqual([
      {name: 'Exteraless.AvatarCorners', value: OE_DEFAULTS.OEAppearanceAvatarCorners, min: 0, max: 28},
      {name: 'Exteraless.SectionRadius', value: OE_DEFAULTS.OEAppearanceSectionRadius, min: 0, max: 28}
    ]);
  });

  it('moves a slider into the store', () => {
    expect(useExteralessSettings()[0].OEAppearanceAvatarCorners).toBe(OE_DEFAULTS.OEAppearanceAvatarCorners);

    const avatarCorners = [...document.querySelectorAll<HTMLElement>('.range-setting-selector')]
    .find((el) => el.dataset.name === 'Exteraless.AvatarCorners');
    avatarCorners.querySelector<HTMLElement>('.slider-zero').click();
    expect(useExteralessSettings()[0].OEAppearanceAvatarCorners).toBe(0);

    // * back to the default for the other tests
    setExteralessSetting('OEAppearanceAvatarCorners', OE_DEFAULTS.OEAppearanceAvatarCorners);
  });

  it('shows three live avatar previews', () => {
    expect(document.querySelectorAll('.exteraless-avatar-preview .avatar')).toHaveLength(3);
  });
});
