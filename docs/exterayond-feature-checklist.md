# Рабочий чеклист переноса exteraless → exterayond

Это полный список **296 строк / 22 группы** из [исходного каталога](exteraless-feature-inventory.md), без добавления новых фич. Некоторые строки — параметры одной системы, а не независимые функции.

**Правило:** работаем только по ID ниже, от небольших интеграций к большим. Отметку [x] и зачёркивание ставим после подключения реального поведения, настроек и совместимого backup/reset, когда они предусмотрены Android. Один переключатель без эффекта не считается интеграцией. Частичные реализации остаются неотмеченными.

Статус интеграции не означает проверку на пользовательском аккаунте. Подробности и пределы проверок — в [журнале](tasks/progress.md). Проверки только на ПК, короткие и целевые. Плагины отложены; аппаратные Android-исключения перечислены в исходном каталоге и не выданы за выполненные функции.

Current progress: **38 completed entries out of 296**. Update this checklist after each integration; the original catalog remains the source reference.

Типы: **П** — переносимая логика, **А** — веб-адаптация, **С** — подсистема. Их отсутствие в Web K не является причиной вычёркивать строку.

## Основные: форматирование, профиль, загрузки и архив

- [ ] **GEN-01 — Перевод в отдельном окне/нижней панели** (**А**).
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

- [ ] **GEN-12 — Сортировка чатов по непрочитанным** (**П**).
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

- [ ] **LOOK-01 — Форма аватаров: квадрат → скругление → круг** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`avatarCornersPreviewRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L102)

- [ ] **LOOK-02 — Единое скругление для обычных чатов, форумов и сообществ** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`singleCornerRadiusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L103)

- [x] ~~LOOK-03 — Мини-аватар автора в строке группового чата~~ (**П**). 002: настоящий владелец строки диалога, обновление и очистка.
  [`senderMiniAvatarsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L126)

- [ ] **LOOK-04 — Свой текст заголовка списка чатов: приложение / username / имя / «Чаты» / собственный** (**А**).
  [`titleTextRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L127) — У Web K другая шапка; нужен осмысленный веб-вариант, а не автоматическое исключение.

- [ ] **LOOK-05 — Заголовок по центру** (**А**).
  [`centerTitleRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L110)

- [ ] **LOOK-06 — Снег и сезонное оформление шапки** (**А**).
  [`forceSnowRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L109)

- [ ] **LOOK-07 — Круглая или квадратная скруглённая плавающая кнопка** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`fabShapeRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L80)

- [ ] **LOOK-08 — Системный шрифт вместо встроенного** (**А**).
  [`useSystemFontsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L81)

- [ ] **LOOK-09 — Пружинящее растяжение аватара в профиле** (**А**).
  [`gooeyAvatarRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L82) — Это анимация интерфейса, не аппаратная функция телефона.

- [ ] **LOOK-10 — Индивидуальные темы и обои чатов** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`customThemesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L83)

- [ ] **LOOK-11 — Радиус карточек разделов настроек** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`sectionRadiusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java#L88)

- [ ] **LOOK-12 — Отдельные заголовки разделов** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
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

- [ ] **LOOK-27 — Счётчик папок: все / кроме чатов без звука / выключен** (**П**).
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

- [ ] **FOLD-10 — Перестановка пунктов главного меню** (**П**).
  [`MainMenuLayout.getLayout()`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L137)

- [ ] **FOLD-11 — Скрытие и восстановление пунктов главного меню** (**П**).
  [`MainMenuLayout.getHiddenItems()`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L189)

- [ ] **FOLD-12 — Добавление и перестановка разделителей меню** (**П**).
  [`MainMenuItem.DIVIDER`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppNavigationActivity.java#L210)

- [ ] **FOLD-13 — Сброс раскладки меню** (**П**).
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

- [ ] **CHAT-10 — Разные действия двойного нажатия по входящим и исходящим** (**А**).
  [`doubleTapIncomingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L167) — Нет действия; отправить/показать реакции; обычный/LLM-перевод; ответ; пересылка; сохранение; скачивание; повтор; повтор копией; редактирование своего; удаление. На ПК согласовать с выделением текста и двойным кликом.

