// No-auth fixture: real preference controls, Badge and PeerProfile.Phone; synthetic peers only.
import '@components/popupSandbox/bootstrapState';
import {seedMirror, mockManagers} from '@components/popupSandbox/bootstrapState';
import {installSandboxEnvironment} from '@components/popupSandbox/environment';
import {SELF_PEER_ID, CONTACT_PEER_ID, CHANNEL_PEER_ID, selfUser, contactUser, dialogs, makeMessage, GROUP_PEER_ID} from '@components/popupSandbox/fixtures';
import {render} from 'solid-js/web';
import {createSignal, onCleanup, Show} from 'solid-js';
import General from '@components/sidebarLeft/tabs/exteralessGeneralTab';
import Appearance from '@components/sidebarLeft/tabs/exteralessAppearanceTab';
import generatePremiumIcon from '@components/generatePremiumIcon';
import getUserStatusString from '@components/wrappers/getUserStatusString';
import addAnchorListener, {confirmExternalAnchorClick} from '@helpers/addAnchorListener';
import Preferences from '@components/sidebarLeft/tabs/exteralessTab';
import {SuperTabProvider} from '@components/solidJsTabs/superTabProvider';
import Chats from '@components/sidebarLeft/tabs/exteralessChatsTab';
import {SettingsHelpSection} from '@components/sidebarLeft/tabs/settings';
import StickersTipCard from '@components/chatTips/stickersCard';
import {MessageRender} from '@components/chat/messageRender';
import {showMessageTimeHint} from '@components/chat/messageTimeHint';
import buttonKeyDown from '@helpers/solid/buttonKeyDown';
import ReactionsElement from '@components/chat/reactions';
import {ReactionLayoutType} from '@components/chat/reaction';
import wrapReply from '@components/wrappers/reply';
import {ChatType} from '@components/chat/chatType';
import {generateTail} from '@components/chat/utils';
import Icon from '@components/icon';
import {getMiddleware} from '@helpers/middleware';
import Badge from '@components/badge';
import PeerProfile from '@components/peerProfile';
import ArchiveDialog, {createArchiveDialogState} from '@components/archiveDialog';
import {appSettings, setAppSettings} from '@stores/appSettings';
import HotReloadGuard from '@lib/solidjs/hotReloadGuardProvider';
import I18n from '@lib/langPack';
import formatCount from '@helpers/number/formatCount';
import {EmojiTextTsx} from '@lib/richTextProcessor/wrapEmojiText';
import {resetExteralessPreferences} from '@stores/exteralessPreferences';
import '@/scss/style.scss';
import '@/scss/fonts.scss';

function PhoneSample(props: {peerId: PeerId, id: string}) {
  let host: HTMLDivElement;
  return <div id={props.id} ref={host}>
    <PeerProfile peerId={props.peerId} isDialog={false} scrollable={undefined} setCollapsedOn={host} />
  </div>;
}

function ArchiveSample() {
  const [visible, setVisible] = createSignal(false);
  const owner = createArchiveDialogState({onHasArchiveDialogChanged: setVisible});
  onCleanup(owner.dispose);
  const element = new ArchiveDialog();
  element.HotReloadGuard = HotReloadGuard;
  element.feedProps({state: owner.state});
  void owner.state.ensureHydrated();
  return <div id="fixture-archive" class="chatlist">
    <Show when={visible()}>{element}</Show>
    <p role="status">{visible() ? 'Archive row visible' : 'Archive row hidden'}</p>
    <button type="button" onClick={() => setAppSettings('showArchiveInChatList', !appSettings.showArchiveInChatList)}>Toggle native archive setting</button>
  </div>;
}

