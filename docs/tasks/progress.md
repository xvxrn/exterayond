# exterayond port progress

Работа продолжается по просьбе пользователя. Плагины отложены.
Исполнители: бесплатный DeepSeek; резерв — бесплатный GLM. MiMo и платные
провайдеры не используются. Коммитов нет, пользовательский аккаунт не открывался.

| Блок | Результат | Проверка и пределы |
|---|---|---|
| 002, мини-аватары | Переключатель Appearance, живое обновление, корректное владение и очистка; повтор одинакового сообщения сохраняет аватар | Настоящие DialogElement/AppDialogsManager/avatarNew с синтетическими peers; 20×20; Space, on/off, повтор, смена отправителя, удаление, desktop/mobile, LTR/RTL. Проверены инициалы, реальные фото аккаунта не использованы |
| 003, секунды | Живое обновление обычной и полной метки даты/времени, 12/24 часа; даты без времени и длительности сохраняются | Настоящий I18n/date; тест сначала обнаружил ошибку combined, после исправления проходит; браузер desktop/mobile, LTR/RTL, клавиатура |
| 005, кнопка нового чата | Скрывается только FAB; создание доступно через существующее меню; поиск и кнопка обновления сохраняют исходный код | Store/reset/backup/UI tests и проверка исходников; полный sidebar на реальном аккаунте не проверен |
| 006, вставка ссылок | Обычная ссылка больше не теряется; вставка происходит сразу, очистка не перезаписывает правки пользователя и не создаёт отдельный Undo | Реальный редактор в 86 целевых тестах, включая deferred-cleaner, cursor-only, Undo/Redo; Браузерная проверка настоящей вставки: обычная ссылка сохраняется, fbclid удаляется, Ctrl+Z/Ctrl+Shift+Z работают одним шагом |
| 007, backup | Форма стикеров включена в совместимый `.extera` roundtrip | Исходный Android EtgBackup: stickerShape, int 0..2; синтетические проверки импорта/экспорта и типов. Четыре других предполагаемых ключа отсутствуют в формате — алиасы не выдумывались |
| 008, нижняя кнопка канала | Discuss при наличии связанного чата, рабочий Mute/Unmute иначе; исправлены receiver обработчика, поздние ответы и живое переключение режимов | 13 тестов с настоящими методами ChatInput и DOM-click через production binding; полный чат с реальным аккаунтом не проверен |

Общая проверка блока: 169 тестов в 13 файлах, проверка типов и production-сборка
проходят. Линтер, проверка 655 chunks и запуск production IM-модулей без
аккаунта/Telegram-трафика также прошли. Локальная версия обновлена на
http://127.0.0.1:8138/; прежние chunks сохранены, данные браузера не очищались. Полный набор тестов и screen-reader testing не запускались.

Снимки изолированных проверок лежат в `tmp/review-002-*.png` и
`tmp/review-003-*.png`. Это тестовые данные; они не демонстрируют пользовательские чаты.
При работе с viewport IAB применяется размер к выбранной вкладке: сначала
проверять выбранный tab и фактический innerWidth, затем снимать изображение.

Следующий более крупный блок — 004: точные счётчики вместо K/M. Перечень
25 потребителей в 19 файлах: [аудит](research-counter-callers.md).
Старые переключатели проверяем до реального эффекта, а не считаем готовыми
по наличию ключа: [сверка проводки](research-existing-settings-wiring.md).

## Дополнение: 004 и 009

- **004, точные счётчики:** Android-ключ `DisableNumberRounding`, default false;
  `.extera` `disableNumberRounding`. Все 25 исходных потребителей компактного
  formatter переведены на общий `formatCount`; выключенное состояние вызывает
  исходный formatter с прежней точностью. Включённое — полные цифры с NBSP.
  Императивные владельцы обновляют существующий текст, очищают слушатели вместе
  с владельцем. Исправлены смешанные peer/mid просмотров и сохранение прокрутки,
  синтетические заголовки списка реакций, pending-paid DOM, асинхронная установка
  статистики и пропуск нулевых показателей.
- **009 / GEN-06, свой номер:** реальный Android-ключ `HidePhone`, default true;
  `.extera` `hidePhoneNumber`. Номер удаляется из DOM своего профиля; контакты,
  копирование и анонимные номера сохраняют прежнее поведение. Переключатель в
  General, поиск, валидация, импорт/экспорт и сброс подключены.

Проверено: 79 тестов в 11 целевых файлах, typecheck, oxlint для 61 изменённого
JS/TS файла, production build, chunk guard и запуск IM-модулей без аккаунта.
Первый прогон выявил устаревший поисковый индекс; штатный Vite-генератор обновил
его, после чего все 8 тестов индекса прошли. Полный набор тестов не запускался.

Браузер: настоящие General / CheckboxField / Badge / PeerProfile.Phone,
синтетические peers; живое on/off, изменение числа, Space и reset;
1440×900 и 390×844, LTR/RTL, без горизонтального переполнения. Снимки:
`tmp/review-general-*.png`. В fixture остаются известные ошибки загрузки
crypto/lottie workers и предупреждения module-scope Solid; это не проверка
реального аккаунта или screen reader. Остальные владельцы счётчиков проверены
исходниками и целевыми DOM-тестами, полный авторизованный чат не открывался.

