# Рабочий чеклист переноса exteraless → exterayond

Это полный список **296 строк / 22 группы** из [исходного каталога](exteraless-feature-inventory.md), без добавления новых фич. Некоторые строки — параметры одной системы, а не независимые функции.

**Правило:** работаем только по ID ниже, от небольших интеграций к большим. Отметку [x] и зачёркивание ставим после подключения реального поведения, настроек и совместимого backup/reset, когда они предусмотрены Android. Один переключатель без эффекта не считается интеграцией. Частичные реализации остаются неотмеченными.

Статус интеграции не означает проверку на пользовательском аккаунте. Подробности и пределы проверок — в [журнале](tasks/progress.md). Проверки только на ПК, короткие и целевые. Плагины отложены; аппаратные Android-исключения перечислены в исходном каталоге и не выданы за выполненные функции.

Current progress: **73 completed entries out of 296** — a literal recount of
the checked catalog lines after packets 059–063 (the previous running count
said 64 before this run; the two-entry drift predates it — CHAT-36 and
GEN-07 are checked and integrated but were not counted). Plus 4 completed
user-directed look & feel entries (V-1..V-4) and 4 completed W entries
(W-1..W-3, W-6) in the user-directed sections below — outside the catalog
count. Update this checklist after each integration; the original
catalog remains the source reference.

Типы: **П** — переносимая логика, **А** — веб-адаптация, **С** — подсистема. Их отсутствие в Web K не является причиной вычёркивать строку.

## Основные: форматирование, профиль, загрузки и архив

- [ ] **GEN-01 — Перевод в отдельном окне/нижней панели** (**А**). **061: вердикт — на вебе нет второго представления ручного перевода.** Android: `OEChatsTranslateInSheet` (ChatsConfig bool, default false) выбирает, куда ложится результат кнопки «Translate»: off — штатный форковый конвейер `MessageTrans.kt` (перевод прямо в сообщении, варианты translatorMode с оригиналом/заменой), on — штатный нижний лист `TranslateAlert2` (`ChatActivity:48295`, внутри листа `nekoProviders` ведёт перевод через провайдер форка). Веб-аналог листа — существующий translate-попап (`openTranslatePopup`), единственное представление ручного перевода; встроенный конвейер — отдельная подсистема (территория TRANS-02/TRANS-05). Переключатель с одинаковыми состояниями не добавляется; EtgBackup ключ не экспортирует (проверено) — хранить нечего.
  [`translateInSheetRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L100) — Нужен веб-эквивалент представления результата, а не новая система перевода.

- [x] ~~GEN-02 — Точные числа вместо округления «1,2 тыс.»~~ (**П**). 004: все исходные потребители счётчиков, живое обновление, backup/reset.
  [`disableNumberRoundingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L104)

- [x] ~~GEN-03 — Секунды во времени сообщений~~ (**П**). 003: обычные и полные метки времени, 12/24 часа, backup/reset.
  [`formatTimeWithSecondsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L105)

- [x] ~~GEN-04 — Фильтрация Zalgo-текста~~ (**П**). 011: отображение текста и имён; исходные entities, ссылки и черновики сохраняются.
  [`filterZalgoRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L107)

- [x] ~~GEN-05 — Относительное «был в сети»: «5 минут назад»~~ (**П**). 026: подтверждены сутки с переходом через полночь/Новый год, граница24ч, сохранение приватных статусов и штатного off; backup/reset. Открытый чат обновляет статус штатно либо при повторном открытии.
  [`relativeLastSeenRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L127)

- [x] ~~GEN-06 — Скрытие своего номера в интерфейсе~~ (**П**). 009: собственный профиль, контакты не скрываются, backup/reset.
  [`hidePhoneRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L128) — Локальное отображение; не меняет серверные настройки приватности.

- [x] ~~GEN-07 — Показ ID и дата-центра, форматы Telegram API/Bot API~~ (**П**). 014: режимы скрыто / Telegram API / Bot API, копирование, DC из доступных данных, backup/reset.
  [`showIdAndDcRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L129)

- [ ] **GEN-08 — Ускорение скачивания: обычное / быстрое / максимальное** (**А**).
  [`downloadSpeedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L111) — Нужно отдельно измерять и переносить стратегию загрузчика, а не обещать ускорение переключателем.

- [ ] **GEN-09 — Ускорение загрузки файлов на сервер** (**А**).
  [`uploadBoostRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L112)

- [ ] **GEN-10 — Сохранение медиа в подпапки по чатам** (**А**).
  [`saveToChatSubfolderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L122) — Зависит от модели загрузок и доступа к файловой системе браузера.

- [ ] **GEN-11 — Папка сохранения файлов** (**А**).
  [`savePathRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L123) — Браузерные разрешения и поддержка различаются; произвольный путь Android не переносится буквально.

- [x] ~~GEN-12 — Сортировка чатов по непрочитанным~~ (**П**). 044: точный ключ `SortByUnread` (NaConfig bool, default false); worker-side раскладка индексов диалогов: непрочитанные (упоминания, реакции, незаглушённый счётчик — как `ChatsHelper.isUnreadSortPriority`, агрегат форума по кэшу тем) поднимаются над прочитанными под полосой закреплённых; live-переключение переиндексирует хранилище и перестраивает списки; alias в Android EtgBackup отсутствует.
  [`sortByUnreadRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L134)

- [ ] **GEN-13 — Расширенные локальные закрепления** (**А**).
  [`unlimitedPinnedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L135) — Нельзя обещать снятие серверных лимитов Telegram; нужен разбор локального механизма.

- [x] ~~GEN-14 — Скрытие архива~~ (**П**). 010: один native-источник showArchiveInChatList, backup/reset.
  [`hideArchiveRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L136)

- [ ] **GEN-15 — Открытие архива жестом** (**А**).
  [`archiveOnPullRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L137) — На ПК нужен доступный эквивалент мышью/клавиатурой.

- [ ] **GEN-16 — Отключение случайного извлечения из архива свайпом** (**А**).
  [`disableUnarchiveSwipeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L138)

- [ ] **GEN-17 — Last.fm и музыка в профиле** (**С**).
  [`lastfmRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L130) — Исходник записывает ник в метаданные трека; это отдельная интеграция, не готовый музыкальный стриминг.

## Внешний вид, шапки и дизайн настроек

- [x] ~~**LOOK-01 — Форма аватаров: квадрат → скругление → круг** (**П**).~~ 059: точный ключ `OEAppearanceAvatarCorners` (int 0..28, default 28 = круг, `AVATAR_CORNERS_MAX = 28`); слайдер ведёт `--oe-avatar-radius` через единую точку `.avatar` (corners/28·50%, 0 = квадрат); 059 закрыл пробел полноты — с выключенным `singleCornerRadius` ползунок теперь масштабирует и аватары форумов (× 42/64, Android `getAvatarCorners` CORNER_TYPE_FORUM) отдельной переменной, на дефолте переменная снимается и штатный радиус форума Web K (37%) остаётся; alias `avatarCorners` из Android-бэкапа (floatToInt 0..28) round-trips. Правка hasStories (−2.5dp) — внутренняя подгонка Android под кольцо историй; веб-кольцо историй — свой компонент со своей геометрией. Визуальная проверка — runbook 4.21.
  [`avatarCornersPreviewRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L102)

- [x] ~~**LOOK-02 — Единое скругление для обычных чатов, форумов и сообществ** (**П**).~~ 059: точный ключ `OEAppearanceSingleCornerRadius` (bool, default false); включённый — аватары форумов получают общий радиус avatarCorners (live-класс); 059 дополнил выключенное состояние: без объединения ползунок всё равно масштабирует форумы (× 42/64), так что форма форумов следует слайдеру, как в Android. Масштаб сообществ (40/72, CORNER_TYPE_COMMUNITY) веб-аналога не имеет — Web K не рендерит отдельный класс аватара сообщества (monoforum ведёт свою маску); записано как предел. Alias `singleCornerRadius` (bool) round-trips.
  [`singleCornerRadiusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L103)

- [x] ~~LOOK-03 — Мини-аватар автора в строке группового чата~~ (**П**). 002: настоящий владелец строки диалога, обновление и очистка.
  [`senderMiniAvatarsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L126)

- [ ] **LOOK-04 — Свой текст заголовка списка чатов: приложение / username / имя / «Чаты» / собственный** (**А**).
  [`titleTextRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L127) — У Web K другая шапка; нужен осмысленный веб-вариант, а не автоматическое исключение.

- [x] ~~LOOK-05 — Заголовок по центру~~ (**А**). 041: точный ключ `OEAppearanceCenterTitle` (bool, default false; в Android мигрирован в NaConfig.centerActionBarTitle); заголовки боковых панелей центрируются live-классом (веб-адаптация центрированного ActionBar-заголовка); backup alias `centerTitle` из Android EtgBackup (bool) round-trips.
  [`centerTitleRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L110)

- [ ] **LOOK-06 — Снег и сезонное оформление шапки** (**А**).
  [`forceSnowRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L109)

- [ ] **LOOK-07 — Круглая или квадратная скруглённая плавающая кнопка** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`fabShapeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L80)

- [x] ~~LOOK-08 — Системный шрифт вместо встроенного~~ (**А**). 041: точный ключ NekoConfig `TypefaceUseDefault` (bool, default true — Android-дефолт включает системные шрифты); live-класс меняет `--font-regular` на системный стек, веб-семейства serif/mono/rounded сохраняют свои шрифты (в Android переключатель ведёт только основную Roboto); backup alias `useSystemFonts` из Android EtgBackup (bool) round-trips.
  [`useSystemFontsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L81)

- [ ] **LOOK-09 — Пружинящее растяжение аватара в профиле** (**А**).
  [`gooeyAvatarRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L82) — Это анимация интерфейса, не аппаратная функция телефона.