- [ ] **CHAT-11 — Выбор реакции для действия двойного нажатия** (**П**).
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

- [ ] **CHAT-20 — Постоянная кнопка вложений при наборе** (**А**).
  [`keepAttachButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L190) — Если Web K уже так работает, зафиксировать эквивалентность вместо пустого переключателя.

- [ ] **CHAT-21 — Отключение глобального поиска** (**П**).
  [`disableGlobalSearchRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L182)

- [ ] **CHAT-22 — Область поиска хэштегов по умолчанию: чаты / каналы** (**П**).
  [`searchHashtagChatRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L183)

- [x] ~~CHAT-23 — Удаление хвостов пузырей сообщений~~ (**П**). 025: проверены штатный SVG, полное скругление входящих/исходящих, live on/off, RTL, reset и Android backup-alias.
  [`removeMessageTailRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L200)

- [x] ~~CHAT-24 — Иконка вместо надписи «изменено»~~ (**П**). 012: штатный значок edit, доступная локализованная подпись, backup/reset.
  [`replaceEditedRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L201)

- [ ] **CHAT-25 — Индикатор онлайна** (**П**).
  [`showOnlineStatusRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L202)

- [ ] **CHAT-26 — Результаты опросов до голосования** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`showResultsBeforeVotingRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L208) — Только там, где сервер реально предоставляет результаты.

- [x] ~~CHAT-27 — Дата исходного пересланного сообщения~~ (**П**). 023: дата/время оригинала рядом с автором пересылки; локализованный формат, обновление существующих сообщений при повторном открытии чата.
  [`dateOfForwardedMsgRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L209)

- [x] ~~CHAT-28 — Подсказка с точным временем сообщения~~ (**П**). 023: щелчок по времени показывает отправку/правку/оригинал с секундами; Enter/Space/Escape, off сохраняет штатное поведение.
  [`showTimeHintRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L210)

- [ ] **CHAT-29 — Запоминание цепочки возвратов после переходов по ответам** (**А**).
  [`rememberAllRepliesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L211)

- [ ] **CHAT-30 — Исправление превью ссылок** (**П**).
  [`fixLinkPreviewRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L288) — Нужно сверить точную семантику с Neko/Na-потребителем.

- [ ] **CHAT-31 — Отключение превью ссылок по умолчанию** (**П**).
  [`disableLinkPreviewRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L289)

- [x] ~~CHAT-32 — Ask before opening links: hidden / all / never~~ (**П**). 027: live policy in Chats; native link handlers, ordinary anchors and middle clicks retain their navigation owners. Cancellation and account changes stop pending actions.
  [`openLinkConfirmationRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L290)

- [ ] **CHAT-33 — Подтверждение отправки голосового сообщения/видеокружка** (**П**).
  [`confirmAVMessageRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L292)

- [x] ~~CHAT-34 — Подтверждение звонка~~ (**П**). 022: голосовой/видео, согласие до завершения текущего/старта нового звонка, отмена и режим off.
  [`askBeforeCallRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L293)

- [ ] **CHAT-35 — Подтверждение повтора сообщения** (**П**).
  [`repeatConfirmRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L294)

- [x] ~~CHAT-36 — Подтверждение отправки команды боту~~ (**П**). 022: ссылки в сообщениях, меню бота и подсказки после «/»; отмена сохраняет ввод, контекст защищён от смены чата.
  [`disableClickCommandToSendRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L295)

- [ ] **CHAT-37 — Удаление трекинговых параметров при открытии ссылок** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`stripTrackingOpenRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L297)

- [x] ~~CHAT-38 — Удаление трекинговых параметров при вставке ссылок~~ (**П**). 006: сохранение вставки, защита от позднего ответа, Undo/Redo.
  [`stripTrackingPasteRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L298)

- [ ] **CHAT-39 — Обновление и возврат встроенного AdGuard-фильтра трекинга** (**А**).
  [`trackingFilterRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L299) — Не сводить к одному статическому списку query-параметров, если цель — паритет.

- [ ] **CHAT-40 — Широкие посты и пересланные посты каналов** (**А**).
  [`wideChannelPostsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L304)

- [ ] **CHAT-41 — Широкие посты в ленте** (**А**).
  [`wideFeedPostsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L305)

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

