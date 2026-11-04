import Row from '@components/rowTsx';
import Section from '@components/section';
import RangeSettingSelector from '@components/rangeSettingSelector';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import LottieAnimation from '@components/lottieAnimation';
import {hotReloadGuard} from '@lib/solidjs/hotReloadGuardProvider';
import {useSuperTab} from '@components/solidJsTabs/superTabProvider';
import {i18n, LangPackKey} from '@lib/langPack';
import {
  useExterayondSettings,
  getStickerTimeMode,
  setStickerTimeMode,
  getStickerScale,
  getOpenLinkConfirmation,
  setOpenLinkConfirmation,
  DOUBLE_TAP_ACTIONS,
  DOUBLE_TAP_INCOMING_OPTIONS,
  DOUBLE_TAP_OUTGOING_OPTIONS,
  doubleTapActionLangKey
} from '@stores/exterayondSettings';
import type {ExterayondSettingsKey} from '@stores/exterayondSettings';

/**
 * The Chats category of the exteraless Preferences hub: every control is a
 * ported Android `ChatsConfig` setting with its behavior wired into Web K.
 * Labels and ranges follow strings_oe_chats.xml / `OpenExteraChatsActivity`.
 */
const TOGGLES: Array<[key: ExterayondSettingsKey, langKey: LangPackKey, infoKey?: LangPackKey]> = [
  ['OEChatsRemoveMessageTail', 'Exterayond.RemoveMessageTail'],
  ['OEChatsHideCallButton', 'Exterayond.HideCallButton'],
  ['OEChatsHideChannelSearchButton', 'Exterayond.HideSearchButton'],
  ['UseEditedIcon', 'Exterayond.UseEditedIcon'],
  ['DateOfForwardedMsg', 'Exterayond.DateOfForwardedMsg', 'Exterayond.DateOfForwardedMsg.Info'],
  ['ShowTimeHint', 'Exterayond.MessageTimeDetails', 'Exterayond.MessageTimeDetails.Info'],
  ['HideShareButtonInChannel', 'Exterayond.HideShareButton'],
  ['HideGiftButtonInChannel', 'Exterayond.HideGiftButton'],
  ['hideSendAsChannel', 'Exterayond.HideSendAsPeer', 'Exterayond.HideSendAsPeer.Info'],
  ['DontSendGreetingSticker', 'Exterayond.DisableGreetingSticker', 'Exterayond.DisableGreetingSticker.Info'],
  ['DisableTrending', 'Exterayond.DisableTrending', 'Exterayond.DisableTrending.Info'],
  ['hideGroupSticker', 'Exterayond.HideGroupSticker', 'Exterayond.HideGroupSticker.Info'],
  ['DeleteChatForBothSides', 'Exterayond.DeleteChatForBothSides', 'Exterayond.DeleteChatForBothSides.Info'],
  ['ConfirmAVMessage', 'Exterayond.AskBeforeAVMessage', 'Exterayond.AskBeforeAVMessage.Info'],
  ['AskBeforeCalling', 'Exterayond.AskBeforeCalling'],
  ['repeatConfirm', 'Exterayond.AskWhenRepeating'],
  ['DisableClickCommandToSend', 'Exterayond.AskBeforeBotCommand'],
  ['DontAutoPlayNextVoice', 'Exterayond.DontAutoPlayNextVoice'],
  ['HidePremiumSection', 'Exterayond.HidePremiumSection'],
  ['HideHelpSection', 'Exterayond.HideHelpSection'],
  ['HideStoriesFromHeader', 'Exterayond.HideStories', 'Exterayond.HideStories.Info'],
  ['DisableDialogsFloatingButton', 'Exterayond.HideFloatingButton'],
  ['HideAllTab', 'Exterayond.HideAllChats'],
  ['OEChatsReplyColors', 'Exterayond.ReplyColors'],
  ['OEChatsReplyEmoji', 'Exterayond.ReplyEmoji'],
  ['OEChatsReplyBackground', 'Exterayond.ReplyBackground'],
  ['OEChatsShowResultsBeforeVoting', 'Exterayond.ShowResultsBeforeVoting', 'Exterayond.ShowResultsBeforeVoting.Info'],
  ['OEChatsAlwaysSendInHD', 'Exterayond.AlwaysSendInHD'],
  ['showAddToSavedMessages', 'Exterayond.MenuAddToSaved'],
  ['CopyPhoto', 'Exterayond.MenuCopyPhoto'],
  ['showReport', 'Exterayond.MenuReport']
];

const STRIP_TRACKING_TOGGLES: Array<[key: ExterayondSettingsKey, langKey: LangPackKey]> = [
  ['OEChatsStripTrackingOnOpen', 'Exterayond.StripTrackingOnOpen'],
  ['OEChatsStripTrackingOnPaste', 'Exterayond.StripTrackingOnPaste']
];