async function boot() {
  await installSandboxEnvironment();
  await import('@lib/solidjs/hotReloadGuardValue');
  mockManagers.override({
    apiManager: {getBaseDcId: () => 2},
    appStickersManager: {
      getFeaturedStickers: () => [{set: {_: 'stickerSet', id: '424242', access_hash: '0', title: 'Test recommended pack', count: 0, pFlags: {}}}],
      getStickerSet: () => ({documents: []})
    },
    appEmojiManager: {getCustomEmojiDocument: () => undefined},
    dialogsStorage: {
      getDialogs: () => ({dialogs: [{...dialogs[0], folder_id: 1, index_1: 1}], isEnd: true, count: 1}),
      getFolderUnreadCount: () => ({unreadCount: 2500})
    }
  });
  seedMirror('peers', String(SELF_PEER_ID), {...selfUser, phone: '12025550123'});
  seedMirror('peers', String(CONTACT_PEER_ID), {...contactUser, phone: '12025550124', color: {
    _: 'peerColorCollectible', collectible_id: '0', gift_emoji_id: '0', accent_color: 0xcc5049, colors: [0xcc5049, 0xd67722]
  }});
  resetExteralessPreferences();

  // Scope this fixture to the real phone component. Other profile surfaces are covered elsewhere.
  for(const key of [
    'AutoAvatar', 'UnofficialWarning', 'PersonalChannel', 'BotMainApp',
    'LinkedCommunity', 'BotVerification', 'BotPermissions'
  ] as const) PeerProfile[key] = () => null;
  PeerProfile.MainSection = () => <><PeerProfile.Phone /><PeerProfile.IdAndDc /></>;

  const [count, setCount] = createSignal(1234567);
  const [commandResult, setCommandResult] = createSignal('No command sent');
  const [linkResult, setLinkResult] = createSignal('No navigation performed');
  const {default: linkProcessor} = await import('@lib/internalLinkProcessor');
  linkProcessor.construct(mockManagers.managers as any);
  addAnchorListener({name: 'im', callback: () => setLinkResult('Telegram URL continued locally; no navigation')});
  const previewLink = (kind: 'hidden' | 'telegram') => {
    setLinkResult('No navigation performed');
    const anchor = document.createElement('a');
    anchor.href = kind === 'telegram' ? 'https://t.me/example/42?thread=7' : 'https://destination.example/path';
    anchor.textContent = kind === 'hidden' ? 'A different destination' : anchor.href;
    if(kind === 'telegram') (window as any).im(anchor);
    else (window as any).showMaskedAlert(anchor, undefined, () => setLinkResult('URL continued locally; no navigation'));
  };
  const previewExternalClick = (event: MouseEvent) => {
    if(event.type === 'auxclick' && event.button !== 1) return;
    const anchor = (event.target as HTMLElement).closest('a');
    if(!anchor) return;
    setLinkResult('No navigation performed');
    const continued = () => setLinkResult('URL continued locally; no navigation');
    if(!confirmExternalAnchorClick(event, anchor, continued)) {
      event.preventDefault();
      continued();
    }
  };
  const middleware = getMiddleware();
  const reactionSamples = [CONTACT_PEER_ID, GROUP_PEER_ID, CHANNEL_PEER_ID].map((peerId, index) => {
    const element = ReactionsElement.create();
    element.init({context: {peerId, mid: 1}, type: ReactionLayoutType.Block, middleware: middleware.get()});
    element.render();
    element.id = 'fixture-reactions-' + index;
    element.append(['Private reactions', 'Group reactions', 'Channel reactions'][index]);
    return element;
  });
  const reply = wrapReply({title: 'Test reply author', subtitle: 'Synthetic reply text', setColorPeerId: CONTACT_PEER_ID, middleware: middleware.get()});
  await reply.fillPromise;
  reply.container.id = 'fixture-reply';
  // Asset stand-ins only; the reply wrapper itself supplies the collectible slot.
  const pattern = document.createElement('div');
  pattern.className = 'quote-like-pattern';
  pattern.textContent = 'Pattern';
  reply.container.prepend(pattern);
  reply.container.querySelector('.reply-collectible').textContent = 'Gift';
  const editedTime = MessageRender.setTime({
    chat: {isAnyGroup: true, getPostAuthor: () => ''} as any,
    chatType: ChatType.Chat,
    message: makeMessage({peerId: GROUP_PEER_ID, edit_date: 1700000001}),
    isOut: false,
    middleware: middleware.get()
  });
  const stickerTime = MessageRender.setTime({
    chat: {isAnyGroup: true, getPostAuthor: () => ''} as any,
    chatType: ChatType.Chat,
    message: makeMessage({peerId: GROUP_PEER_ID}),
    isOut: false,
    middleware: middleware.get()
  });
  const timeMessage = makeMessage({peerId: GROUP_PEER_ID, date: 1700000000, edit_date: 1700000060,
    fwd_from: {_: 'messageFwdHeader', pFlags: {}, date: 1600000000, saved_date: 1800000000}});
  let timeHost: HTMLDivElement;
  const [timeSample, setTimeSample] = createSignal<HTMLElement>();
  const refreshTimeSample = () => {
    const container = document.createElement('div');
    container.className = 'bubble is-in is-group-first';
    const header = document.createElement('div');
    header.className = 'name colored-name';
    header.dir = 'auto';
    header.textContent = 'Forwarded from Test author';
    MessageRender.appendForwardedDate(header, timeMessage);
    const content = document.createElement('div');
    content.className = 'bubble-content';
    content.style.minWidth = '300px';
    const body = document.createElement('div');
    body.className = 'message';
    body.append('Synthetic forwarded message ', MessageRender.setTime({
      chat: {getPostAuthor: () => ''} as any, chatType: ChatType.Chat,
      message: timeMessage, isOut: false, middleware: middleware.get()
    }));
    content.append(header, body);
    container.append(content);
    setTimeSample(container);
  };
  refreshTimeSample();
  const statusUser = {...contactUser, status: {_: 'userStatusOffline' as const, was_online: Math.floor(Date.now() / 1000) - 23 * 3600}};
  const titleSample = () => {
    const title = document.createElement('span');
    title.className = 'peer-title with-icons';
    const emoji = document.createElement('span');
    emoji.className = 'emoji-status';
    emoji.textContent = 'Emoji';
    const verified = document.createElement('span');
    verified.className = 'verified-icon';
    verified.style.width = 'auto';
    verified.textContent = 'Verified';
    title.append('Test peer ', generatePremiumIcon(), emoji, verified);
    return title;
  };
  const dispose = render(() => <HotReloadGuard>
    <div class="fixture-grid">
      <section aria-label="General preferences">
        <details><summary>Project preferences</summary><SuperTabProvider self={{} as any}><Preferences /></SuperTabProvider></details>
        <details><summary>Chat preferences</summary><Chats /></details>
        <details><summary>Appearance preferences</summary><Appearance /></details>
        <details open><summary>General preferences</summary><General /></details>
      </section>
      <section aria-label="Synthetic samples" class="fixture-samples">
        <h2>Synthetic samples</h2>
        <p>Real components with test data; no Telegram account.</p>
        <h3>Link questions (real handlers, navigation replaced locally)</h3>
        <button type="button" onClick={() => previewLink('hidden')}>Preview hidden link</button>
        <div onClick={previewExternalClick} onAuxClick={previewExternalClick}><a href="https://destination.example/path">Preview visible link</a></div>
        <button type="button" onClick={() => previewLink('telegram')}>Preview Telegram link</button>
        <p id="fixture-link-result" role="status">{linkResult()}</p>
        <h3>Title status (stock styles/star; text markers for emoji and verification)</h3>
        <div id="fixture-header-status" class="chat-info"><div class="user-title">{titleSample()}</div></div>
        <div id="fixture-profile-status" class="profile-name">{titleSample()}</div>
        <div id="fixture-list-status" class="user-title">{titleSample()}</div>
        <h3>Last seen (real formatter, synthetic status 23 hours ago)</h3>
        <p id="fixture-relative-status">{getUserStatusString(statusUser)}</p>
        <h3>Message tails (stock SVG and bubble styles)</h3>
        <div class="chat active" style="position:relative;height:auto;width:auto;padding:16px;">
          <div id="fixture-tail-in" class="bubble is-in is-group-first is-group-last can-have-tail"><div class="bubble-content"><div class="message">Incoming test message</div>{generateTail()}</div></div>
          <div id="fixture-tail-out" class="bubble is-out is-group-first is-group-last can-have-tail"><div class="bubble-content"><div class="message">Outgoing test message</div>{generateTail()}</div></div>
        </div>
        <h3>Composer layout (synthetic controls, stock styles)</h3>
        <div class="chat-input-wrapper"><div class="chat-input rows-wrapper" style="--padding-vertical:8px;--chat-input-height:48px;">
          <div id="fixture-send-as" class="new-message-wrapper rows-wrapper-row has-offset forwards" data-offset="as">
            <button type="button" class="new-message-send-as-container message-send-as" aria-label="Send as Test sender">Me</button>
            <button type="button" class="attach-file btn-icon" aria-label="Attach sample file">{Icon('attach')}</button>
            <div class="input-message-container">Test draft</div>
          </div>
          <div id="fixture-commands" class="new-message-wrapper rows-wrapper-row has-offset forwards" data-offset="commands">
            <button type="button" class="new-message-bot-commands" aria-label="Sample bot commands">/</button>
            <button type="button" class="attach-file btn-icon" aria-label="Attach bot sample file">{Icon('attach')}</button>
            <div class="input-message-container">Bot draft</div>
          </div>
        </div>
        <SettingsHelpSection />
        </div>
        <h3>Real reaction containers (text stand-ins)</h3>
        {reactionSamples}
        <button type="button" onClick={() => {
          void import('@components/popups/deleteDialog').then(({default: open}) => open(CONTACT_PEER_ID, 'chat'));
        }}>Preview delete confirmation</button>
        <button type="button" onClick={async() => {
          const {default: confirm} = await import('@components/confirmationPopup');
          void confirm({
            peerId: CONTACT_PEER_ID,
            titleLangKey: 'Exteraless.ConfirmCall.Title',
            descriptionLangKey: 'Exteraless.ConfirmCall.Video',
            descriptionLangArgs: ['Test user'],
            button: {langKey: 'VideoCall'}
          }).catch(() => {});
        }}>Preview call question (no call)</button>
        <button type="button" onClick={async() => {
          const {default: confirm} = await import('@components/chat/confirmBotCommand');
          setCommandResult(await confirm('/start@test_bot') ? 'Confirmed locally; no command sent' : 'Canceled; no command sent');
        }}>Preview bot command (no sending)</button>
        <p role="status">{commandResult()}</p>
        <h3>Real stickers tip (synthetic pack)</h3>
        <div style="width:320px;height:320px;"><StickersTipCard /></div>
        <h3>Real reply (synthetic peer colors and asset stand-ins)</h3>
        <div class="chat active" style="position:relative;height:auto;width:auto;"><div class="bubble is-in"><div class="bubble-content" style="min-width:260px;">{reply.container}</div></div></div>
        <h3>Real edited timestamp</h3>
        <div class="bubble is-in"><div class="bubble-content"><div class="message">Edited test message {editedTime}</div></div></div>
        <h3>Forward date and time hint (real renderers)</h3>
        <button type="button" onClick={refreshTimeSample}>Refresh forwarded message</button>
        <div ref={timeHost} id="fixture-message-time" class="chat active" style="position:relative;height:auto;width:auto;padding:16px;" onClick={(event) => {
          const time = (event.target as HTMLElement).closest<HTMLElement>('.time');
          if(time) showMessageTimeHint(timeMessage, ChatType.Chat, time, timeHost);
        }} onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if(target.matches('[role="button"]')) buttonKeyDown(event, target);
        }}>{timeSample()}</div>
        <h3>Sticker timestamp layout (synthetic sticker)</h3>
        <div id="fixture-sticker" class="bubble sticker is-in"><div class="bubble-content" style="position:relative;width:160px;height:80px;background:var(--surface-color);"><span>Sticker sample</span>{stickerTime}</div></div>
        <h3>Zalgo display and draft</h3>
        <p id="fixture-zalgo"><EmojiTextTsx text={'A\u0301\u0302\u0303\u0304 link'} entities={[{_: 'messageEntityTextUrl', offset: 6, length: 4, url: 'https://example.invalid/'}]} /></p>
        <p id="fixture-zalgo-draft"><EmojiTextTsx text={'A\u0301\u0302\u0303\u0304 draft'} isDraft /></p>
        <div class="fixture-count">Count <Badge tag="span" size={24} color="primary" count={count()} format={formatCount} /></div>
        <button type="button" onClick={() => setCount(count() === 1234567 ? 2500 : 1234567)}>Change sample count</button>
        <h3>Own profile</h3>
        <PhoneSample id="fixture-self" peerId={SELF_PEER_ID} />
        <h3>Contact profile</h3>
        <PhoneSample id="fixture-contact" peerId={CONTACT_PEER_ID} />
        <h3>Channel profile</h3>
        <PhoneSample id="fixture-channel" peerId={CHANNEL_PEER_ID} />
        <h3>Native archive row</h3>
        <ArchiveSample />
        <button type="button" onClick={() => {
          const rtl = !I18n.getIsRTL();
          I18n.forceRTL(rtl);
        }}>Switch direction</button>
        <button type="button" onClick={resetExteralessPreferences}>Reset preferences</button>
      </section>
    </div>
  </HotReloadGuard>, document.getElementById('fixture-root'));
  window.addEventListener('pagehide', () => {
    dispose();
    middleware.destroy();
  }, {once: true});
  document.getElementById('fixture-result').textContent = 'Ready';
}

void boot().catch((err) => {
  document.getElementById('fixture-result').textContent = `Fixture failed: ${String(err)}`;
});
