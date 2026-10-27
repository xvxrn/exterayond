import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import LottieAnimation from '@components/lottieAnimation';
import {hotReloadGuard} from '@lib/solidjs/hotReloadGuardProvider';
import {i18n, LangPackKey} from '@lib/langPack';
import {useExteralessSettings, getStickerTimeMode, setStickerTimeMode, getStickerScale, getOpenLinkConfirmation, setOpenLinkConfirmation} from '@stores/exteralessSettings';
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
  ['UseEditedIcon', 'Exteraless.UseEditedIcon'],
  ['DateOfForwardedMsg', 'Exteraless.DateOfForwardedMsg', 'Exteraless.DateOfForwardedMsg.Info'],
  ['ShowTimeHint', 'Exteraless.MessageTimeDetails', 'Exteraless.MessageTimeDetails.Info'],
  ['HideShareButtonInChannel', 'Exteraless.HideShareButton'],
  ['hideSendAsChannel', 'Exteraless.HideSendAsPeer', 'Exteraless.HideSendAsPeer.Info'],
  ['DontSendGreetingSticker', 'Exteraless.DisableGreetingSticker', 'Exteraless.DisableGreetingSticker.Info'],
  ['DisableTrending', 'Exteraless.DisableTrending', 'Exteraless.DisableTrending.Info'],
  ['hideGroupSticker', 'Exteraless.HideGroupSticker', 'Exteraless.HideGroupSticker.Info'],
  ['DeleteChatForBothSides', 'Exteraless.DeleteChatForBothSides', 'Exteraless.DeleteChatForBothSides.Info'],
  ['AskBeforeCalling', 'Exteraless.AskBeforeCalling'],
  ['DisableClickCommandToSend', 'Exteraless.AskBeforeBotCommand'],
  ['DontAutoPlayNextVoice', 'Exteraless.DontAutoPlayNextVoice'],
  ['HidePremiumSection', 'Exteraless.HidePremiumSection'],
  ['HideHelpSection', 'Exteraless.HideHelpSection'],
  ['DisableDialogsFloatingButton', 'Exteraless.HideFloatingButton'],
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

const PAUSE_TOGGLES: Array<[key: ExteralessSettingsKey, langKey: LangPackKey]> = [
  ['OEChatsPauseVoice', 'Exteraless.PauseVoice'],
  ['OEChatsPauseRound', 'Exteraless.PauseRound']
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
      <Section name="Exteraless.OpenLinkPolicy" caption="Exteraless.OpenLinkPolicy.Info">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.OpenLinkPolicy')}
          textRight={(value) => i18n(value === 0 ? 'Exteraless.OpenLinkPolicy.Hidden' : value === 1 ? 'Exteraless.OpenLinkPolicy.All' : 'Exteraless.OpenLinkPolicy.Never')}
          value={getOpenLinkConfirmation()}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={setOpenLinkConfirmation}
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
      <Section name="Exteraless.StickerSize" caption="Exteraless.StickerSize.Info">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.StickerSize')}
          textRight={(value) => '' + Math.round(value * 10) / 10}
          value={exteralessSettings.stickerSize}
          minValue={4}
          maxValue={20}
          step={0.1}
          onChange={(value) => setExteralessSetting('stickerSize', value)}
        />
        <div aria-hidden="true" style="height:280px;display:grid;place-items:center;">
          <div style={{width: '200px', height: '200px', transform: `scale(${getStickerScale()})`}}>
            <LottieAnimation lottieLoader={hotReloadGuard.lottieLoader} name="UtyanDiscussion" size={200} lottieOptions={{autoplay: false}} />
          </div>
        </div>
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
      <Section name="Exteraless.StickerTime">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.StickerTime')}
          textRight={(value) => i18n(value === 0 ? 'Exteraless.StickerTime.Default' : value === 1 ? 'Exteraless.StickerTime.Side' : 'Exteraless.StickerTime.Hidden')}
          value={getStickerTimeMode()}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={setStickerTimeMode}
        />
      </Section>
      <Section name="Exteraless.PauseOnMinimize">
        {PAUSE_TOGGLES.map(([key, langKey]) => (
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