Оба дополнения опубликованы на прежнем локальном адресе 8138, старые chunks
сохранены. Данные браузера не очищались. Следующий небольшой блок — GEN-14:
привязать скрытие архива к уже существующему WebK `showArchiveInChatList`,
без второго источника состояния, с точным alias `hideArchiveFolder`.

## Дополнение: 010 / GEN-14, скрытие архива

В General добавлен переключатель, который инвертирует существующее поле Web K
`showArchiveInChatList`. Отдельного сохранённого `HideArchive` нет. Контекстное
меню Web K и хаб читают один источник; реальная строка архива исчезает/появляется
без перезагрузки. Существующий вход Archived chats в главном меню сохранён
(проверен исходный код, полный авторизованный sidebar не открывался).

Android NaConfig: `HideArchive`, bool false; EtgBackup: `hideArchiveFolder` в
`exteraconfig`. Alias теперь поддерживается, строго проверяет boolean, экспорт
читает текущее native-состояние. Сброс хаба восстанавливает строку архива и
собственные настройки, сохраняя остальные native-настройки.

Проверено: 59 тестов / 7 файлов, включая настоящий общий appSettings store,
передачу записи менеджеру, обратное изменение native-поля, backup, invalid input,
подтверждение/отмену reset, settings search и import-graph budget. Typecheck,
oxlint изменённых файлов, production build, guard 656 chunks и no-account
production startup прошли. Найденная зависимость низкого хранилища от native
адаптера устранена: композиция сброса живёт выше обоих хранилищ; бюджет графа
не увеличивался.

CUA: настоящий createArchiveDialogState + ArchiveDialog на синтетических чатах,
живое изменение через оба входа, Space, reset; 1440×900 / 390×844, LTR/RTL,
без горизонтального переполнения. Снимки `tmp/review-010-*.png`. Обновлено
на 8138 атомарной заменой index; прежние chunks сохранены. Коммитов нет.

Следующий блок: GEN-04 (Zalgo). Нужна фильтрация отображаемого текста с сохранением
исходных offsets entities; редактор и отправляемый текст должны сохраняться.

## Новый темп работы и 011 / GEN-04

По прямой просьбе пользователя: только ПК, без мобильных прогонов; короткая
проверка поведения, существующие стенды, без отдельной QA-инфраструктуры на
каждый переключатель. Сборка на группу изменений или существенный общий путь.
Правило закреплено в корневом AGENTS.md и имеет приоритет над старыми brief/skills.
OpenCode использовался; DeepSeek дал полезные изменения, но часть требовала
исправлений и некоторые задания оборвались. Сейчас DeepSeek и GLM ограничены
бесплатной квотой; работа продолжается локально без ожидания и платного fallback.

Добавлен Zalgo-фильтр: Android NaConfig `ZalgoFilter=false`, EtgBackup
`filterZalgo`; реальная настройка в General и поиске, import/export/reset.
Алгоритм Android: 4..2048 UTF-16 символов, срабатывает на четыре последовательных
combining marks и затем убирает все marks. Исходные offsets entities и URL не
изменяются: очищаются только выводимые части текста. Имена проходят через
существующий wrapEmojiText → wrapRichText. Черновики не фильтруются. Уже
нарисованные сообщения обновляются при повторном открытии чата, что указано
в подписи настройки.

Проверено 55 целевых тестов в 6 существующих файлах (добавлено четыре случая
Zalgo и несколько backup-assertions), типы, линтер, сборка и production startup.
Браузер: только 1440×900, существующий General-стенд и EmojiTextTsx, on/off,
одна сохранённая ссылка, неизменный draft. Снимки `tmp/review-011-desktop-*.png`.
Опубликовано на прежнем адресе 8138; коммитов и действий с аккаунтом нет.

## 012–013: метка изменения, пересылка и живые кнопки

Добавлены Android NaConfig `UseEditedIcon=true` и
`HideShareButtonInChannel=false`. В Chats — два рабочих переключателя;
EtgBackup alias `replaceEditedWithIcon` / `hideShareButton`, bool, reset и поиск.
Значок — штатный Telegram `edit`, локализованная подпись остаётся доступной;
существующие метки переключаются CSS без перерисовки сообщений. Режим
primary-edited-date и отдельная метка ephemeral «updated» сохранены.

Кнопка пересылки скрывается у постов вне Saved Messages; обычное действие
Forward в меню не затронуто. Для существующих Hide Call Button / Hide Search
Button in Channels исправлено применение к открытому чату: базовая доступность
считается отдельно, предпочтение скрывает существующую кнопку. Дополнительных
запросов, слушателей и корней на сообщение нет; меню звонка проверяет настройку.

49 целевых тестов в 5 файлах, typecheck, lint, сборка и production startup прошли;
import-graph budget не увеличивался. Desktop 1440×900: реальные Chats и
MessageRender.setTime, оба вида метки и локализованная подпись. Полный
авторизованный topbar/пост не открывался; маршруты кнопок проверены исходниками.
Мобильные и тяжёлые матрицы не запускались. Существующий fixture получил правильный
base URL и fonts.scss (раньше его иконки отображались квадратами).
Снимки `tmp/review-012-desktop-*.png`. Обновлено на 8138, старые chunks сохранены.

