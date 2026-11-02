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

The player repeat button now announces its current off, playlist or track mode
instead of presenting a three-state control as a binary toggle. Its existing
popup fixture follows the same three-step cycle as the playback controller, and
the popup regression test exercises all three transitions. The two focused test
files pass (12 tests); typecheck and targeted lint pass. Visual and authenticated
playback review remain pending, and PLAYER-01 remains incomplete.

## 029 / PLAYER-02..05, 08..10, 12, 15..17 — the MD3 player's style settings (2026-10-31)

The style rows of Android's `PlayerStyleEditor` are ported into the Appearance
hub as three groups (Cover / Title / Layout) whose dependent rows follow
`PlayerStyleEditor.refreshVisibility`: size for the framed covers (card, disc),
corner radius for the card only, spin and title position for the framed ones.
The store gained the exact Android keys and defaults (`OEPlayerCoverStyle` 0,
`OEPlayerCoverSize` 100, `OEPlayerCoverRadius` 28, `OEPlayerDiscSpin` true,
`OEPlayerTitleAlign` 0, `OEPlayerTitleSize` 1, `OEPlayerTitleAbove` false,
`OEPlayerShowModes` true, `OEPlayerShowSource` true, `OEPlayerWavy` true,
`OEPlayerControlsSize` 1) with their ranges; the mappings port
`PlayerStyle.controlsScale` (0.84/1/1.14), `PlayerSheet.applyStyle`'s title
sizes (22/26/31 and 15/16/17) and `PlayerStyle.coverSize`. Android EtgBackup
exports none of them, so no aliases were invented.

The base popup (`md3Player.tsx`) now applies the cover styles as CSS
adaptations: card, wide (full-width 6:5 plate), full (artwork as the dialog
backdrop behind a light scrim, blocks at the bottom) and disc (circle, one
turn per 16s while playing, off at reduced motion). Title alignment, size and
position, the controls scale and a "Playing from chat" source line (the real
peer title via `PeerTitleTsx`, now accepting `meAsNotes`; hidden in place when
off, like Android's `View.INVISIBLE`) follow the settings live. `OEPlayerShowModes`
hides the repeat control; shuffle has no web counterpart and stays unsupported.
`OEPlayerWavy` feeds the amplitude of a new `WavyProgressLine`
(`src/components/wavyProgressLine.ts`), which ports `WavySeekBar`'s wave
(amplitude 4, wavelength 34, 6 rad/s, 4px stroke) over the existing
`MediaProgressLine` seek owner — zero keeps the flat stock bar, reduced motion
keeps it flat, and a paused track eases the wave back into the line. The block
order, the speed/lyrics/queue actions, the cover-derived colors and the
background modes wait on the missing web primitives and were not faked.

Tests: `exteralessSettings` (18), `exteralessTabs` (14, including the slider
list and the visibility-dependent rows), `outgoingConfirmations` (8, including
a new live-reshape pass over every wired setting and a pumped-frame decay
check for the wave), `exteraBackup` (23), `settingsSearchIndex` (8), plus a
first `pauseOnMinimize` file (see 030). Typecheck, targeted lint and
standalone sass compiles of the touched stylesheets pass; the settings-search
index was regenerated (468 entries). The player entries are appearance CSS whose
desktop result is unreviewed, so they stay unchecked with their annotations;
the count moves to 41/296 through 030's three checks below. Desktop appearance, RTL and
authenticated playback remain unverified; no server or browser was launched.

## 030 / MEDIA-13, MEDIA-14, MEDIA-15 — pause on minimize (2026-10-31)

MEDIA-13 lands with the exact Android key: NekoConfig's `AutoPauseVideo`
(default true, not an `OE*` key — the persisted name is the contract). The
playback controller's `visibilitychange` handler now pauses video with the
voice and round toggles; music never pauses, like Android. The Chats hub gains
the Video row beside Voice and Round, and the `.extera` backup gains the
Android alias `pauseOnMinimizeVideo` (it leaves the unsupported list, round
trips as a strict boolean and rejects non-booleans). MEDIA-14 and MEDIA-15 had
their wiring from an earlier packet; both are now locked by the same
regression.

The new `src/tests/pauseOnMinimize.test.ts` drives the real controller
singleton — its `construct(managers)` wires the listeners on sign-in, which
the harness had never called — and asserts, through the actual
`visibilitychange` handler, that video pauses by default and with its toggle,
that voice and round follow their off-by-default toggles, and that music and a
disabled video toggle keep playing. `exteralessSettings` (18), `exteraBackup`
(23), `exteralessTabs` (14), `settingsSearchIndex` (8) and typecheck pass; the
search index was regenerated. The three checklist entries are checked. What a
real hidden tab does with live media (an actual video element mid-playback) is
browser-owned and was not exercised; no server or browser was launched.

## 031 / CHAT-31 — Disable link preview by default (2026-10-31)

The Chats hub's link group gains **Disable link preview by default** with the
exact Android key: NekoConfig's `DisableLinkPreviewByDefault` (bool, default
false, `NekoConfig.java:160`; row at `OpenExteraChatsActivity.java:511`,
before the open-link-confirmation selector like Android's group order).
Android EtgBackup exports no alias for it, so none was invented.

Android seeds the composer's per-session preview state from the setting
(`ChatActivity.disableLinkPreview` at 15411,
`ChatActivityEnterView.messageWebPageSearch` at 811) and `searchLinks`
returns before fetching (ChatActivity.java:15417); sends then carry
`no_webpage`. The web port reads the flag in `ChatInput.processWebPage`
(the `searchLinks` owner): with the setting on, a fresh composition never
fetches a preview, keeps `noWebPage`, and `appMessagesManager`'s
`generateOutgoingWebPage` sends `{no_webpage: true}`. The gate stands before
the same-URL cache check so a live toggle also defuses a fetch left in flight
and drops an already shown preview plate (the stock no-URL branch's
helper/hover restore path), and turning the setting off re-fetches from
scratch. Edits (`editMsgId`) keep their own media handling — the task's
"new messages only" seeding — and a restored draft keeps the `no_webpage`
its composer saved, which is what Android's draft restore does with the
flag. Rich messages keep their existing always-suppressed path. Scheduled
posts go through the same composer gate.

Tests: `chatInputEditorAsyncActions` (13, five new over the real
`processWebPage` harness: suppressed fresh composition, dropping a fetched
preview, the in-flight fetch defusal, edits unaffected, stock restored when
the setting turns off), `exteralessSettings` (18, defaults contract),
`exteralessTabs` (14, row order), `settingsSearchIndex` (8, regenerated, 469
entries). Typecheck passes. What a real send produces on the server and the
composer's visual states are unverified (no browser); a message without a
URL keeps `no_webpage` unset, matching observable behavior while staying
minimal.

## 032 / CHAT-22 — Hashtag search default scope (2026-10-31)

The Chats hub gains **Hashtag search** with the two Android rows: default
hashtag page in chats and in channels, the exact NaConfig keys
`SearchHashtagDefaultPageChat` / `SearchHashtagDefaultPageChannel`
(int 0..2, default 0, `NaConfig.kt:478`); the three pages reuse Web K's own
`Search.Types.*` labels (Android's `SearchThisChat` / `SearchMyMessages` /
`SearchPublicPosts`). Android EtgBackup exports neither key, so no aliases
were invented.

Android seeds the search's default page on every hashtag open
(`ChatActivity.java:37788`): a public channel and not a megagroup reads the
channel key, everything else the chat key. The web seed lives beside the
topbar search's full-replacement effect — the exact moment a search opens
from outside (a hashtag click through `internalLinkProcessor`'s
`searchByTag` → `chat.initSearch`), not while typing. 0 leaves Web K's stock
default (the type strip unpicked = this chat), 1 picks my messages, 2 public
posts; the user's own strip pick still wins for that search, as in Android.
The public-channel check is `chat.isBroadcast && usernames[0]`, the same
shape as Android's `isChannelAndNotMegaGroup && isPublic`.

Tests: `exteralessSettings` (19, including the chat/channel key split, the
0/1/2 mapping to Web K's `undefined`/`'my'`/`'public'`, clamping and reset),
`exteralessTabs` (14), `settingsSearchIndex` (8, regenerated, 472 entries).
Typecheck passes. The seed effect itself renders only inside a mounted chat,
so its runtime path over the real topbar is unverified in a browser; the
store mapping it reads is the tested contract.

## 033 / CHAT-33 — Confirm before sending voice and video messages (2026-10-31)

The Chats hub's "ask when" rows gain **Confirm before sending voice and video
messages** with the exact Android key: NekoConfig's `ConfirmAVMessage` (bool,
default false, `NekoConfig.java:143`; the row sits before AskBeforeCalling
like Android's group). The label follows the Android hub's own override
("Sending video/voice messages" under "Ask when...") as the sibling
AskBefore* rows; the settings-search extractor denies keys containing
"Confirm", so the lang key is `Exteraless.AskBeforeAVMessage` while the
persisted name stays the Android contract. Android EtgBackup exports no
alias, so none was invented.

Android's release stops the recording into the recorded preview
(`MediaController.stopRecording` send=2) and only the explicit send commits
it. Web K already owns that preview: the recording's paused state, with its
send and discard buttons. The port reads the flag in
`ChatRecording.handleSendButtonClick` (the release owner): with the setting
on, a release past the minimum length pauses instead of stopping to send —
the paused preview's send is the confirmation, discard cancels, resume
records on. Disabled, the release sends like stock; a too-short recording
still cancels; the send menu's Silent/Schedule/Send-when-online keep their
explicit immediate send. Voice and round video share the handler.

Tests: `confirmAvMessage` (4 new, driving the real `handleSendButtonClick`
over a stub instance through the bubbles-graph loader: pause on release,
preview send commits, stock release, short-recording cancel),
`exteralessSettings` (19, defaults), `exteralessTabs` (14, row order),
`settingsSearchIndex` (8, regenerated, 473 entries). Typecheck passes. The
live recording UX (camera/microphone, the paused panel's buttons) is
browser-owned and was not exercised; no server or browser was launched.

## 034 / LOOK-27 — Folder tab counter mode, plus two resolved audit entries (2026-10-31)

The Appearance hub gains **Notification counter** with the exact Android key:
NaConfig's `IgnoreUnreadCount` (int 0..2, `NaConfig.kt:1314`), default 1 —
the effective default NaConfig computes from its legacy
`IgnoreMutedCount` preference. The Android strings name the three modes:
All chats / Except muted / Off. Android's EtgBackup exports the alias
`tabCounter` as a boolean (`EtgBackup.java:398`: true = counters on, false =
off; the middle mode never round-trips through the format), so the web
backup moves `tabCounter` out of the unsupported list with exactly that
mapping — a non-boolean still rejects like an untrusted file.

In the readable Android source only two readers consume the key
(`DialogsActivity.getTabCounter`, `FoldersPreviewCell.getTabCounter`) and
both only distinguish mode 2 (counter 0) from everything else, so the mode
the middle value reads through lives in the filter-count internals this
checkout does not carry. The web port gives each mode a real behavior from
the data the folder-badge owner already fetches
(`dialogsStorage.getFolderUnreadCount` returns both muted and unmuted
counts): mode 2 hides the folder-bar badges whole, mode 0 ("All chats")
reads the full unread count on every tab including All, and mode 1 — the
default — is Web K's stock behavior (the All tab's unmuted count, folders'
own counts). The badges recompute live through the existing
`exteraless_settings_updated` event, which the store now also fires for this
key on change and reset; Android itself only offers a restart hint here.
The refresh listens per folder item because the pre-existing
`updateAllFolderNotifications` skips the All folder's falsy id — that guard
was left alone.

Resolved from prior audit without new code: **CHAT-20** (keep attach button)
— Web K's composer never morphs the attach button while typing, the
setting's outcome is the base's permanent behavior, and a toggle would be
empty; the equivalence was already recorded in packet af8da51, the checklist
entry now reflects it. **OTHER-03** (reset settings) — the Other tab's
confirmed reset of the OE record plus the one native preference it owns is
implemented and regression-tested, and was fixture-verified in an earlier
session; the entry now says the full Android `resetAllSettings` app restart
is not reproduced and not claimed.

Tests: `foldersStoreRecovery` (3, one new: the three modes' badge counts
over the real store with a mocked dialogsStorage, the live recompute
included), `exteraBackup` (24, one new: the `tabCounter` boolean round-trip
and non-boolean rejection), `exteralessSettings` (19, defaults), 
`exteralessTabs` (14, the Appearance slider list), `settingsSearchIndex`
(8, regenerated, 474 entries). Typecheck passes. The folder bar's visual
result and RTL are unverified in a browser; no server or browser was
launched.

## 035 / HIDE-02 — Hide stories from the chat list header (2026-10-31)

The Chats hub's hiding group gains **Disable Stories** with the exact Android
key: NaConfig's `HideStoriesFromHeader` (bool, default **true**,
`NaConfig.kt:1362`; the row sits between hideActionBarStatus and
hideFloatingButton like Android's hiding group, `OpenExteraChatsActivity.java:727`,
whose title override is the string `DisableStories`). Android's consumer is
`DialogsActivity.updateStoriesVisibility` (13233, 13256): with the flag on, the
dialog stories cell is never made visible. Android EtgBackup exports the alias
`hideStories` as a boolean (`EtgBackup.java:326`), so the web backup moves it
out of the unsupported list with a straight boolean mapping; a non-boolean is
rejected like an untrusted file.

The web owner is the dialogs' stories strip — the `stories-list` container
`appDialogsManager` mounts above the chat list (`StoriesList`). The port hides
it with a root class `oe-hide-stories` toggled by the store's single effect and
one SCSS rule (`display: none`), which covers both the main sidebar and the
archived-container placement and keeps the strip out of layout and the
accessibility tree. Like HIDE-01 this is UI hiding: the strip's data path is
untouched, stories stay available in the chat header and the viewer, and the
toggle is live with reset returning to the Android default (hidden).

Tests: `exteralessSettings` (20, defaults plus the new live class test over
the Android default), `exteralessTabs` (14, the Chats row order),
`exteraBackup` (25, the `hideStories` boolean round-trip and non-boolean
rejection), `settingsSearchIndex` (8, regenerated, 475 entries). Typecheck and
a standalone sass compile of the touched stylesheet pass. The strip's visual
result (and the archived sidebar's) is unverified in a browser; no server or
browser was launched.

## 036 / CHAT-30 — Fix link previews (2026-10-31)

The Chats hub's link group gains **Fix link previews** with the exact Android
key: NaConfig's `FixLinkPreview` (bool, default `true`, `NaConfig.kt:1386`;
row at `OpenExteraChatsActivity.java:288/510`, beside the disable-link-preview
row, whose value caption Android renders as `x.com → fixupx.com`). EtgBackup
exports no alias, so none was invented.

The port adds `src/lib/linkCleaner/pagePreviewRules.ts`:
`PagePreviewRulesHelper.applyBuiltInRules` verbatim — the ten domain→replace
pairs at the pinned revision, one regex per domain, applied as a global
replace over the whole URL after an authority lookup. The remote rules
channel is disabled at this revision (`BaseRemoteHelper.hasMetadataSource()`
is false), so the built-in list is the complete behavior; nothing remote was
invented. `ChatInput.processWebPage` applies the rewrite to the URL it is
about to fetch, before the same-URL cache check — the sent text is never
rewritten, matching Android's `messageWebPageSearch` → `doRegex` consumer:
the message carries the preview fetched from the fixed URL. Setting off
restores the stock unfetched/unrewritten preview path. Case semantics follow
Android exactly: the authority lookup lowercases, the replace does not.

Tests: `pagePreviewRules` (5: all ten pairs, rewritten hosts left alone,
pass-through, case semantics, whole-URL replace). Typecheck passes. Whether
the fixupx/fxtwitter endpoints actually return a preview for a given post is
a property of those third-party services, not of the port; the composer's
visual states are unverified (no browser yet at integration time).

## 037 / HIDE-08 — Hide gift button in channels (2026-10-31)

The Chats hub's hiding group gains **Hide Gift Button in Channels** with the
exact Android key: NaConfig's `HideGiftButtonInChannel` (bool, default false,
`NaConfig.kt:882`; the row sits after hideShareButton in the "hiding chats"
group, `OpenExteraChatsActivity.java:736`). Android's consumer is
`ChatActivity.java:30127`: the channel bottom-buttons layout's BUTTON_GIFT is
shown only while the flag is off. Android EtgBackup exports no alias for it,
so none was invented.

