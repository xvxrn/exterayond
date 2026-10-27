# Сверка пяти небольших фич — только исследование

Приложение не менялось. Каталог ID: `docs/exteraless-feature-inventory.md` — сброс = **OTHER-03** :509 (в задании назван OTHER-04; OTHER-04 = localPremium :510). Наличие ключа/строки/переключателя ≠ работа: готовность только по скриншотам off/on.

## 1. LOOK-03 мини-аватары — S
- Есть: store `OEAppearanceSenderMiniAvatars: true` — src/stores/exteralessSettings.ts:43 (Android `.research/android/TMessagesProj/src/main/kotlin/app/exteraless/appearance/AppearanceConfig.kt:65-66`, default `true`), `.extera` alias `senderMiniAvatars` — src/lib/exteraBackup/etgBackup.ts:77, CSS — src/scss/partials/_chatlist.scss.
- Пробел в поведении: consumer src/components/wrappers/dialogSubtitle.ts:120-140 читает настройку однократно в promise-цепи — уже отрисованные строки не перечитывают её. Нужны toggle + живое обновление строк с cleanup, без аватаров при off, без двойных узлов/корней, с сохранением middleware.
- Пробел в UI: строки нет (src/components/sidebarLeft/tabs/exteralessAppearanceTab.tsx :47-137), ключа в src/lang.ts нет; src/lib/settingsSearch/generated.ts не править руками — только Vite-плагин scripts/settings-search-plugin.mjs (vite.config.ts:17, :229).
- Промпт: docs/tasks/002-sender-mini-avatars.md. Оценка S (но живое обновление, а не только checkbox).

## 2. OTHER-03 сброс настроек клиента — реализован и проверен на fixture
- Сделано: `resetExteralessSettings` src/stores/exteralessSettings.ts:156, строка с confirm — src/components/sidebarLeft/tabs/exteralessOtherTab.tsx:22-30, :85, тесты — src/tests/exteralessSettings.test.ts:99-122. Хранилище OE-записи — один ключ localStorage `exterayond-exteraless-settings` (exteralessSettings.ts:104); сессия/плагины в другом месте (точное хранилище плагинов — UNVERIFIED).
- Android-семантика для QA: `.research/android/TMessagesProj/src/main/java/app/exteraless/general/GeneralHelper.java:130-152` сбрасывает только OE-конфиги + перечисленные Neko/Na ключи; `resetAllSettings()` (:154) чистит SharedPreferences целиком. Полное восстановление Android НЕ реализовано — не заявлять.
- Проверено: подтверждение/отмена, исходные значения после перезагрузки store, сохранность посторонних записей; браузер 1440×900 и 390×844, LTR/RTL. Реальный аккаунт проверяет пользователь. Новые ключи 003–005 обязаны покрываться reset-тестами.

## 3. GEN-02 точные числа вместо K/M — M
- Хранилища/строки нет; узел — src/helpers/number/formatNumber.ts:1-15. Аудит всех ~20 вызовов до общего изменения: src/lib/appDialogsManager.ts:2590, src/components/archiveDialog.tsx:111, src/components/sidebarLeft/index.ts:262, src/components/chat/messageRender.ts:290, src/components/chat/reaction.ts:1041, src/components/chat/bubbleParts/pollMessageContent/PollOption.tsx:169 и др. (`rg -n formatNumber src/`); часть счётчиков уже точная — numberThousandSplitter (src/lib/appImManager.ts:3983).
- Не в объёме: байты/размеры, длительности, графики src/lib/tchart/utils.ts:223-225.
- Ключи: Android persisted `DisableNumberRounding` default `false` — .research/android/TMessagesProj/src/main/java/tw/nekomimi/nekogram/NekoConfig.java:145; `.extera` alias `disableNumberRounding` — src/lib/exteraBackup/etgBackup.ts:44 (KNOWN_UNSUPPORTED → SUPPORTED, править с reset/validation тестами src/tests/exteraBackup.test.ts). Сохранять настоящий Android-ключ в текущей namespaced-записи, без OE*-алиаса.
- Промпт: docs/tasks/004-exact-counts.md. UNVERIFIED: тchart — вне списков вызовов.

## 4. GEN-03 секунды во времени сообщений — S
- Хранилища/строки нет; узел — `formatTimeOptions` (hour+minute) src/helpers/date.ts:133, читают :152/:170/:180/:200; цепочка сообщения src/components/chat/utils.ts:40 → src/components/chat/messageRender.ts:268 → src/components/chat/bubbles.ts:9584.
- Кэш Intl: src/lib/langPack.ts:191-193 `cachedDateTimeFormats.clear()` + повторный `update()` смонтированных `.i18n` (:197-209); ветка ровно hour+minute в `IntlDateElement.update` src/lib/langPack.ts:820-827. Toggle в открытом чате обязан учитывать кэш и уже отрисованные времена; длительности/date-случаи не менять indiscriminately.
- Ключи: Android persisted `showSeconds` default `false` — .research/android/TMessagesProj/src/main/java/tw/nekomimi/nekogram/NekoConfig.java:83; строка и `recreateFormatters()` — .research/android/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java:181, :412-414; `.extera` alias `formatTimeWithSeconds` — src/lib/exteraBackup/etgBackup.ts:44 → SUPPORTED. Сохранять настоящий Android-ключ в текущей namespaced-записи, без OE*-алиаса.
- Промпт: docs/tasks/003-message-seconds.md.

## 5. HIDE-03 плавающая кнопка нового чата — M
- Кнопка: `#new-menu` создаётся src/components/sidebarLeft/index.ts:225-226 (`createNewChatsMenuButton` :1131-1157); состояния :403 (update-кнопка), :1644/:1659 (поиск); CSS src/scss/partials/_foldersSidebar.scss:216-234, src/scss/partials/_leftSidebar.scss:195-197. Переключателя нет; `hideFloatingButton` — KNOWN_UNSUPPORTED src/lib/exteraBackup/etgBackup.ts:47.
- Ключи: Android persisted `DisableDialogsFloatingButton` default `false` — .research/android/TMessagesProj/src/main/kotlin/xyz/nextalone/nagram/NaConfig.kt:352-357; строка — .research/android/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraChatsActivity.java:728, :2207, :2915; `.extera` alias `hideFloatingButton` → SUPPORTED. Сохранять настоящий Android-ключ в текущей namespaced-записи, без OE*-алиаса.
- Граница: скрыть только кнопку, `#new-menu` — сама кнопка, updateBtn отдельная; сохранить служебную логику видимости; другой реальный путь создания — пункт `CreateANew` src/components/sidebarLeft/index.ts:741-750 → :1160 — должен остаться рабочим.
- Промпт: docs/tasks/005-hide-new-chat-button.md.

## Общий чек-лист
Новый ключ: OE_DEFAULTS (src/stores/exteralessSettings.ts:36-68) → строка в tab-файле → ключ в src/lang.ts → индекс поиска только через Vite-плагин scripts/settings-search-plugin.mjs → `.extera`-маппинг в src/lib/exteraBackup/etgBackup.ts → точный fixture src/tests/exteralessSettings.test.ts:39-75 + reset/validation в src/tests/exteraBackup.test.ts → targeted tests, typecheck, браузер desktop+mobile, RTL, off/on. Задания 002–005 выполнять ПО ОДНОМУ в одном checkout.