## Полный рабочий список и 014 / GEN-07

Создан [полный чеклист](../exterayond-feature-checklist.md): 296 исходных ID,
22 группы, все исходные названия/оговорки/ссылки сохранены. Проверена взаимно
однозначная полнота с каталогом. Выполненные интеграции помечены и зачёркнуты,
частичные и неперепроверенные существующие реализации оставлены открытыми.
Корневой AGENTS.md требует выбирать работу только из этого списка и обновлять
его после каждого пакета. Сейчас отмечены 15 строк; это не счётчик независимых
подсистем. Исторический каталог остаётся справочником источников.

GEN-07: Android NaConfig IdDcType=1, диапазон 0..2; backup showIdAndDc.
Режимы скрыто / Telegram API / Bot API, ID в обычных профилях, копирование.
Каналы используют -(1000000000000 + id), обычные группы — -id, users — id.
Для себя DC берётся из локального метода менеджера текущего соединения;
для чатов — stats_dc или фото, остальных пользователей — фото. При отсутствии
сведений показано unknown, без предположений о DC/регионе. Запрос текущего DC
не выполняется в скрытом режиме и не блокирует открытие чата. Менеджеры
привязаны к сессии; новые сырые MTProto-запросы не добавлены.

Проверено: 47 тестов в 5 файлах, включая три новых случая реального PeerProfile
(ID/форматы/копирование/hidden/self DC), backup и валидацию; типы, lint, граф,
сборка и no-account startup. Браузер 1440×900: настоящие General/PeerProfile,
синтетические own/contact/channel, Telegram API → Bot API → hidden клавиатурой;
данные контакта и собственный ID сохраняются, строки метаданных удаляются из DOM.
Снимки tmp/review-014-desktop-*.png. Полный авторизованный профиль не открывался.
GEN-07 зачёркнут после проверки и публикации на 8138.

## 015: HIDE-16 и MEDIA-17

- HIDE-16: Neko DontSendGreetingSticker=true, bool; выключает получение и
  отрисовку приветственного стикера в пустом чате, сохраняет текст и обработку
  бизнес-вступления. Текущий пустой чат обновляется при повторном открытии,
  что указано в подписи. Подключён точный alias disableGreetingSticker.
- MEDIA-17: NaConfig DontAutoPlayNextVoice=false, bool; реальный обработчик
  завершения голосового останавливает воспроизведение вместо next(). Музыка,
  кружки и ручной next не изменены. В Android EtgBackup этого ключа нет —
  отдельный совместимый alias не выдуман. Локальное сохранение/reset подключены.

47 целевых тестов / 5 файлов плюс 8 тестов поиска; типы, lint, production build
и startup проходят. Новый случай настоящего ChatBubbles проверяет сохранение
пустого текста и отсутствие запроса стикера; 4 случая настоящего обработчика
AppMediaPlaybackController проверяют voice off/on и сохранение music/round.
Браузер 1440×900: реальные Chats, оба переключателя и подписи. Полное проигрывание
звука и стикерные assets на аккаунте не проверялись. Отдельных стендов и мобильных
прогонов нет. Снимок tmp/review-015-desktop.png. Опубликовано на 8138;
чеклист обновлён до 17/296 после проверок.

## 016: HIDE-21 и HIDE-22

HidePremiumSection=false и HideHelpSection=true перенесены из NaConfig.
Реальный Premium-раздел Settings (Premium, Business, Stars/TON и подарки)
скрывается через существующий Solid Show; серверный purchase-block сохранён.
Help адаптирован: в Web K секции не было, добавлены четыре Android-пункта в
существующий экран Settings. По умолчанию секция скрыта, прежний начальный вид
Web K сохраняется. Поддержка открывает официальную веб-форму вместо Android-чата
с поддержкой; FAQ, TelegramTips и privacy используют адреса исходника. Сообщений
и форм агент не отправлял. Адреса проверены по официальным страницам Telegram.

Поиск и недавние результаты учитывают скрытые секции; переключатели скрытия
остаются доступны. Сигналы читаются при запросе, индекс не перестраивается при
каждом переключении. Локальное сохранение/reset подключены. В Android EtgBackup
этих двух ключей нет — новые alias не выдуманы.

36 тестов / 5 файлов, типы, lint, граф, сборка и startup прошли. Два новых случая
настоящего поискового движка проверяют скрытие/возврат результатов и recents.
Desktop 1440×900: настоящий SettingsHelpSection, четыре пункта, mouse и Space,
удаление скрытой секции из DOM. Полный авторизованный Settings/Premium не
открывался, его условие проверено исходниками. Снимки tmp/review-016-desktop-*.
Опубликовано на 8138, чеклист19/296.

## 017: CHAT-03

