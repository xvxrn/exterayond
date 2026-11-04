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
  exterayondSettings,
  getPlayerCoverStyle,
  getMd3StyleCount,
  setAllMd3Styles,
  useExterayondSettings
} from '@stores/exterayondSettings';

/**
 * The Appearance category of the exteraless Preferences hub. Every control is
 * a ported Android setting with its behavior wired into Web K (the CSS choke
 * points named in src/stores/exterayondSettings.ts); ranges, defaults and
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
  if(exterayondSettings.OEAppearanceThemePalette && !isUserOwnedWallpaper()) {
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
    <Section name="Exterayond.AccentColor" caption="Exterayond.AccentColor.Info">
      <Row>
        <Row.Title>{i18n('Exterayond.AccentColor')}</Row.Title>
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
        <summary>{i18n('Exterayond.AccentColor.Customize')}</summary>
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
          <Row.Title>{i18n('Exterayond.AccentColor.Reset')}</Row.Title>
        </Row>
      </details>
    </Section>
  );
};

const ExterayondAppearance = () => {
  const [exterayondSettings, setExterayondSetting] = useExterayondSettings();
  const [tab] = useSuperTab();

  const md3Styles = [
    ['OEAppearanceNewLoadingStyle', 'Exterayond.Md3.ProgressIndicators'],
    ['SliderStyle', 'Exterayond.Md3.Sliders'],
    ['SwitchStyle', 'Exterayond.Md3.Switches'],
    ['OEAppearanceNewChatHeaderStyle', 'Exterayond.NewChatHeaderStyle'],
    ['OEAppearanceNewNavigationBarStyle', 'Exterayond.Md3.Navigation'],
    ['OEAppearanceM3ListItems', 'Exterayond.Md3.ListItems'],
    ['OEAppearanceMd3Player', 'Exterayond.Md3.Player'],
    ['OEAppearanceMd3MiniPlayer', 'Exterayond.Md3.MiniPlayer']
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
      return i18n('Exterayond.AvatarCorners.Circle');
    } else if(value === 0) {
      return i18n('Exterayond.AvatarCorners.Square');
    }

    return '' + value;
  };

  return (
    <>
      <Section name="Exterayond.ThemePalette" caption="Exterayond.ThemePalette.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceThemePalette}
              onChange={(value) => setExterayondSetting('OEAppearanceThemePalette', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.ThemePalette')}</Row.Title>
        </Row>
      </Section>
      <AccentColorSection />
      <Section name="Exterayond.Md3" caption="Exterayond.Md3.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx toggle checked={getMd3StyleCount() > 0} onChange={setAllMd3Styles} />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Md3')}</Row.Title>
          <Row.Subtitle>{getMd3StyleCount()}/8</Row.Subtitle>
        </Row>
        <details class="exterayond-md3-options">
          <summary>{i18n('Exterayond.Md3.Customize')}</summary>
          {md3Styles.map(([key, label]) => (
            <Row>
              <Row.CheckboxFieldToggle>
                <CheckboxFieldTsx
                  toggle
                  checked={key === 'SliderStyle' ? exterayondSettings[key] === 2 : key === 'SwitchStyle' ? exterayondSettings[key] >= 2 : exterayondSettings[key]}
                  onChange={(enabled) => {
                    if(key === 'SliderStyle' || key === 'SwitchStyle') setExterayondSetting(key, enabled ? key === 'SwitchStyle' ? 3 : 2 : 0);
                    else setExterayondSetting(key, enabled);
                  }}
                />
              </Row.CheckboxFieldToggle>
              <Row.Title>{i18n(label)}</Row.Title>
            </Row>
          ))}
          {/* * the ninth MD3 part (packet 065) stays an independent row: the
            * master's x/8 count and its group are the eight Android parts' */}
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exterayondSettings.OEAppearanceMd3Dialogs}
                onChange={(value) => setExterayondSetting('OEAppearanceMd3Dialogs', value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n('Exterayond.Md3.Dialogs')}</Row.Title>
          </Row>
        </details>
      </Section>
      <Section name="Exterayond.Player.Cover" caption="Exterayond.Player.StyleInfo">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.Player.Cover.Style')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Cover.Card' : value === 1 ? 'Exterayond.Player.Cover.Wide' : value === 2 ? 'Exterayond.Player.Cover.Full' : 'Exterayond.Player.Cover.Disc')}
          step={1}
          value={exterayondSettings.OEPlayerCoverStyle}
          minValue={0}
          maxValue={3}
          onChange={(value) => setExterayondSetting('OEPlayerCoverStyle', value)}
        />
        {framedCover() && (
          <RangeSettingSelector
            textLeft={i18n('Exterayond.Player.Cover.Size')}
            textRight={(value) => value + '%'}
            step={5}
            value={exterayondSettings.OEPlayerCoverSize}
            minValue={OE_PLAYER_COVER_SIZE_MIN}
            maxValue={OE_PLAYER_COVER_SIZE_MAX}
            onChange={(value) => setExterayondSetting('OEPlayerCoverSize', value)}
          />
        )}
        {coverStyle() === 0 && (
          <RangeSettingSelector
            textLeft={i18n('Exterayond.Player.Cover.Radius')}
            textRight={(value) => '' + value}
            step={2}
            value={exterayondSettings.OEPlayerCoverRadius}
            minValue={0}
            maxValue={OE_PLAYER_COVER_RADIUS_MAX}
            onChange={(value) => setExterayondSetting('OEPlayerCoverRadius', value)}
          />
        )}
        {coverStyle() === 3 && (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exterayondSettings.OEPlayerDiscSpin}
                onChange={(value) => setExterayondSetting('OEPlayerDiscSpin', value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n('Exterayond.Player.DiscSpin')}</Row.Title>
          </Row>
        )}
      </Section>
      <Section name="Exterayond.Player.Title">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.Player.TitleAlign')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Align.Start' : 'Exterayond.Player.Align.Center')}
          step={1}
          value={exterayondSettings.OEPlayerTitleAlign}
          minValue={0}
          maxValue={1}
          onChange={(value) => setExterayondSetting('OEPlayerTitleAlign', value)}
        />
        <RangeSettingSelector
          textLeft={i18n('Exterayond.Player.TitleSize')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Size.Small' : value === 1 ? 'Exterayond.Player.Size.Medium' : 'Exterayond.Player.Size.Large')}
          step={1}
          value={exterayondSettings.OEPlayerTitleSize}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExterayondSetting('OEPlayerTitleSize', value)}
        />
        {framedCover() && (
          <RangeSettingSelector
            textLeft={i18n('Exterayond.Player.TitlePosition')}
            textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Title.Below' : 'Exterayond.Player.Title.Above')}
            step={1}
            value={exterayondSettings.OEPlayerTitleAbove ? 1 : 0}
            minValue={0}
            maxValue={1}
            onChange={(value) => setExterayondSetting('OEPlayerTitleAbove', value === 1)}
          />
        )}
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEPlayerShowSource}
              onChange={(value) => setExterayondSetting('OEPlayerShowSource', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Player.ShowSource')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exterayond.Player.Layout" caption="Exterayond.Player.LayoutInfo">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEPlayerShowModes}
              onChange={(value) => setExterayondSetting('OEPlayerShowModes', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Player.ShowModes')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEPlayerWavy}
              onChange={(value) => setExterayondSetting('OEPlayerWavy', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Player.ShowWave')}</Row.Title>
        </Row>
        <RangeSettingSelector
          textLeft={i18n('Exterayond.Player.ControlsSize')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Controls.Compact' : value === 1 ? 'Exterayond.Player.Controls.Normal' : 'Exterayond.Player.Controls.Large')}
          step={1}
          value={exterayondSettings.OEPlayerControlsSize}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExterayondSetting('OEPlayerControlsSize', value)}
        />
      </Section>
      {/* * Android PlayerStyleEditor's mini section (PLAYER-20..30): the rows
        * whose keys have a real surface over the pinned-audio plate. The
        * cover/shape repaints ride the `oe-md3-mini-player` root class, so
        * with the MD3 mini player off they change nothing */}
      <Section name="Exterayond.Player.Mini" caption="Exterayond.Player.Mini.Info">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.Player.Mini.Cover')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Mini.Cover.Rounded' : value === 1 ? 'Exterayond.Player.Mini.Cover.Round' : 'Exterayond.Player.Mini.Cover.Hidden')}
          step={1}
          value={exterayondSettings.OEPlayerMiniCover}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExterayondSetting('OEPlayerMiniCover', value)}
        />
        <RangeSettingSelector
          textLeft={i18n('Exterayond.Player.Mini.Shape')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Mini.Shape.Rounded' : value === 1 ? 'Exterayond.Player.Mini.Shape.Pill' : 'Exterayond.Player.Mini.Shape.Square')}
          step={1}
          value={exterayondSettings.OEPlayerMiniShape}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExterayondSetting('OEPlayerMiniShape', value)}
        />
        <RangeSettingSelector
          textLeft={i18n('Exterayond.Player.Mini.Progress')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.Player.Mini.Progress.Ring' : value === 1 ? 'Exterayond.Player.Mini.Progress.Line' : value === 2 ? 'Exterayond.Player.Mini.Progress.None' : 'Exterayond.Player.Mini.Progress.Border')}
          step={1}
          value={exterayondSettings.OEPlayerMiniProgress}
          minValue={0}
          maxValue={3}
          onChange={(value) => setExterayondSetting('OEPlayerMiniProgress', value)}
        />
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEPlayerMiniArtist}
              onChange={(value) => setExterayondSetting('OEPlayerMiniArtist', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Player.Mini.Artist')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEPlayerMiniNext}
              onChange={(value) => setExterayondSetting('OEPlayerMiniNext', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Player.Mini.Next')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEPlayerMiniClose}
              onChange={(value) => setExterayondSetting('OEPlayerMiniClose', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Player.Mini.Close')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exterayond.TabCounter" caption="Exterayond.TabCounter.Info">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.TabCounter')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.TabCounter.All' : value === 1 ? 'Exterayond.TabCounter.Unmuted' : 'Exterayond.TabCounter.Off')}
          step={1}
          value={exterayondSettings.IgnoreUnreadCount}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExterayondSetting('IgnoreUnreadCount', value)}
        />
      </Section>
      <Section name="Exterayond.AvatarCorners">
        <div class="exteraless-avatar-preview">
          <div class="avatar avatar-gradient" data-color="red" />
          <div class="avatar avatar-gradient" data-color="green" />
          <div class="avatar avatar-gradient" data-color="blue" />
        </div>
        <RangeSettingSelector
          textLeft={i18n('Exterayond.AvatarCorners')}
          textRight={avatarCornersLabel}
          step={1}
          value={exterayondSettings.OEAppearanceAvatarCorners}
          minValue={0}
          maxValue={OE_AVATAR_CORNERS_MAX}
          onChange={(value) => setExterayondSetting('OEAppearanceAvatarCorners', value)}
        />
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceSingleCornerRadius}
              onChange={(value) => setExterayondSetting('OEAppearanceSingleCornerRadius', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.SingleCornerRadius')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.SingleCornerRadius.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceSenderMiniAvatars}
              onChange={(value) => setExterayondSetting('OEAppearanceSenderMiniAvatars', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.SenderMiniAvatars')}</Row.Title>
        </Row>
      </Section>
      <Section caption="Exterayond.BubbleRadius.StockHint">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.BubbleRadius')}
          textRight={(value) => value === 17 ? i18n('Exterayond.BubbleRadius.Stock') : '' + value}
          step={1}
          value={exterayondSettings.bubbleRadius}
          minValue={0}
          maxValue={17}
          onChange={(value) => setExterayondSetting('bubbleRadius', value)}
        />
      </Section>
      <Section caption="Exterayond.SectionRadius.StockHint">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.SectionRadius')}
          textRight={(value) => value === 0 ? i18n('Exterayond.SectionRadius.Off') : value === OE_AVATAR_CORNERS_MAX ? i18n('Exterayond.SectionRadius.Max') : '' + value}
          step={1}
          value={exterayondSettings.OEAppearanceSectionRadius}
          minValue={0}
          maxValue={OE_AVATAR_CORNERS_MAX}
          onChange={(value) => setExterayondSetting('OEAppearanceSectionRadius', value)}
        />
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceSeparateHeaders}
              onChange={(value) => setExterayondSetting('OEAppearanceSeparateHeaders', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.SeparateHeaders')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceGlassMessageMenu}
              onChange={(value) => setExterayondSetting('OEAppearanceGlassMessageMenu', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.GlassMessageMenu')}</Row.Title>
        </Row>
      </Section>
      <Section>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceSquareFab}
              onChange={(value) => setExterayondSetting('OEAppearanceSquareFab', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.SquareFab')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.SquareFab.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceCenterTitle}
              onChange={(value) => setExterayondSetting('OEAppearanceCenterTitle', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.CenterTitle')}</Row.Title>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceAttachedSidebar}
              onChange={(value) => setExterayondSetting('OEAppearanceAttachedSidebar', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.AttachedSidebar')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.AttachedSidebar.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.TypefaceUseDefault}
              onChange={(value) => setExterayondSetting('TypefaceUseDefault', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.UseSystemFonts')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.UseSystemFonts.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceHideActionBarStatus}
              onChange={(value) => setExterayondSetting('OEAppearanceHideActionBarStatus', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.HideActionBarStatus')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.HideActionBarStatus.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceCustomThemes}
              onChange={(value) => setExterayondSetting('OEAppearanceCustomThemes', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.CustomThemes')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.CustomThemes.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEAppearanceWallpaperPattern}
              onChange={(value) => setExterayondSetting('OEAppearanceWallpaperPattern', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.WallpaperPattern')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.WallpaperPattern.Info')}</Row.Subtitle>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExterayondPillStackTab).open()}>
          <Row.Icon icon="data_filled" />
          <Row.Title>{i18n('Exterayond.PillStack')}</Row.Title>
        </Row>
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppExterayondMainMenuTab).open()}>
          <Row.Icon icon="more" />
          <Row.Title>{i18n('Exterayond.MainMenu')}</Row.Title>
        </Row>
      </Section>
    </>
  );
};

export default ExterayondAppearance;
