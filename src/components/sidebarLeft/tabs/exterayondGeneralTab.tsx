import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import RangeSettingSelector from '@components/rangeSettingSelector';
import {i18n} from '@lib/langPack';
import {useExterayondSettings} from '@stores/exterayondSettings';
import {isArchiveHidden, setArchiveHidden} from '@stores/exterayondPreferences';

/**
 * The General category of the exteraless Preferences hub, ported from
 * `OpenExteraGeneralActivity`. Labels follow strings_oe_general.xml and the
 * stock strings the Android screen reuses.
 */
const General = () => {
  const [exterayondSettings, setExterayondSetting] = useExterayondSettings();

  return (
    <Section name="Exterayond.General">
      <RangeSettingSelector
        textLeft={i18n('Exterayond.IdDcType')}
        textRight={(value) => i18n(value === 0 ? 'Exterayond.IdDcType.Hidden' : value === 1 ? 'Exterayond.IdDcType.TelegramApi' : 'Exterayond.IdDcType.BotApi')}
        value={exterayondSettings.IdDcType}
        minValue={0}
        maxValue={2}
        step={1}
        onChange={(value) => setExterayondSetting('IdDcType', value)}
      />
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exterayondSettings.ZalgoFilter}
            onChange={(value) => setExterayondSetting('ZalgoFilter', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.ZalgoFilter')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.ZalgoFilter.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exterayondSettings.SortByUnread}
            onChange={(value) => setExterayondSetting('SortByUnread', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.SortByUnread')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.SortByUnread.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={isArchiveHidden()}
            onChange={setArchiveHidden}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.HideArchive')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.HideArchive.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exterayondSettings.HidePhone}
            onChange={(value) => setExterayondSetting('HidePhone', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.HidePhone')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.HidePhone.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exterayondSettings.DisableNumberRounding}
            onChange={(value) => setExterayondSetting('DisableNumberRounding', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.DisableNumberRounding')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.DisableNumberRounding.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exterayondSettings.showSeconds}
            onChange={(value) => setExterayondSetting('showSeconds', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.FormatTimeWithSeconds')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.FormatTimeWithSeconds.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exterayondSettings.OERelativeLastSeen}
            onChange={(value) => setExterayondSetting('OERelativeLastSeen', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.RelativeLastSeen')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.RelativeLastSeen.Info')}</Row.Subtitle>
      </Row>
      <Row>
        <Row.CheckboxFieldToggle>
          <CheckboxFieldTsx
            toggle
            checked={exterayondSettings.OEAddCommaAfterMention}
            onChange={(value) => setExterayondSetting('OEAddCommaAfterMention', value)}
          />
        </Row.CheckboxFieldToggle>
        <Row.Title>{i18n('Exterayond.AddCommaAfterMention')}</Row.Title>
        <Row.Subtitle>{i18n('Exterayond.AddCommaAfterMention.Info')}</Row.Subtitle>
      </Row>
    </Section>
  );
};

export default General;