Вместо одного переключателя «сбоку» — три режима времени на стикерах.
Android ChatsConfig: HideTimeForSticker=false и OEChatsStickerTimeSide=false;
скрыто имеет приоритет при чтении, выбор режима согласованно меняет оба флага.
Обычные сообщения не затрагиваются; изменения применяются через существующий
корневой CSS-эффект без новых обработчиков на каждое сообщение. Backup понимает
hideStickerTime и stickerTimeMode 0..2, составной режим имеет приоритет как в Android.
При экспорте читается переданный снимок настроек, при импорте сохранён callback записи.

41 тест / 3 файла плюс 9 проверок поиска и графа; типы, lint, production build,
656 chunks guard и startup проходят. Повторно использован общий стенд 8137:
реальный выбор режима и MessageRender.setTime с синтетическим стикерным контейнером,
клавиши 0→1→2→0, обычное время сохраняется; RTL-стрелка возвращает 2→1.
Снимки tmp/review-017-desktop-*.png. Реальные стикерные assets на аккаунте не открывались.
Опубликовано на 8138, чеклист20/296.

## 018: HIDE-14 и HIDE-15

Neko DisableTrending=true и hideGroupSticker=false перенесены с точным регистром.
Рекомендации не запрашиваются и не показываются в обоих владельцах Web K:
стикерный поиск и карточка-подсказка пустого окна. Явный поиск наборов и настройка
подсказок по эмодзи сохранены. Поздний ответ запроса не возвращает скрытые рекомендации.
Групповой набор отключён в GroupSetController до получения full-info, включая
админский placeholder; повторное открытие панели возвращает/удаляет секцию.
Ответ, начатый до включения скрытия, не рисует набор. Групповые custom emoji
и уже установленные наборы не затронуты. В Android EtgBackup обоих ключей нет;
выдуманных alias нет, локальное сохранение и reset работают через общий store.

28 тестов / 3 файла, включая три случая настоящего GroupSetController;
9 проверок поиска/графа, типы, lint, сборка, 656 chunks guard и startup проходят.
Desktop 1440×900: реальные Chats и StickersTipCard с синтетическим названием набора,
видно возвращение/удаление рекомендации, mouse/Space, обе настройки меняют состояние.
Снимки tmp/review-018-desktop-*.png. Полная панель групповых стикеров и поиск на
аккаунте не открывались; явно отделено от тестов контроллера и проверки исходников.
Опубликовано на 8138, чеклист22/296.

## 019: CHAT-04, CHAT-05 и CHAT-06

Существующие replyColors/replyEmoji/replyBackground сверены с ChatsConfig и
ReplyMessageLine Android; точные ключи, defaults=true и три backup-alias уже были.
Исправлены два дефекта: CSS отключения цветов проигрывал inline-палитре
setPeerColorToElement и не сбрасывал градиент линии; скрытие эмодзи пропускало
коллекционный подарок и его отступ. Теперь индивидуальные акцент/полоса заменяются
цветом темы, узор и подарок скрываются вместе, padding-inline-end сбрасывается.
Подложка переключается независимо. Использован существующий корневой эффект;
новых запросов, слушателей или эффектов на каждый ответ нет. Общие webpage/quote
поверхности вне .reply не затрагиваются.

17 тестов backup, включая новый проход трёх независимых флагов; типы, lint,
сборка, 656 chunks guard и startup проходят. Реальный wrapReply в общем стенде,
синтетический peerColorCollectible, без загрузки подарка: полосатая линия →
одноцветная, фон rgba(...,.1) → transparent, узор/подарок display:none, отступ
28px → 0px; после включения возвращаются. Проверены mouse/Space и RTL.
Декоративные assets заменены явными текстовыми stand-in; их изображения и полный
авторизованный чат не проверялись. Стенд получил локальный .chat-контекст для
наследования штатных переменных темы. Снимки tmp/review-019-desktop-on.png и
tmp/review-019-desktop-off.png. QA-вкладка закрыта, viewport восстановлен.
Опубликовано на 8138, чеклист25/296.

## 020: CHAT-01

Точный Neko stickerSize: float 4..20, default14; EtgBackup decimal stickerSize.
Дробные значения сохраняются в локальном record и backup, не округляются до int;
числовые настройки с целочисленным контрактом по-прежнему округляются. Backup
отклоняет выход за диапазон, строки и bool. Поиск/reset подключены штатно.

Размер подключён в ChatBubbles.wrapSticker к существующим размерам static/animated
стикера. Веб-адаптация использует отношение Android tablet-формулы к её default14:
масштаб 1+(size-14)/16. На десктопе stock200px остаётся 200px при14; диапазон75..275px.
Aspect ratio и pixel rounding остаются у setAttachmentSize; реальные width/height
передаются отрисовщику, min-size пузыря совпадает с контейнером. Увеличенные emoji
и явный boxSize не масштабируются. Старые сообщения обновляются при переоткрытии
чата, это указано под настройкой. Новых обработчиков на каждое сообщение нет.

Предпросмотр — встроенный UtyanDiscussion Web K, без запроса Telegram и без новых
картинок. Один неподвижный кадр, один canvas, масштаб через transform; изменение
слайдера не пересоздаёт проигрыватель. Существующий RangeSettingSelector, шаг0.1.

