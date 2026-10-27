import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n} from '@lib/langPack';
import {
  OE_AVATAR_CORNERS_MAX,
  getMd3StyleCount,
  setAllMd3Styles,
  useExteralessSettings
} from '@stores/exteralessSettings';

/**
 * The Appearance category of the exteraless Preferences hub. Every control is
 * a ported Android setting with its behavior wired into Web K (the CSS choke
 * points named in src/stores/exteralessSettings.ts); ranges, defaults and
 * labels follow `OpenExteraAppearanceActivity`.
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