const PAUSE_TOGGLES: Array<[key: ExterayondSettingsKey, langKey: LangPackKey]> = [
  ['AutoPauseVideo', 'Exterayond.PauseVideo'],
  ['OEChatsPauseVoice', 'Exterayond.PauseVoice'],
  ['OEChatsPauseRound', 'Exterayond.PauseRound']
];

const REACTION_TOGGLES: Array<[key: ExterayondSettingsKey, langKey: LangPackKey]> = [
  ['OEChatsHideReactionsChannels', 'Exterayond.HideReactions.Channels'],
  ['OEChatsHideReactionsGroups', 'Exterayond.HideReactions.Groups'],
  ['OEChatsHideReactionsPrivate', 'Exterayond.HideReactions.Private']
];

const ExterayondChats = () => {
  const [exterayondSettings, setExterayondSetting] = useExterayondSettings();
  const [tab] = useSuperTab();

  const stickerShapeLabel = (value: number) => {
    if(value === 0) {
      return i18n('Exterayond.StickerShape.Default');
    } else if(value === 1) {
      return i18n('Exterayond.StickerShape.Rounded');
    }

    return i18n('Exterayond.StickerShape.AsMessage');
  };

  // * CHAT-10 — the selector steps a filtered option list (Android's
  // * showDoubleTapOptions minus the values the web cannot back), while the
  // * store keeps the Android enum verbatim. An imported value outside the
  // * list displays as Disable until the selector moves it.
  const doubleTapIndex = (action: number, list: readonly number[]) => Math.max(0, list.indexOf(action));

  const doubleTapSection = (
    <Section name="Exterayond.DoubleTap" caption="Exterayond.DoubleTap.Info">
      <RangeSettingSelector
        textLeft={i18n('Exterayond.DoubleTapIncoming')}
        textRight={(index) => i18n(doubleTapActionLangKey(DOUBLE_TAP_INCOMING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE))}
        value={doubleTapIndex(exterayondSettings.DoubleTapAction, DOUBLE_TAP_INCOMING_OPTIONS)}
        minValue={0}
        maxValue={DOUBLE_TAP_INCOMING_OPTIONS.length - 1}
        step={1}
        onChange={(index) => setExterayondSetting('DoubleTapAction', DOUBLE_TAP_INCOMING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE)}
      />
      <RangeSettingSelector
        textLeft={i18n('Exterayond.DoubleTapOutgoing')}
        textRight={(index) => i18n(doubleTapActionLangKey(DOUBLE_TAP_OUTGOING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE))}
        value={doubleTapIndex(exterayondSettings.DoubleTapActionOut, DOUBLE_TAP_OUTGOING_OPTIONS)}
        minValue={0}
        maxValue={DOUBLE_TAP_OUTGOING_OPTIONS.length - 1}
        step={1}
        onChange={(index) => setExterayondSetting('DoubleTapActionOut', DOUBLE_TAP_OUTGOING_OPTIONS[index] ?? DOUBLE_TAP_ACTIONS.NONE)}
      />
      {/* CHAT-11 — the reaction row exists only while an action sends one
          (OpenExteraChatsActivity's doubleTapReactionRow condition); it opens
          the stock quick-reaction subtab, the web's own reaction chooser */}
      {(exterayondSettings.DoubleTapAction === DOUBLE_TAP_ACTIONS.SEND_REACTIONS ||
        exterayondSettings.DoubleTapActionOut === DOUBLE_TAP_ACTIONS.SEND_REACTIONS) && (
        <Row clickable={() => tab.slider.createTab(hotReloadGuard.tabs.AppQuickReactionTab).open()}>
          <Row.Title>{i18n('Exterayond.DoubleTapReaction')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.DoubleTap.ReactionInfo')}</Row.Subtitle>
        </Row>
      )}
    </Section>
  );

  return (
    <>
      <Section name="Exterayond.Chats">
        {TOGGLES.map(([key, langKey, infoKey]) => (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exterayondSettings[key] as boolean}
                onChange={(value) => setExterayondSetting(key, value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n(langKey)}</Row.Title>
            {infoKey && <Row.Subtitle>{i18n(infoKey)}</Row.Subtitle>}
          </Row>
        ))}
      </Section>
      <Section name="Exterayond.BottomButton">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.BottomButton')}
          textRight={(value) => value === 0 ? i18n('Exterayond.BottomButton.Hide') : value === 1 ? i18n('Exterayond.BottomButton.Mute') : i18n('Exterayond.BottomButton.Discuss')}
          step={1}
          value={exterayondSettings.OEChatsBottomButton}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExterayondSetting('OEChatsBottomButton', value)}
        />
      </Section>
      <Section name="Exterayond.OpenLinkPolicy" caption="Exterayond.OpenLinkPolicy.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.FixLinkPreview}
              onChange={(value) => setExterayondSetting('FixLinkPreview', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.FixLinkPreview')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.FixLinkPreview.Info')}</Row.Subtitle>
        </Row>
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.DisableLinkPreviewByDefault}
              onChange={(value) => setExterayondSetting('DisableLinkPreviewByDefault', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.DisableLinkPreviewByDefault')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.DisableLinkPreviewByDefault.Info')}</Row.Subtitle>
        </Row>
        <RangeSettingSelector
          textLeft={i18n('Exterayond.OpenLinkPolicy')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.OpenLinkPolicy.Hidden' : value === 1 ? 'Exterayond.OpenLinkPolicy.All' : 'Exterayond.OpenLinkPolicy.Never')}
          value={getOpenLinkConfirmation()}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={setOpenLinkConfirmation}
        />
      </Section>
      <Section name="Exterayond.DisableGlobalSearch">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.DisableGlobalSearch}
              onChange={(value) => setExterayondSetting('DisableGlobalSearch', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.DisableGlobalSearch')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exterayond.HashtagSearch" caption="Exterayond.HashtagSearch.Info">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.HashtagSearch.Chats')}
          textRight={(value) => i18n(value === 0 ? 'Search.Types.ThisChat' : value === 1 ? 'Search.Types.MyMessages' : 'Search.Types.PublicPosts')}
          value={exterayondSettings.SearchHashtagDefaultPageChat}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={(value) => setExterayondSetting('SearchHashtagDefaultPageChat', value)}
        />
        <RangeSettingSelector
          textLeft={i18n('Exterayond.HashtagSearch.Channels')}
          textRight={(value) => i18n(value === 0 ? 'Search.Types.ThisChat' : value === 1 ? 'Search.Types.MyMessages' : 'Search.Types.PublicPosts')}
          value={exterayondSettings.SearchHashtagDefaultPageChannel}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={(value) => setExterayondSetting('SearchHashtagDefaultPageChannel', value)}
        />
      </Section>
      <Section name="Exterayond.StripTracking">
        {STRIP_TRACKING_TOGGLES.map(([key, langKey]) => (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exterayondSettings[key] as boolean}
                onChange={(value) => setExterayondSetting(key, value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n(langKey)}</Row.Title>
          </Row>
        ))}
      </Section>
      <Section name="Exterayond.ChannelPosts" caption="Exterayond.ChannelPosts.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEChatsWideChannelPosts}
              onChange={(value) => setExterayondSetting('OEChatsWideChannelPosts', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.WideChannelPosts')}</Row.Title>
        </Row>
      </Section>
      <Section name="Exterayond.MessageMenu">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.showRepeat}
              onChange={(value) => setExterayondSetting('showRepeat', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.MenuRepeat')}</Row.Title>
          <Row.Subtitle>{i18n('Exterayond.MenuRepeat.Info')}</Row.Subtitle>
        </Row>
      </Section>
      {doubleTapSection}
      <Section name="Exterayond.StickerSize" caption="Exterayond.StickerSize.Info">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.StickerSize')}
          textRight={(value) => '' + Math.round(value * 10) / 10}
          value={exterayondSettings.stickerSize}
          minValue={4}
          maxValue={20}
          step={0.1}
          onChange={(value) => setExterayondSetting('stickerSize', value)}
        />
        <div aria-hidden="true" style="height:280px;display:grid;place-items:center;">
          <div style={{width: '200px', height: '200px', transform: `scale(${getStickerScale()})`}}>
            <LottieAnimation lottieLoader={hotReloadGuard.lottieLoader} name="UtyanDiscussion" size={200} lottieOptions={{autoplay: false}} />
          </div>
        </div>
      </Section>
      <Section name="Exterayond.StickerShape">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.StickerShape')}
          textRight={stickerShapeLabel}
          step={1}
          value={exterayondSettings.OEChatsStickerShape}
          minValue={0}
          maxValue={2}
          onChange={(value) => setExterayondSetting('OEChatsStickerShape', value)}
        />
      </Section>
      <Section name="Exterayond.StickerTime">
        <RangeSettingSelector
          textLeft={i18n('Exterayond.StickerTime')}
          textRight={(value) => i18n(value === 0 ? 'Exterayond.StickerTime.Default' : value === 1 ? 'Exterayond.StickerTime.Side' : 'Exterayond.StickerTime.Hidden')}
          value={getStickerTimeMode()}
          minValue={0}
          maxValue={2}
          step={1}
          onChange={setStickerTimeMode}
        />
      </Section>
      <Section name="Exterayond.PauseOnMinimize">
        {PAUSE_TOGGLES.map(([key, langKey]) => (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exterayondSettings[key] as boolean}
                onChange={(value) => setExterayondSetting(key, value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n(langKey)}</Row.Title>
          </Row>
        ))}
      </Section>
      <Section name="Exterayond.HideReactions">
        {REACTION_TOGGLES.map(([key, langKey]) => (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={exterayondSettings[key] as boolean}
                onChange={(value) => setExterayondSetting(key, value)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title>{i18n(langKey)}</Row.Title>
          </Row>
        ))}
      </Section>
    </>
  );
};

export default ExterayondChats;