- [ ] **HIDE-02 — Скрытие историй в шапке** (**П**).
  [`hideStoriesRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L363)

- [x] ~~HIDE-03 — Скрытие плавающей кнопки нового чата~~ (**П**). 005: только FAB, альтернативное создание чата через меню.
  [`hideFloatingButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L364)

- [ ] **HIDE-04 — Скрытие строки поиска** (**П**).
  [`hideSearchBarRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L365) — Нужен альтернативный доступ к поиску с клавиатуры.

- [ ] **HIDE-05 — Скрытие вкладки «Все чаты»** (**П**).
  [`hideAllChatsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L366)

- [x] ~~HIDE-06 — Скрытие кнопки «Отправить как…»~~ (**П**). 025: кнопка и её отступ скрываются сразу, отправитель сохраняется; команды бота и выбор автора платной реакции остаются доступны; backup/reset.
  [`hideSendAsPeerRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L188)

- [x] ~~HIDE-07 — Скрытие боковой кнопки «Поделиться»~~ (**П**). 013: боковая пересылка постов, Saved Messages сохраняются.
  [`hideShareButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L203)

- [ ] **HIDE-08 — Скрытие кнопки подарков в каналах** (**П**).
  [`hideGiftButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L204)

- [x] ~~HIDE-09 — Скрытие поиска в канале~~ (**П**). 012–013: применяется к открытому broadcast-чату сразу.
  [`hideSearchButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L205)

- [x] ~~HIDE-10 — Скрытие кнопки звонка~~ (**П**). 012–013: применяется к открытому чату сразу, доступность звонка сохраняется.
  [`hideCallButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L206)

- [ ] **HIDE-11 — Скрытие финансового пункта меню вложений** (**П**).
  [`hideMoneyButtonRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L207) — Сначала сопоставить с доступным веб-элементом; не добавлять фиктивную строку.

- [x] ~~HIDE-12 — Скрытие реакций отдельно в каналах, группах и личных чатах~~ (**П**). 021: live CSS по типу peer из UI-кэша, без запросов и пересоздания полос реакций; backup/reset.
  [`hideReactionsGroupRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L158)

- [ ] **HIDE-13 — Скрытие плитки камеры в меню вложений** (**А**).
  [`hideCameraTileRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L328) — Если в Web K такой плитки нет, отмечается как уже не требуется, не как непереносимая фича.

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

- [ ] **MEDIA-13 — Автопауза видео при сворачивании** (**П**).
  [`pauseVideoRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L343)

- [ ] **MEDIA-14 — Автопауза голосовых при сворачивании** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`pauseVoiceRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L344)

- [ ] **MEDIA-15 — Автопауза видеокружков при сворачивании** (**П**). **В коде есть реализация или её часть; полноту ещё сверить.**
  [`pauseRoundRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L345)

- [ ] **MEDIA-16 — Шумоподавление и улучшение голоса** (**А**).
  [`voiceEnhancementsRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L350) — У Web K уже есть собственные аудиокомпоненты; нужно сравнить возможности.

