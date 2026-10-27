# Проводка OE_DEFAULTS (read-only)

Рабочее дерево exterayond, 2026-10-26. Прочитаны AGENTS.md и docs/upstream/AGENTS.md; приложение, тесты, сборка, сервер и браузер не запускались. Runtime не проверен: «подтв.» — явный статический путь ключ → consumer → эффект; «условно» — путь есть, но зависит от runtime-состояния; «дефект» — путь есть, но воспроизводимый сбой; «мёртв» — пути нет; UNVERIFIED — код в процессе (003). Сокращения: AS/CS/GS — exteralessAppearance/Chats/GeneralTab.tsx, ST — stores/exteralessSettings.ts; SCSS — src/scss/partials; пути от src/.

| ключ | default | UI | consumer | режим | статус | риск |
|---|---|---|---|---|---|---|
| OEAppearanceAvatarCorners | 28 | AS:42 | ST:214 → _avatar.scss:72, base.scss:883 | CSS var | подтв. | только `.avatar`/`.avatar-edit`; monoforum/topic маски не трогает |
| OEAppearanceSectionRadius | 20 | AS:74 | ST:223 → _section.scss:8 | CSS var | подтв. | только `.sidebar-left-section`; карточки вне Section не меняются |
| OEAppearanceSingleCornerRadius | false | AS:51 | ST:215 → _avatar.scss:148, base.scss:892 | CSS class | подтв. | только forum-аватары; monoforum/topic сохраняют маску |
| OEAppearanceSquareFab | true | AS:105 | ST:217 → _button.scss:1267 | CSS var | подтв. | только `.btn-corner.btn-circle`; другие круглые кнопки не FAB |
| OEAppearanceSeparateHeaders | true | AS:83 | section.tsx:89 → _section.scss:56 | reactive JSX | подтв. | все `<Section name>`, включая попапы; raw `.sidebar-left-h2` не разделяются; класс `oe-separate-headers` (ST:230) никем не читается |
| OEAppearanceHideActionBarStatus | false | AS:116 | generateTitleIcons.ts:49 | once | условно | только при `wrapOptions.middleware`; не live — титул перерисуется при смене peer |
| OEAppearanceSenderMiniAvatars | true | AS:62 | dialogSubtitle.ts:56,73,190; appDialogsManager.ts:2432 | reactive | подтв. | только subtitle диалога; поиск/контакты без мини-аватара |
| OEAppearanceCustomThemes | true | AS:136 | chat/chat.ts:575 (эффект 599) | reactive | подтв. | только тема/обои чата; при off — глобальная тема |
| OEAppearanceGlassMessageMenu | true | AS:93 | ST:238 → _button.scss:137 | CSS class | подтв. | только `.btn-menu.contextmenu` и reactions-container; прочие glass-поверхности не трогает |
| OEAppearanceNewChatHeaderStyle | false | AS:126 | ST:239 → _chatTopbar.scss:77 | CSS class | подтв. | убраны только radius/shadow; ширина и отступы карточки остались — частичный вид |
| OEChatsRemoveMessageTail | true | CS:15 | ST:232 → _chatBubble.scss:4240 | CSS class | подтв. | только `.bubble`; хвосты других типов не скрываются |
| OEChatsHideCallButton | false | CS:16 | chat/topbar.ts:406 | once | условно | не live; verify один раз на peer; topbar + profile menu |
| OEChatsHideChannelSearchButton | false | CS:17 | chat/topbar.ts:1375 | once | условно | только broadcast; не live — до следующего setPeer |
| OEChatsStickerShape | 1 | CS:102 | ST:244 → _chatBubble.scss:894 | CSS var | подтв. | только `.media-sticker` в bubble |
| OEChatsBottomButton | 1 | CS:77 | chat/input.ts:1810, 3051 | event/once | условно | только plate «нельзя писать»/replies; 2 без linked chat — клик no-op, label может стать Mute |
| OEChatsAlwaysSendInHD | true | CS:23 | helpers/canvas/photoUploadPreparation.ts:26 | once | подтв. | только фото; видео/GIF не трогает; heavy PNG/BMP всё равно жмутся |
| OEChatsKeepAttachButton | false | нет | нет | — | мёртв | нет UI и consumer; в backup не входит — настройка-призрак |
| OEChatsStickerTimeSide | false | CS:18 | ST:234 → _chatBubble.scss:1898 | CSS class | подтв. | только `.sticker`; emoji-big/round не трогает |
| OEChatsShowResultsBeforeVoting | false | CS:22 | pollMessageContent/usePollDerivedProps.ts:114 | reactive memo | условно | нужны results в сообщении; closed/creator скрыты |
| OEChatsStripTrackingOnOpen | true | CS:27 | lib/appImManager.ts:1974 → linkCleaner:46 | event | подтв. | только `openUrl`; нативный middle-click/target=_blank может обойти |
| OEChatsStripTrackingOnPaste | true | CS:28 | inputEditor/index.ts:1935 → linkCleaner:55 | event | дефект | plain-text только; при unchanged URL вставка теряется (см. фикс 1); rich HTML идёт мимо |
| OEChatsReplyColors | true | CS:19 | ST:240 → _quote.scss:6 | CSS class | подтв. | только `.reply.quote-like` |
| OEChatsReplyEmoji | true | CS:20 | ST:241 → _quote.scss:15 | CSS class | подтв. | только `.quote-like-pattern` внутри quote-like |
| OEChatsReplyBackground | true | CS:21 | ST:242 → _quote.scss:10 | CSS class | подтв. | только quote-like (+hoverable) |
| OEChatsHideReactionsChannels | false | CS:37 | chat/reactions.ts:296,335 | render-time | условно | не live — до следующего render; скрывает весь reactions-row, включая add-reaction |
| OEChatsHideReactionsGroups | false | CS:38 | chat/reactions.ts:296,335 | render-time | условно | kind=group до ответа getChat; возможен flash + re-render; не live |
| OEChatsHideReactionsPrivate | false | CS:39 | chat/reactions.ts:296,335 | render-time | условно | только user-peer; не live |
| OEChatsPauseVoice | false | CS:32 | appMediaPlaybackController.ts:245 | event | подтв. | только voice; событие visibilitychange, не «окно перекрыто» |
| OEChatsPauseRound | false | CS:33 | appMediaPlaybackController.ts:243 | event | подтв. | только round; то же visibilitychange |
| OERelativeLastSeen | false | GS:32 | wrappers/getUserStatusString.ts:68 | once | условно | только 1–24 ч; не live — до перерисовки строки |
| OEAddCommaAfterMention | true | GS:43 | chat/input.ts:2689 | event | подтв. | только вставка из autocomplete; вручную набранный @name не трогает |
| showSeconds | false | GS:21 | lib/langPack.ts:805; helpers/date.ts:165 | reactive | UNVERIFIED | код 003 в рабочем дереве (uncommitted); live только для shared messageTimeOptions, combined full-sent-time не обновляется |

