import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import {i18n} from '@lib/langPack';
import {
  OE_AVATAR_CORNERS_MAX,
  useExteralessSettings
} from '@stores/exteralessSettings';

/**
 * The Appearance category of the exteraless Preferences hub. Each slider is a
 * ported Android setting with its behavior wired into Web K (the CSS choke
 * points named in src/stores/exteralessSettings.ts); the sliders' ranges,
 * defaults and end labels follow `OpenExteraAppearanceActivity`.
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
      </Section>
    </>
  );
};

export default ExteralessAppearance;