The web owner is the channel "can't write" plate's trailing gift button
(`ChatInput.giftControlBtn`, shown for broadcast channels the user cannot post
in). The port hides it with a root class `oe-hide-channel-gift-button` toggled
by the store's single effect and one SCSS rule scoped to
`.chat-input-plate .btn-icon.gift` — the user chat's own send-gift button
(`btnSendGift`, a privacy-gated composer accessory) is a different control and
stays out of the selector. The toggle is live, and reset returns to the
Android default (shown).

Tests: `exteralessSettings` (22, the defaults list gained the key — and
retro-gained packet 036's missing `FixLinkPreview` default — plus the new live
class test), `exteralessTabs` (14, the Chats row list retro-gained packet
036's FixLinkPreview row plus the new one), `settingsSearchIndex` (8,
regenerated, 477 entries). Typecheck and a standalone sass compile of
`_chat.scss` pass. The plate's visual result is unverified in a browser; no
server or browser was launched.

## 038 / CHAT-21 — Disable global search (2026-10-31)

The Chats hub gains **Disable Global Search** with the exact Android key:
NaConfig's `DisableGlobalSearch` (bool, default false, `NaConfig.kt:1452`).
The row opens Android's search group before the hashtag rows
(`OpenExteraChatsActivity.java:494`), so the web section sits between the link
policy and the hashtag search. Android EtgBackup exports no alias, so none was
invented.

