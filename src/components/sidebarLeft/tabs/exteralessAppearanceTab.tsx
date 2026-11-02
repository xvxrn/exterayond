import {createSignal, onCleanup} from 'solid-js';
import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import type {ColorPickerColor} from '@components/colorPicker';
import {i18n} from '@lib/langPack';
import rootScope from '@lib/rootScope';
import themeController from '@helpers/themeController';
import {subscribeOn} from '@helpers/solid/subscribeOn';
import {useSuperTab} from '@components/solidJsTabs/superTabProvider';
import {hotReloadGuard} from '@lib/solidjs/hotReloadGuardProvider';
import {accentPresetFromColor, materialWallpaperFromAccent} from '@config/themePresets';
import type {AccentPreset} from '@config/themePresets';
import type {WallPaper} from '@layer';
import {
  OE_AVATAR_CORNERS_MAX,
  OE_PLAYER_COVER_RADIUS_MAX,
  OE_PLAYER_COVER_SIZE_MAX,
  OE_PLAYER_COVER_SIZE_MIN,
  exteralessSettings,
  getPlayerCoverStyle,
  getMd3StyleCount,
  setAllMd3Styles,
  useExteralessSettings
} from '@stores/exteralessSettings';

/**
 * The Appearance category of the exteraless Preferences hub. Every control is
 * a ported Android setting with its behavior wired into Web K (the CSS choke
 * points named in src/stores/exteralessSettings.ts); ranges, defaults and
 * labels follow `OpenExteraAppearanceActivity`. The player-style group ports
 * the rows of Android's `PlayerStyleEditor`; the visibility of dependent rows
 * follows its `refreshVisibility`.
 */

// * how long after the last picked color the custom accent commits through
// * the full applyAccentPreset pipeline (persist + background + transition)
const ACCENT_COMMIT_DELAY = 800;

/**
 * V-4 ladder 2 — a per-theme accent color picker. The stock General tab's
 * picker only offers shipped presets; this one takes any color through the
 * same pipeline. While the color is being dragged a live preview writes the
 * accent variables directly (`applyTheme` — no persistence, no view
 * transition) and the debounced commit goes through `applyAccentPreset`,
 * which persists the synthetic 'preset:' theme into the app's own theme state
 * (so the pick survives a reload) without ever touching the stock theme
 * objects in `SETTINGS_INIT`. Reset sends the current theme back to its
 * factory entry, the stock picker's "Default" swatch.
 *
 * Acceptance round 1 (F-3): while the theme-palette toggle is on, the accent
 * goes Material-You — the committed preset carries an accent-hued wallpaper
 * with the shared pattern (the background follows the accent and keeps its
 * material elements), and the palette tints every surface with the accent's
 * hue. An explicit background pick (a "Set a color" choice, an upload, a grid
 * pick) is never replaced.
 */

/**
 * Whether the current theme's wallpaper belongs to the user rather than to
 * the theme/preset pipeline: `pFlags.default` marks the factory record and
 * the preset pipeline's own builds, everything else — a "Set a color" pick,
 * an upload, a grid pick — is an explicit user choice that the accent's
 * material wallpaper must not replace.
 */
const isUserOwnedWallpaper = () => {
  const wallPaper = themeController.getThemeSettings(themeController.getTheme())?.wallpaper as WallPaper.wallPaper | undefined;
  return !!wallPaper && !wallPaper.pFlags?.default;
};

const buildCustomAccentPreset = (accentColor: number): AccentPreset => {
  const base = themeController.getBaseThemeForName(themeController.getTheme().name);
  const preset = accentPresetFromColor(accentColor, base);
  if(exteralessSettings.OEAppearanceThemePalette && !isUserOwnedWallpaper()) {
    preset.wallpaper = materialWallpaperFromAccent(accentColor, base);
  }
  return preset;
};

