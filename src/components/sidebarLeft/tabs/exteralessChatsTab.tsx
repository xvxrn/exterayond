import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import LottieAnimation from '@components/lottieAnimation';
import {hotReloadGuard} from '@lib/solidjs/hotReloadGuardProvider';
import {useSuperTab} from '@components/solidJsTabs/superTabProvider';
import {i18n, LangPackKey} from '@lib/langPack';
import {
  useExteralessSettings,
  getStickerTimeMode,
  setStickerTimeMode,
  getStickerScale,
  getOpenLinkConfirmation,
  setOpenLinkConfirmation,
  DOUBLE_TAP_ACTIONS,
  DOUBLE_TAP_INCOMING_OPTIONS,
  DOUBLE_TAP_OUTGOING_OPTIONS,
  doubleTapActionLangKey
} from '@stores/exteralessSettings';
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
  ['HideGiftButtonInChannel', 'Exteraless.HideGiftButton'],
  ['hideSendAsChannel', 'Exteraless.HideSendAsPeer', 'Exteraless.HideSendAsPeer.Info'],
  ['DontSendGreetingSticker', 'Exteraless.DisableGreetingSticker', 'Exteraless.DisableGreetingSticker.Info'],
  ['DisableTrending', 'Exteraless.DisableTrending', 'Exteraless.DisableTrending.Info'],
  ['hideGroupSticker', 'Exteraless.HideGroupSticker', 'Exteraless.HideGroupSticker.Info'],
  ['DeleteChatForBothSides', 'Exteraless.DeleteChatForBothSides', 'Exteraless.DeleteChatForBothSides.Info'],
  ['ConfirmAVMessage', 'Exteraless.AskBeforeAVMessage', 'Exteraless.AskBeforeAVMessage.Info'],
  ['AskBeforeCalling', 'Exteraless.AskBeforeCalling'],
  ['repeatConfirm', 'Exteraless.AskWhenRepeating'],
  ['DisableClickCommandToSend', 'Exteraless.AskBeforeBotCommand'],
  ['DontAutoPlayNextVoice', 'Exteraless.DontAutoPlayNextVoice'],
  ['HidePremiumSection', 'Exteraless.HidePremiumSection'],
  ['HideHelpSection', 'Exteraless.HideHelpSection'],
  ['HideStoriesFromHeader', 'Exteraless.HideStories', 'Exteraless.HideStories.Info'],
  ['DisableDialogsFloatingButton', 'Exteraless.HideFloatingButton'],
  ['HideAllTab', 'Exteraless.HideAllChats'],
  ['OEChatsReplyColors', 'Exteraless.ReplyColors'],
  ['OEChatsReplyEmoji', 'Exteraless.ReplyEmoji'],
  ['OEChatsReplyBackground', 'Exteraless.ReplyBackground'],
  ['OEChatsShowResultsBeforeVoting', 'Exteraless.ShowResultsBeforeVoting', 'Exteraless.ShowResultsBeforeVoting.Info'],
  ['OEChatsAlwaysSendInHD', 'Exteraless.AlwaysSendInHD'],
  ['showAddToSavedMessages', 'Exteraless.MenuAddToSaved'],
  ['CopyPhoto', 'Exteraless.MenuCopyPhoto'],
  ['showReport', 'Exteraless.MenuReport']
];

const STRIP_TRACKING_TOGGLES: Array<[key: ExteralessSettingsKey, langKey: LangPackKey]> = [
  ['OEChatsStripTrackingOnOpen', 'Exteraless.StripTrackingOnOpen'],
  ['OEChatsStripTrackingOnPaste', 'Exteraless.StripTrackingOnPaste']
];

