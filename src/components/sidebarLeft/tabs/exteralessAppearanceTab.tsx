import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n} from '@lib/langPack';
import {
  OE_AVATAR_CORNERS_MAX,
  OE_PLAYER_COVER_RADIUS_MAX,
  OE_PLAYER_COVER_SIZE_MAX,
  OE_PLAYER_COVER_SIZE_MIN,
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
const ExteralessAppearance = () => {
  const [exteralessSettings, setExteralessSetting] = useExteralessSettings();

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
      </Section>
    </>
  );
};

export default ExteralessAppearance;
