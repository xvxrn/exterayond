import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n, LangPackKey} from '@lib/langPack';
import {useExteralessSettings} from '@stores/exteralessSettings';
import type {ExteralessSettingsKey} from '@stores/exteralessSettings';

/**
 * The Chats category of the exteraless Preferences hub: every toggle is a
 * ported Android `ChatsConfig` setting with its behavior wired into Web K.
 * Labels follow strings_oe_chats.xml.
 */
const TOGGLES: Array<[key: ExteralessSettingsKey, langKey: LangPackKey]> = [
  ['OEChatsRemoveMessageTail', 'Exteraless.RemoveMessageTail'],
  ['OEChatsHideCallButton', 'Exteraless.HideCallButton'],
  ['OEChatsHideChannelSearchButton', 'Exteraless.HideSearchButton']
];

const ExteralessChats = () => {
  const [exteralessSettings, setExteralessSetting] = useExteralessSettings();

  return (
    <Section name="Exteraless.Chats">
      {TOGGLES.map(([key, langKey]) => (
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings[key] as boolean}
              onChange={(value) => setExteralessSetting(key, value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n(langKey)}</Row.Title>
        </Row>
      ))}
    </Section>
  );
};

export default ExteralessChats;