const PAUSE_TOGGLES: Array<[key: ExteralessSettingsKey, langKey: LangPackKey]> = [
  ['AutoPauseVideo', 'Exteraless.PauseVideo'],
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
  const [tab] = useSuperTab();

  const stickerShapeLabel = (value: number) => {
    if(value === 0) {
      return i18n('Exteraless.StickerShape.Default');
    } else if(value === 1) {
      return i18n('Exteraless.StickerShape.Rounded');
    }

    return i18n('Exteraless.StickerShape.AsMessage');
  };

  // * CHAT-10 — the selector steps a filtered option list (Android's
  // * showDoubleTapOptions minus the values the web cannot back), while the
  // * store keeps the Android enum verbatim. An imported value outside the
  // * list displays as Disable until the selector moves it.
  const doubleTapIndex = (action: number, list: readonly number[]) => Math.max(0, list.indexOf(action));

  const doubleTapSection = (
    <Section name="Exteraless.DoubleTap" caption="Exteraless.DoubleTap.Info">
      <RangeSettingSelector
        textLeft={i18n('Exteraless.DoubleTapIncoming')}
        textRight={(index) => i18n(doubleTapActionLangKey(DOUBLE_TAP_INCOMING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE))}
        value={doubleTapIndex(exteralessSettings.DoubleTapAction, DOUBLE_TAP_INCOMING_OPTIONS)}
        minValue={0}
        maxValue={DOUBLE_TAP_INCOMING_OPTIONS.length - 1}
        step={1}
        onChange={(index) => setExteralessSetting('DoubleTapAction', DOUBLE_TAP_INCOMING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE)}
      />
      <RangeSettingSelector
        textLeft={i18n('Exteraless.DoubleTapOutgoing')}
        textRight={(index) => i18n(doubleTapActionLangKey(DOUBLE_TAP_OUTGOING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE))}
        value={doubleTapIndex(exteralessSettings.DoubleTapActionOut, DOUBLE_TAP_OUTGOING_OPTIONS)}
        minValue={0}
        maxValue={DOUBLE_TAP_OUTGOING_OPTIONS.length - 1}
        step={1}
        onChange={(index) => setExteralessSetting('DoubleTapActionOut', DOUBLE_TAP_OUTGOING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE)}
      />
      {/* CHAT-11 — the reaction row exists only while an action sends one
          (OpenExteraChatsActivity's doubleTapReactionRow condition); it opens
          the stock quick-reaction subtab, the web's own reaction chooser */}
      {(exteralessSettings.DoubleTapAction === DOUBLE_TAP_ACTIONS.SEND_REACTIONS ||
        exteralessSettings.DoubleTapActionOut === DOUBLE_TAP_ACTIONS.SEND_REACTIONS) && (
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppQuickReactionTab).open()}>
          <Row.Title>{i18n('Exteraless.DoubleTapReaction')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.DoubleTap.ReactionInfo')}</Row.Subtitle>
        </Row>
      )}
    </Section>
  );

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
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.FixLinkPreview}
              onChange={(value) => setExteralessSetting('FixLinkPreview', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.FixLinkPreview')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.FixLinkPreview.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.DisableLinkPreviewByDefault}
              onChange={(value) => setExteralessSetting('DisableLinkPreviewByDefault', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.DisableLinkPreviewByDefault')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.DisableLinkPreviewByDefault.Info')}</Row.Subtitle>
        </Row>
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
      <Section name="Exteraless.DisableGlobalSearch">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.DisableGlobalSearch}
              onChange={(value) => setExteralessSetting('DisableGlobalSearch', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.DisableGlobalSearch')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exteraless.HashtagSearch" caption="Exteraless.HashtagSearch.Info">
        <RangeSettingSelector
          textLeft={i18n('Exteraless.HashtagSearch.Chats')}
          textRight={(value) => i18n(value === 0 ? 'Search.Types.ThisChat' : value === 1 ? 'Search.Types.MyMessages' : 'Search.Types.PublicPosts')}
          value={exteralessSettings.SearchHashtagDefaultPageChat}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={(value) => setExteralessSetting('SearchHashtagDefaultPageChat', value)}
        />
        <RangeSettingSelector
          textLeft={i18n('Exteraless.HashtagSearch.Channels')}
          textRight={(value) => i18n(value === 0 ? 'Search.Types.ThisChat' : value === 1 ? 'Search.Types.MyMessages' : 'Search.Types.PublicPosts')}
          value={exteralessSettings.SearchHashtagDefaultPageChannel}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={(value) => setExteralessSetting('SearchHashtagDefaultPageChannel', value)}
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
      <Section name="Exteraless.ChannelPosts" caption="Exteraless.ChannelPosts.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEChatsWideChannelPosts}
              onChange={(value) => setExteralessSetting('OEChatsWideChannelPosts', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.WideChannelPosts')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exteraless.MessageMenu">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.showRepeat}
              onChange={(value) => setExteralessSetting('showRepeat', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.MenuRepeat')}</Row.Title>
          <Row.Subtitle>{i18n('Exteraless.MenuRepeat.Info')}</Row.Subtitle>
        </Row>
      </Section>
      {doubleTapSection}
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