- [x] ~~MEDIA-17 — Отключение автозапуска следующего голосового~~ (**П**). 015: остановка после голосового, музыка/видеокружки и ручное переключение сохраняются. Отдельного alias в Android EtgBackup нет.
  [`dontAutoPlayNextVoiceRow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java#L340)

## Полный музыкальный плеер и мини-плеер

- [ ] **PLAYER-01 — Full MD3 music player** (**С**). **028: base music popup and existing mini-player adaptation implemented. Full style editor, queue, lyrics and gestures remain pending; see packet 028.**
  [`PlayerStyleEditor`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L39) — Подсистема уже реализована в Android; на вебе нужна интеграция с существующим воспроизведением.

- [ ] **PLAYER-02 — Стиль обложки: карточка / широкая / на весь экран / пластинка** (**П**).
  [`OEPlayerCoverCard`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L73)

- [ ] **PLAYER-03 — Размер обложки** (**П**).
  [`OEPlayerCoverSize`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L76)

- [ ] **PLAYER-04 — Радиус обложки** (**П**).
  [`OEPlayerCoverRadius`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L78)

- [ ] **PLAYER-05 — Вращение пластинки во время воспроизведения** (**П**).
  [`OEPlayerDiscSpin`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L80)

- [ ] **PLAYER-06 — Переключение треков жестом по обложке** (**А**).
  [`OEPlayerCoverSwipe`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L81)

- [ ] **PLAYER-07 — Продолжение обложки вниз** (**П**).
  [`OEPlayerCoverExtend`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L82)

- [ ] **PLAYER-08 — Выравнивание названия трека** (**П**).
  [`OEPlayerAlignStart`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L85)

- [ ] **PLAYER-09 — Размер названия** (**П**).
  [`OEPlayerSizeSmall`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L88)

- [ ] **PLAYER-10 — Положение названия: над обложкой / под ней** (**П**).
  [`OEPlayerTitleBelow`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L90)

- [ ] **PLAYER-11 — Кнопка добавления трека в профиль** (**А**).
  [`OEPlayerShowLike`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L92) — Зависит от поддержки музыки профиля в движке Web K.

- [ ] **PLAYER-12 — Показ источника воспроизведения** (**П**).
  [`OEPlayerShowSource`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L93)

- [ ] **PLAYER-13 — Порядок блоков: прогресс / управление / действия** (**П**).
  [`orderList`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L60)

- [ ] **PLAYER-14 — Показ скорости, текста и очереди** (**П**).
  [`OEPlayerShowActions`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L100)

- [ ] **PLAYER-15 — Показ перемешивания и повтора** (**П**).
  [`OEPlayerShowModes`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L101)

- [ ] **PLAYER-16 — Волна на полосе прогресса** (**П**).
  [`OEPlayerShowWave`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/player/PlayerStyleEditor.java#L102)

- [ ] **PLAYER-17 — Размер кнопок управления** (**П**).
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

- [ ] **PILLS-01 — Полоса виджетов в строке поиска** (**С**).
  [`PillStackSettingsActivity`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L37)

- [ ] **PILLS-02 — Активные/скрытые виджеты и их порядок** (**П**).
  [`active`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L39) — Точный контракт хранится в PillStackConfig и PillRegistry.

- [ ] **PILLS-03 — Переключение виджетов жестом** (**А**).
  [`PillStack`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L37) — На ПК нужен эквивалент колёсиком/клавишами/кнопкой.

- [ ] **PILLS-04 — Бесконечная прокрутка виджетов** (**П**).
  [`infinite`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L42)

- [ ] **PILLS-05 — Виджет погоды и выбор местоположения** (**А**).
  [`Weather`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L171) — Отдельно источник погоды и явное разрешение на геолокацию.

- [ ] **PILLS-06 — Виджет размера кэша клиента** (**А**).
  [`CachePill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L20) — Показывать кэш этого приложения, а не выдуманный размер памяти устройства.

- [ ] **PILLS-07 — Виджет состояния прокси** (**А**).
  [`ProxyPill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L25) — Зависит от выбранной веб-архитектуры подключения.

- [ ] **PILLS-08 — Виджет переключения Ghost Mode** (**С**).
  [`GhostPill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L22)

- [ ] **PILLS-09 — Виджет локального статуса/последней активности** (**А**).
  [`LastSeenPill`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillRegistry.java#L23)

- [ ] **PILLS-10 — Виджет пинга дата-центра** (**А**).
  [`PillStack`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L37) — См. DcPingPill.java; измерять прикладной транспорт, не обещать системный ICMP.

- [ ] **PILLS-11 — Настраиваемые курсы валют и криптовалют, цена золота** (**С**).
  [`RateInstances`](https://github.com/exteraless/exteraless/blob/8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63/TMessagesProj/src/main/java/app/exteraless/pillstack/PillStackSettingsActivity.java#L129) — RateInstances.java, ExchangeRates.java, GoldPrice.java; экземпляры курса, пары валют, источники и кэш.

- [ ] **PILLS-12 — Сброс раскладки виджетов** (**П**).
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

- [ ] **OTHER-03 — Сброс настроек клиента** (**П**).
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