47 целевых тестов / 4 существующих файла, 9 поиска/графа; типы, lint, production
build, 656 chunks guard и startup проходят. Один новый тест настоящего
ChatBubbles.wrapSticker проверяет stock/min/max, min-width, размеры отрисовщика,
aspect rounding, сохранение emoji/explicit box; сама медиа-отрисовка в нём stub.
Браузер1440×900: настоящий слайдер/встроенный canvas, 20→4.1→4, в RTL Left даёт4.2,
canvas остаётся один. Снимки tmp/review-020-desktop-large.png и small.png.
Новые размеры стикеров на пользовательском аккаунте не проверялись.
Опубликовано на 8138, чеклист26/296.

## 021: CHAT-14, CHAT-16 и HIDE-12

- CHAT-14: точный NaConfig DeleteChatForBothSides=true. Предвыбор существующего
  revoke-checkbox в удалении личного чата и в доступных вариантах удаления
  сообщений. Окончательный выбор в окне подтверждения имеет приоритет;
  само открытие ничего не удаляет. Проверки доступности revoke, scheduled,
  ephemeral, Saved Messages, dice и destructive delete целого канала сохранены.
  Очистка истории не меняется. В Android EtgBackup ключа нет — alias не выдуман;
  общий validated store сохраняет/reset возвращает значение. Новый пункт Chats
  с подписью и поиском объясняет предвыбор, включая возможность снять отметку.
- CHAT-16: Android ChatActivity.appendMention добавляет запятую только публичным
  упоминаниям, кроме ботов. Исправлен прежний общий суффикс, затрагивавший ботов
  и именованные mentions. Длина/offset messageEntityMentionName сохранены.
  Middleware и peerId защищают ввод от отложенного результата после смены чата.
  Ключ/default/alias уже были подключены; подпись уточнена.
- HIDE-12: прежний код читал флаги только при render и делал worker-запрос типа
  чата для каждой полосы, мог сохранить неверный тип при её переиспользовании.
  Теперь видимый peer классифицируется из готового UI mirror (как Android cache),
  контейнер получает один класс; общий корневой CSS-эффект мгновенно меняет
  видимость каждого типа. Нет новых подписок, эффектов на сообщения или
  worker-запросов; существующие узлы/выбор/медиа сохраняются. Broadcast отличается
  от megagroup; при переиспользовании класс обновляется. Три точных defaults=false
  и backup-alias уже были, reset и round trip проверены.

73 целевых теста в 6 файлах, 9 поиска/графа, типы, lint, сборка, 656 chunks guard
и startup проходят. Новые случаи настоящих функций удаления проверяют оба
defaults, ручное изменение выбора и отсутствие недоступных revoke-вариантов;
запросы записи в тестах — mocks. ChatInput проверен для user/bot/named/channel,
off и смены чата; ReactionsElement — для категорий и повторного использования.
Браузер1440×900, общий стенд: настоящее окно удаления, default on/off, Space,
Escape с возвратом фокуса; подтверждение удаления не нажималось. Настоящие
контейнеры реакций с текстовыми stand-ins скрываются раздельно, сохраняют
содержимое и возвращаются после reset. Их изображения/платные эффекты и полный
авторизованный редактор не проверялись. Известные worker/stories ошибки стенда
не объявлены отсутствующими. Снимки tmp/review-021-delete-default.png и off.png.
QA-вкладка закрыта, viewport восстановлен. Опубликовано на 8138, чеклист29/296.

## 022: CHAT-34 и CHAT-36

Точные ключи/defaults: Neko AskBeforeCalling=true и NaConfig
DisableClickCommandToSend=false. Оба находятся в Chats, validated record/reset
и поиске; в Android EtgBackup их нет, новые alias не добавлялись.

CHAT-34 подключён в AppImManager.callUser, общий путь ручных voice/video звонков.
Существующая проверка приватности идёт первой. После неё подтверждение с именем
и типом звонка, затем discardCurrentCall/startCallInternal. При отмене до этих
действий дело не доходит. Сохраняются очередь переходов и захваченный аккаунт;
имя читается его менеджерами. Повторный вызов для уже существующего звонка
использует прежнюю проверку. В режиме off сохраняется прежний путь.

CHAT-36 использует один helper подтверждения в трёх существующих владельцах:
execBotCommand, меню ChatBotCommands и CommandsHelper (подсказки после «/»).
Показывается полный текст с @bot. Подмена текста и отправка происходят после
согласия; при отмене черновик и навигация меню сохраняются. Middleware защищает
от смены чата, link-handler заранее связывает менеджеры с сессией; исходные
thread/reply/ephemeral-параметры и ephemeral receiver в подсказках сохраняются.
В off helper возвращает boolean синхронно. AutocompletePeerHelper теперь берёт
тип onSelect из общего ListNavigationOptions: слой навигации уже поддерживает
Promise<boolean>, отдельный обработчик клавиш не добавлялся.

44 целевых теста / 6 файлов, типы, lint, сборка, 656 chunks guard и startup
проходят. Настоящий AppImManager.callUser проверен с замоканным контроллером:
ожидание согласия до discard/start, voice/video, cancel/off, исходный аккаунт.
Настоящие обработчик ссылки и оба меню проверены с mocks отправки, включая
смену чата и ephemeral-контекст. Поиск отдельно проверяет наличие обоих
переключателей и исключение текстов самих окон подтверждения.