Android's consumer is `DialogsSearchAdapter.globalResultsAllowed()`
(`DialogsSearchAdapter.java:1105`): the flag feeds
`searchAdapterHelper.setAllowGlobalResults`, and the helper then drops the
server-wide results — users you don't have as contacts (`b == 1 &&
!user.contact`) and chats you're not in. The web equivalent lives in the
sidebar search's chats branch (`appSearchSuper.ts`): with the setting on, the
`contacts.search` handler keeps `my_results` (the user's own contacts) and
skips the global `results` that feed the "Global search" group, so the group
never renders. The user's local dialogs, the messages group and the sponsored
chips keep their existing owners — Android's gate touches none of them. The
gate reads the setting when the results arrive, so a toggle applies from the
next search.

Tests: `exteralessSettings` (21, the defaults list gained `DisableGlobalSearch`),
`exteralessTabs` (14, the Chats row list gained the section's row),
`settingsSearchIndex` (8, regenerated, 478 entries). Typecheck passes. The
gate's runtime path over the real sidebar search (a live query against the
server) is unverified in a browser; no server or browser was launched.

## 039 / HIDE-13 + HIDE-11 — attach menu camera tile and money item: audit resolution (2026-10-31)

Both entries resolve like packet 034's CHAT-20: the setting's outcome is the
web base's permanent behavior, so no toggle is added.

**HIDE-13** (`OEChatsHideCameraTile`, `ChatsConfig.kt:155`, default false):
Android's consumers are `ChatAttachAlert.java:6062` and
`ChatAttachAlertPhotoLayout.java:159` — the camera tile leaves the attach
panel's grid. The web attach menu is a `ButtonMenuToggle` over
`ChatInput.attachMenuButtons` (Photo or Video, Audio, Document, Music,
Location, article, group collage/slideshow, edit media, Gift Premium, Poll,
Checklist, attach bots) — there is no camera tile; the instant camera is the
composer's mic button, a different control. The key stays in the settings
record for compatibility (no UI row), and the Android EtgBackup alias
`hideCameraTile` (`EtgBackup.java:383`) leaves the unsupported list: an import
applies it silently as the documented no-op instead of reporting it. A
non-boolean is rejected like any untrusted value.

**HIDE-11** (`OEChatsHideMoneyButton`, `ChatsConfig.kt:209`, default false):
Android's consumer is `ChatAttachAlert.java:7028` — the wallet "Money" item in
the attach alert, gated on `config.walletAvailable` and the recipient. The web
attach menu has no money item at all. Android EtgBackup exports no alias, so
no record key, mapping or UI row exists for it.

Tests: `exteraBackup` (26, one new: the `hideCameraTile` boolean round-trip
and non-boolean rejection), `exteralessSettings` (21, the record gained
`OEChatsHideCameraTile: false`). Typecheck passes. Nothing visual changed; no
server or browser was launched.

## 040 / HIDE-05 — Hide the "All chats" tab (2026-10-31)

The Chats hub's chat-list hiding group gains **Hide "All chats" Tab** with the
exact Android key: NekoConfig's `HideAllTab` (bool, default false,
`NekoConfig.java:118`; the row formats `OEAppearanceHideAllChats` = Hide "All
chats" Tab, `OpenExteraChatsActivity.java:730/2921`). Android's consumers are
`FilterTabsView` (the default tab is not added to the bar; the folder preview
cell mirrors it via `tabsView.showAllChatsTab = !hideAllTab`). Android
EtgBackup exports the alias `hideAllChats` as a boolean
(`EtgBackup.java:330`), so the web backup moves it out of the unsupported list
with a straight boolean mapping; a non-boolean is rejected like an untrusted
file.

The web port filters the shared `folderItems` list in the folders store
(`visibleFolderItems`): the horizontal tab bar, the folder rail and every
index-based click path (tab clicks, the folder swipes, the back-stack pop,
`setUnreadOnly`'s folder opening) read the same array, so indexes stay
aligned — filtering only at the tab render would have desynced the clicked
index from the store's list. The All tab is dropped while real folders
remain; with no real folders the bar is never left empty (the setting's
hiding keeps the All tab there, unlike Android's empty bar). Toggling live
dispatches the store's settings event: hiding drops the All item and moves
the selection to the first visible folder through `onClick(0)` — the same
`selectFolderByIndex` path the tab bar uses, so the open chat list follows —
and unhiding rebuilds the list from `filtersStorage.getDialogFilters()` like
a hydration, re-checking the setting after the async read. The
`premium_toggle` fallback normalizes to the first visible folder instead of a
hidden All id. `setExteralessSetting`'s live-event list gained the key (the
constant renamed from LIVE_COUNTER_KEYS to LIVE_EVENT_KEYS; the dispatch
semantics unchanged).

Tests: `foldersStoreRecovery` (5, two new: the live hide/unhide cycle over the
real store with the selection moved through the click path, and the
no-real-folders case keeping the All tab), `exteraBackup` (27, the
`hideAllChats` boolean round-trip and non-boolean rejection),
`exteralessSettings` (21, defaults), `exteralessTabs` (14, the Chats row
order), `settingsSearchIndex` (8, regenerated, 479 entries). Typecheck
passes. The tab bar's live reshaping, RTL and the fresh-session bootstrap are
unverified in a browser; no server or browser was launched.

## 041 / LOOK-05 + LOOK-08 — centered header title and system fonts (2026-10-31)

Two Appearance rows, one packet (both small root-class adaptations).

**LOOK-05 — Center Title** with the exact Android key: AppearanceConfig's
`OEAppearanceCenterTitle` (bool, default false; on load Android migrates it
into NaConfig's `centerActionBarTitle`, `AppearanceConfig.kt:121/736`, and
EtgBackup exports the alias `centerTitle` as a boolean of that NaConfig value,
`EtgBackup.java:325`). Android's consumer centers the ActionBar title; the web
analog is a root class `oe-center-title` and one rule centering every
`.sidebar-header__title` (and its subtitle row) — the text centers inside its
own box between the leading and trailing buttons, the way the centered
TextView does. Direction-neutral (`text-align: center`), RTL needs no extra
rule.

**LOOK-08 — System font instead of built-in** with the exact Android key:
NekoConfig's `TypefaceUseDefault` (bool, default **true** — the exteraless
default already uses the platform fonts; the row reads `NekoConfig.typeface`,
`OpenExteraAppearanceActivity.java:913`). Android's consumer
(`TypefaceHelper.createTypeface`) maps the app's Roboto requests to system
families — only the main UI font. The web port toggles a root class
`oe-system-font` that swaps `--font-regular` (the app-wide font variable,
base.scss) to a system stack without the bundled Roboto; the web-only serif,
mono and rounded families keep their own stacks, matching Android's reach.
The Android default means a fresh web session renders with system fonts — the
contract's default, like HideStoriesFromHeader before it. EtgBackup exports
the alias `useSystemFonts` (`EtgBackup.java:339`), so both aliases moved out
of the backup's unsupported list with straight boolean mappings; a non-boolean
is rejected like an untrusted file.

Tests: `exteralessSettings` (22, the defaults list gained both keys plus a
live-class/reset test over the Android defaults),
`exteraBackup` (28, one new: `centerTitle` and `useSystemFonts` round-trips
and non-boolean rejection), `exteralessTabs` (15, one new: the two rows render
and the system-font toggle writes the store), `settingsSearchIndex` (8,
regenerated, 481 entries). Typecheck passes; standalone sass compiles of
base.scss and _sidebar.scss pass. The rendered result of both toggles (and
the sidebar title's centering in every sidebar) is unverified in a browser;
no server or browser was launched.

## 042 / CHAT-40 (+ CHAT-41 verdict) — wide channel posts (2026-10-31)

The Chats hub gains a **Channel posts** group (the Android group sits after
the tracking group, `OpenExteraChatsActivity.java:533-537`) with **Wide
posts**, the exact Android key: ChatsConfig's `OEChatsWideChannelPosts`
(bool, default false, `ChatsConfig.kt:189`). Android's consumer is
`MessageObject.hasWideChannelPostHeader` (`MessageObject.java:10157`): the
message's peer is a channel and not a megagroup (or `messageOwner.post`),
never a service message, sponsored post or preview, and
`ChatMessageCell.applyWideChannelPostWidth` replaces the bubble's
content-hugging background width with the full row width
(`WideChannelPostLayout.backgroundWidth`). The in-feed twin reads
`OEChatsWideFeedPosts` instead (`searchType == 4`).

The web port marks bubbles rendered in a broadcast channel with an `is-post`
class at the single bubble choke point (`ChatBubbles.renderMessage`, where
`is-out`/`is-in` are set; the open chat's `isBroadcast` is Android's
`isChannelAndNotMegaGroup` check, and service messages are excluded by the
`message._` gate). A root class `oe-wide-posts` then stretches those bubbles
over the available width — `--max-width: 100%` plus `width: 100%` on the
bubble and its content wrapper, the layout the sponsored bubble already uses.
Albums (`.is-album`) and backgroundless media (`.just-media`) keep their own
layouts: Android widens those through `getWideChannelPostMediaWidth`, a
separate media path the web does not reproduce. Toggling is live; the "and
forwards" of Android's footer is covered by the chat-level check (a forward
posted in the channel has the channel as its peer).

**CHAT-41 — Wide posts in Feed** resolves to *waiting on the web primitive*:
Web K has no feed (FEED-01 is an open subsystem), so the setting has nothing
to act on and gets no UI row. Its exact key `OEChatsWideFeedPosts` still
enters the record and its EtgBackup alias `wideFeedPosts`
(`EtgBackup.java:366`) moves out of the unsupported list as a documented
no-op that round-trips, like `hideCameraTile` before it. `wideChannelPosts`
also moved out of the unsupported list with a straight boolean mapping.

Tests: `exteralessSettings` (22, the defaults list gained both keys plus the
live `oe-wide-posts` class assertion), `exteraBackup` (29, one new: both
aliases' round-trips and non-boolean rejection), `exteralessTabs` (15, the
Chats row list gained the Channel posts row), `settingsSearchIndex` (8,
regenerated, 482 entries). Typecheck passes; a standalone sass compile of
`_chatBubble.scss` passes. The stretched bubble's visual result, its albums
and RTL are unverified in a browser (a channel with posts is live-session
content); no server or browser was launched.

## 043 / CHAT-35 — the Repeat action and its confirmation (2026-10-31)

The web repeat action CHAT-35 needs did not exist in Web K, so the packet
ports it together with its confirmation. Two exact Android keys, both
NekoConfig: `showRepeat` (bool, default false, `NekoConfig.java:106` — the
message menu gains the "Repeat" item) and `repeatConfirm` (bool, default
**true**, `NekoConfig.java:81` — the confirmation before it). Android's
consumer is `ChatActivity.repeatMessage` (`ChatActivity.java:48419`): with
the confirm on, a dialog ("Repeat" / `repeatConfirmText`) gates
`doRepeatMessage`, which forwards the messages **straight back into the same
chat** — no forward picker; the menu item itself requires a chat the user can
send in, no noforwards, and a forwardable message (`ChatActivity.java:50707`).
`repeatAsCopy` (the long-click / noforwards variant) stays out: it is a
separate Android flag (`showRepeatAsCopy`) and a separate MENU-05 item.

The web port: `repeatMessages` (`src/components/chat/repeatMessages.ts`,
shaped like `confirmBotCommand`) asks through the shared `confirmationPopup`
(title "Repeat", Android's `repeatConfirmText` verbatim) and then calls
`appMessagesManager.forwardMessages({peerId, fromPeerId: peerId, mids})` —
the manager-level forward, no popup. The message context menu gains the item
(redo icon, beside Forward, the Android menu position) whose verify reads
`showRepeat` plus the chat-level conditions: `!noForwards` (already computed
per menu open), `message._ === 'message'`, not scheduled, `chat.canSend()`;
outgoing messages are included, as in Android. The menu handler resolves the
album/grouped mids through the existing `getMidsByMid` like Forward does.
Rows: "Message menu" → **Repeat** (Android's message-menu composition group,
the one item of MENU-05's 24 that this packet needs), and the ask-when
group's **Repeating messages** between AskBeforeCalling and the bot-command
row, exactly Android's group order. The settings-search deny on "Confirm" is
avoided with the `Exteraless.AskWhenRepeating` key, per packet 033's
workaround. Android EtgBackup exports the alias `showRepeatMessageButton`
(`EtgBackup.java:371`), so it moved out of the unsupported list with a
boolean mapping; `repeatConfirm` has no alias and none was invented.

Tests: `repeatMessages` (4 new: asks and forwards into the same chat,
cancellation cancels, confirm-off sends without asking, empty mids no-op),
`exteralessSettings` (22, the defaults list gained both keys),
`exteraBackup` (30, one new: the `showRepeatMessageButton` round-trip and
non-boolean rejection, `repeatConfirm` absent from the export),
`exteralessTabs` (15, the Chats row list gained both rows),
`settingsSearchIndex` (8, regenerated, 484 entries). Typecheck passes. The
live menu over real messages and the actual server forward are unverified in
a browser; no server or browser was launched.

## 044 / GEN-12 — Sort chats by unread (2026-11-01)

The General hub gains **Sort by Unread** with the exact Android key: NaConfig's
`SortByUnread` (bool, default false, `NaConfig.kt:1398`; the row sits in the
archive group before "Unlimited pinned", `OpenExteraGeneralActivity.java:209`,
label `strings_nax.xml` "Sort by Unread"). Android's consumers are the two
dialog comparators (`MessagesController.java:1457/1500`): pinned dialogs keep
their order, then `ChatsHelper.isUnreadSortPriority`
(`ChatsHelper.java:375`) lifts a dialog above the rest — unread mentions,
unread reactions, or an unmuted unread counter, a forum's aggregate computed
over its topics — and only then the date decides. The toggle re-sorts live
(`sortDialogs(null)` + `dialogsNeedReload`). Android EtgBackup exports no
alias, so none was invented.

The web dialogs storage orders every folder array by a stored numeric index
`(date * 0x10000) + tail`, with `0x7fff0000…` reserved for the pinned band —
and today's dates already fill ~83% of the range below it, so no additive
priority level fits. The port (all in `src/lib/storages/dialogs.ts`) halves
every non-pinned date while the setting is on and reserves the freed top half
for the priority band: read indexes stay under `2^46`, unread-priority ones in
`[2^46, 0x7fff0000)`, pinned above both — Android's comparator order, with the
2-second granularity of the halved dates still broken by the insertion tail.
Indexes are per-session (`setDialogsFromState` deletes them on restore), so
the two layouts never mix; the flag flips only through `setSortByUnread`,
which re-indexes every cached dialog and topic in place (the same pass a
filter update runs) and then broadcasts `exteraless_settings_updated`, to
which every autonomous chat list answers with `fullReset()` — the web analog
of `dialogsNeedReload`, so held rows and the pagination cursors rebuild under
the new layout. Priority staleness is detected from the stored index itself
(`index >= 2^46`), so a filter pass regenerates instead of reusing an index
made under the other state. The flag reaches the worker through a
`appMessagesManager.setSortByUnread` passthrough, pushed from the settings
store on `user_auth`, on `account_switched` and on every change (the worker
has no access to the tab's Solid store); `clear()` resets it.

Tests: `dialogSortByUnread` (6 new: the stock layout byte-exact at flag off,
the priority band and halved dates at flag on, the Android predicate incl.
mentions-while-muted and the forum aggregate, the live folder re-sort with the
descending-index invariant and the pinned band above it, the stale-index
regeneration), `exteralessSettings` (22, the defaults list gained
`SortByUnread`), `exteralessTabs` (15, the General row list picked the row
up), `settingsSearchIndex` (8, regenerated, 487 entries). Typecheck passes.
Limits: a forum's aggregate reads only the cached topics (a freshly loaded
forum stays date-ordered until its topics arrive — the topic save path
re-sorts the parent, debounced); future-dated dialogs past year 2038 would
cross the pinned band exactly as the stock layout would. The rebuilt list's
visual result is unverified in a browser; no server or browser was launched.

## 045 / V-1 — Wallpaper pattern toggle (2026-11-01)

First packet of the user-directed look & feel stream (brief:
[`look-and-feel.md`](look-and-feel.md)). Android research: no exteraless,
Neko or Na config key owns the wallpaper pattern — the owner is Telegram's
own pattern dimming, the wallpaper record's `settings.intensity` (0..100,
edited by the wallpaper editor's "Intensity" seekbar,
`ThemePreviewActivity`), with the same value mirrored into a theme accent's
`patternIntensity`. Per the brief the web toggle maps onto that dimension
rather than inventing a separate concept: **off is intensity 0** — the
background renderer draws the wallpaper's color/gradient only — and **on**
(the default, stock) keeps the record's own intensity. Store key
`OEAppearanceWallpaperPattern` (bool, default true); EtgBackup exports no
wallpaper alias (verified against `EtgBackup.java`), so none was invented.

The gate lives at the background renderer's choke points
(`src/components/chat/bubbles/chatBackground.tsx`, the renderer behind the
chat, the wallpaper picker tiles, the passcode lock and Document PiP):
`getWallPaperUrl` does not even fetch a pattern whose drawing is denied, and
`buildContent` skips the pattern layer, its intensity dimming (a pattern-less
gradient keeps its full color — Android's intensity 0), and the dark-mask
mirror flag for the folders sidebar. Image wallpapers and their own dimming
are untouched. The decision predicate `wallpaperDrawsPattern` lives with the
other store mappings. Live without a reload: the setting is a live-event key
and the page-wide background singleton re-renders the current background on
it (`reRender`, whose cloned theme reference busts every guard).

Row: Appearance hub, beside Custom Themes in Chats. Tests:
`exteralessSettings` (24: the defaults list, the gate predicate over
pattern/image records, the live event), `settingsSearchIndex` (8,
regenerated, 488 entries), `exteralessTabs` (15). Typecheck passes. The
visual result (pattern disappearing live, gradient-only fallback on the
night theme's mask render) is unverified in a browser; no server or browser
was launched.

## 046 / V-2 — Floating vs attached sidebar (2026-11-01)

Android has no floating panels — its navigation drawer runs the app's full
height — and no config key exists for this (the "floating" hits in the
Android source are the bottom-navigation mode), so the setting is a
web-only adaptation: `OEAppearanceAttachedSidebar` (bool, default false =
stock floating; no backup alias). Web research: the float lives on
`#column-left` — `margin-block`/`margin-inline-start` from
`--page-chats-padding` plus the folders-rail offset, the outer
`--main-column-border-radius` radius and `--column-box-shadow`.

