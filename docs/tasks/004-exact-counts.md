# 004 — точные числа вместо K/M в счётчиках

Рабочая папка: `/home/aiden/extra/git/exterayond`.
Задание выполняется ПО ОДНОМУ в этом checkout: `src/lang.ts`, `src/stores/exteralessSettings.ts`,
`src/lib/exteraBackup/etgBackup.ts` общие — не запускай соседние задания параллельно.
Прочитай AGENTS.md и docs/upstream/AGENTS.md; UI-часть — через skill `creative-frontend`.
Из приложения ничего не коммить. Не трогай .env, сессии/авторизацию, плагины, tmp/seed*, приватные
скриншоты/экспорты. Не утверждай готовность по наличию строки или ключа.

**Точная цель.** Настройка: точные числа («1 234») вместо округлений «1,2K/1,2M» во всех счётчиках.
Выкл = текущие строки без изменений; вкл = точные, локализованные, обновляющиеся у уже показанных значений.

**Сначала аудит — обязательный, до общего изменения:** пройти ВСЕ вызовы `formatNumber`
(src/helpers/number/formatNumber.ts:1-15; `rg -n formatNumber src/`, ~20 штук) и решить по каждому
«счётчик или нет». Известные: src/lib/appDialogsManager.ts:2590, src/components/archiveDialog.tsx:111,
src/components/sidebarLeft/index.ts:262, src/components/chat/topbar.ts:992,
src/components/chat/messageRender.ts:290, src/components/chat/bubbles.ts:2579,
src/components/chat/reaction.ts:1041, src/components/chat/bubbleParts/pollMessageContent/PollOption.tsx:169,
src/components/chat/replies.ts:145, src/components/chat/similarChannels.tsx:111,
src/components/communities/communityDialog.tsx:91, src/components/stories/viewer.tsx:2572,
src/components/sidebarRight/tabs/statistics.tsx:198, src/components/popups/starsRating.tsx:79.

**Границы:** числа ≠ байты/размеры файлов, ≠ длительности, ≠ графики (src/lib/tchart/utils.ts:223-225 —
вне объёма). Локализация обязательна: разделители как в существующем
src/helpers/number/numberThousandSplitter.ts, не «сырой» английский. Обновление существующих значений —
через штатный механизм списка/строки, без mass-rerender на каждое сообщение.

**Ключи (проверено, не выдумывать):** persisted Android key = `DisableNumberRounding`, default `false` —
.research/android/TMessagesProj/src/main/java/tw/nekomimi/nekogram/NekoConfig.java:145; строка —
.research/android/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraGeneralActivity.java:180.
`.extera` alias = `disableNumberRounding` (src/lib/exteraBackup/etgBackup.ts:44, KNOWN_UNSUPPORTED →
перенести в SUPPORTED, обновить reset/validation тесты src/tests/exteraBackup.test.ts).
В текущей namespaced-записи используй ключ `DisableNumberRounding` с Android default; не придумывай OE*-алиас.

**Критерии готовности:** off = прежние строки байт-в-байт (src/tests/formatNumber.test.ts остаётся
без правок и зелёным); on = точные локализованные числа, у уже отрисованных счётчиков обновляются на
месте; скриншоты desktop и mobile, LTR и RTL, оба состояния config (off/on).

**Проверка:** `corepack pnpm test --run src/tests/formatNumber.test.ts src/tests/exteralessSettings.test.ts
src/tests/exteraBackup.test.ts`, `corepack pnpm typecheck`, затем изолированный браузерный fixture без авторизации со
скриншотами до/после. Сброс уже реализован (`resetExteralessSettings`, src/stores/exteralessSettings.ts:156)
— новый ключ обязан им покрываться. Добавь проверку нового поведения; прогони settingsSearchIndex.test.ts. src/lib/settingsSearch/generated.ts не править руками (Vite-плагин
scripts/settings-search-plugin.mjs). Без коммитов.
В ответе максимум 5 строк: файлы, что сделано, что не проверено.
