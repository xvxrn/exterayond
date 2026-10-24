import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n} from '@lib/langPack';
import {useExteralessSettings} from '@stores/exteralessSettings';

/**
 * The General category of the exteraless Preferences hub, ported from
 * `OpenExteraGeneralActivity`. Labels follow strings_oe_general.xml and the
 * stock strings the Android screen reuses.
 */
const General = () => {
  const [exteralessSettings, setExteralessSetting] = useExteralessSettings();

  return (
    <Section name="Exteraless.General">
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