Браузер1440×900: реальные настройки и confirmationPopup, текст типа звонка и
полной команды, Escape/Cancel, возврат фокуса, off/on и reset. Call-preview
показывает только стандартное окно с тестовым именем; выполнение callUser
проверено unit-тестом. Bot-preview вызывает реальный helper, после согласия
меняет только локальный статус. Звонки, запросы микрофона/камеры и команды на
аккаунте не выполнялись. Снимки tmp/review-022-call-question.png и
tmp/review-022-bot-question.png. QA-вкладка закрыта, viewport восстановлен.
Опубликовано на 8138, чеклист31/296.

## 023: CHAT-27 и CHAT-28

Точные NaConfig keys/defaults: DateOfForwardedMsg=false (строки186–192) и
ShowTimeHint=false (472–478). Android MessageHelper.showForwardDate (937) и
getTimeHintText (1007), ChatActivity.didPressTime (42805). В Android EtgBackup
этих ключей нет: alias не добавлялись. Переключатели подключены к Chats,
валидируемой записи, reset и поиску. Заголовок поисковой строки
Exteraless.MessageTimeDetails не попадает под фильтр caption-ключей *Hint.

CHAT-27: существующий заголовок пересылки ChatBubbles дополняется локализованными
датой и временем оригинала через MessageRender.appendForwardedDate. Источник —
fwd_from.date, не saved_date; без даты/при off заголовок остаётся прежним.
Истории не меняются. Один штатный IntlDateElement сохраняет порядок даты и
времени в RTL и формат часов пользователя. Уже показанные сообщения обновляются
после повторного открытия чата; это указано у переключателя.

CHAT-28: делегированный обработчик времени в ChatBubbles показывает штатный
tooltip с локализованными строками отправки, правки (кроме edit_hide) и оригинала,
включая секунды. ShowTimeHint читается при щелчке. Off сохраняет выбор сообщения
и родную hover-подсказку Web K; режим выделения, импортированные пересылки и
неподходящие режимы чата сохраняют свой прежний путь. Семантика кнопки/фокус
на видимом time-inner, не на невидимой копии-размере time. Уже существующий
делегат buttonKeyDown даёт Enter/Space без нового обработчика на сообщение;
для новых клавиатурных остановок нужен повторный вход в чат. Tooltip создаётся
только по запросу, без запросов к менеджерам, подписок или эффектов на сообщение.
Нет перехватывающего щелчки overlay; автозакрытие и Escape через существующую
навигацию с noHistory/noBlurOnPop, её запись удаляется при закрытии. Строки dir=auto.

Попутно исправлена воспроизводимая ошибка старого hover-title: saved_date
передавалась в Date как миллисекунды. Обе ветки теперь переводят секунды в ms.
Дата сохранения в родном hover-title и исходная дата в новой подсказке сохраняют
свои разные значения; дата в заголовке всегда исходная.

42 уникальных целевых теста в 5 файлах проходят: настройки14, вкладки12,
рендеры7, поиск8 и граф1. Добавлены три регрессии в существующий файл:
оригинал против saved_date/отсутствия даты/off; точные строки, исключения,
навигация/закрытие; saved_date и видимая кнопка. Типы, lint, production build,
656 chunks guard и startup без аккаунта проходят. Графовые бюджеты не менялись.

Браузер1440×900: настоящие настройки, MessageRender и tooltip в общем стенде
с синтетической пересылкой; on/off, повторный рендер, Enter, Space, Escape,
автозакрытие и RTL. В off нет новой даты/подсказки. Визуальная проверка выявила
невидимый фокусный узел и перехват щелчков overlay; исправлены до публикации.
Снимки tmp/review-023-time-hint.png и time-hint-rtl.png. Полный авторизованный
чат/истории/скринридер не проверялись; старые worker/stories ошибки стенда
не объявлены устранёнными. Опубликовано на 8138, index совпадает с dist;
старые hashed chunks сохранены. Чеклист33/296.

## 024: исправление публикации, названий General и брендинга

Это исправления уже показанного интерфейса; число отмеченных фич остаётся33/296.
Причина смены шрифта и исчезновения иконок — в локальную копию на8138 переносился
только dist. В Vite copyPublicDir=false; штатный server.js обслуживает и dist,
и public, а Python-сервер этой копии видел только dist. Запросы Roboto/tgico
возвращали404. Новый scripts/publish-local.mjs (`pnpm publish:local`) копирует
сначала public, затем dist, проверяет наличие основных шрифтов и атомарно
заменяет index последним. Старые hashed chunks сохраняются. Шрифты/CSS не менялись.

Причина кодовых имён General и старого бренда: getCacheLangPackAndApply применял
сохранённый пакет как есть; обновление Telegram-переводов не добавляло новые
локальные строки форка. Теперь bundled strings загружаются параллельно с cache;
applyLangPack добавляет отсутствующие fallback-строки и всегда берёт актуальные
Exteraless/Exteraless.* из текущей сборки. Переводы Telegram и сохранённый язык
сохраняются; новый fallback в RTL получает штатную LTR-изоляцию. Нет сетевого
запроса для исправления и нет очистки хранилища/аккаунтов. Тот же overlay действует
при последующих обновлениях языка. Технические ключи, settings/backup JSON и
совместимость Android не переименовывались.