- [ ] **LOOK-10 — Индивидуальные темы и обои чатов** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  049 (acceptance round 1, F-4): the row's gate is extracted into `resolveChatThemeOverride` and regression-tested — off drops the peer's theme emoticon and wallpaper exactly like `ChatActivity.setupChatTheme`'s early return, on is the stock Web K per-chat behavior. It reads as dead in acceptance because the visible effect needs a chat whose theme or wallpaper was set from another client (the web has no UI to set one); the authenticated data path is unverified here.
  [`customThemesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L83)

- [x] ~~**LOOK-11 — Радиус карточек разделов настроек** (**П**).~~ 060 (аудит полноты): точный ключ `OEAppearanceSectionRadius` (int 0..28, default 20); на вебе дефолт нейтрален — штатный радиус карточек Web K ($section-rounded-border-radius, 24px) остаётся, остальные значения применяются пикселями через `--oe-section-radius` к единой точке карточек-секций `.sidebar-left-section` (компонент Section используется по всему приложению: вкладки обеих панелей и попапы), к радиусам summary/reveal хаба и сегментам MD3-списка; это заявленная веб-адаптация — Android красит все RecyclerListView-секции уже на дефолте. Alias `sectionRadius` (floatToInt 0..28) round-trips.
  [`sectionRadiusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L88)

- [x] ~~**LOOK-12 — Отдельные заголовки разделов** (**П**).~~ 060: поведение уже было подключено — компонент Section при включённом рендерит заголовок вне карточки (`.is-separated`), ровно как Android исключает HeaderCell из фона секции (`sectionsSeparatedHeaders()`); 060 добавил отсутствовавшую регрессию (off — заголовок внутри карточки, on — своя карточка-заголовок, живой тумблер в обе стороны, M3-списки форсируют разделение — веб-гейт `separateHeaders || m3ListItems`, стиля «Сегменты» на вебе нет); alias `sectionsSeparatedHeaders` (bool) round-trips. Визуальная проверка — runbook 4.22.
  [`separateHeadersRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L89)

- [ ] **LOOK-13 — Разделители: скрытые / линии / сегментированные карточки** (**А**).
  [`dividerStyleRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L90)

- [ ] **LOOK-14 — Стеклянные меню сообщений и реакций** (**А**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`glassMessageMenuRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L96)

- [ ] **LOOK-15 — Стиль обводки стеклянных поверхностей** (**А**).
  [`glassOutlineRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L95)

- [ ] **LOOK-16 — Размытие интерфейса чата** (**А**).
  [`forceBlurRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L97)

- [ ] **LOOK-17 — Отключение размытия аватаров** (**П**).
  [`disableAvatarBlurRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L98)

- [ ] **LOOK-18 — Material 3 loading indicators** (**А**). **028: wavy circular/linear web adaptation implemented; desktop visual review pending.**
  [`md3LoadingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L113)

- [ ] **LOOK-19 — Material 3 sliders** (**А**). **028: 8px track, 3×24px thumb and gap implemented; desktop visual review pending.**
  [`md3SliderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L114)

- [ ] **LOOK-20 — Material 3 switches** (**А**). **028: Android scaled track/thumb geometry implemented; desktop visual review pending.**
  [`md3SwitchRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L115)

- [ ] **LOOK-21 — Material 3 chat header** (**А**). **028: flat tonal surface, full column width and 46px avatar implemented; desktop visual review pending.**
  [`md3ChatHeaderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L116) — The existing desktop pinned-panel geometry is retained; see packet 028.

- [ ] **LOOK-22 — Material 3 navigation** (**А**). **028: existing folder rail/tabs styled with tonal indicators; desktop visual review pending.**
  [`md3NavBarRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L117)

- [ ] **LOOK-23 — Material 3 list items** (**А**). **028: 56/72px rows, tonal segments and separate headers implemented; desktop visual review pending.**
  [`md3ListItemsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L118)

- [ ] **LOOK-24 — iOS-подобная шапка чата** (**А**).
  [`iosChatHeaderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L124)

- [ ] **LOOK-25 — iOS-подобная навигационная панель** (**А**).
  [`iosNavBarRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L123)

- [ ] **LOOK-26 — Заголовки вкладок папок: текст / иконки / смешанный режим** (**П**).
  [`tabTitleStyleRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L133)

- [x] ~~LOOK-27 — Счётчик папок: все / кроме чатов без звука / выключен~~ (**П**). 034: точный ключ `IgnoreUnreadCount` (int 0..2, default 1), счётчики папок скрываются в режиме off, «все» считает и заглушённые; живое обновление; alias `tabCounter` из Android-бэкапа (bool: true=0, false=2).
  [`tabCounterRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L134)

## Папки и навигация приложения

- [ ] **FOLD-01 — Режим компоновки «телефон / планшет / авто»** (**А**).
  [`ID_TABLET_MODE`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L61) — Для ПК это выбор плотности/колонок, не эмуляция Android-устройства.

- [ ] **FOLD-02 — Стиль анимации перехода назад** (**А**).
  [`ID_BACK_ANIMATION`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L62)

- [ ] **FOLD-03 — Режим нижней навигации** (**А**).
  [`ID_BOTTOM_NAVIGATION_BAR`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L63) — Сначала определить веб-навигацию; отсутствие такой панели в базе не делает фичу телефонной.

- [ ] **FOLD-04 — Скрытие названий вкладок навигации** (**А**).
  [`ID_HIDE_TAB_TITLES`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L67)

- [ ] **FOLD-05 — Скрытие вкладки контактов** (**А**).
  [`ID_HIDE_CONTACTS_TAB`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L68)

- [ ] **FOLD-06 — Скрытие вкладки звонков** (**А**).
  [`ID_HIDE_CALLS_TAB`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L69)

- [ ] **FOLD-07 — Скрытие вкладки профиля** (**А**).
  [`ID_HIDE_PROFILE_TAB`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L70)

- [ ] **FOLD-08 — Боковое меню / drawer** (**А**).
  [`ID_DRAWER`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L65)

- [ ] **FOLD-09 — Полное смещение содержимого при открытии drawer** (**А**).
  [`ID_IMMERSIVE`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L66)

- [x] ~~**FOLD-10 — Перестановка пунктов главного меню** (**П**).~~ 054 + 062: раскладка потребляется — `OEAppearanceMainMenuLayout` («видимые;скрытые», схема id `MainMenuItem` 1:1) переставляет и скрывает пункты меню «⋮» левой панели при каждом открытии; 062 добавил и редактор порядка в хабе: у строк видимой половины появились кнопки вверх/вниз (десктоп-адаптация долгого нажатия-перетаскивания Android-редактора, `allowReorder`+`onReordered`), перенос сплайсит по сохранённой последовательности — пункты без веб-аналога пропускаются, но сохраняют своё место в строке; «Настройки» остаются на своём месте (`saveMainMenuLayout`); импорт `.extera` по-прежнему переносит строку целиком.
  [`MainMenuLayout.getLayout()`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L137)

- [x] ~~**FOLD-11 — Скрытие и восстановление пунктов главного меню** (**П**).~~ 054: экран «Main Menu» в хабе (открывается из Appearance): переключатели видимости переносят пункт между половинами строки ровно как сохранение редактора Android; «Настройки» скрыть нельзя — веб всегда без нижней панели (`ensureSettingsVisibility`); id без веб-аналога не предлагаются (правило реестра пилюль).
  [`MainMenuLayout.getHiddenItems()`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L189)

- [x] ~~**FOLD-12 — Добавление и перестановка разделителей меню** (**П**).~~ 054 + 062: разделитель читается из строки раскладки (DIVIDER(-1), только в видимой половине) и рисуется линией после предыдущего пункта; 062 добавил управление в хабе: строка «Add a divider» дописывает разделитель в конец видимой половины (как кнопка Android-редактора, ID_ADD_DIVIDER), строка-разделитель в списке кликабельна и удаляется (как клик по разделителю в Android), разделители тоже переставляются кнопками вверх/вниз.
  [`MainMenuItem.DIVIDER`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L210)

- [x] ~~**FOLD-13 — Сброс раскладки меню** (**П**).~~ 054: строка «Reset to Default» возвращает пустую строку — «настройку не трогали», меню байт-в-байт штатное (`MainMenuLayout.reset`).
  [`resetMenuLayout`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L119)

## Сообщения, ввод, поиск и жесты

- [x] ~~CHAT-01 — Размер стикеров с предпросмотром~~ (**П**). 020: float 4..20/default14, встроенный предпросмотр, реальные размеры стикера и рендерера, backup/reset; существующий чат нужно переоткрыть.
  [`stickerSizeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L129)

- [x] ~~CHAT-02 — Форма стикеров: исходная / скруглённая / как пузырь сообщения~~ (**П**). 007 и существующая интеграция: три формы стикеров, CSS, backup/reset.
  [`stickerShapeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L139)

- [x] ~~CHAT-03 — Время на стикерах: обычное / сбоку / скрыто~~ (**П**). 017: все три режима, live CSS только для стикеров, оба исходных флага и полный backup/reset.
  [`stickerTimeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L130)

- [x] ~~CHAT-04 — Цвета ответов~~ (**П**). 019: исправлен приоритет индивидуальных цветов; акцент и полосатая линия возвращаются к цвету темы.
  [`replyColorsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L132)

- [x] ~~CHAT-05 — Эмодзи/узор в ответах~~ (**П**). 019: скрываются узор и коллекционный подарок, убирается отступ подарка.
  [`replyEmojiRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L133)

- [x] ~~CHAT-06 — Подложка ответов~~ (**П**). 019: проверены независимое отключение/возврат подложки, live CSS, backup/reset.
  [`replyBackgroundRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L134)

- [ ] **CHAT-07 — Отправка заблокированных premium-эмодзи как стикеров** (**А**).
  [`lockedEmojiAsStickerRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L154) — Поведение-конверсия, а не выдача Premium.

- [ ] **CHAT-08 — Расширенная история недавних стикеров** (**А**).
  [`unlimitedStickersRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L156)

