import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n} from '@lib/langPack';
import {
  OE_AVATAR_CORNERS_MAX,
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
