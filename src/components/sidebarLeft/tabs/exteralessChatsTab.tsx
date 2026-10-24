import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {i18n, LangPackKey} from '@lib/langPack';
import {useExteralessSettings} from '@stores/exteralessSettings';
import type {ExteralessSettingsKey} from '@stores/exteralessSettings';

/**
 * The Chats category of the exteraless Preferences hub: every control is a
 * ported Android `ChatsConfig` setting with its behavior wired into Web K.
 * Labels and ranges follow strings_oe_chats.xml / `OpenExteraChatsActivity`.
 */
const TOGGLES: Array<[key: ExteralessSettingsKey, langKey: LangPackKey, infoKey?: LangPackKey]> = [
  ['OEChatsRemoveMessageTail', 'Exteraless.RemoveMessageTail'],
  ['OEChatsHideCallButton', 'Exteraless.HideCallButton'],
  ['OEChatsHideChannelSearchButton', 'Exteraless.HideSearchButton'],
  ['OEChatsStickerTimeSide', 'Exteraless.StickerTimeSide'],
  ['OEChatsReplyColors', 'Exteraless.ReplyColors'],
  ['OEChatsReplyEmoji', 'Exteraless.ReplyEmoji'],
  ['OEChatsReplyBackground', 'Exteraless.ReplyBackground'],
  ['OEChatsShowResultsBeforeVoting', 'Exteraless.ShowResultsBeforeVoting', 'Exteraless.ShowResultsBeforeVoting.Info'],
  ['OEChatsAlwaysSendInHD', 'Exteraless.AlwaysSendInHD']
];

const STRIP_TRACKING_TOGGLES: Array<[key: ExteralessSettingsKey, langKey: LangPackKey]> = [
  ['OEChatsStripTrackingOnOpen', 'Exteraless.StripTrackingOnOpen'],
  ['OEChatsStripTrackingOnPaste', 'Exteraless.StripTrackingOnPaste']
];

const REACTION_TOGGLES: Array<[key: ExteralessSettingsKey, langKey: LangPackKey]> = [
  ['OEChatsHideReactionsChannels', 'Exteraless.HideReactions.Channels'],
  ['OEChatsHideReactionsGroups', 'Exteraless.HideReactions.Groups'],
  ['OEChatsHideReactionsPrivate', 'Exteraless.HideReactions.Private']
];

const ExteralessChats = () => {
  const [exteralessSettings, setExteralessSetting] = useExteralessSettings();

  const stickerShapeLabel = (value: number) => {
    if(value === 0) {
      return i18n('Exteraless.StickerShape.Default');
    } else if(value === 1) {
      return i18n('Exteraless.StickerShape.Rounded');
    }

    return i18n('Exteraless.StickerShape.AsMessage');
  };

  return (
    <>
      <Section name="Exteraless.Chats">
        {TOGGLES.map(([key, langKey, infoKey]) => (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exteralessSettings[key] as boolean}
                onChange={(value) => setExteralessSetting(key, value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n(langKey)}</Row.Title>
            {infoKey && <Row.Subtitle>{i18n(infoKey)}</Row.Subtitle>}
          </Row>
        ))}
      </Section>
      <Section name="Exteraless.BottomButton">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.BottomButton')}
          textRight={(value) => value === 0 ? i18n('Exteraless.BottomButton.Hide') : value === 1 ? i18n('Exteraless.BottomButton.Mute') : i18n('Exteraless.BottomButton.Discuss')}
          step={1}
          value={exteralessSettings.OEChatsBottomButton}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExteralessSetting('OEChatsBottomButton', value)}
        />
      </Section>
      <Section name="Exteraless.StripTracking">
        {STRIP_TRACKING_TOGGLES.map(([key, langKey]) => (
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
      <Section name="Exteraless.StickerShape">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.StickerShape')}
          textRight={stickerShapeLabel}
          step={1}
          value={exteralessSettings.OEChatsStickerShape}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExteralessSetting('OEChatsStickerShape', value)}
        />
      </Section>
      <Section name="Exteraless.HideReactions">
        {REACTION_TOGGLES.map(([key, langKey]) => (
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
    </>
  );
};

export default ExteralessChats;