const AccentColorSection = () => {
  // * the picker loads when the reveal first opens: the color picker drags
  // * the custom-emoji renderer's module graph with it, which a settings tab
  // * has no reason to carry up front
  let containerEl: HTMLDivElement | undefined;
  let autoResizeDisposer: (() => void) | undefined;
  let picker: import('@components/colorPicker').default | undefined;
  let commitTimer: ReturnType<typeof setTimeout>;
  let previewed = false;

  // * the applied accent, for the row's swatch; follows every theme change
  const [appliedHex, setAppliedHex] = createSignal(currentAccentHex());
  subscribeOn(rootScope)('theme_changed', () => setAppliedHex(currentAccentHex()));

  function currentAccentHex() {
    const settings = themeController.getThemeSettings(themeController.getTheme());
    const accent = settings?.accent_color;
    return accent !== undefined ? '#' + accent.toString(16).padStart(6, '0') : '#8774e1';
  }

  const preview = (hex: string) => {
    previewed = true;
    themeController.applyTheme(themeController.buildAccentPresetTheme(buildCustomAccentPreset(parseInt(hex.slice(1), 16))));
  };

  const commit = () => {
    clearTimeout(commitTimer);
    if(!previewed || !picker) {
      return;
    }

    previewed = false;
    void themeController.applyAccentPreset(buildCustomAccentPreset(parseInt(picker.getCurrentColor().hex.slice(1), 16)));
  };

  const scheduleCommit = () => {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(commit, ACCENT_COMMIT_DELAY);
  };

  const onColorChange = (color: ColorPickerColor) => {
    preview(color.hex);
    scheduleCommit();
  };

  const loadPicker = async() => {
    if(picker || !containerEl) {
      return;
    }

    const ColorPicker = (await import('@components/colorPicker')).default;
    if(!containerEl) {
      return;
    }

    picker = new ColorPicker();
    containerEl.append(picker.container);
    autoResizeDisposer = picker.attachAutoResize();
    picker.setColor(currentAccentHex());
    picker.onChange = onColorChange;
  };

  onCleanup(() => {
    if(picker) picker.onChange = undefined;
    autoResizeDisposer?.();
    // * a close mid-drag still lands the last picked color
    commit();
  });

  return (
    <Section name="Exteraless.AccentColor" caption="Exteraless.AccentColor.Info">
      <Row>
        <Row.Title>{i18n('Exteraless.AccentColor')}</Row.Title>
        <span class="exteraless-accent-swatch" style={{'background-color': appliedHex()}} />
      </Row>
      <details
        class="exterayond-options-reveal"
        ref={(el) => el.addEventListener('toggle', () => {
          if((el as HTMLDetailsElement).open) {
            void loadPicker();
          }
        })}
      >
        <summary>{i18n('Exteraless.AccentColor.Customize')}</summary>
        <div
          class="exteraless-accent-picker"
          ref={(el) => {
            containerEl = el;
            if(el.isConnected) {
              void loadPicker();
            }
          }}
        />
        <Row clickable={() => {
          previewed = false;
          clearTimeout(commitTimer);
          void themeController.resetActiveTheme();
        }}>
          <Row.Title>{i18n('Exteraless.AccentColor.Reset')}</Row.Title>
        </Row>
      </details>
    </Section>
  );
};

