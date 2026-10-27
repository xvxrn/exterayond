import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import RangeSettingSelector from '@components/rangeSettingSelector';
import {i18n} from '@lib/langPack';
import {useExteralessSettings} from '@stores/exteralessSettings';
import {isArchiveHidden, setArchiveHidden} from '@stores/exteralessPreferences';

/**
 * The General category of the exteraless Preferences hub, ported from
 * `OpenExteraGeneralActivity`. Labels follow strings_oe_general.xml and the
 * stock strings the Android screen reuses.
 */
const General = () => {
  const [exteralessSettings, setExteralessSetting] = useExteralessSettings();

  return (
    <Section name="Exteraless.General">
      <RangeSettingSelector
        textLeft={i18n('Exteraless.IdDcType')}
        textRight={(value) => i18n(value === 0 ? 'Exteraless.IdDcType.Hidden' : value === 1 ? 'Exteraless.IdDcType.TelegramApi' : 'Exteraless.IdDcType.BotApi')}
        value={exteralessSettings.IdDcType}
        minValue={0}
        maxValue={2}
        step={1}
        onChange={(value) => setExteralessSetting('IdDcType', value)}
      />
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exteralessSettings.ZalgoFilter}
            onChange={(value) => setExteralessSetting('ZalgoFilter', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exteraless.ZalgoFilter')}</Row.Title>
        <Row.Subtitle>{i18n('Exteraless.ZalgoFilter.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={isArchiveHidden()}
            onChange={setArchiveHidden}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exteraless.HideArchive')}</Row.Title>
        <Row.Subtitle>{i18n('Exteraless.HideArchive.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exteralessSettings.HidePhone}
            onChange={(value) => setExteralessSetting('HidePhone', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exteraless.HidePhone')}</Row.Title>
        <Row.Subtitle>{i18n('Exteraless.HidePhone.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exteralessSettings.DisableNumberRounding}
            onChange={(value) => setExteralessSetting('DisableNumberRounding', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exteraless.DisableNumberRounding')}</Row.Title>
        <Row.Subtitle>{i18n('Exteraless.DisableNumberRounding.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exteralessSettings.showSeconds}
            onChange={(value) => setExteralessSetting('showSeconds', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exteraless.FormatTimeWithSeconds')}</Row.Title>
        <Row.Subtitle>{i18n('Exteraless.FormatTimeWithSeconds.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exteralessSettings.OERelativeLastSeen}
            onChange={(value) => setExteralessSetting('OERelativeLastSeen', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exteraless.RelativeLastSeen')}</Row.Title>
        <Row.Subtitle>{i18n('Exteraless.RelativeLastSeen.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exteralessSettings.OEAddCommaAfterMention}
            onChange={(value) => setExteralessSetting('OEAddCommaAfterMention', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exteraless.AddCommaAfterMention')}</Row.Title>
        <Row.Subtitle>{i18n('Exteraless.AddCommaAfterMention.Info')}</Row.Subtitle>
      </Row>
    </Section>
  );
};

export default General;