The setting toggles the root class `oe-attached-sidebar`; one rule in
`_leftSidebar.scss` zeroes the page margins and outer rounding, drops the
shadow and lets the panel run the full height, while keeping the
folders-rail offset so the two panels stay side by side. The inner section
cards keep their radius (`--oe-section-radius`), so attached still reads
exteraless rather than square; the interplay with
`OEAppearanceSingleCornerRadius` is unchanged (both compose at their own
choke points). Logical margins only — nothing to mirror in RTL; handhelds
already run zero root padding, so the class is a no-op there.

Row: Appearance hub, under Center Title. Tests: `exteralessSettings` (25:
the defaults list plus the live root-class/reset pass), a standalone sass
compile of `_leftSidebar.scss` (the compiled selector is
`:root.oe-attached-sidebar #column-left`). The visual result — both
directions, with the folders rail shown and hidden — is unverified in a
browser; no server or browser was launched.

## 047 / V-4 — Theme palettes and the accent picker (2026-11-01)

Web K theme research first: the stock system already ships iOS-ported
accent presets per base (`themePresets.ts`) applied through
`themeController.applyAccentPreset` → `applyNewTheme` (a synthetic
`preset:*` theme persisted into the app's own theme state — the stock theme
objects in `SETTINGS_INIT` are never touched, and `resetActiveTheme`
restores the factory entry), the stock accent picker row is Dark-only, and
surface colors are CSS variables the theme applier writes inline on `<html>`
for `tinted` and leaves to static rules for `night`.

Ladder as shipped: (1) **exteraless palette** and (3) **AMOLED** — one
Appearance selector `OEAppearanceThemePalette` (0 stock default, 1
exteraless, 2 AMOLED; `exteralessThemePalette.ts`): a palette override of
the seven surface variables (`surface-color`, `background-color`,
`body-background-color`, `message-background-color`,
`input-search-background-color`, `border-color`, `secondary-color`, plus
their `-rgb` companions) with fixed values — the exteraless near-black
surfaces with muted cards, and the AMOLED pure black of Android's bundled
`amoled.attheme`. It applies only while the resolved theme is dark (the
`.night` class `_setTheme` toggles covers night and tinted), re-applies
after every theme application (`theme_changed` fires inside `_setTheme`
after the theme's own writes, plus `user_auth` for the silent first boot
apply) and clears exactly the variables it wrote, so the theme's own inline
values survive. (2) **accent color picker** — an Appearance row with the
existing `ColorPicker` component (lazily loaded on first reveal): a drag
previews through `applyTheme` (variable writes only) and a debounced commit
goes through `applyAccentPreset` with `accentPresetFromColor` (new helper in
`themePresets.ts`: dark bases derive iOS' bubble gradient, light bases take
the solid fill), so the pick is per-theme and survives a reload. Reset is
the stock `resetActiveTheme`. (4) the custom-theme editor is not built —
everything shipped is expressed through the stock system; the palette does
not touch the wallpaper (Chat Wallpaper keeps its owner) and the `.night`
menu-mirror keeps the underlying theme's surfaces (documented limit).

Rows: Appearance hub, "Theme Palette" selector and "Accent Color" section.
Tests: `exteralessThemePalette` (5 new: resolution, the apply/clear matrix
with foreign inline values preserved, the accent-preset composition),
`exteralessSettings` (25: the defaults list plus the palette clamp),
`exteralessTabs` (15: the palette selector in the slider list),
`settingsSearchIndex` (8, regenerated, 493 entries). Typecheck passes; the
standalone sass compile passes. The palettes' and picker's visual result is
unverified in a browser; no server or browser was launched.

## 048 / V-3 — Forced MD3 coverage audit and the slider extension (2026-11-01)

The audit first (per the brief), surface by surface, under the current
eight-part group (`oe-md3-loading`, `oe-md3-sliders`, `oe-md3-switches`,
`oe-new-chat-header`, `oe-md3-navigation`, `oe-md3-list-items`,
`OEAppearanceMd3Player`, `oe-md3-mini-player`):

| Surface | Verdict under the eight parts | Owner |
|---|---|---|
| Switches (every toggle in the app) | covered | `oe-md3-switches` — the rule targets `.checkbox-field-toggle` globally |
| Loading indicators | covered | `oe-md3-loading` — the M3 wave rides the shared `putPreloader` and `preloaderRing`, so every spinner |
| Settings rows / section cards | covered | `oe-md3-list-items` — the Section component's `sidebar-left-section` choke point renders left-sidebar tabs, right-sidebar tabs (profile and 23 more) and 28 popups' sections, so every Section row is covered |
| Settings sliders | covered | `oe-md3-sliders` — the settings `RangeSettingSelector` family |
| Chat header | covered | `oe-new-chat-header` — the flat tonal topbar |
| Folder navigation | covered | `oe-md3-navigation` — the folders rail and the tab bar's active pill |
| Music player popup | covered | `OEAppearanceMd3Player` + the PLAYER style group |
| Mini player | covered | `oe-md3-mini-player` — tonal plate, cover, radius |
| Chat list rows | covered by contract | Android's eight parts do not M3-ify chat rows either (`M3ListItems` is row heights/tonal fills for sectioned lists only) — the stock dialog row is the faithful mapping |
| Audio rows' seek line (chat bubbles) | **was not covered → extended** | `oe-md3-sliders` — Android's SliderStyle styles every SeekBarView; the web's other slider family now takes the same M3 track and gap handle the settings sliders wear. Voice rows keep their waveform (`.audio.is-voice` excluded); the mini player's and media viewer's sliders keep their own chrome |
| Popup / context menu / dialog card chrome | waiting on a decision, not a primitive | Android themes modals through the theme; the web's eight parts have no modal-surface owner, and a ninth part would change the master's count semantics, which the brief forbids |
| Search input chrome | waiting | same — no owning toggle |
| Media viewer chrome | waiting | same — the viewer is its own shell |
| Composer | waiting | same — the composer has no MD3 sub-toggle |

The one extension ships behind the existing `oe-md3-sliders` toggle (ported
values verbatim, no new semantics, off = stock): the audio rows' seek line
(`_leftSidebar.scss`, `.audio:not(.is-voice) .progress-line`). Everything
else in the table above the line was verified covered by reading the actual
choke points, not assumed. The remaining "waiting" surfaces are listed for
the user's acceptance session to prioritize (extending them means deciding
which toggle owns modal chrome). Standalone sass compile passes; no test
(CSS-only), no browser run.

## 049 / Acceptance round 1 — the F-1..F-6 fix list (2026-11-01)

The user's first acceptance pass over the look & feel stream
([`look-and-feel.md`](look-and-feel.md), fix list F-1..F-6), plus a mid-work
refinement of F-3 from the user (the background tab's "Set a color" must
cohere with the accent, and the accent tinting must reach every surface
family).

**F-1 — attached sidebar keeps its outer rounding.** The `oe-attached-sidebar`
rule set no longer zeroes the radius: both modes are rounded, they differ in
margins and height only (the shadow stays off in attached mode — a float
affordance, not part of the complaint). RTL unaffected (logical margins,
symmetric radius); the folders-rail offset is untouched. Standalone sass
compile verified: the compiled selector stays `:root.oe-attached-sidebar
#column-left`.

**F-2 — Theme Palette is a single toggle.** `OEAppearanceThemePalette` is a
boolean now (default false = stock): off keeps the theme's own surfaces, on
applies the near-black palette to dark themes. The Stock/Exteraless/AMOLED
selector and the AMOLED palette are removed entirely (`THEME_PALETTES` → the
single `THEME_PALETTE_SURFACES`), and the store's numeric range entry with
them. The persisted value migrates by the store's own clamping (a stale 1/2
falls back to the boolean default). The row is a plain checkbox; the settings
search index was regenerated for it (the checked-in index had also gone stale
— the V-1/V-2/V-4 rows are now in it).