## 5 малых исправлений

1. `components/chat/inputEditor/index.ts:1942` — убрать `if(cleaned === plainText) return;`. Сейчас при stripTrackingOnPaste (default true) plain-text с URL без tracking-параметров перехватывается (`return true`) и не вставляется. Одна строка, чинит потерю вставки.
2. `lib/exteraBackup/etgBackup.ts:60,75-105` — `stickerShape` лежит в UNSUPPORTED, а `hideCallButton`, `hideChannelSearchButton`, `stripTrackingOnOpen`, `stripTrackingOnPaste` не описаны; импорт/экспорт `.extera` их молча теряет. Перенести/добавить 5 записей в SUPPORTED (ключи сверены с Android `ChatsConfig.kt:38,203,206,215,218`).
3. `scss/partials/_chatlist.scss:91` — лишний `ul` перед комментарием делает правило `ul .dialog-sender-mini-avatar`; вне `<ul>` отступ мини-аватара пропадает. Удалить `ul`.
4. `components/chat/input.ts:1810` — при `OEChatsBottomButton === 2` без `linked_chat_id` клик делает `return` (no-op), хотя label может быть Mute; в `updateChannelMuteButton` (2361) label ViewDiscussion затирается. Фолбэк на `togglePeerMute` и не перетирать label при 2 — ~5 строк.
5. `helpers/date.ts:165,175` — `getMessageTimeOptions()` спредится в новый объект, поэтому `updateMountedMessageTimes` (langPack.ts:851) не находит full-sent-time и не обновляет его live; нужен общий combined-объект. Координировать с code003, не править вслепую.

Код002 уже проведён: `appDialogsManager.ts:2432` → `dialogSubtitle.ts:56,73,190`, отдельного разрыва нет. `OEChatsKeepAttachButton` — единственный полностью мёртвый ключ. «Подтв.» не означает проверку в браузере: это только чтение кода.