По подтверждённому пользователем адресу Channel заменён на @exterayond.
Ссылка GitHub остаётся честно подписанной Original Android source code:
собственный репозиторий пользователя не указан. Имя экспортируемого файла теперь
exterayond-XXXX.extera; формат/шифрование/чтение прежних .extera не менялись.
Убрано старое имя из ошибки несовместимого файла. Корневой settings-tab читает
appImManager через имеющийся hotReloadGuard при нажатии.

51 уникальный целевой тест в6файлах проходит: язык8, правила строк3, вкладки12,
backup19, поиск8 и граф1. Регрессия воспроизводит старый cached pack без новых
строк, прежнее имя exteraless, сохранённый арабский перевод и повторное apply;
проверяет человекочитаемые General-строки, актуальный бренд и bidi-изоляцию.
Типы, lint, production build, guard656 и startup проходят. На реальном8138
HTTP200 и побайтовое совпадение проверены для index, tgico.ttf и Roboto400/500;
прежний404 устранён. Общий стенд1440×900: реальные hub/General, видимые иконки,
Roboto, название и @exterayond; снимки tmp/review-024-hub.png и general.png.
Пользовательский авторизованный чат и экранный диктор не открывались.

## 025: HIDE-06 и завершение CHAT-23

HIDE-06: точный Neko key/default hideSendAsChannel=false (NekoConfig172),
Android ChatActivityEnterView12554; EtgBackup360 alias hideSendAsPeer.
Переключатель добавлен в Chats, поиск, validated store/reset и совместимый
backup; alias исключён из unsupported. Это скрытие интерфейса, не смена автора.
ChatSendAs помечает только обычную кнопку отдельным классом message-send-as,
общий root effect обновляет CSS-класс. CSS прячет кнопку и обнуляет её размер
в штатном смещении поля для data-offset=as. DOM, текущий sender и менеджеры
сохраняются, при возврате кнопки не нужны новые запросы/пересоздание аватара.
Штатный canOpen читает флаг при открытии, в том числе после асинхронной подготовки.
Отправитель платных реакций не получает скрываемый класс и проходит прежний путь;
смещение команд бота data-offset=commands не меняется. Не добавлены эффекты,
подписки на каждый sender или запросы на открытии чата.

CHAT-23: прежнее подключение OEChatsRemoveMessageTail=true (ChatsConfig196),
EtgBackup alias removeMessageTail и CSS подтверждены на штатном generateTail SVG
и реальных классах пузырей. On скрывает SVG и сохраняет обе нижние границы15px;
off возвращает хвост и обнуляет только нижний угол со стороны хвоста (incoming
end-start, outgoing end-end). Проверены живое изменение, оба направления и RTL,
reset и независимый backup round trip. Новая копия механизма не создавалась.

64 целевых теста в6файлах: store15, backup20, tabs12, render/owner8, search8,
graph1. В существующем render-тесте настоящий ChatSendAs с замоканным только
построителем меню проверяет on/off canOpen, исключение платных реакций и
отсутствие onChange при скрытии. Store/reset и строгий bool backup проверены
отдельно, включая независимость removeMessageTail. Типы, lint, production build,
656 chunks guard и startup проходят; графовые бюджеты не менялись.

Общий стенд1440×900, без аккаунта: штатные SVG/CSS пузырей, синтетические кнопки
composer со штатными CSS-классами/переменными. Смещение sender44px→0px→44px,
команд бота44px неизменно; в RTL команды сдвинуты-44px, скрытый sender0px.
Кнопка уходит из AX-дерева при display:none, Space возвращает её. Хвосты и углы
проверены on/off и в RTL, Space работает. Полный авторизованный composer, список
реальных отправителей и графика аватаров не проверялись; UI-контролы стенда
не выполняют отправку. Снимок tmp/review-025-tails-visible-sender-hidden.png. Опубликовано через publish:local, index8138 совпадает с dist,
статические ресурсы включены. Чеклист35/296.

## 026: GEN-05 и HIDE-01

HIDE-01: точный OEAppearanceHideActionBarStatus=false (AppearanceConfig70),
EtgBackup hideActionBarStatus уже были. Android ActionBar.getVisibleTitleRightDrawable
(659) и DialogStoriesCell.updateStatus (2182) управляют статусом в заголовке.
Прежний Web K port отсекал Premium/emoji в общем generateTitleIcons: исчезали
значки во всех именах, а уже открытые не менялись. Убран этот глобальный отсев;
один root-класс/CSS теперь скрывает только premium-icon/emoji-status внутри
chat-info (настоящая шапка чата) и profile-name. Список чатов остаётся штатным,
verified-icon/badge-fake не затрагиваются; загруженные узлы/анимации/обработчики
сохраняются для мгновенного возврата. Нет новых запросов/подписок на сообщение.
Скрытый emoji остаётся загруженным, как прочие данные PeerTitle; это скрытие UI.
Новый явный caption/название/keywords в Appearance; ключи и defaults не менялись.
Важно: user-title есть и в DialogElement, поэтому CSS на него не направлен.
Отдельного статуса в Story viewer Web K сейчас не добавляли.