**F-3 — the accent tints the surfaces and carries the material elements**
(with the user's mid-work refinement). Research first: the stock
`applyAccentPreset` pipeline wraps the preset into a synthetic `preset:` theme
and re-applies it through `applyNewTheme` (wallpaper included); `applyTheme`
derives `--primary-color`, links, saved-color and the outgoing bubbles from
the accent, but on `night`/`tinted` the surface family comes from
`finalize()`'s static `colorMap` — which is why the accent never touched the
background — and the chat canvas renders the wallpaper record, which the
custom-accent preset never carried. Two extensions, both inside the stock
pipeline:

- *Surfaces.* While the palette toggle is on, `applyThemePalette` tints every
  surface of its family (the seven `colorMap.night` keys) with the accent's
  hue Material-You style: each surface keeps its lightness and takes the
  source hue at a low, source-scaled saturation (capped at 24% so text-bearing
  surfaces stay readable); an achromatic source leaves the surfaces neutral.
  The tint source is the explicit "Set a color" pick when there is one (a
  `wallPaperNoFile` record with a `background_color` — the user's own choice
  wins over the palette, and it survives accent changes since the accent's
  material wallpaper below only replaces factory wallpaper), otherwise the
  active theme's accent — so accent changes retint the chrome live via the
  `theme_changed` re-apply, and a background pick re-hues it the same way.
  Image wallpapers are not hue-read (the palette keeps the accent hue there).
- *Background.* A committed custom accent now bundles a Material-You wallpaper
  (`materialWallpaperFromAccent` in `themePresets.ts`): four accent-hued
  gradient stops following the iOS dark-tinted wallpaper convention (dark
  muted stops, intensity 40, `dark`) on dark bases and pastel stops at
  intensity 50 on light ones, rendered with the bundled `pattern.svg` through
  the existing `preset:*` slug path — so the background follows the accent and
  keeps its material elements, with no new rendering code and no server fetch.
  It attaches only while the palette toggle is on and the current wallpaper is
  not user-owned (`pFlags.default` marks factory and preset-owned records;
  a "Set a color" pick, an upload or a grid pick is never replaced). The
  preview during a drag stays variables-only; the wallpaper lands on commit.

The wiring moved wholesale into `exteralessThemePalette.ts` (the tint-source
resolver, the `theme_changed`/`user_auth`/live-event re-applies, self-registered
at boot beside the store's dynamic import in `index.ts`): the store must not
import `themeController`, because a stateful store re-run by a themeController
hot edit is exactly the import-graph hazard the budget ratchet caught
(`dirtyPage` grew to 2). The ratchet is green again — and packet 044's own
debt (the store stacked duplicate `user_auth`/`account_switched` listeners on
every hot re-run) went with it, both listeners now go through `hotListen`.

**F-4 — Custom Themes in Chats was not dead at the gate.** End-to-end read of
the wiring: the row → the store → chat.ts's per-chat resolution →
`publishBackground` → `setBackground` are all connected, and the ON state is
byte-for-byte the stock Web K behavior this gate was wrapped around
(`if(_fullPeer)` → `if(_fullPeer && OEAppearanceCustomThemes)`). The
resolution logic is now extracted (`resolveChatThemeOverride`, next to the
other store decision predicates) with a real regression test: off drops the
peer's theme emoticon and wallpaper exactly like `ChatActivity.setupChatTheme`'s
early return; on resolves the emoticon through the account themes and keeps
the wallpaper record when the emoticon resolves to nothing. LOOK-10 stays
unchecked with the finding recorded: the visible effect needs a chat whose
theme or wallpaper was set from another client — the web has no UI to set one
— which is why the row reads as dead in acceptance.

**F-5 — the brand is out of the user-visible text.** The palette keys were the
last user-visible "exteraless"/"AMOLED" strings (the hub's own titles have said
"exterayond" since packet 024): the selector's three value labels are gone
with F-2, the toggle's info text and search keywords are neutral. Kept
deliberately: the code comments citing the Android/exteraless sources
(attribution is required), the internal `Exteraless.*` lang-key prefix (591
usages — renaming them is mass churn with regression risk for zero visible
gain; flagged for the user to order explicitly if wanted), and internal CSS
class names. No aria text carries the brand.

**F-6 — animations and polish, bounded tranche.** Audit findings: shared
scrolling already rides the level-aware helpers (`fastSmoothScroll`,
`smoothScrollBehavior`, the TransitionSlider); the real instant jumps on the
surfaces this stream touched were (a) the `<details>` reveals in the hub (the
accent picker, the MD3 customize list) and (b) the attach/detach toggle.
Shipped: (a) the reveals grow open where the platform can animate a keyword
size (`interpolate-size` + `::details-content`, Chrome 131+) at full animation
level, and open at once everywhere else; (b) the attach toggle eases its
margins/rounding/shadow behind a one-shot `oe-sidebar-layout-animate` root
class the store raises for 500ms — so the folders-rail offset and every
resize path stay instant, and the level mixin gives reduced animations the
margins and shadow fade only. Deliberately left out: app-wide CSS
`scroll-behavior: smooth` (the app's scroll positions are JS-owned and would
fight `fastSmoothScroll`), popup/menu/dialog entrance animation (packet 048's
chrome question — no owning toggle), per-row chat-list animations (per-row
cost; the stock row is the contract).

Rows/tests: `exteralessThemePalette` (13: resolution, tint behavior incl. the
achromatic case, the apply/clear matrix, the wiring lifecycle over the store's
live channel, the accent preset, the material wallpaper for both base kinds),
`exteralessSettings` (27: boolean palette default + clamp, the custom-themes
gate, the one-shot animate class, the pre-existing suite),
`exteralessTabs` (16: the palette is a toggle, the slider list without it),
`settingsSearchIndex` (8, regenerated — the checked-in index had gone stale
and now carries the V rows), `importGraphBudget` (back within budget after the
palette-module move). Typecheck passes, oxlint passes on the touched files,
the standalone sass compile passes. Unverified in a browser (no server or
browser launched): every visual result — the rounded attached corners, the
hue-tinted chrome, the accent's material wallpaper, the details/attach
animations — belongs to the user's acceptance round 2, steps 1.21–1.24.

## 050 / Acceptance round 2 — the G-1..G-4 fix list (2026-11-01)

The user's second acceptance pass over the look & feel stream
([`look-and-feel.md`](look-and-feel.md), fix list G-1..G-4), plus a live
mid-work bug report on the attached sidebar overlapping the chat (folded
into G-3 below).

**G-1 — the background color pick.** The render path was traced end to end
and proved intact with a flow regression test (`exteralessBackgroundPick`):
the pick persists through `setWallpaperForCurrentTheme` (a fresh wallpaper
reference every time — the Solid store does not merge it in place), and the
real `appChatBackground` dedup guards land a canvas render per pick, over a
preset-carried theme state too. What actually degraded the pick: every
background re-apply ran through `themeController.setTheme()` — the
theme-switch view transition (`startViewTransition` wraps `_setTheme` plus a
wallpaper-ready wait), one per 16ms throttle tick during a color drag, each
pausing heavy rendering. Shipped: `themeController.applyThemeFast()` — the
fast branch extracted verbatim — and `appImManager.applyCurrentTheme` (every
caller is a wallpaper re-apply, none a theme switch) routes through it, so a
pick applies in the same task and the canvas slot fade carries the visual;
theme switches keep the reveal. The tint priority chain was made explicit
and tested (`resolvePaletteTintSource` in `exteralessThemePalette.ts`).

**G-2 — hub motion.** The plumbing finding: the stock animation level
resolves 2 by default (`liteMode.getAnimationLevel()`, the body classes land
at boot via `appImManager.setAnimationLevel`, covered by
`animationLevel.test.ts`) — **the F-6 level gate did not keep the reveals
instant; the platform gate did**: the F-6 reveal animates only where
`interpolate-size` + `::details-content` exist (Chromium 131+), instant
everywhere else. The tranche, all level-gated: (a) the `<details>` reveals
fade their content in from reduced level (`fade-in-opacity`, every engine) —
the size growth stays Chromium-only at full; (b) the hub's `Customize`
summaries are controls now — they take the row hover/press highlight
(`hover-background-effect`, rounded to the section radius, eased); (c) the
shared `.row-clickable` hover/press highlight eases with the standard timing
instead of snapping (`--transition-standard-*`, Material's
`cubic-bezier(.4, 0, .2, 1)`), reduced shortens it, off snaps. Tab switches
were verified already animated (the stock SuperTab slide, `--tabs-transition`)
— untouched. Deliberately skipped: app-wide smooth scrolling and per-row
chat-list animations (the F-6 exclusions stand), popup/menu/dialog entrance
animation (packet 048's no-owning-toggle decision), making the hub's toggle
rows click-to-toggle like Android's SwitchBarRow (a behavior port, not
motion — needs its own decision), the accent picker's preview flicker
(`applyTheme` writes the theme's own surfaces during the drag until the
commit re-tints), section-card entrance animations (Android has none).
Verification: standalone sass compiles of `_leftSidebar.scss` and `_row.scss`
(the compiled selectors carry `body.animation-level-1` / the no-touch hover
rules).

**G-3 — attached sidebar.** Corners: only the content-facing edge keeps its
rounding — `border-start-start-radius`/`border-end-start-radius` zeroed on
`#column-left`, so the inline-end edge (top-right/bottom-right in LTR,
mirrored in RTL by the logical properties themselves) stays rounded and the
window-facing corners square; the folders-rail offset and the no-shadow
decision unchanged; logical radii only, no physical twin in the block.
Live bug from the user mid-round: in attached mode the chat did not offset —
the docked-range pop-out (collapsed sidebar + an open tab) overlays the chat
by stock design (layout reserves 80, the panel renders 360, a scrim dims the
chat), and the drawer range covers it with a fixed push. Attached never
overlays now: `updateColumnWidths` computes the chat's space (and the
`rightColumnFits` threshold) from the panel's VISUAL width while
`OEAppearanceAttachedSidebar` is on (the helper imports the store — the
budget ratchet stays green), re-runs on the setting's live event, and caps
`--chat-width` in the drawer range too; `#column-center` re-centers beside
the visual width in the docked range (both the plain and right-column-shown
shifts) and in the drawer range while the panel is shown (eased, level
gated); the pop-out scrim is suppressed in attached mode. The topbar, pinned
bar and composer plates all ride `--chat-width`, so one recompute covers
them; the shift rides `--reflect` (RTL mirror). Off = stock byte-for-byte.
Tests: `attachedSidebarWidths` (the chat clears the popped-out panel only
while attached, 696px vs 616px at the pop-out state). The corner rules are
verified by sass compile (`:root.oe-attached-sidebar #column-left` carries
the two zeroed logical radii).

**G-4 — theme from wallpaper.** The Pixel/Material You port: while the
palette toggle is on and the wallpaper is an image, its dominant chromatic
color tints the surface family. The extractor (`helpers/wallpaperTint.ts`)
is JS-only canvas sampling — the source downscales to ≤48px once, pixels
bucket into a 36-bucket hue histogram weighted by saturation, the winning
bucket's mean color returns; a gray-dominant image yields undefined (no
tint); samples cache per wallpaper record (bounded, 8), so theme re-renders
do not resample. No server, no workers. The hook point is the chat
background renderer itself: it already decodes every wallpaper for the
canvas layers, so it samples the same decoded image at render time and
announces the result on the new typed `exteraless_wallpaper_tint` event —
every wallpaper change re-renders and therefore re-derives live. The
priority chain, explicit and tested (`resolvePaletteTintSource`): **explicit
background color > explicit accent PICK > wallpaper-derived > the theme's
own accent (F-3) > palette default** — an explicit accent pick is the accent
picker's synthetic `preset:*` theme; the factory/cloud-carried accent is not
a pick and yields to the wallpaper, the way the Pixel behavior the user
asked for reads. The palette applies the matching-key sample only (a stale
sample of another record never applies) and a pattern/color render clears
the level. Tests: `wallpaperTint` (the bucketing decision logic incl. the
gray skip, the cache, the announcement event), `exteralessBackgroundPick`
(the full chain, and the derived level applying and clearing live over the
factory accent through the real `applyThemeFast` re-apply).

Rows/tests/typecheck/lint: no new settings (G-4 is the palette toggle's
extended behavior; G-1/G-3 have no new keys), so the settings-search index
is unchanged and `exteralessTabs`/`exteralessSettings` pass untouched
(81 tests across the 8 touched suites). Typecheck passes, oxlint passes on
the touched files, the import-graph budget ratchet is green (404/0/35).
Limits: the extractor samples the decoded image the renderer already has —
the first sample lands after the wallpaper's decode (one canvas draw + one
48px pass, cached), so the chrome's tint follows the canvas within a frame
or two of the wallpaper landing; a blurred variant samples the blurred
bitmap (same hue family); the average-bucket color is a defensible dominant,
not Android's full Monet palette. Unverified in a browser (no server or
browser launched): the rounded content-facing corners and the chat offset in
both modes and directions, the hub motion, the pick's instant apply, and the
wallpaper-derived tint — the user's re-acceptance, runbook 1.22–1.23
rewritten for the new behavior.

## 051 / CHAT-10 + CHAT-11 — Double-tap actions (2026-11-01)