const ExteralessAppearance = () => {
  const [exteralessSettings, setExteralessSetting] = useExteralessSettings();
  const [tab] = useSuperTab();

  const md3Styles = [
    ['OEAppearanceNewLoadingStyle', 'Exteraless.Md3.ProgressIndicators'],
    ['SliderStyle', 'Exteraless.Md3.Sliders'],
    ['SwitchStyle', 'Exteraless.Md3.Switches'],
    ['OEAppearanceNewChatHeaderStyle', 'Exteraless.NewChatHeaderStyle'],
    ['OEAppearanceNewNavigationBarStyle', 'Exteraless.Md3.Navigation'],
    ['OEAppearanceM3ListItems', 'Exteraless.Md3.ListItems'],
    ['OEAppearanceMd3Player', 'Exteraless.Md3.Player'],
    ['OEAppearanceMd3MiniPlayer', 'Exteraless.Md3.MiniPlayer']
  ] as const;

  // * Android PlayerStyleEditor.refreshVisibility: size for the framed covers,
  // * radius for the card only, spin and title position for the framed ones.
  // * Reads stay inside the JSX so the rows follow a style change live
  const coverStyle = () => getPlayerCoverStyle();
  const framedCover = () => {
    const style = coverStyle();
    return style === 0 || style === 3;
  };

  const avatarCornersLabel = (value: number) => {
    if(value === OE_AVATAR_CORNERS_MAX) {
      return i18n('Exteraless.AvatarCorners.Circle');
    } else if(value === 0) {
      return i18n('Exteraless.AvatarCorners.Square');
    }

    return '' + value;
  };

  return (
    <>
      <Section name="Exteraless.ThemePalette" caption="Exteraless.ThemePalette.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceThemePalette}
              onChange={(value) => setExteralessSetting('OEAppearanceThemePalette', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.ThemePalette')}</Row.Title>
        </Row>
      </Section>
      <AccentColorSection />
      <Section name="Exteraless.Md3" caption="Exteraless.Md3.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx toggle checked={getMd3StyleCount() > 0} onChange={setAllMd3Styles} />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.Md3')}</Row.Title>
          <Row.Subtitle>{getMd3StyleCount()}/8</Row.Subtitle>
        </Row>
        <details class="exterayond-md3-options">
          <summary>{i18n('Exteraless.Md3.Customize')}</summary>
          {md3Styles.map(([key, label]) => (
            <Row>
              <Row.CheckboxFieldToggle>
                <CheckboxFieldTsx
                  toggle
                  checked={key === 'SliderStyle' ? exteralessSettings[key] === 2 : key === 'SwitchStyle' ? exteralessSettings[key] >= 2 : exteralessSettings[key]}
                  onChange={(enabled) => {
                    if(key === 'SliderStyle' || key === 'SwitchStyle') setExteralessSetting(key, enabled ? key === 'SwitchStyle' ? 3 : 2 : 0);
                    else setExteralessSetting(key, enabled);
                  }}
                />
              </Row.CheckboxFieldToggle>
              <Row.Title>{i18n(label)}</Row.Title>
            </Row>
          ))}
        </details>
      </Section>
      <Section name="Exteraless.Player.Cover" caption="Exteraless.Player.StyleInfo">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.Player.Cover.Style')}
          textRight={(value) => i18n(value === 0 ? 'Exteraless.Player.Cover.Card' : value === 1 ? 'Exteraless.Player.Cover.Wide' : value === 2 ? 'Exteraless.Player.Cover.Full' : 'Exteraless.Player.Cover.Disc')}
          step={1}
          value={exteralessSettings.OEPlayerCoverStyle}
          minValue={0}
          maxValue={3}
          onChange={(value) => setExteralessSetting('OEPlayerCoverStyle', value)}
        />
        {framedCover() && (
          <RangeSettingSelector
            textLeft={i18n('Exteraless.Player.Cover.Size')}
            textRight={(value) => value + '%'}
            step={5}
            value={exteralessSettings.OEPlayerCoverSize}
            minValue={OE_PLAYER_COVER_SIZE_MIN}
            maxValue={OE_PLAYER_COVER_SIZE_MAX}
            onChange={(value) => setExteralessSetting('OEPlayerCoverSize', value)}
          />
        )}
        {coverStyle() === 0 && (
          <RangeSettingSelector
            textLeft={i18n('Exteraless.Player.Cover.Radius')}
            textRight={(value) => '' + value}
            step={2}
            value={exteralessSettings.OEPlayerCoverRadius}
            minValue={0}
            maxValue={OE_PLAYER_COVER_RADIUS_MAX}
            onChange={(value) => setExteralessSetting('OEPlayerCoverRadius', value)}
          />
        )}
        {coverStyle() === 3 && (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exteralessSettings.OEPlayerDiscSpin}
                onChange={(value) => setExteralessSetting('OEPlayerDiscSpin', value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n('Exteraless.Player.DiscSpin')}</Row.Title>
          </Row>
        )}
      </Section>
      <Section name="Exteraless.Player.Title">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.Player.TitleAlign')}
          textRight={(value) => i18n(value === 0 ? 'Exteraless.Player.Align.Start' : 'Exteraless.Player.Align.Center')}
          step={1}
          value={exteralessSettings.OEPlayerTitleAlign}
          minValue={0}
          maxValue={1}
          onChange={(value) => setExteralessSetting('OEPlayerTitleAlign', value)}
        />
        <RangeSettingSelector
          textLeft={i18n('Exteraless.Player.TitleSize')}
          textRight={(value) => i18n(value === 0 ? 'Exteraless.Player.Size.Small' : value === 1 ? 'Exteraless.Player.Size.Medium' : 'Exteraless.Player.Size.Large')}
          step={1}
          value={exteralessSettings.OEPlayerTitleSize}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExteralessSetting('OEPlayerTitleSize', value)}
        />
        {framedCover() && (
          <RangeSettingSelector
            textLeft={i18n('Exteraless.Player.TitlePosition')}
            textRight={(value) => i18n(value === 0 ? 'Exteraless.Player.Title.Below' : 'Exteraless.Player.Title.Above')}
            step={1}
            value={exteralessSettings.OEPlayerTitleAbove ? 1 : 0}
            minValue={0}
            maxValue={1}
            onChange={(value) => setExteralessSetting('OEPlayerTitleAbove', value === 1)}
          />
        )}
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEPlayerShowSource}
              onChange={(value) => setExteralessSetting('OEPlayerShowSource', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.Player.ShowSource')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exteraless.Player.Layout" caption="Exteraless.Player.LayoutInfo">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEPlayerShowModes}
              onChange={(value) => setExteralessSetting('OEPlayerShowModes', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.Player.ShowModes')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEPlayerWavy}
              onChange={(value) => setExteralessSetting('OEPlayerWavy', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.Player.ShowWave')}</Row.Title>
        </Row>
        <RangeSettingSelector
          textLeft={i18n('Exteraless.Player.ControlsSize')}
          textRight={(value) => i18n(value === 0 ? 'Exteraless.Player.Controls.Compact' : value === 1 ? 'Exteraless.Player.Controls.Normal' : 'Exteraless.Player.Controls.Large')}
          step={1}
          value={exteralessSettings.OEPlayerControlsSize}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExteralessSetting('OEPlayerControlsSize', value)}
        />
      </Section>
      <Section name="Exteraless.TabCounter" caption="Exteraless.TabCounter.Info">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.TabCounter')}
          textRight={(value) => i18n(value === 0 ? 'Exteraless.TabCounter.All' : value === 1 ? 'Exteraless.TabCounter.Unmuted' : 'Exteraless.TabCounter.Off')}
          step={1}
          value={exteralessSettings.IgnoreUnreadCount}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExteralessSetting('IgnoreUnreadCount', value)}
        />
      </Section>
      <Section name="Exteraless.AvatarCorners">
        <div class="exteraless-avatar-preview">
          <div class="avatar avatar-gradient" data-color="red" />
          <div class="avatar avatar-gradient" data-color="green" />
          <div class="avatar avatar-gradient" data-color="blue" />
        </div>
        <RangeSettingSelector
          textLeft={i18n('Exteraless.AvatarCorners')}
          textRight={avatarCornersLabel}
          step={1}
          value={exteralessSettings.OEAppearanceAvatarCorners}
          minValue={0}
          maxValue={OE_AVATAR_CORNERS_MAX}
          onChange={(value) => setExteralessSetting('OEAppearanceAvatarCorners', value)}
        />
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceSingleCornerRadius}
              onChange={(value) => setExteralessSetting('OEAppearanceSingleCornerRadius', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.SingleCornerRadius')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.SingleCornerRadius.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceSenderMiniAvatars}
              onChange={(value) => setExteralessSetting('OEAppearanceSenderMiniAvatars', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.SenderMiniAvatars')}</Row.Title>
        </Row>
      </Section>
      <Section caption="Exteraless.BubbleRadius.StockHint">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.BubbleRadius')}
          textRight={(value) => value === 17 ? i18n('Exteraless.BubbleRadius.Stock') : '' + value}
          step={1}
          value={exteralessSettings.bubbleRadius}
          minValue={0}
          maxValue={17}
          onChange={(value) => setExteralessSetting('bubbleRadius', value)}
        />
      </Section>
      <Section caption="Exteraless.SectionRadius.StockHint">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.SectionRadius')}
          textRight={(value) => value === 0 ? i18n('Exteraless.SectionRadius.Off') : value === OE_AVATAR_CORNERS_MAX ? i18n('Exteraless.SectionRadius.Max') : '' + value}
          step={1}
          value={exteralessSettings.OEAppearanceSectionRadius}
          minValue={0}
          maxValue={OE_AVATAR_CORNERS_MAX}
          onChange={(value) => setExteralessSetting('OEAppearanceSectionRadius', value)}
        />
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceSeparateHeaders}
              onChange={(value) => setExteralessSetting('OEAppearanceSeparateHeaders', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.SeparateHeaders')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceGlassMessageMenu}
              onChange={(value) => setExteralessSetting('OEAppearanceGlassMessageMenu', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.GlassMessageMenu')}</Row.Title>
        </Row>
      </Section>
      <Section>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceSquareFab}
              onChange={(value) => setExteralessSetting('OEAppearanceSquareFab', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.SquareFab')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.SquareFab.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceCenterTitle}
              onChange={(value) => setExteralessSetting('OEAppearanceCenterTitle', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.CenterTitle')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceAttachedSidebar}
              onChange={(value) => setExteralessSetting('OEAppearanceAttachedSidebar', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.AttachedSidebar')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.AttachedSidebar.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.TypefaceUseDefault}
              onChange={(value) => setExteralessSetting('TypefaceUseDefault', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.UseSystemFonts')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.UseSystemFonts.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceHideActionBarStatus}
              onChange={(value) => setExteralessSetting('OEAppearanceHideActionBarStatus', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.HideActionBarStatus')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.HideActionBarStatus.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceCustomThemes}
              onChange={(value) => setExteralessSetting('OEAppearanceCustomThemes', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.CustomThemes')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.CustomThemes.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEAppearanceWallpaperPattern}
              onChange={(value) => setExteralessSetting('OEAppearanceWallpaperPattern', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.WallpaperPattern')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.WallpaperPattern.Info')}</Row.Subtitle>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExteralessPillStackTab).open()}>
          <Row.Icon icon="data_filled" />
          <Row.Title>{i18n('Exteraless.PillStack')}</Row.Title>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExteralessMainMenuTab).open()}>
          <Row.Icon icon="more" />
          <Row.Title>{i18n('Exteraless.MainMenu')}</Row.Title>
        </Row>
      </Section>
    </>
  );
};

export default ExteralessAppearance;