- [ ] **CHAT-09 — Расширенная история GIF** (**А**).
  [`unlimitedGifsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L157)

- [x] ~~**CHAT-10 — Разные действия двойного нажатия по входящим и исходящим** (**А**).~~ 051: `DoubleTapAction` / `DoubleTapActionOut` (NaConfig, the `DoubleTap.kt` enum 0..12 verbatim, Android defaults 1/1 = send reactions) in the Chats tab's "Double tap" section; the bubble's dblclick handler dispatches — the quick reaction (`chat.sendReaction`, CHAT-11), the message context menu (Show Reactions), the native translate popup, Reply (the stock web path), Forward, Save (forward to Saved Messages), Save to device, Repeat (CHAT-35), Repeat as Copy (`dropAuthor`), Delete, Edit; the LLM translate is not offered (no web provider) and an imported value no-ops. A double click that selects text stays a selection.
  [`doubleTapIncomingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L167) — Нет действия; отправить/показать реакции; обычный/LLM-перевод; ответ; пересылка; сохранение; скачивание; повтор; повтор копией; редактирование своего; удаление. На ПК согласовать с выделением текста и двойным кликом.

- [x] ~~**CHAT-11 — Выбор реакции для действия двойного нажатия** (**П**).~~ 051: a "Reaction on Double Tap" row shows while either side sends a reaction (Android's `doubleTapReactionRow` condition) and opens the stock Quick Reaction subtab — the web analog of `reaction_on_double_tap` (`MediaDataController.getDoubleTapReaction`) is the account's quick reaction (`messages.setDefaultReaction`).
  [`doubleTapReactionRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L169)

- [ ] **CHAT-12 — Быстрый переход к следующему каналу** (**А**).
  [`quickTransitionChannelsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L177)

- [ ] **CHAT-13 — Быстрый переход к следующей теме форума** (**А**).
  [`quickTransitionTopicsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L178)

- [x] ~~CHAT-14 — Удаление чата для обеих сторон по умолчанию~~ (**П**). 021: начальная отметка в существующих окнах удаления чата/сообщений; права и окончательный выбор пользователя сохранены.
  [`deleteChatForBothSidesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L180) — Только в пределах доступных Telegram действий.

- [ ] **CHAT-15 — Скрытие экранной клавиатуры при прокрутке** (**А**).
  [`hideKeyboardOnScrollRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L181) — Для обычного ПК без экранной клавиатуры не требуется; имеет смысл на сенсорных устройствах.

- [x] ~~CHAT-16 — Запятая после вставленного упоминания~~ (**П**). 021: исправлены исключения ботов и упоминаний по имени, сохранены entities; поздний результат не попадает в другой чат.
  [`addCommaRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L185)

- [ ] **CHAT-17 — Калькулятор в поле ввода** (**С**).
  [`inlineMathRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L186) — Отсутствие калькулятора в Web K — объём реализации, не аппаратное ограничение.

- [ ] **CHAT-18 — Валютные вычисления через @calcmulabot** (**С**).
  [`inlineMathCurrencyRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L187) — Нужна отдельная проверка сетевой интеграции и UX.

- [ ] **CHAT-19 — Нажатие для переключения голосового сообщения и видеокружка** (**А**).
  [`tapToSwitchRecordRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L189)

- [x] ~~CHAT-20 — Постоянная кнопка вложений при наборе~~ (**А**). Веб-эквивалент: кнопка вложений в Web K никогда не сменяется при наборе — постоянство уже штатное поведение базы; отдельный переключатель не добавлен (был бы пустым). Ключ `OEChatsKeepAttachButton` остаётся в записи для совместимости.
  [`keepAttachButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L190)

- [x] ~~CHAT-21 — Отключение глобального поиска~~ (**П**). 038: точный ключ `DisableGlobalSearch` (NaConfig bool, default false); глобальная (серверная) выдача «Global search» в поиске списка чатов скрывается, свои чаты/контакты и локальные результаты остаются; sponsored-плашки и поиск в чате — вне затрагивания (как в Android); alias в Android EtgBackup отсутствует.
  [`disableGlobalSearchRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L182)

- [x] ~~CHAT-22 — Область поиска хэштегов по умолчанию: чаты / каналы~~ (**П**). 032: точные ключи `SearchHashtagDefaultPageChat`/`Channel` (int 0..2, default 0); поиск по хэштегу открывается на выбранной странице (публичный канал — свой ключ), ручной выбор сохраняется.
  [`searchHashtagChatRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L183)

- [x] ~~CHAT-23 — Удаление хвостов пузырей сообщений~~ (**П**). 025: проверены штатный SVG, полное скругление входящих/исходящих, live on/off, RTL, reset и Android backup-alias.
  [`removeMessageTailRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L200)

- [x] ~~CHAT-24 — Иконка вместо надписи «изменено»~~ (**П**). 012: штатный значок edit, доступная локализованная подпись, backup/reset.
  [`replaceEditedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L201)

- [ ] **CHAT-25 — Индикатор онлайна** (**П**).
  [`showOnlineStatusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L202)

- [x] ~~**CHAT-26 — Результаты опросов до голосования** (**П**).~~ 063 (аудит полноты + регрессия): точный ключ `OEChatsShowResultsBeforeVoting` (ChatsConfig bool, default false); гейт — таблица истинности `ChatMessageCell.isPollResultsPreviewEnabled()` (ChatMessageCell.java:1473-1491) один в один: настройка вкл, опрос не закрыт, на сообщении есть результаты с голосами, `hide_results_until_close` прячет их от всех кроме создателя опроса; предикат выделен в чистую функцию и покрыт таблицей (5 кейсов); строка в Chats, alias `showResultsBeforeVoting` (bool, EtgBackup.java:367) round-trips. Android-внутренний `forceShowPollResults` (ручное «просмотреть как автор») — состояние штатного веб-потока опроса, к гейту настройки не относится.
  [`showResultsBeforeVotingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L208) — Только там, где сервер реально предоставляет результаты.

- [x] ~~CHAT-27 — Дата исходного пересланного сообщения~~ (**П**). 023: дата/время оригинала рядом с автором пересылки; локализованный формат, обновление существующих сообщений при повторном открытии чата.
  [`dateOfForwardedMsgRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L209)

- [x] ~~CHAT-28 — Подсказка с точным временем сообщения~~ (**П**). 023: щелчок по времени показывает отправку/правку/оригинал с секундами; Enter/Space/Escape, off сохраняет штатное поведение.
  [`showTimeHintRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L210)

- [ ] **CHAT-29 — Запоминание цепочки возвратов после переходов по ответам** (**А**).
  [`rememberAllRepliesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L211)

- [x] ~~**CHAT-30 — Исправление превью ссылок** (**П**)~~. 036: точный ключ `FixLinkPreview` (NaConfig bool, default true); URL запроса превью переписывается встроенными правилами `PagePreviewRulesHelper` (x.com → fixupx.com и ещё 9, 1:1 с ревизией), отправляемый текст не меняется; удалённый канал правил на закреплённой ревизии отключён в Android — переносятся только встроенные. Проверка превью в браузере — в runbook.
  [`fixLinkPreviewRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L288)

- [x] ~~CHAT-31 — Отключение превью ссылок по умолчанию~~ (**П**). 031: точный ключ `DisableLinkPreviewByDefault` (default false); новые сообщения без fetch превью уходят с no_webpage; черновики и правки хранят своё состояние; live-переключение гасит зависший запрос.
  [`disableLinkPreviewRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L289)

- [x] ~~CHAT-32 — Ask before opening links: hidden / all / never~~ (**П**). 027: live policy in Chats; native link handlers, ordinary anchors and middle clicks retain their navigation owners. Cancellation and account changes stop pending actions.
  [`openLinkConfirmationRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L290)

- [x] ~~CHAT-33 — Подтверждение отправки голосового сообщения/видеокружка~~ (**П**). 033: точный ключ `ConfirmAVMessage` (default false); отпускание записи ставит её в существующее состояние превью-паузы, отправка оттуда — явное подтверждение, отмена — сброс.
  [`confirmAVMessageRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L292)

- [x] ~~CHAT-34 — Подтверждение звонка~~ (**П**). 022: голосовой/видео, согласие до завершения текущего/старта нового звонка, отмена и режим off.
  [`askBeforeCallRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L293)

- [x] ~~CHAT-35 — Подтверждение повтора сообщения~~ (**П**). 043: точные ключи NekoConfig `showRepeat` (bool, default false — веб-действие «Repeat» в меню сообщения, `repeatConfirm` (bool, default true — подтверждение перед пересылкой в тот же чат, `ChatActivity.repeatMessage` → `doRepeatMessage`, диалог `repeatConfirmText`); noforwards/недоступные для отправки чаты и service-сообщения исключены; alias `showRepeatMessageButton` из Android EtgBackup (bool) round-trips, для `repeatConfirm` alias нет.
  [`repeatConfirmRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L294)

- [x] ~~CHAT-36 — Подтверждение отправки команды боту~~ (**П**). 022: ссылки в сообщениях, меню бота и подсказки после «/»; отмена сохраняет ввод, контекст защищён от смены чата.
  [`disableClickCommandToSendRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L295)

- [ ] **CHAT-37 — Удаление трекинговых параметров при открытии ссылок** (**П**). **061: проводка завершена, ожидает проверки кликов пользователем (implemented-but-unreviewed).** Точный ключ `OEChatsStripTrackingOnOpen` (ChatsConfig bool, default true — совпадает); движок — байт-порт `UrlCleaner`/`AdGuardRule` со штатным фильтром `adguard_url_tracking.txt` (не статический список), роута «open» уже шла через `appImManager.openUrl`; 061 закрыл пробел против Android `Browser.openUrl:295`: обычные ссылки сообщений навигируют нативно, поэтому `stripAnchorTracking` синхронно переписывает href внешних http(s)-анкоров до дефолтного действия браузера (клик и средняя кнопка, повтор перед подтверждением CHAT-32 — Android тоже чистит до своего подтверждения), href возвращается после навигации (наведения/копирование показывают оригинал); префеч фильтра на загрузке приложения (`preloadIfEnabled`), при незагруженном фильтре URL проходит нетронутым (`getCleaner() ?: url`). Регрессия: `linkCleanerOpen` (5). Alias в Android EtgBackup отсутствует.
  [`stripTrackingOpenRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L297)

- [x] ~~CHAT-38 — Удаление трекинговых параметров при вставке ссылок~~ (**П**). 006: сохранение вставки, защита от позднего ответа, Undo/Redo.
  [`stripTrackingPasteRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L298)

- [ ] **CHAT-39 — Обновление и возврат встроенного AdGuard-фильтра трекинга** (**А**).
  [`trackingFilterRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L299) — Не сводить к одному статическому списку query-параметров, если цель — паритет.

- [x] ~~CHAT-40 — Широкие посты и пересланные посты каналов~~ (**А**). 042: точный ключ `OEChatsWideChannelPosts` (bool, default false); посты broadcast-канала (включая пересланные в канале — проверка по чату, как `hasWideChannelPostHeader`) растягивают пузырь на всю ширину строки live-классом; альбомы и медиа без подложки сохраняют свою раскладку (отдельный медиа-путь Android не воспроизводится); backup alias `wideChannelPosts` из Android EtgBackup (bool) round-trips.
  [`wideChannelPostsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L535)

- [ ] **CHAT-41 — Широкие посты в ленте** (**А**). **Лента (FEED-01) в Web K отсутствует — настройка ждёт веб-примитив; ключ `OEChatsWideFeedPosts` хранится в записи и round-trips в backup как документированный no-op.**
  [`wideFeedPostsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L536)

## Настраиваемые меню и кнопки

- [x] ~~MENU-01 — Нижняя кнопка канала: скрыть / без звука / обсудить~~ (**П**). 008: скрыть / mute / discussion, исправлены click и поздние ответы.
  [`bottomButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L174)

- [ ] **MENU-02 — Быстрые действия администратора** (**П**).
  [`adminShortcutsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L175)

- [ ] **MENU-03 — Состав меню чата — 13 пунктов** (**П**).
  [`chatMenuGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L212) — Администраторы; недавние действия; статистика; разрешения; участники; бусты; связанный чат; к началу; к сообщению; скрыть заголовок; просмотр удалённых; очистка удалённых; удаление своих сообщений. Функции удалённых зависят от AyuMoments.

- [ ] **MENU-04 — Группировка меню сообщений** (**П**).
  [`groupedMessageMenuRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L278)

- [ ] **MENU-05 — Состав меню сообщения — 24 пункта** (**П**).
  [`messageMenuGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L226) — Реакции; ответ лично; ссылка; кадр видео; фото; копия стикером; добавить в стикеры; избранные стикеры; переслать без цитирования; напоминание; сохранить; закладка; повторить; повторить копией; очистить кэш; история; перевод; LLM-перевод; поделиться; скрыть; жалоба; действия администратора; разрешения; подробности. Каждый пункт должен иметь реальный обработчик.

- [ ] **MENU-06 — Стиль меню форматирования текста** (**П**).
  [`textStyleRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L279)

- [ ] **MENU-07 — Состав меню медиапросмотрщика — 6 пунктов** (**П**).
  [`mediaViewerMenuGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L251) — Переслать; переслать без цитирования; копировать кадр; копировать фото; установить фото профиля; распознать QR.

- [ ] **MENU-08 — Состав панели действий над выделенными сообщениями** (**П**).
  [`actionBarButtonsGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L258) — Ответ; редактирование; выделить между; копирование; пересылка.

- [ ] **MENU-09 — Предустановки диалога удаления** (**П**).
  [`deleteMenuGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L273) — Блокировать пользователей; жалоба на спам; удалить все; действие с общими группами. Не обходят Telegram-права.

## Скрытие элементов и визуальных эффектов

- [x] ~~HIDE-01 — Скрытие emoji-статуса/значка Premium в заголовках~~ (**П**). 026: live CSS в заголовках чата/профиля; список чатов, verified/scam-значки и данные статуса сохраняются; backup/reset.
  [`hideActionBarStatusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L362)

- [x] ~~HIDE-02 — Скрытие историй в шапке~~ (**П**). 035: exact NaConfig key `HideStoriesFromHeader` (bool, default true); the dialogs' stories strip is never shown (a root class hides `.stories-list`, live on/off, reset); backup alias `hideStories` from Android EtgBackup (bool) round-trips.
  [`hideStoriesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L363)

- [x] ~~HIDE-03 — Скрытие плавающей кнопки нового чата~~ (**П**). 005: только FAB, альтернативное создание чата через меню.
  [`hideFloatingButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L364)

- [ ] **HIDE-04 — Скрытие строки поиска** (**П**).
  [`hideSearchBarRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L365) — Нужен альтернативный доступ к поиску с клавиатуры.

- [x] ~~HIDE-05 — Скрытие вкладки «Все чаты»~~ (**П**). 040: точный ключ `HideAllTab` (NekoConfig bool, default false); вкладка «Все чаты» уходит из панели папок и боковой рейки, пока остаются настоящие папки (пустая панель не оставляется), выбор живой уходит в первую видимую папку общим кликом, обратное включение восстанавливает вкладку из фильтров; backup alias `hideAllChats` из Android EtgBackup (bool) round-trips.
  [`hideAllChatsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L366)

- [x] ~~HIDE-06 — Скрытие кнопки «Отправить как…»~~ (**П**). 025: кнопка и её отступ скрываются сразу, отправитель сохраняется; команды бота и выбор автора платной реакции остаются доступны; backup/reset.
  [`hideSendAsPeerRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L188)

- [x] ~~HIDE-07 — Скрытие боковой кнопки «Поделиться»~~ (**П**). 013: боковая пересылка постов, Saved Messages сохраняются.
  [`hideShareButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L203)

- [x] ~~HIDE-08 — Скрытие кнопки подарков в каналах~~ (**П**). 037: точный ключ `HideGiftButtonInChannel` (NaConfig bool, default false); gift-кнопка «невозможно писать»-плашки канала (Android BUTTON_GIFT) скрывается live-классом, send-gift в личных чатах не затрагивается; alias в Android EtgBackup отсутствует.
  [`hideGiftButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L204)

- [x] ~~HIDE-09 — Скрытие поиска в канале~~ (**П**). 012–013: применяется к открытому broadcast-чату сразу.
  [`hideSearchButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L205)

- [x] ~~HIDE-10 — Скрытие кнопки звонка~~ (**П**). 012–013: применяется к открытому чату сразу, доступность звонка сохраняется.
  [`hideCallButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L206)

- [x] ~~HIDE-11 — Скрытие финансового пункта меню вложений~~ (**П**). 039: аудит разрешения — Android скрывает wallet-«Money» в шторке вложений (`ChatAttachAlert.java:7028`, только при walletAvailable); в Web K меню вложений финансового пункта нет, исход равен постоянному штатному поведению. Alias в Android EtgBackup отсутствует — переключатель не добавлялся.
  [`hideMoneyButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L207)

- [x] ~~HIDE-12 — Скрытие реакций отдельно в каналах, группах и личных чатах~~ (**П**). 021: live CSS по типу peer из UI-кэша, без запросов и пересоздания полос реакций; backup/reset.
  [`hideReactionsGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L158)

- [x] ~~HIDE-13 — Скрытие плитки камеры в меню вложений~~ (**А**). 039: аудит разрешения — Android скрывает плитку камеры в шторке вложений (`ChatAttachAlert.java:6062`, `ChatAttachAlertPhotoLayout.java:159`); в Web K меню вложений плитки камеры нет (моментальная камера — кнопка микрофона, другой элемент). Ключ `OEChatsHideCameraTile` остаётся в записи для совместимости, alias `hideCameraTile` из Android-бэкапа применяется без предупреждения (документированный no-op).
  [`hideCameraTileRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L328)

- [x] ~~HIDE-14 — Скрытие рекомендованных стикеров~~ (**П**). 018: рекомендации в поиске наборов и подсказке пустого окна; явный поиск сохраняется.
  [`disableTrendingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L152)

- [x] ~~HIDE-15 — Скрытие группового набора стикеров~~ (**П**). 018: не запрашивает/не показывает групповой раздел; обновление при следующем открытии панели, групповые эмодзи сохраняются.
  [`hideGroupStickerRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L153)

- [x] ~~HIDE-16 — Отключение приветственного стикера~~ (**П**). 015: пустой чат сохраняет текст; скрытый стикер не запрашивается/не монтируется; disableGreetingSticker в backup.
  [`disableGreetingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L179)

- [ ] **HIDE-17 — Скрытие AI-редактора** (**П**).
  [`hideAiEditorRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L374)

- [ ] **HIDE-18 — Скрытие AI-сводки сообщений** (**П**).
  [`hideAiSummaryRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L375)

- [ ] **HIDE-19 — Скрытие AI-сводки Instant View** (**П**).
  [`hideAiIvRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L376)

- [ ] **HIDE-20 — Выбор отображаемых Premium-эффектов — 8 переключателей** (**П**).
  [`premiumElementsGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L264) — Emoji-статусы; эмодзи и цвета в ответах; обои; видеоаватары; реакции звёздами; эффекты стикеров; бусты. Локальное отображение, не подписка.

- [x] ~~HIDE-21 — Скрытие раздела Premium в настройках~~ (**П**). 016: реальный Premium/Business/Stars/Gifts-раздел и его поисковые строки скрываются; ограничения покупки сохраняются.
  [`hidePremiumSectionRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L380)

- [x] ~~HIDE-22 — Скрытие раздела помощи в настройках~~ (**П**). 016: веб-адаптация — четыре штатных пункта Help, реальное скрытие и фильтрация поиска; по умолчанию скрыт.
  [`hideHelpSectionRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L381)

## Медиа, запись, воспроизведение

- [ ] **MEDIA-01 — HD-качество фото по умолчанию** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`alwaysSendHdRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L325)

- [ ] **MEDIA-02 — HDR-фото** (**А**).
  [`hdrPhotosRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L326) — Нужна проверка декодирования, дисплея и браузера; нельзя объявлять все HDR-фото исключительно Android-фичей.

- [ ] **MEDIA-03 — Использование внешнего/встроенного способа захвата фото** (**А**).
  [`disableInstantCameraRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L327) — Переносить пользовательский выбор источника, не Android Intent.

- [ ] **MEDIA-04 — Выбор камеры для видеокружков** (**А**).
  [`videoMessagesCameraRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L317) — На ПК — выбор доступной камеры/веб-камеры.

- [ ] **MEDIA-05 — Запоминание последней камеры** (**А**).
  [`rememberLastUsedCameraRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L318)

- [ ] **MEDIA-06 — Ползунок зума камеры и его поведение** (**А**).
  [`zoomSliderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L319) — Только если камера/браузер предоставляют соответствующие возможности; без гарантии Android-паритета.

- [ ] **MEDIA-07 — Статичный зум** (**А**).
  [`staticZoomRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L320)

- [ ] **MEDIA-08 — Предпочитать оригинальное качество видео** (**П**).
  [`preferOriginalQualityRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L334)

- [ ] **MEDIA-09 — Увеличенный битрейт записи видео** (**А**).
  [`enhancedVideoBitrateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L335) — Пределы реального браузерного кодировщика нужно проверять отдельно.

- [ ] **MEDIA-10 — Компактное отображение GIF** (**П**).
  [`showSmallGifRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L339)

- [ ] **MEDIA-11 — Шаг перемотки двойным нажатием: 5 / 10 / 15 / 30 секунд** (**А**).
  [`doubleTapSeekDurationRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L333)

- [ ] **MEDIA-12 — Жест перехода в «картинку в картинке»** (**А**).
  [`swipeToPipRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L337) — На ПК также нужна обычная кнопка/горячая клавиша; зависит от PiP API.

- [x] ~~**MEDIA-13 — Автопауза видео при сворачивании** (**П**).~~ 030: точный Neko key `AutoPauseVideo` (default true), пауза по `visibilitychange` в контроллере воспроизведения, переключатель в Chats, совместимый alias `pauseOnMinimizeVideo` в `.extera`; регрессия гоняет настоящий обработчик.
  [`pauseVideoRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L343)

- [x] ~~**MEDIA-14 — Автопауза голосовых при сворачивании** (**П**).~~ 030: прежняя проводка `OEChatsPauseVoice` (default false) проверена регрессией на настоящем обработчике контроллера.
  [`pauseVoiceRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L344)

- [x] ~~**MEDIA-15 — Автопауза видеокружков при сворачивании** (**П**).~~ 030: прежняя проводка `OEChatsPauseRound` (default false) проверена регрессией на настоящем обработчике контроллера.
  [`pauseRoundRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L345)

- [ ] **MEDIA-16 — Шумоподавление и улучшение голоса** (**А**).
  [`voiceEnhancementsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L350) — У Web K уже есть собственные аудиокомпоненты; нужно сравнить возможности.

- [x] ~~MEDIA-17 — Отключение автозапуска следующего голосового~~ (**П**). 015: остановка после голосового, музыка/видеокружки и ручное переключение сохраняются. Отдельного alias в Android EtgBackup нет.
  [`dontAutoPlayNextVoiceRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L340)

## Полный музыкальный плеер и мини-плеер

- [ ] **PLAYER-01 — Full MD3 music player** (**С**). **028: base music popup and existing mini-player adaptation implemented. 029: the style settings of Android's PlayerStyleEditor are ported into the hub and drive the popup (PLAYER-02..05, 08..10, 12, 15..17). Queue, lyrics, gestures, block order, cover colors and the background modes remain pending; see packets 028 and 029.**
  [`PlayerStyleEditor`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L39) — Подсистема уже реализована в Android; на вебе нужна интеграция с существующим воспроизведением.

- [ ] **PLAYER-02 — Стиль обложки: карточка / широкая / на весь экран / пластинка** (**П**). **029: all four styles wired into the popup as CSS adaptations (card/wide 6:5/full backdrop/disc); desktop visual review pending.**
  [`OEPlayerCoverCard`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L73)

- [ ] **PLAYER-03 — Размер обложки** (**П**). **029: 60..100% fraction drives the card and disc covers; desktop visual review pending.**
  [`OEPlayerCoverSize`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L76)

- [ ] **PLAYER-04 — Радиус обложки** (**П**). **029: 0..48 radius applies to the card cover only, like refreshVisibility; desktop visual review pending.**
  [`OEPlayerCoverRadius`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L78)

- [ ] **PLAYER-05 — Вращение пластинки во время воспроизведения** (**П**). **029: disc spins 16s/turn while playing, off at reduced motion; desktop visual review pending.**
  [`OEPlayerDiscSpin`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L80)

- [ ] **PLAYER-06 — Переключение треков жестом по обложке** (**А**).
  [`OEPlayerCoverSwipe`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L81)

- [ ] **PLAYER-07 — Продолжение обложки вниз** (**П**).
  [`OEPlayerCoverExtend`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L82)

- [ ] **PLAYER-08 — Выравнивание названия трека** (**П**). **029: start (Android default) / centered alignment wired; desktop visual review pending.**
  [`OEPlayerAlignStart`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L85)

- [ ] **PLAYER-09 — Размер названия** (**П**). **029: small/medium/large 22/26/31 and 15/16/17 title/artist sizes; desktop visual review pending.**
  [`OEPlayerSizeSmall`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L88)

- [ ] **PLAYER-10 — Положение названия: над обложкой / под ней** (**П**). **029: above/below follows refreshVisibility (framed styles only); desktop visual review pending.**
  [`OEPlayerTitleBelow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L90)

- [ ] **PLAYER-11 — Кнопка добавления трека в профиль** (**А**).
  [`OEPlayerShowLike`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L92) — Зависит от поддержки музыки профиля в движке Web K.

- [ ] **PLAYER-12 — Показ источника воспроизведения** (**П**). **029: 'Playing from chat' line with the real peer title, hidden-in-place when off; desktop visual review pending.**
  [`OEPlayerShowSource`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L93)

- [ ] **PLAYER-13 — Порядок блоков: прогресс / управление / действия** (**П**).
  [`orderList`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L60)

- [ ] **PLAYER-14 — Показ скорости, текста и очереди** (**П**).
  [`OEPlayerShowActions`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L100)

- [ ] **PLAYER-15 — Показ перемешивания и повтора** (**П**). **029: repeat control hides when off; shuffle has no web counterpart (controller lacks it), so the port is partial.**
  [`OEPlayerShowModes`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L101)

- [ ] **PLAYER-16 — Волна на полосе прогресса** (**П**). **029: WavyProgressLine ports the WavySeekBar wave (amplitude 4, wavelength 34, 6 rad/s) over the existing seek owner; desktop visual review pending.**
  [`OEPlayerShowWave`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L102)

- [ ] **PLAYER-17 — Размер кнопок управления** (**П**). **029: compact/normal/large 0.84/1/1.14 scale of the transport; desktop visual review pending.**
  [`OEPlayerControlsCompact`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L106)

- [ ] **PLAYER-18 — Цвета из обложки или из темы** (**П**).
  [`OEPlayerColorsCover`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L113)

- [ ] **PLAYER-19 — Фон: сплошной / градиент / размытие** (**П**).
  [`OEPlayerBackgroundSolid`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L116)

- [ ] **PLAYER-20 — Настраиваемый мини-плеер** (**С**).
  [`OEPlayerStyleMini`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L119)

- [ ] **PLAYER-21 — Расположение мини-плеера** (**А**).
  [`OEPlayerMiniMoveHint`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L122) — В Android есть перемещение верх/низ; требуется подходящая веб-компоновка.

- [ ] **PLAYER-22 — Обложка мини-плеера: скруглённая / круглая / скрыта** (**П**).
  [`OEPlayerMiniCoverRounded`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L125)

- [ ] **PLAYER-23 — Форма мини-плеера: скруглённая / пилюля / строгая** (**П**).
  [`OEPlayerMiniShapeRounded`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L129)

- [ ] **PLAYER-24 — Прогресс мини-плеера: кольцо / линия / контур / нет** (**П**).
  [`OEPlayerMiniProgressRing`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L133)

- [ ] **PLAYER-25 — Цвета мини-плеера** (**П**).
  [`OEPlayerMiniColors`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L140)

- [ ] **PLAYER-26 — Компактный мини-плеер** (**П**).
  [`OEPlayerMiniCompact`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L143)

- [ ] **PLAYER-27 — Показ исполнителя в мини-плеере** (**П**).
  [`OEPlayerMiniArtist`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L144)

- [ ] **PLAYER-28 — Кнопка предыдущего трека в мини-плеере** (**П**).
  [`OEPlayerMiniPrevious`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L145)

- [ ] **PLAYER-29 — Кнопка следующего трека в мини-плеере** (**П**).
  [`OEPlayerMiniNext`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L146)

- [ ] **PLAYER-30 — Кнопка закрытия мини-плеера** (**П**).
  [`OEPlayerMiniClose`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L147)

## Текст песен, очередь и музыкальные интеграции

- [ ] **LYRICS-01 — Очередь треков, управление порядком и переходами** (**С**).
  [`PlayerQueueSheet`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerSheet.java#L1638) — Реализация также в PlayerQueueSheet.java; сопоставить с возможностями штатного плеера Web K.

- [ ] **LYRICS-02 — Обычный и синхронизированный текст песен из файла** (**С**).
  [`LyricsView`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerSheet.java#L107) — Реальные компоненты: Lyrics.java, LyricsView.java, PlayerSheet.java; требуется отдельная проверка форматов.

- [ ] **LYRICS-03 — Поиск текстов песен в LRCLIB/lrcmux** (**С**).
  [`OnlineLyrics`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerSheet.java#L1521) — OnlineLyrics.java; запрос передаёт название трека внешнему сервису, поведение должно быть явным.

## Па́ки иконок интерфейса и эмодзи

- [ ] **ICONS-01 — Система паков иконок внутри клиента** (**С**).
  [`IconPacksConfig.enabled`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/icons/IconPacksActivity.java#L177) — Это замена иконок интерфейса, не системная иконка Android-приложения.

- [ ] **ICONS-02 — Установка паков иконок** (**П**).
  [`install`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/icons/IconPacksActivity.java#L56) — Веб-форматы и сопоставление Android resource-id с веб-иконками нужно определить отдельно.

- [ ] **ICONS-03 — Создание собственного пака иконок** (**П**).
  [`create`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/icons/IconPacksActivity.java#L57) — Не считать готовой совместимость архивов до проверки формата.

- [ ] **ICONS-04 — Замена отдельных иконок пользовательскими изображениями** (**П**).
  [`IconPacksEditorActivity`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/icons/IconPacksActivity.java#L329)

- [ ] **ICONS-05 — Приоритеты и перестановка паков** (**П**).
  [`move`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/icons/IconPacksActivity.java#L235)

- [ ] **ICONS-06 — Удаление и включение паков** (**П**).
  [`deletePack`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/icons/IconPacksActivity.java#L397)

## Шрифты и наборы эмодзи

- [ ] **EMOJI-01 — Использование системных эмодзи** (**А**).
  [`useSystemEmojiRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoEmojiSettingsActivity.java#L71)

- [ ] **EMOJI-02 — Установка пользовательского emoji-шрифта** (**А**).
  [`customEmojiAddRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoEmojiSettingsActivity.java#L77) — Проверить формат шрифта, лицензию и браузерный рендеринг.

- [ ] **EMOJI-03 — Каталог и загрузка наборов эмодзи** (**С**).
  [`downloadEmojiPacksRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoEmojiSettingsActivity.java#L81) — Нужен сам каталог/источник, а не только переключатель.

- [ ] **EMOJI-04 — Выбор и удаление пользовательских наборов** (**П**).
  [`customEmojiStartRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoEmojiSettingsActivity.java#L75)

## Pill Stack — виджеты в поле поиска

- [x] ~~**PILLS-01 — Полоса виджетов в строке поиска** (**С**).~~ 052: полоса прикреплена к полю поиска списка чатов (`attachPillStackStrip`), позиция — инлайн-конец поля (6px, как в Android), скрыта при набранном тексте, live-пересборка по изменению раскладки; полоса рендерит только пилюли веб-реестра — точная семантика `PillRegistry.createPill`. Переключение жестом — PILLS-03.
  [`PillStackSettingsActivity`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L37)

- [ ] **PILLS-02 — Активные/скрытые виджеты и их порядок** (**П**). **052: контракт перенесён (ключи `OEPillActivePills`/`OEPillHiddenPills`, значения по умолчанию Android, парсинг `parseList`, фильтр реестра, клик-переключение как `onItemClick`, backup `activePills`/`hiddenPills`/`infiniteScrolling`); осталось: drag&drop-перестановка списка в настройках (значима, когда пилюль больше одной).**
  [`active`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L39) — Точный контракт хранится в PillStackConfig и PillRegistry.

- [ ] **PILLS-03 — Переключение виджетов жестом** (**А**). **053: эквиваленты для ПК реализованы — колесо мыши над полосой и ArrowUp/ArrowDown на самой пилюле (веб-аналог вертикального свайпа), решение индекса `nextPillIndex` покрыто тестами, восстановление `OEPillLastActiveId` как в `rebuildContents`; строка ждёт второй зарегистрированной пилюли, чтобы переключение стало видимым (сейчас реестр несёт одну), тач-свайп не переносился.**
  [`PillStack`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L37) — На ПК нужен эквивалент колёсиком/клавишами/кнопкой.

- [ ] **PILLS-04 — Бесконечная прокрутка виджетов** (**П**). **052: ключ `OEPillInfiniteScrolling` (bool, default true) хранится, переносится в backup и имеет строку в хабе; 053: поведение подключено — зацикливание в `nextPillIndex` (тесты), остаётся неотмеченной до проверки с несколькими пилюлями.**
  [`infinite`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L42)

- [ ] **PILLS-05 — Виджет погоды и выбор местоположения** (**А**). **052: вердикт — ключи погоды читаются из PillStackConfig, но веб-реестр не регистрирует пилюлю: нет выбранного источника погоды и явного разрешения на геолокацию (как требует строка ниже). Не подделывается.**
  [`Weather`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L171) — Отдельно источник погоды и явное разрешение на геолокацию.

- [x] ~~**PILLS-06 — Виджет размера кэша клиента** (**П**).~~ 052: точный id 5 (`PillType.CACHE`, имя Android = R.string.StorageUsage); показывает реальный размер кэша клиента (файлы + потоковые чанки — сборщики раздела Data & Storage, выделены в общий модуль), обновление раз в 3 минуты, клик открывает Data & Storage (веб-владелец тех же данных, аналог `CacheControlActivity`); кольцо заполнения накопителя не переносится (у страницы нет объёма диска).
  [`CachePill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L20) — Показывать кэш этого приложения, а не выдуманный размер памяти устройства.

- [ ] **PILLS-07 — Виджет состояния прокси** (**А**). **052: вердикт — класс 3: в браузерном клиенте нет подсистемы прокси (браузер не открывает SOCKS/MTProto-транспорт), Web K не имеет ни настроек, ни состояния прокси; id 6 остаётся в строке раскладки (хранится, переносится в backup), полоса его не рендерит. Не подделывается.**
  [`ProxyPill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L25) — Зависит от выбранной веб-архитектуры подключения.

- [ ] **PILLS-08 — Виджет переключения Ghost Mode** (**С**). **052: вердикт — ждёт собственную подсистему (GHOST-01 не переносился); пилюля не регистрируется, не подделывается.**
  [`GhostPill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L22)

- [ ] **PILLS-09 — Виджет локального статуса/последней активности** (**А**). **052: вердикт — ждёт AYU-09 (локальная история последней активности); пилюля не регистрируется.**
  [`LastSeenPill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L23)

- [ ] **PILLS-10 — Виджет пинга дата-центра** (**А**). **052: вердикт — ждёт примитив уровня менеджера (измерять прикладной транспорт, как требует строка ниже; UI-код не лезет в MTProto напрямую); пилюля не регистрируется.**
  [`PillStack`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L37) — См. DcPingPill.java; измерять прикладной транспорт, не обещать системный ICMP.

- [ ] **PILLS-11 — Настраиваемые курсы валют и криптовалют, цена золота** (**С**). **052: вердикт — внешние источники курсов (Coinbase и т.п.) не выбирались; пилюли курсов не регистрируются.**
  [`RateInstances`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L129) — RateInstances.java, ExchangeRates.java, GoldPrice.java; экземпляры курса, пары валют, источники и кэш.

- [x] ~~**PILLS-12 — Сброс раскладки виджетов** (**П**).~~ 052: строка «Reset to Default» в хабе возвращает `DEFAULT_ACTIVE` ("5,6") и пустые скрытые (Android `resetLayout`), с уведомлением `PillStackResetDone`.
  [`reset`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L61)

## Перевод сообщений, чатов и статей

- [ ] **TRANS-01 — Показ кнопки перевода** (**П**).
  [`showTranslateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L118)

- [ ] **TRANS-02 — Перевод всего чата и автоматический перевод через UI Telegram** (**А**).
  [`useTelegramUIAutoTranslateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L119) — Проверить поддержку конкретного провайдера и серверные ограничения.

- [ ] **TRANS-03 — Сохранение Markdown/разметки при переводе** (**П**).
  [`keepMarkdownRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L120)

- [ ] **TRANS-04 — Выбор сервиса перевода** (**А**).
  [`translationProviderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L125) — Возможность прямых запросов из браузера и CORS проверяется по каждому провайдеру.

- [ ] **TRANS-05 — Режим переводчика** (**П**).
  [`translatorModeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L126)

- [ ] **TRANS-06 — Язык перевода по умолчанию** (**П**).
  [`translateToLangRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L131)

- [ ] **TRANS-07 — Языки, которые не нужно переводить** (**П**).
  [`doNotTranslateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L132)

- [ ] **TRANS-08 — Предпочитаемый целевой язык** (**П**).
  [`preferredTranslateTargetLangRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L133)

- [ ] **TRANS-09 — Google Cloud / DeepL: собственные ключи и параметры** (**А**).
  [`googleCloudTranslateKeyRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L146)

- [ ] **TRANS-10 — Тон DeepL: исходный / формальный / неформальный** (**П**).
  [`deepLFormalityRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L151)

- [ ] **TRANS-11 — LLM-переводчик: провайдер, модель, endpoint и ключ** (**С**).
  [`llmProviderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L161)

- [ ] **TRANS-12 — Системный и пользовательский prompt переводчика** (**П**).
  [`llmSystemPromptRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L216)

- [ ] **TRANS-13 — Контекст чата при LLM-переводе** (**П**).
  [`llmUseContextRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L218)

- [ ] **TRANS-14 — Контекст при автопереводе и размер контекста** (**П**).
  [`llmUseContextInAutoTranslateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L219)

- [ ] **TRANS-15 — Температура LLM-перевода** (**П**).
  [`temperatureValueRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L228)

- [ ] **TRANS-16 — Отдельный переводчик для Instant View/статей** (**С**).
  [`enableSeparateArticleTranslatorRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L233)

- [ ] **TRANS-17 — Сохранение предпочтений переводчика** (**П**).
  [`keepTranslatorPrefRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L239)

- [ ] **TRANS-18 — Экспериментальный способ перевода Google** (**А**).
  [`googleTranslateExpRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/NekoTranslatorSettingsActivity.java#L238) — Сначала проверить доступность/совместимость сервиса; не обещать работоспособность веб-запросов.

## Собственный AI-ассистент

- [ ] **AI-01 — AI-чат/ассистент внутри клиента** (**С**).
  [`OEAiTitle`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L101)

- [ ] **AI-02 — Выбор провайдера и собственного endpoint** (**А**).
  [`providerRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L69) — Нужен поддерживаемый браузером сетевой маршрут; ключи пользователя не входят в обычный экспорт автоматически.

- [ ] **AI-03 — Выбор/поиск модели и ввод своего имени модели** (**П**).
  [`modelRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L71)

- [ ] **AI-04 — API-ключ и проверка соединения** (**П**).
  [`testRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L76)

- [ ] **AI-05 — Уровень reasoning** (**П**).
  [`reasoningRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L74)

- [ ] **AI-06 — Пресеты endpoint + модель** (**П**).
  [`presetsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L75)

- [ ] **AI-07 — Роли и собственные роли** (**П**).
  [`roleRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L80)

- [ ] **AI-08 — Температура генерации** (**П**).
  [`temperatureRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L81)

- [ ] **AI-09 — Потоковое отображение ответа** (**П**).
  [`streamingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L82)

- [ ] **AI-10 — Хранение и очистка истории AI-чата** (**П**).
  [`saveHistoryRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L83)

- [ ] **AI-11 — Отключение инструментов модели** (**П**).
  [`disableToolsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L84)

- [ ] **AI-12 — Замена AI-редактора Telegram собственным провайдером** (**С**).
  [`replaceEditorRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L89)

- [ ] **AI-13 — Замена AI-сводок Telegram собственным провайдером** (**С**).
  [`replaceSummariesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/ai/ui/AiSettingsActivity.java#L90) — Реальные интеграции также в TelegramAiReplacement.java; это не только отдельное окно чата.

## Распознавание речи

- [ ] **STT-01 — Выбор провайдера транскрибации** (**С**).
  [`transcribeProviderRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L354)

- [ ] **STT-02 — Параметры Cloudflare для транскрибации** (**А**).
  [`cloudflareCredentialsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L355) — Нужны поддерживаемый API и CORS; локальная учётная запись Telegram к этому не относится.

- [ ] **STT-03 — Gemini для транскрибации** (**А**).
  [`geminiApiKeyRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L356)

- [ ] **STT-04 — OpenAI-совместимый провайдер транскрибации** (**А**).
  [`openAiCredentialsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L357)

- [ ] **STT-05 — Офлайн-распознавание Vosk** (**С**).
  [`voskModelsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L358) — Android-библиотеку напрямую не подключить; требуется веб-движок/порт, оценка размера и быстродействия.

- [ ] **STT-06 — Загрузка, выбор и удаление языковых моделей** (**П**).
  [`voskModelsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L358) — Подэкран VoskSettingsActivity.java.

## Общая лента каналов

- [ ] **FEED-01 — Объединённая лента постов каналов** (**С**).
  [`FeedConfig`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/feed/FeedConfig.java#L19) — UI/загрузка также в FeedActivity, FeedController, FeedTimelineLoader и FeedChatIntegration.

- [ ] **FEED-02 — Включать или не включать архивные каналы** (**П**).
  [`includeArchived`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/feed/FeedConfig.java#L22)

- [ ] **FEED-03 — Показанные и исключённые каналы** (**П**).
  [`excludedChannels`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/feed/FeedConfig.java#L23)

- [ ] **FEED-04 — Автоматическое добавление новых подписок** (**П**).
  [`addNewChannels`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/feed/FeedConfig.java#L24)

- [ ] **FEED-05 — Отдельная конфигурация ленты на каждый аккаунт** (**П**).
  [`PREFERENCES_PREFIX`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/feed/FeedConfig.java#L21)

- [ ] **FEED-06 — Отметить всю ленту прочитанной** (**П**).
  [`markAllRead`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/feed/ui/FeedActivity.java#L380) — Меняет прочитанность и в исходных каналах; это реальное действие, не только локальный вид списка.

## AyuMoments: локальная история и поведение приватности

- [ ] **AYU-01 — Хранение удалённых сообщений, полученных этим клиентом** (**С**).
  [`saveDeletedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L94) — Это локальная история увиденного клиентом, не восстановление отсутствующих сообщений с сервера.

- [ ] **AYU-02 — История редактирований** (**С**).
  [`saveEditsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L95)

- [ ] **AYU-03 — Исключения для хранения удалённых и для истории правок** (**П**).
  [`deletedExceptionsModeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L96)

- [ ] **AYU-04 — Хранение сообщений из архива** (**П**).
  [`saveInArchivedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L98)

- [ ] **AYU-05 — Хранение удалённых отдельно для личных чатов, групп и каналов** (**П**).
  [`saveDeletedPrivateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L108)

- [ ] **AYU-06 — Сохранение медиа удалённых сообщений по типам чатов** (**С**).
  [`saveMediaPrivateChatsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L100) — Личные чаты, публичные/приватные каналы, публичные/приватные группы.

- [ ] **AYU-07 — Хранение удалённых сообщений от ботов** (**П**).
  [`botUserRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L106) — NaConfig.saveDeletedMessageForBotUser — все сообщения от ботов.

- [ ] **AYU-08 — Хранение удалённых в чатах с ботами** (**П**).
  [`botChatRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L107) — NaConfig.saveDeletedMessageForBot — сохранение в бот-чатах; это не отправка сообщений внешнему боту.

- [ ] **AYU-09 — Локальная история последней активности** (**С**).
  [`saveLastSeenRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L92)

- [ ] **AYU-10 — Сохранение даты прочтения** (**С**).
  [`saveReadDateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L93) — Только доступные клиенту события; не раскрывает недоступную серверную приватную информацию.

- [ ] **AYU-11 — Ответ на удалённое сообщение цитатой** (**П**).
  [`replyToDeletedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L111)

- [ ] **AYU-12 — Полупрозрачность удалённых сообщений** (**П**).
  [`translucentRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L112)

- [ ] **AYU-13 — Иконка или собственная метка удалённого** (**П**).
  [`deletedIconRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L113)

- [ ] **AYU-14 — Цвет метки удалённого** (**П**).
  [`deletedMarkColorRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L115)

- [ ] **AYU-15 — Регулярные выражения для фильтрации** (**С**).
  [`regexRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L91) — Нужно отдельно прочитать правила применения, не заменять произвольным фильтром интерфейса.

- [ ] **AYU-16 — Пересылка защищённого сообщения как копии** (**А**).
  [`forwardProtectedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L116) — Отдельно проверить, какие данные и действия действительно доступны веб-клиенту; не обещать обход серверных ограничений.

- [ ] **AYU-17 — Экспорт и импорт локальной базы Ayu** (**С**).
  [`exportDbRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L117)

- [ ] **AYU-18 — Очистка локальной базы** (**П**).
  [`clearDbRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L120)

- [ ] **AYU-19 — Одновременное отключение функций AyuMoments** (**П**).
  [`disableAllRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L119)

- [ ] **AYU-20 — Подтверждение открытия историй** (**П**).
  [`askStoryRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L82)

- [ ] **AYU-21 — Вход в настройки Ghost Mode** (**С**).
  [`ghostRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAyuMomentsActivity.java#L81) — Подробный состав — следующий блок.

## Ghost Mode и параметры отправки

- [ ] **GHOST-01 — Единый переключатель Ghost Mode** (**С**).
  [`ghostModeToggleRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L35) — Не аппаратная функция. Нужен аккуратный перенос на уровень отправки соответствующих MTProto-событий.

- [ ] **GHOST-02 — Управление отправкой прочтения сообщений** (**П**).
  [`sendReadMessagePacketsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L37)

- [ ] **GHOST-03 — Управление отправкой прочтения историй** (**П**).
  [`sendReadStoriesPacketsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L38)

- [ ] **GHOST-04 — Управление отправкой статуса online** (**П**).
  [`sendOnlinePacketsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L39)

- [ ] **GHOST-05 — Управление отправкой прогресса загрузки** (**П**).
  [`sendUploadProgressRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L40)

- [ ] **GHOST-06 — Отправка offline после online** (**П**).
  [`sendOfflinePacketAfterOnlineRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L41)

- [ ] **GHOST-07 — Отмечать прочитанным после собственного ответа** (**П**).
  [`markReadAfterSendRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L43)

- [ ] **GHOST-08 — Отправка без звука по умолчанию** (**П**).
  [`sendWithoutSoundRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L46)

- [ ] **GHOST-09 — Поведение Ghost Mode при отложенной отправке** (**П**).
  [`scheduledSendRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L48) — NaConfig.ghostScheduledSend; точную семантику перенести из потребителя, не подменять обычным планировщиком сообщений.

- [ ] **GHOST-10 — Пункт Ghost Mode в боковом меню** (**П**).
  [`showGhostInDrawerRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L50)

- [ ] **GHOST-11 — Индикатор Ghost Mode** (**П**).
  [`showGhostModeStatusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L51)

- [ ] **GHOST-12 — Фиксация отдельных флагов при общем переключении Ghost Mode** (**П**).
  [`sendReadMessagePacketsLocked`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/tw/nekomimi/nekogram/settings/GhostModeActivity.java#L175) — Поддержка locked-полей и долгого нажатия; на ПК нужен явный доступный аналог.

## Облако, резервные копии и обслуживание

- [ ] **BACKUP-01 — Выгрузка настроек в облако** (**С**).
  [`uploadRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraCloudActivity.java#L54) — CloudSettingsHelper и формат необходимо исследовать отдельно; нельзя подменить произвольным внешним сервером.

- [ ] **BACKUP-02 — Восстановление настроек из облака** (**С**).
  [`restoreRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraCloudActivity.java#L55)

- [ ] **BACKUP-03 — Показ времени локальной и облачной копии** (**П**).
  [`localDateRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraCloudActivity.java#L50)

- [ ] **BACKUP-04 — Удаление облачной копии** (**П**).
  [`clearRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraCloudActivity.java#L56)

- [ ] **BACKUP-05 — Автоматическая синхронизация настроек** (**С**).
  [`autoSyncRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraCloudActivity.java#L59)

- [ ] **BACKUP-06 — Отдельное разрешение включать API-ключи в облачную копию** (**П**).
  [`apiKeysRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraCloudActivity.java#L60)

## Остальные функции и экспериментальные параметры

- [ ] **OTHER-01 — Экспорт и импорт настроек, в том числе .extera** (**П**).
  [`exportEtgRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraOtherActivity.java#L89) — В Android есть полный .json и exteraGram-совместимый .extera; нужны обратимость и проверка значений.

- [ ] **OTHER-02 — Настройка отчётов о сбоях** (**А**).
  [`crashReportsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraOtherActivity.java#L70) — Пункт присутствует в экране; комментарии исходника указывают на проблемы Android Crashlytics. Работоспособность потребителя не подтверждена. Для веба нужен собственный механизм диагностики.

- [x] ~~OTHER-03 — Сброс настроек клиента~~ (**П**). Сброс OE-записи и единственной родной настройки (showArchiveInChatList) с подтверждением; покрыт регрессией и fixture-проверкой (1440×900, LTR/RTL). Полный `resetAllSettings` Android с перезапуском приложения на вебе не воспроизводится и не заявляется.
  [`resetSettingsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraOtherActivity.java#L94)

- [ ] **OTHER-04 — Локальное отображение Premium-возможностей** (**А**).
  [`localPremiumRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraOtherActivity.java#L79) — Не серверная подписка и не разблокировка платных серверных действий.

- [ ] **OTHER-05 — Системная настройка фильтрации чувствительного контента аккаунта** (**А**).
  [`sensitiveContentRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraOtherActivity.java#L83) — Зависит от того, разрешает ли сервер изменить её этому аккаунту.

- [ ] **OTHER-06 — Удаление аккаунта** (**П**).
  [`deleteAccountRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraOtherActivity.java#L95) — Обычная опасная операция Telegram, не уникальная визуальная фича; может уже существовать в базе.

## Карты и уведомления: переносимый UX отдельно от Android SDK

- [ ] **MAP-01 — Провайдер интерактивной карты: Google Maps / OpenStreetMap** (**А**).
  [`mapProviderOptions`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L461) — Веб-карта/веб-ссылка оценивается отдельно от Android SDK.

- [ ] **MAP-02 — Превью местоположения: Telegram / Yandex / выключено** (**А**).
  [`mapPreviewOptions`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L465) — По исходнику Yandex здесь — вариант превью; нельзя вычеркнуть всю работу с местоположением из-за нативной реализации.

- [ ] **MAP-03 — Коррекция смещения карты** (**А**).
  [`mapDriftingFixRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L143) — Нужно проверить алгоритм и применимость к выбранному веб-провайдеру.

- [ ] **MAP-04 — Отображение состояния push-уведомлений** (**А**).
  [`pushStatusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java#L151) — Android-движки push не переносятся; браузерный статус и диагностика могут иметь аналог.

## Дополнительные конфиги оформления вне основных строк хаба

- [ ] **THEME-01 — Палитры Monet: Telemone / Classic** (**А**).
  [`val monetStyle`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/kotlin/app/exteraless/appearance/AppearanceConfig.kt#L89) — Ключ и поведение в исходнике есть; системный Android Material You — отдельная зависимость. Подготовленные палитры/генерация палитры на вебе не тождественны чтению системных цветов.

- [ ] **THEME-02 — Оформление музыки в профиле: штатное / карточка** (**С**).
  [`val profileMusicCard`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/kotlin/app/exteraless/appearance/AppearanceConfig.kt#L389) — Нужно сначала сверить наличие музыки профиля в Web K; отсутствие — отдельная подсистема, не телефонное оборудование.

- [ ] **THEME-03 — Показ вкладки Feed и счётчика непрочитанных** (**А**).
  [`val showFeedTab`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/kotlin/app/exteraless/appearance/AppearanceConfig.kt#L467) — Настройки AppearanceConfig.showFeedTab/showFeedUnreadCounter дополняют FeedConfig.

## User-directed look & feel (stream brief: docs/tasks/look-and-feel.md)

These entries come from the user's review of exteraless on Android, not from
the original 296-item catalog; the IDs (V-1..V-4) are new and the catalog
above stays untouched. Same rules apply: a setting gates it, off = stock,
Android source first where a key exists.

- [x] ~~V-1 — Wallpaper pattern toggle~~. 045: the Android owner is Telegram's own pattern dimming (the wallpaper record's `settings.intensity`, `ThemePreviewActivity`'s "Intensity" seekbar), so the web toggle maps onto it — off is intensity 0 (color/gradient only), on (default) is stock; the background renderer's pattern layer is gated (no fetch, no canvas, no mask dimming), live without a reload.

- [x] ~~V-2 — Floating vs attached sidebar~~. 046: web-only adaptation (Android has no floating panels and no key); `OEAppearanceAttachedSidebar` toggles the `oe-attached-sidebar` root class — zero page margins and no shadow, full-height left panel, folders-rail offset kept, inner section cards keep their radius. Default off = stock floating. Acceptance round 1 (F-1): the rounding is kept in attached mode too. Acceptance round 2 (G-3): only the content-facing edge keeps it (the inline-end corners — the right edge in LTR, mirrored in RTL), the window-facing corners square; and the attached panel never overlays the chat — the chat's space math uses the panel's visual width (`updateColumnWidths`), `#column-center` re-centers beside it in the docked and the shown-drawer ranges, the pop-out scrim is suppressed; off = stock byte-for-byte.

- [x] ~~V-4 — Theme palettes and the accent picker~~. 047: ladder (1) near-black palette and (3) AMOLED variant as one `OEAppearanceThemePalette` selector over the dark surface variables (dark themes only, live, clears only its own writes, no theme object touched); (2) a per-theme accent color picker through the stock `applyAccentPreset` pipeline (preview via `applyTheme`, debounced commit, survives reload, reset = factory theme); (4) the custom-theme editor was not needed — the stock system expresses the rest. Acceptance round 1 reshaped it: F-2 dropped the selector for a single toggle (off = stock, on = the near-black palette; AMOLED removed entirely), and F-3 made it Material-You — the palette tints every surface of its family from the accent color or an explicit "Set a color" pick (the pick wins), and a committed accent carries an accent-hued material wallpaper (gradient + the shared pattern) unless the user owns the background. Acceptance round 2 (G-1/G-4): a "Set a color" pick applies in the same task (`applyThemeFast` — background re-applies no longer run the theme-switch view transition) and wins over everything; the palette's tint chain is explicit — explicit background color > explicit accent PICK (the picker's `preset:*` theme) > wallpaper-derived > the theme's own accent — and an image wallpaper's dominant color (JS canvas sampling at render time, cached per record, `exteraless_wallpaper_tint`) tints the family while the toggle is on, re-derived on every wallpaper change.

- [x] ~~V-3 — Forced MD3 coverage strengthening~~. 048: the coverage audit table lives in the journal (packet 048); the eight-part group's choke points verified covered (switches, loading, Section rows app-wide, settings sliders, chat header, folder navigation, player, mini player), chat-list rows covered by contract, and the audio rows' seek line extended behind `oe-md3-sliders` (the web's other slider family, ported M3 values); popup/menu/dialog card chrome, search input, media viewer chrome and the composer are listed as waiting on an owning-toggle decision.

## User-directed W entries (the Neko/Na keys the 296-catalog never carried)

Added 2026-11-02 from the priority override (the user's real config, see
CURRENT.md): keys the original 296-line catalog does not carry, integrated
under the same rules — Android source first, off = stock, backup aliases only
where Android's `EtgBackup` exports one.

- [x] ~~W-1 — `showAddToSavedMessages`~~. 055: NekoConfig bool, default false (the user runs it on); the message context menu gains "Add to Saved Messages" — a direct forward to the own chat (the same handler the double-tap Save uses), Android's conditions verbatim (a real message, not the self chat, forwardable, not scheduled); backup alias `showSaveMessageButton` (bool) round-trips. Hub row in Chats.
  [`ChatActivity.java:50685`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java#L50685)

- [x] ~~W-2 — `CopyPhoto`~~. 055: NaConfig.showCopyPhoto bool, default false (the user runs it on; the persisted name is the contract); the message context menu gains "Copy" for clipboard-copyable media — the media viewer's own copy path (`copyMediaToClipboard`) with its feedback toasts; backup alias `showCopyPhotoButton` (bool) round-trips. Hub row in Chats.
  [`ChatActivity.java` allowCopyPhoto](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java#L50477)

- [x] ~~W-3 — `showReport`~~. 055: NekoConfig bool, default false; the stock per-message "Report" item (channels only in Web K) also shows for incoming messages outside channels — Android's condition (a real incoming message in a chat or with a bot) mapped onto the existing `showMessageReport` popup; backup alias `showReportButton` (bool) round-trips. Hub row in Chats.
  [`ChatActivity.java:50200`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java#L50200)

- [ ] **W-4 — `showMessageDetails`** (**С**). 055: NekoConfig bool, default false (the user leaves it off); the web has no message-details surface (Android's popup shows ids, dates, forwards, signature) — the key is stored and round-trips, an imported true is a documented no-op; waits on a web details view, never faked. Backup alias `showDetailsButton` stays recognized-but-unsupported.
  [`ChatActivity.java:51064`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java#L51064)

- [ ] **W-5 — `showViewHistory`** (**С**). 055: NekoConfig bool, default false; the item opens the edit/delete history viewer (AyuMessageHistory) — waits on the history subsystem (AYU-02); the key is stored and round-trips, an imported true is a documented no-op. Backup alias `showHistoryButton` stays recognized-but-unsupported.
  [`AyuMessageHistory`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/com/radolyn/ayugram/ui/AyuMessageHistory.java)

- [x] ~~W-6 — `bubbleRadius`~~. 056: Android `SharedConfig.bubbleRadius` (mainconfig, int 0..17, default 17; `MessageDrawable` takes the radius for the far corners and clamps the tail side to min(6, radius)); the store maps it to `--oe-bubble-radius` / `--oe-bubble-tail-radius` over the in/out bubble corner variables, the default 17 leaves Web K's own geometry byte-for-byte (the stock 15px/5px pair ≈ Android's 17/6dp); slider in Appearance; the `.extera` alias `bubbleRadius` (mainconfig, int 0..17) round-trips.
  [`SharedConfig.java:339`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/org/telegram/messenger/SharedConfig.java#L339)

- [ ] **W-7 — `ActionBarDecoration` / `chatDecoration`** (**А**). 056: NekoConfig `ActionBarDecoration` (int 0..3: 0 depends-on-date, 1 snow, 2 fireworks, 3 none; the user runs 1) and NaConfig `chatDecoration` (int 0..2, the user runs 1) draw `SnowflakesEffect` / `FireworksEffect` canvas overlays over the action bar and the chat (`SizeNotifierFrameLayout.drawOverlays`, `ActionBar`; exteraless's `migrateDecorations` collapses both to snow/none). Verdict: the web client has no canvas-effect subsystem at all (no snow/fireworks anywhere in Web K), and porting the two effect implementations verbatim is its own packet — recorded, not approximated, not faked; EtgBackup exports neither key, so nothing is stored.
  [`SizeNotifierFrameLayout.java:563`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/org/telegram/ui/Components/SizeNotifierFrameLayout.java#L563)