Android research: the two NaConfig keys `DoubleTapAction` /
`DoubleTapActionOut` (ints, defaults 1 = send the quick reaction on both
sides) with the action enum of `xyz.nextalone.nagram.helper.DoubleTap.kt`
(0..12); the consumer is `ChatActivity.onDoubleClick` — the direction picks
the key (`isOutOwner`), then a switch dispatches: send the chosen reaction
(`MediaDataController.getDoubleTapReaction` — the local
`reaction_on_double_tap` emoji setting), open the message menu
(`createMenu(..., onDoubleTapped)`), translate (native or LLM), reply,
forward, save (nkbtn_savemessage = forward to the own user id), repeat /
repeat as copy (`repeatMessage`'s copy flag → forward without the header),
edit, delete, download (`saveByDoubleTap`, media only). The settings dialog
offers EDIT only on the outgoing side; the reaction row
(`doubleTapReactionRow`) shows only while an action is send-reactions.
EtgBackup exports neither key — no backup alias invented.

The web store keeps the enum and defaults verbatim
(`src/stores/exteralessSettings.ts`, ranges [0, 12]); the decision predicate
`resolveDoubleTapAction` (direction → key, values pass through) and the
option lists sit beside the other store decision predicates. The hub's Chats
tab gains the "Double tap" section: two `RangeSettingSelector` rows that step
a filtered option list (Android's `showDoubleTapOptions` order minus
`TRANSLATE_LLM` — the web has no LLM translator provider, so it is not
offered and an imported value resolves to a no-op, never faked; the selector
view maps index ↔ enum value so the store stays Android-faithful), and the
CHAT-11 reaction row — visible under Android's own condition — opens the
stock Quick Reaction subtab (`AppQuickReactionTab`,
`messages.setDefaultReaction`), which is the web's existing account reaction
chooser and the honest stand-in for `reaction_on_double_tap`.

The consumer is the bubble's stock dblclick handler
(`src/components/chat/bubbles.ts`): the stock guards and the
text-selection-aware bubble resolution stay byte-for-byte, the stock
`canSendPlain` early return moves into the Reply branch (Android allows
react/delete/forward where sending is restricted), and the configured action
dispatches through `performDoubleTapAction` — every action rides an existing
web handler: `chat.sendReaction` with the quick reaction, a synthetic
contextmenu on the bubble for Show Reactions (the same untrusted-contextmenu
path the a11y keyboard support already synthesizes), `openTranslatePopup`
behind `peerTranslation.canTranslate` and the shared language detector,
`hotReloadGuard.showForwardPopup`, forward to `rootScope.myId` for Save,
`repeatMessages` for Repeat (the CHAT-35 confirmation applies), `dropAuthor`
forward for Repeat as Copy, `showDeleteMessagesPopup`, `initMessageEditing`
behind `canEditMessage('text')`, and `appDownloadManager.downloadToDisc` for
Download. A double click that selected text never reaches the dispatch (the
stock selection guard) — the PC coordination the checklist asks for.

Rows/tests: `exteralessSettings` (28: the defaults list gained the two keys,
a new test over the direction split, the enum table, the filtered option
lists and the unsupported-value passthrough), `exteralessTabs` (17: the
reaction row's condition live in both directions and the click opening the
quick-reaction tab), `settingsSearchIndex` (8, regenerated — 497 entries),
`dialogSortByUnread` (6, untouched, regression). Typecheck passes, oxlint
passes on the touched files, the import-graph budget ratchet is green.
Unverified in a browser (no server or browser launched): every dispatched
action's visible result, the reaction row's live appearance, and the
selector views — runbook step 2.17.

## 052 / PILLS-01 + PILLS-06 + PILLS-12 — Pill Stack: store, registry, strip (2026-11-02)

First packet of the user's real-config priority (the pill stack is the
biggest used-but-missing subsystem in their export). Android research:
`PillStackConfig.kt` — the four layout keys verbatim: `OEPillActivePills`
(string, default `DEFAULT_ACTIVE` = "5,6", the pills that need no network),
`OEPillHiddenPills` (string, default empty), `OEPillInfiniteScrolling` (bool,
default true), `OEPillLastActiveId` (int, default -1); `PillType.java` — the
exteraGram ids 1..15 (WEATHER, GRAM, BTC, USD, CACHE, PROXY, GHOST, RAM, CPU,
NET_SPEED, DC_PING, GOLD, ETH, EUR, LAST_SEEN); `PillRegistry.java` — the
default registrations and the open-registry rule the strip obeys
(`createPill` returns null for an unregistered id, so unknown ids are
skipped, never rendered); `PillStackController.java` — the strip attaches to
the search field at its inline end (6dp), hides while the field holds text,
rebuilds on layout events; `EtgBackup.java` — `activePills`/`hiddenPills`
export under the `pillstackconfig` section with the exteraGram names,
validated by `isPillsLayout` (empty ok, ints 1..100000, no duplicates, ≤100,
4096 chars), and `infiniteScrolling` exports as an exteraGram bool alias.