GEN-05: точные OERelativeLastSeen=false (OpenExteraConfig37) и EtgBackup
relativeLastSeen подтверждены. LocaleController2790/formatRelativeDate2578:
relative только до24ч, целые часы/минуты, отрицательная разница приравнена к0.
Существующий getUserStatusString соответствует веб-адаптации: штатные минуты
и часы сегодняшнего дня остаются, on распространяет часы на предыдущий день
в пределах24ч. Начиная с24ч — обычные дата/время; приблизительные приватные
статусы, online, bot/support и служебные пользователи не раскрывают новых данных.
Caption теперь объясняет переход через полночь и повторное открытие чата для
немедленного обновления: открытая шапка использует свой прежний60-секундный
таймер и user_update. Новых таймеров/эффектов на статусы не добавлено.

73 уникальных целевых теста в7файлах проходят: time/status7, renderer9, store15,
backup21, tabs12, search8, graph1. Новые регрессии: полночь/Новый год on/off,
86399/86400с, будущее время, приватные статусы/bot/online; настоящая генерация
значков при скрытии сохраняет Premium/verified/scam для других владельцев;
root-класс и независимый backup round trip обоих флагов. Первые status-тесты
потребовали штатный peerId polyfill и pFlags в тестовых данных; исправлены.
Типы, lint, production build, guard656 и startup проходят, бюджеты не менялись.

Общий стенд1440×900: реальные настройки/форматтер, stock star/CSS заголовков;
emoji и verification обозначены текстовыми маркерами. В header/profile premium
и emoji flex→none→flex, verified всегда flex; в обычном user-title списка оба
всегда flex. RelativeLastSeen: вчерашняя дата/время→last seen23hoursago; reset
возвращает прежний режим. Проверены Space и RTL. Снимки
tmp/review-026-status-visible.png и status-hidden.png. Полный авторизованный
клиент, реальные custom emoji assets и экранный диктор не проверялись.
Опубликовано через publish:local; index8138 совпадает с dist. Чеклист37/296.

## 027 / CHAT-32 — Link-opening confirmation (2026-10-27)

Chats now offers **Ask before opening links: Hidden links / All links / Never**.
The policy uses Android's `ConfirmAllLinks=false` and `SkipOpenLinkConfirm=false`,
including All taking precedence if both flags are true. The existing validated
settings record and reset own these flags. Android EtgBackup exports neither key,
so no backup aliases were invented. Search indexes the new control.

The policy applies at interaction time through existing Telegram link handlers,
the document's external-link owner, middle clicks and `safeWindowOpen`. Already
rendered links respond immediately. Bot commands, hashtags, media timestamps,
editor links, downloads and local UI hashes keep their own actions. The stock
confirmation displays a non-clickable destination; Open continues the captured
URL and original handler arguments/result once. Cancellation or an account-session
change stops the pending action. Original mouse modifiers are captured before
the question. Auth-domain and sponsored processing remain with their existing
owners after consent. Hub external links also pass `openExternal=true`, fixing
their previously inert external navigation.

82 distinct targeted tests across eight files passed during this packet:
store16, tabs12, search8, anchor12, whitelist22, safeWindowOpen5, outgoing6 and
import-graph1. Final changed-logic rerun: 18 tests in the anchor/outgoing suites.
Typecheck, targeted lint, production build, unchanged import-graph budgets,
656-chunk guard and the no-account production startup check passed.

Desktop fixture review at 1440x900 verified the default visible-link continuation,
hidden-link question with the full destination, Escape cancellation and focus
restoration, and keyboard selection of All. The browser connection then became
unavailable. All/Never execution is covered by tests; its remaining visual check,
RTL, real authenticated autologin/sponsored flows and screen-reader testing were
not completed. No Telegram navigation, sending or user-session inspection occurred.
Browser context-menu navigation and dragging a link out remain browser-owned.
Published with public assets through `publish-local.mjs`; checklist: 38/296.

## 028 / Forced MD3 — implemented, visual review pending

The Appearance hub now contains the eight-part Forced MD3 group, using the
Android settings and master-switch semantics. Loading indicators, sliders,
switches, the chat header, folder navigation and section rows use the existing
Web K owners. The music popup and the mini-player use the existing playback
controller; the latter shows artwork when available. Search expands the group
when a nested setting is selected. The Android backup aliases round-trip with
the original boolean-to-style mappings. Details and source metrics are in
[`028-forced-md3.md`](028-forced-md3.md).

Focused settings, backup, player, loading, search and import-graph tests passed
with one worker. Typecheck and production bundle checks were run separately.
The local snapshot was updated with public assets; its index matches `dist`.
The user reported out-of-memory failures, so the local server was stopped and
no new server or browser was launched for this packet. Desktop appearance,
RTL, authenticated playback and the browser-based startup check remain unverified.
The six LOOK entries
and the full PLAYER-01 subsystem remain unchecked; the base music popup does not
include the full Android player editor, queue, lyrics or gestures.