The store gained the four keys (its first string-valued settings — the
record's type map now kinds string defaults, the clamp passes strings
through, `OEPillLastActiveId` ranges [-1, 15]) and the two layout keys joined
the live-event list. New `src/stores/exteralessPills.ts` carries the contract:
the id table, the web registry, `parsePillIds` (Android `parseList`),
`resolvePillLayout` (an id in both strings reads active, like
`loadConfig`), `getVisiblePillIds` (the registry filter), `setPillActive`
(Android's move-between-lists), `resetPillLayout` (`DEFAULT_ACTIVE`).

The web registry registers only what this client can really back. Verdicts
for the rest (recorded in the checklist entries): PILLS-05 weather and
PILLS-11 rates wait on an external data provider the hub has none of;
PILLS-07 proxy is class 3 — the browser client has no proxy subsystem at all
(no SOCKS/MTProto transport exists in Web K); PILLS-08 ghost and PILLS-09
last-seen wait on their owning subsystems (GHOST-01, AYU-09); RAM/CPU/
NET_SPEED are OS-bound (a page has no such counters); PILLS-10 DC ping waits
on a manager-level primitive (UI code does not reach into MTProto). The
cached ids stay in the stored strings — Android's dormant-pill behavior — so
registering one later restores its place.

The strip (`src/components/sidebarLeft/pillStack.ts`) mounts into the chat
list's InputSearch container from `sidebarLeft`'s construct, one button per
registered active pill, `inset-inline-end: 6px` (RTL mirrors by itself),
hidden by an `input` listener while the field holds text, rebuilt live on the
settings store's `exteraless_settings_updated` for the two layout keys. The
cache pill (PILLS-06, id 5, Android's name is `R.string.StorageUsage`) shows
the real client cache — the Data & Storage tab's own collectors, extracted
verbatim from `storageQuota.tsx` into `dataAndStorage/cachedSizes.ts` so
there is one implementation (files + stream chunks) — refreshed on Android's
3-minute interval; the click opens Data & Storage (the web owner of the same
data, the analog of `CachePill.openCacheSettings`). The hub gained the Pill
Stack screen (`AppExteralessPillStackTab`, declared in tabs.ts, opened from
an Appearance row exactly like Android's `pillStackRow`): infinite scrolling
toggle, Active/Hidden pill sections (click moves a pill, Android's
`onItemClick`; the lists show registered pills only, the same set the strip
renders), and Reset to Default with the `PillStackResetDone` toast. The
`.extera` backup gained `pillstackconfig.activePills`/`hiddenPills` (with the
`isPillsLayout` validator as a per-entry string check) and moved
`infiniteScrolling` out of the unsupported list.

Rows/tests: `exteralessPills` (9 new: defaults, parseList semantics, the
active-wins read, the registry filter over a stored PROXY id, setPillActive,
reset, hub groups, the pills-section round-trip, the isPillsLayout negative
matrix), `exteralessSettings` (29: the defaults list gained the four keys),
`exteraBackup`/`exteralessTabs`/`settingsSearchIndex` (regenerated by the
watcher — 502 entries, the new tab and rows in it), `formatCount` (type-only
widen of the live-event payload). Typecheck passes, oxlint passes on the
touched files, the standalone sass compile carries
`#column-left .item-main .oe-pill-stack` and the `.night` pill variant, the
import-graph budget ratchet is green. Limits: the strip shows one visible
pill (switching is PILLS-03's packet); the Android storage-fill ring around
the cache icon is not ported (a page has no disk-size number); drag-reorder
in the hub lists waits for a second registered pill (PILLS-02 stays
unchecked); long-press menus on pills are not ported yet. Unverified in a
browser (no server or browser launched): the strip's position, the
hide-on-text behavior, the refresh and the hub flows — runbook step 5.19.

## 053 / PILLS-03 + PILLS-04 — the strip's switch machinery (2026-11-02)

The second pill-stack packet: Android's `PillStackView` vertical swipe, on
the PC terms the checklist itself asks for ("колёсиком/клавишами"). The
switch decision is a pure, tested function (`nextPillIndex` in
`exteralessPills.ts`): direction 1 = next (a swipe/wheel up), -1 = previous;
with `OEPillInfiniteScrolling` the index wraps (Android's
`animateToNextPill`), without it it clamps — the strip keeps the same pill,
which is Android's pull-and-resist read without porting the overscroll
animation. The strip renders every registered pill with exactly one visible
(`is-hidden-pill`), a roving tabindex (only the current pill is a tab stop),
`aria-hidden` on the others, and restores `OEPillLastActiveId` on rebuild
like `PillStackController.rebuildContents` (the id's index, else 0); a switch
persists the id back through the store. The PC inputs: one wheel notch per
switch over the strip (preventDefault, a 300 ms trackpad cooldown) and
ArrowUp/ArrowDown on the focused pill, which stopPropagation so the sidebar's
own key handlers never see them. The enter animation is level-gated in the
SCSS (a fade at reduced level, a 50% slide at full, instant at level 0) and
restarts on a repeated same-direction switch (one forced reflow per user
action — the one-off case the review rules allow). With the web registry
carrying a single pill the switch is inert by design — `nextPillIndex` on
count 1 returns the same index — and both entries stay unchecked until a
second pill registers (the verdicts of packet 052 stand); the machinery, the
wrap toggle's behavior and the restore are real and covered.

Tests: `exteralessPills` (11: the wrap/clamp matrix incl. the one-pill
no-op, the `OEPillLastActiveId` domain). Typecheck passes; the standalone
sass compile carries the `body.animation-level-1/-2` enter selectors.
Unverified in a browser (no server or browser launched): the wheel/keyboard
switching, the level-gated animation — inert until a second pill lands.

## 054 / FOLD-10..13 — the main menu layout over the burger menu (2026-11-02)

The user's second real-config priority: their export carries
`OEAppearanceMainMenuLayout` =
`14,18,8,17,106;2,6,11,105,3,10,102,101`. Android research:
`MainMenuLayout.java` — one string key `AppearanceConfig.mainMenuLayout`
holding `"visible;hidden"`, comma-separated `MainMenuItem` ids
(`MainMenuItem.java` verbatim: NEW_GROUP 2, CONTACTS 6, NEW_CHANNEL 3, CALLS
10, SAVED 11, SETTINGS 8, ARCHIVE 14, PROFILE 18, QR 17, BROWSER 101,
PLUGINS 102, BOTS 105, FEED 106, GHOST_MODE 107, RECENT_CHATS 108, WALLET
109, EXTERALESS_SETTINGS 110, KILL_APP 111, DIVIDER -1). So the user's value
means visible = Archive, Profile, Settings, QR, Feed; hidden = New Group,
Contacts, Saved, Bots, New Channel, Calls, Plugins, Browser. An empty string
is "never customized" — the consumers show exactly the stock menu. Parse
drops unknown ids and duplicates, dividers live in the visible half only,
ids listed in neither half are hidden, and `ensureSettingsVisibility`
appends Settings whenever the bottom navigation bar is off — which on the
web is always, so Settings can never be hidden.

The web's main menu is the left sidebar's burger (tools) menu
(`createToolsMenu`). Its id-mappable items are tagged with `oeMenuId`
(Saved 11, Archive 14, Contacts 6, Calls 10, Settings 8); the web-only
composites (add account, "Create a new", stories, "More") keep their stock
frame around the laid-out block. The layout applies on every menu open, in
`onOpenBefore` before the stock per-open filtering: an uncustomized key
returns the pristine list untouched (byte-for-byte stock), a customized one
lays the mapped items out in the visible order, skips ids without a web
backing (the pill-registry rule — Profile/QR/Feed/etc. render nothing,
never a stub), and a DIVIDER in the visible half becomes a hairline after
the previous item (`separatorDown`; the marks reset each application since
the item objects are reused by identity). The attach-menu bots still insert
before Settings and the account rows still splice at the top — both stock
paths run after the layout. The hub gained the Main Menu screen
(`AppExteralessMainMenuTab`, from an Appearance row): Visible/Hidden toggle
lists for the five backed ids (a toggle moves the id between the halves
exactly like Android's editor save) and Reset to Default. The `.extera`
backup gained `mainMenuLayout`/`mainMenuHiddenItems` — Android exports the
halves as exteraGram JSON arrays validated by `isIdArray`; both bridge into
the single string, a fresh client applying a hidden half keeps the stock
menu's own mappable order as its visible half (Android saves
`(getLayout(), hidden)`).

Rows/tests: `exteralessMenuLayout` (13: the verbatim parse incl. the
neither-listed rule, the divider rules, Settings kept-at-position vs
appended, the uncustomized stock read, the toggle move, reset, the
`isIdArray` matrix, both backup halves, and the button-list consumption —
the web-only frame, the unbacked skip, the divider hairline and its reset),
`exteralessSettings` (30: the defaults list gained the key),
`exteraBackup`/`exteralessTabs`/`exteralessPills` regression. Typecheck
passes, oxlint passes on the touched files. Limits: no drag-reorder editor
on the web (the order changes only through the layout string or a `.extera`
import — FOLD-10 stays unchecked with that annotation); dividers cannot be
added from the web yet (FOLD-12 likewise); PLUGINS/EXTERALESS_SETTINGS menu
rows wait on their own decision. Unverified in a browser (no server or
browser launched): the laid-out menu's visual result — runbook step 5.20.

## 055 / W-1..W-5 — the message-menu toggles (2026-11-02)

The W-entry stream begins: the Neko/Na keys the user runs that the 296-line
catalog never carried. Android research (NekoConfig.java:98-104,
NaConfig.kt:165, ChatActivity consumers): `showAddToSavedMessages` (bool,
default false) adds the "Add to Saved Messages" item — a direct forward to
the own chat, shown when the message is real, not the self chat,
forwardable (`ChatActivity:50685`); `showCopyPhoto` (persisted key
`CopyPhoto`, bool, default false) adds "Copy photo" for clipboard-copyable
media (`allowCopyPhoto` branches); `showReport` (bool, default false) adds
the per-message Report for incoming messages outside the stock contexts
(`ChatActivity:50200`); `showMessageDetails` (bool, default false) opens the
message-details popup; `showViewHistory` (bool, default false) opens the
Ayu edit-history viewer. EtgBackup exports all five under the exteraGram
aliases `showSaveMessageButton` / `showCopyPhotoButton` / `showReportButton`
/ `showDetailsButton` / `showHistoryButton` (EtgBackup.java:368-374).

The web port: the store gained all five keys verbatim. The message context
menu (`src/components/chat/contextMenu.ts`) gained two items and one
broadening — "Add to Saved Messages" (the double-tap Save's direct forward
to `rootScope.myId`, Android's conditions verbatim), "Copy" behind
`CopyPhoto` (the media viewer's own `copyMediaToClipboard` path with its
MediaCopied/MediaCopyFailed toasts, offered only where
`canCopyMediaToClipboard` says the media is copyable), and the stock
per-message "Report" item's verify extended with Android's showReport branch
(incoming, real message — any peer, not just channels; the stock
`showMessageReport` popup is the web's report surface). `showMessageDetails`
and `showViewHistory` are class 3: the web has no message-details surface
and the edit-history viewer waits on AYU-02 — the keys round-trip, an
imported true is a documented no-op, never faked (W-4/W-5 in the checklist).

The hub's Chats tab gained the three real rows. The backup moved the three
real aliases to SUPPORTED; `showDetailsButton`/`showHistoryButton` stay
recognized-but-unsupported. One self-inflicted typecheck detour worth
recording: binding the helper's DEFAULT export (the async
`copyMediaToClipboard`, `Promise<void>`) under the name
`canCopyMediaToClipboard` retyped three verify call sites at once — the
import line is `import copyMediaToClipboard, {canCopyMediaToClipboard,
CopyableMedia} from '@helpers/copyMediaToClipboard'`.

Rows/tests: `exteraBackup` (31, +1: the three aliases round-trip,
`showDetailsButton` lands in `unsupported`), `exteralessSettings` (defaults
list at 35 keys), `exteralessTabs` regression (the Chats rows). Typecheck
passes, oxlint passes on the touched files. Unverified in a browser (no
server or browser launched): the three items' visible behavior — runbook
step 5.21.

## 056 / W-6 + W-7 — bubbleRadius, and the decoration verdicts (2026-11-02)

Android research: `SharedConfig.bubbleRadius` (int, default 17, the
mainconfig section, `EtgBackup` exports it 1:1 as KIND_INT 0..17) — the
consumer is `MessageDrawable`: the far corners take dp(radius), the
tail-side corners clamp to dp(min(6, radius)). The web's bubble geometry is
corner variables per side (`.bubble.is-in`: medium tail corners at
start-start/end-start, big far corners; `.bubble.is-out` mirrored;
medium = 5px, big = 15px — already the web's own 6/17dp pair). The port: the
store key `bubbleRadius` (range [0, 17]) maps through `bubbleRadiusToCss` —
undefined at 17 (the stock geometry, byte-for-byte, so a reset never
restyles), otherwise the far corners take the value in px and the tail side
min(6, value) — written as `--oe-bubble-radius` / `--oe-bubble-tail-radius`
from the store's single hot effect; the SCSS substitutes them into the
in/out base blocks and the is-group-first/is-forced-rounded override (the
drawn tail's own 0-radius rules are untouched, like Android's tail
geometry). The Appearance tab gained the slider (0–17, "Stock" at 17). The
`.extera` alias `bubbleRadius` moved from recognized-but-unsupported to
SUPPORTED. One material limit: at 16 the far corner is 16px — one pixel over
the web's own stock 15px, a discontinuity inherent in "the default keeps the
base's geometry" (the alternative, restyling at the default, violates the
off = stock rule).

The decorations verdict (W-7, the user runs snow on both): NekoConfig
`ActionBarDecoration` (0..3 — 0 depends-on-date, 1 snowflakes, 2 fireworks,
3 none) and NaConfig `chatDecoration` (0..2) drive Android's
`SnowflakesEffect`/`FireworksEffect` canvas overlays (ActionBar +
SizeNotifierFrameLayout.drawOverlays, `Theme.canStartHolidayAnimation` for
the date-dependent mode; exteraless's `migrateDecorations` collapses both to
snow/none). The web client has no canvas-effect subsystem (no snow or
fireworks anywhere in Web K), and porting the two effect implementations
verbatim is its own packet — the verdict is recorded with the sources, the
keys are not stored (EtgBackup exports neither, so there is no round-trip
contract to keep), and nothing is approximated or faked.

Tests: `exteralessPills` (+1: the bubbleRadius mapping — the stock at 17,
the tail clamp, 0), `exteralessSettings` (defaults at 36 keys),
`exteraBackup` (the trusted-file test now asserts bubbleRadius applies from
the mainconfig section and `mediaColumnsCount` stays the unsupported
example). Typecheck passes, oxlint passes on the touched files, the
standalone sass compile of `_chatBubble.scss` carries the two variables with
their stock fallbacks. Unverified in a browser (no server or browser
launched): the rounded bubbles live — runbook step 5.22.

## 057 / Verification pass — the rest of the user's real config (2026-11-02)

A no-code packet that walks the remaining keys of the user's export against
the port and records the verdicts (the user-directed section of the
checklist carries them; the private file itself is never committed).

**Covered by completed catalog entries, verified against the Android
defaults.** `HidePhone` — NekoConfig hidePhone (persisted `HidePhone`),
default **true** — the store's true matches; the hub row lives in General
(GEN-06, packet 009) and the `.extera` alias `hidePhoneNumber` round-trips.
`ZalgoFilter` — NaConfig, default false; store false (GEN-04). `UseEditedIcon`
— NekoConfig, default true; store true (CHAT-24). `HideTimeForSticker` —
NekoConfig, default false (CHAT-03's sticker-time trio). `stickerSize` —
NekoConfig float default 14.0 (CHAT-01). `HideIvSummary` /
`HideMessageSummary` — not W-entries at all: the catalog carries them as the
pending HIDE-19/HIDE-18 (the AI IV / message summary rows); the user's
export does not set them.

**LOOK-05 and CenterActionBarTitleType.** NaConfig's type is 0 Off, 1 On,
2 SettingsOnly, 3 ChatsOnly (`NekoGeneralSettingsActivity`); the user runs 1
— exactly the ported boolean's On. The 2/3 scoping variants are a documented
limitation of LOOK-05 (the centered-title live class has no scope
qualifier); an imported 2/3 has no store key and no effect.

**Pending catalog entries the user's keys map to (not W-entries).**
`EnableSaveDeletedMessages` / `SaveDeletedInPrivateChats` /
`MessageSavingSaveMedia` → AYU-01/AYU-05 (+ the AyuGadget saving subsystem);
`EnableSaveEditsHistory` → AYU-02; `RegexFilters` (user off) → AYU-15;
`DisableAvatarBlur` → LOOK-17; `SwipeToPip` → MEDIA-12; `PreferOriginalQuality`
→ MEDIA-08; `ImmersiveDrawer` / `OEAppearanceNavigationDrawer` → FOLD-09/FOLD-08;
`TabTitleType` (user 1) → LOOK-26; `BackAnimationStyle` (user 2) → FOLD-02;
`TabletMode` (user 2) → FOLD-01; `TranslatorModeWithOriginalMigrated` (true)
→ TRANS-05. All remain unchecked with their Android keys intact in the
catalog links.

**Class-3 verdicts with reasons.** `OEChatsCameraType`,
`CameraInVideoMessages`, `OEChatsCameraStabilization`,
`OEChatsExtendedFps` — hardware-bound: the web attach path has no camera
(the HIDE-13 audit established the attach menu has no camera tile at all);
ExtendedFps widens the Android camera's FPS range, there is no camera to
widen. `uploadBoost` (user true) / `OEGeneralDownloadSpeedBoost` (user 2) —
GEN-08/GEN-09's own caveat stands: a real loader strategy must be measured
and ported first, a switch that promises speed is not shipped. Icon packs
(`OEIconPacksEnabled` true, `IconReplacements` 1) — the ICONS-01..06
subsystem (Android resource-id → web icon mapping); per AGENTS the
hardware/app-icon family is removed from the hub entirely. `autoNight` (the
mainconfig autoNight* family) — the work order fixes class 3: no web
primitive. `OEGeneralLastFmExplained` — not a setting: the "explained"
flag of Android's Last.fm onboarding dialog (GEN-17 stays pending); nothing
to port. Observed in the export but outside the ordered priority list, noted
for a future order: `DisableStories` (true), `showDeleteDownloadedFile`,
`ShowRPCError`, `SwitchStyle`/`SliderStyle` non-defaults (already ported via
the MD3 group), and the themeconfig/mainconfig sections that belong to
Telegram's own theme machinery.

**localPremium — parked, unchanged.** The user runs it on; the port does not
ship client-side premium faking: OTHER-04 stays pending and the decision is
the user's (a policy call about which local premium affordances are honest
to surface), not a port. Recorded here and in the checklist so the parked
state is visible.

Session postscript (2026-11-02, packet 057 wrap-up). Two notes:

1. The import-graph budget ratchet went red mid-session (dirtyPage 1): the
   palette module's boot class observer had become a top-level statement,
   which the graph's statefulness model counts as a second-instance risk.
   The observer moved into a `watchBootThemeClass` helper (its body lives
   inside a function, the same shape the detector exempts), the stray `;;`
   after `import.meta.hot.accept()` went with it; behavior is unchanged
   (the helper keeps the document guard and the self-disconnect).
2. While this session was wrapping up, another session began moving the
   test tree from `src/tests/` to a root `tests/` (a large staged rename,
   not this session's work). My new suites moved with it
   (`tests/exteralessPills.test.ts`, `tests/exteralessMenuLayout.test.ts`);
   at the moment of writing they do not load because the vitest setup file
   still resolves to `src/tests/setup.ts` — the mover's remaining step.
   Last green state before the move: every touched suite passed
   (`exteralessSettings` 30, `exteralessPills` 12, `exteralessMenuLayout`
   13, `exteraBackup` 32, `exteralessTabs` 17, `settingsSearchIndex` 8,
   `exteralessThemePalette`, `dialogSortByUnread` regression), typecheck
   and oxlint clean on every touched file, and the ratchet's dirtyPage
   returned to 0 by the same construction packet 050 used.

## Packet 058 — the test tree consolidated under `tests/` (2026-11-02)

The unit suite moved from `src/tests/` to a root `tests/` (641 files, `git mv`,
rename history preserved) and the Playwright browser suites moved from the root
`e2e/` to `tests/browser/` (109 files), so the `e2e` name now belongs only to
the end-to-end encryption module at `src/lib/calls/e2e/`. That module's own
`tests/` stay inside it, untouched. Follow-up path fixes the move required:

- static imports: 13 one-level `../` imports into `src/` became `../src/…`
  (one, `../networkerHarness`, correctly stayed), 2 `../../scripts/*.mjs` became
  `../scripts/*.mjs`, and the browser-fixture stubs in `tests/mocks/` point at
  `../browser/fixtures/…`;
- a new `@tests/*` alias (tsconfig paths + `ADDITIONAL_ALIASES` in vite.config)
  replaced the 111 `@/tests/…` sibling imports;
- non-import path uses the first sweep missed: `require()` and `__dirname`
  strings in `settingsSearchIndex` (the generator lives in `src/scripts/`),
  `markupTooltipLayout`, `webManifest`, `checkBundleMangling`,
  `tiptapDependencies`, `richMessageModelBoundary`, `managersBeforeAwaitRule`,
  `richMessageInput`, `audioPlayGlyph`, and in `tests/browser/` the `ROOT` of
  all three vite e2e configs, `ports.ts` (the per-checkout port lock) and the
  lottie/scss fixture reads — all repointed;
- URL paths: the editor fixture is served at
  `/tests/browser/fixtures/chatInputEditor.html`, specs request fixtures by the
  new URL, and the `namedModules()` scan in `vite.e2e.config.ts` (bundle mode)
  reads `tests/browser` and matches `tests/browser/fixtures` URLs;
- configs: 17 `package.json` scripts, the vitest `setupFiles` and the
  `e2e/**` → `tests/browser/**` exclude (still anchored, still documented why),
  two `.oxlintrc.json` overrides, and the `import-graph.mjs` skip rule.

Verified: `tsc --noEmit` clean, oxlint clean, playwright `--list` discovers
1130 tests across all five configs, vitest runs green on 32 files (124
handoff-suite tests plus the files whose imports changed), and `tests/browser`
is excluded from vitest (`vitest list tests/browser` finds nothing). Two real
browser runs passed after the move: `popupSandboxPlainFields.spec.ts` (5 tests,
bundle mode — it built the sandbox bundle through the rewritten
`namedModules()` and reached into the app through `e2eImport`) and
`lottieRender.spec.ts` (47 tests against the e2e dev server), the latter
against a manually started server because the automation shell has no `pnpm`
on PATH for the config's `pnpm exec vite` webServer command.

Two follow-up fixes the runs surfaced: Playwright 1.61 spawns `webServer`
with the config file's directory as its cwd, so the relative `vite` commands
were written against the wrong base — all three webServer definitions now set
`cwd` to the checkout root explicitly (the old root-`e2e/` layout carried the
same latent bug); and one stale alias had survived the first sweep in
`src/components/popupSandbox/stories/misc.ts` (`@/tests/fixtures/…` →
`@tests/fixtures/…`), which failed the sandbox bundle with an ENOENT until
repointed.

Two failures met on the way are pre-existing, not the move's: the import-graph
budget ratchet is red on HEAD (`dirtyPage grew: 1 ≤ 0` in a pristine worktree)
and its esbuild service crashes with truncated-packet JSON errors under this
Node (v26.12.1) — reproduced in the untouched worktree too.

## 058 / Bug-hunt pass — the porting run's user-facing surfaces (2026-11-02)

A dedicated bug-hunt over packets 052–057's surfaces (pill stack, main menu
layout, theme palette chain, bubbleRadius, the W-entries), judged against the
owning Web K code and the pinned Android source before testing, with a
failing test per fix. Four proven defects fixed, each with a test; the rest
of the surfaces audited clean. No commits (housekeeping owns them); typecheck
(`scss-types` + `tsc --noEmit`) and oxlint on the touched files pass.

**Theme palette — restore-on-clear across theme re-applies (proven, fixed).**
`applyThemePalette` restored its captured foreign inline values blindly, so
any theme apply between two palette passes poisoned the capture: with the
toggle on, a theme switch (or an accent re-apply, or a "Set a color" pick —
all run the applier before `theme_changed`) was clobbered by the previously
captured values, the map re-captured the stale pair, and toggling the palette
off later restored the *previous* theme's surfaces onto the current one. The
light-theme path was worst: switching night→tinted-day with the palette on
wrote the captured night surfaces inline onto the day theme, where nothing
re-applies until the next theme change. Fix: the apply records what it wrote
(`appliedInline`) and the restore only undoes keys whose current inline value
still is the palette's — a value the applier rewrote since is already the
correct restore target, so the capture re-reads it fresh. Byte-exact restore
asserted over tinted-theme inline values (`--key` and `--key-rgb` pairs,
`#hex` strings); the palette module's own surface stays untouched otherwise.
Tests: `exteralessThemePalette` (+3: the byte-exact foreign-stands case, the
theme-switch-while-on case, the light-theme case; the old 'clearing removes
only the palette writes' test asserted the wipe defect its own name
contradicted and was corrected to match its stated intent).

**Theme palette — the boot night-class observer (proven, fixed).**
`watchBootThemeClass` disconnected after the FIRST class mutation of
`<html>`, and `setRootClasses()` adds the platform classes (`no-touch`,
`native-emoji`, …) on DOMContentLoaded — long before the first theme apply,
which waits on IndexedDB settings. The one-shot observer was therefore always
consumed by the wrong mutation, and since the first theme apply is silent (no
`theme_changed`), a dark-theme boot never applied the palette to the login
screen (no `user_auth` there either). Fix: the watcher follows the `night`
class itself (compares against the last seen value, fires only on a real
flip) and disconnects after the first flip — every apply after the first
rides `theme_changed`. Exported for testing.
Test: `exteralessThemePalette` (+1: an unrelated class mutation does not
consume it, the night flip fires once, a later flip does not).

**Pill stack strip — the cache pill's failed collection rejected unhandled
(proven, fixed).** `cachePillRenderer.refresh` had try/finally without
catch, and `void refresh()` dropped the rejection: in an environment without
CacheStorage (Firefox private mode, denied storage) `caches.open` rejects and
the pill produced an unhandled promise rejection on mount and at every
3-minute refresh — proven in the test by mocking the collectors to reject
(vitest reports the unhandled rejection without the fix). Android's
`CachePill` just keeps waiting on its callback; the web pill now keeps its
name with an empty value, nothing rejects. New suite
`exteralessPillStrip` (7 tests): the registered-pills-only mount with the
roving tabindex/aria states, the hide-while-text rule including the clear
button's simulated `input` event, the live rebuild on both layout keys, the
one-pill inert switch (wheel + ArrowDown persist nothing), the teardown, and
the contained failure.

**Main menu layout — the hub was inert on a fresh client and the first
toggle collapsed the menu (proven, fixed).** The hub screen read
`resolveMainMenuLayout`, whose uncustomized contract is empty halves — so on
a stock key the Visible/Hidden sections both rendered empty and nothing could
be toggled; Android's editor instead shows the current layout
(`parse()`'s `getDefaultLayout` branch). Worse, `setMenuItemVisible` started
from those empty halves and persisted directly, so the first toggle from
stock wrote `";11"` — a layout whose visible half is empty — collapsing the
burger menu to Settings alone. Fix: a new `getEditorMainMenuLayout` (the
editor read: an uncustomized key yields the stock halves —
`WEB_MENU_STOCK_ORDER` + Settings — exactly what the menu really runs) feeds
both the hub tab and `setMenuItemVisible`, which now saves through
`saveMainMenuLayout` (Android's save: Settings forced visible, whole layout
written). The menu consumer's "empty = byte-for-byte stock" contract is
untouched. Tests: `exteralessMenuLayout` (+2: the editor read on stock, and
the first toggle saving `14,6,10,8;11` with the menu keeping the rest —
verified failing against the old code before the fix).

**W-3 showReport — the broadening never ran (proven, fixed).** The Report
item's verify appended `|| exteralessSettings.showReport` after
`this.managers.appPeersManager.isChannel(...)`, but every proxied manager
call returns a Promise — truthy — so `Promise || boolean` short-circuited and
the setting never participated: the item behaved exactly as stock. The
rewired verify awaits the peer-type answers and decides through a new pure
`verifyReportContext(isChannel, isAnyChat, isBot, showReport)` — Android's
contexts verbatim (`currentChat != null || currentUser.bot`): the stock
`isChannel` gate (channels + supergroups), broadened by the setting to any
chat peer (basic groups included) or a bot, never a private chat with a
human. The extra peer-type lookups run only when the setting is on and the
stock gate missed. Test: `exteralessSettings` (+1, the context truth table).
W-1 (Add to Saved) and W-2 (CopyPhoto) verifies are all-sync and match
Android's conditions (`!isUserSelf && !noforwards && canForwardMessage`;
the clipboard-copyable gate) — clean.

**Audited clean, no change.** bubbleRadius: the store range [0,17], the
17→undefined stock rule and the min(6, r) tail clamp (tested in
`exteralessPills`), and the SCSS substitution — the four logical corner
properties in both is-in/is-out blocks with the stock SCSS fallbacks
($medium 5px / $big 15px byte-identical to the unset state), the
is-group-first/is-forced-rounded override on the far variable, the drawn
tail's own rules untouched (Android `MessageDrawable.generatePath` near/far
correspondence checked at ActionBar/MessageDrawable.java:575-587). The tint
priority chain stays covered by `exteralessBackgroundPick` (explicit pick >
accent pick > derived > accent), re-run green against the palette change.
The strip's SCSS: `inset-inline-end` + vertical-only animations (RTL
mirrors by itself), `display: none` unless `.has-pills:not(.is-hidden)` so an
empty strip never intercepts the field, and the clear button never overlaps
(it shows only while the strip hides). Menu parse semantics match
`MainMenuLayout.java` line for line (unknown ids dropped, neither-listed →
hidden, dividers visible-only, Settings forced, save/reset serialize).

**Moved-test-file disclosure (coordinator-approved).** This pass's test
deltas ride on top of the parallel session's staged `src/tests → tests/`
move; no rename/add entry was touched and no path changed:
`exteralessMenuLayout.test.ts` and `exteralessSettings.test.ts` are staged
adds (`AM`) whose worktree content gained this pass's tests (2 and 1 new
blocks plus one import line); `exteralessThemePalette.test.ts` is untracked
entirely (`??` — never part of the staged index), so its content delta — 3
new tests plus the corrected 'clearing' assertion (the old one encoded the
wipe-on-clear defect) — is plain worktree content;
`tests/exteralessPillStrip.test.ts` is a new untracked file.

**Findings for the user's acceptance (visual, no fix guessed).**
1. A reordered item keeps its stock group hairline: `separator: true` rides
   the item object, so moving Saved Messages mid-list draws its line above it
   (Android lays one continuous list; the web menu's stock framing is kept
   around it). Also, hiding the item that carried the frame line removes that
   line. Judgment call for a browser check.
2. A DIVIDER as the first visible entry attaches its hairline to the last
   web-only composite above the laid-out block (there is no previous laid-out
   item) — plausible, worth an eye.
3. The hub's Settings row renders toggleable but bounces back (the web never
   hides Settings); Android's editor in the same situation offers no hide at
   all. Consider disabling the row's checkbox.
4. With one registered pill the wheel over the strip is preventDefault-ed
   (scroll blocked over a 28 px area) though the switch is inert — Android's
   strip is a switch surface; acceptable, but noticeable if the strip grows.
5. The strip overlaps a long search placeholder visually (both live at the
   field's inline end when the field is empty) — desktop check with a long
   locale string.

Checks run: `exteralessThemePalette` 17, `exteralessPillStrip` 7 (new),
`exteralessMenuLayout` 15, `exteralessSettings` 29, `exteralessPills` 12,
`exteralessBackgroundPick` 5 (palette regression) — all green; typecheck and
oxlint clean. Runbook: steps 1.23, 5.19, 5.20, 5.21 gained the new checks
(5.21's Report scope description was corrected — it claimed "any incoming
message", the Android contexts are narrower).

## The test suite move to tests/ (2026-11-02)

The user's parallel session moved the test suite `src/tests/` → `tests/`
(~691 staged renames, including the moved-and-edited packet tests) and
repointed `vite.config.ts`'s `setupFiles` at `./tests/setup.ts`. The move is
functional — the packet suites load and pass from the new root (the pill
stack's 12, the import-graph budget). This section documents the move for
the housekeeping gate; the staged renames commit as their own chore commit.

Two environment notes from the same pass: `importGraphBudget` was red at
HEAD on a clean worktree because packet 058's budget fix was still unstaged
— committing the packet heals it; and an esbuild flake reproduces on Node 26
independent of the working tree — environmental, not a source regression.
