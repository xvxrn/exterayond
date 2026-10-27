# 002 — мини-аватары отправителя: переключатель + живое обновление

Рабочая папка: `/home/aiden/extra/git/exterayond`.
Задание выполняется ПО ОДНОМУ в этом checkout: `src/lang.ts`, `src/stores/exteralessSettings.ts`,
`src/lib/exteraBackup/etgBackup.ts` общие — не запускай соседние задания параллельно.
Прочитай AGENTS.md и docs/upstream/AGENTS.md; UI-часть — через skill `creative-frontend`.
Из приложения ничего не коммить. Не трогай .env, сессии/авторизацию, плагины, tmp/seed*, приватные
скриншоты/экспорты. Не утверждай готовность по наличию строки или ключа.

**Точная цель.** Переключатель «мини-аватар отправителя» в Appearance-вкладке и живое поведение
в уже отрисованных строках диалогов. Один checkbox недостаточен.

**Текущие факты (src):**
- src/stores/exteralessSettings.ts:43 — `OEAppearanceSenderMiniAvatars: true` уже есть (default = Android).
- src/components/wrappers/dialogSubtitle.ts:120-140 — читает настройку однократно внутри promise-цепи,
  уже отрисованные строки её не перечитывают; паттерн middleware: `middleware as unknown as Middleware` (:126).
- src/scss/partials/_chatlist.scss — блок «exteraless ns» уже лежит, не переписывать.
- src/lib/exteraBackup/etgBackup.ts:77 — `.extera` alias `senderMiniAvatars` уже в SUPPORTED.
- Слот строки: src/components/sidebarLeft/tabs/exteralessAppearanceTab.tsx (образец Row :47-57).
- src/lib/settingsSearch/generated.ts НЕ править руками: индекс пересобирает Vite-плагин
  scripts/settings-search-plugin.mjs (vite.config.ts:17, :229). Язык — src/lang.ts, блок Exteraless.

**Android (read-only, полные пути):**
- .research/android/TMessagesProj/src/main/kotlin/app/exteraless/appearance/AppearanceConfig.kt:65-66 —
  persisted key `OEAppearanceSenderMiniAvatars`, default `true`.
- .research/android/TMessagesProj/src/main/java/app/exteraless/settings/OpenExteraAppearanceActivity.java:184,
  786-787, 931-932 — строка и её состояние.

**Обязательные поправки к поведению:**
- живое обновление уже отображённых строк при переключении, с корректным cleanup;
- при off — без скачивания/создания аватаров вообще;
- без двойных корней и дублирующихся узлов при повторных обновлениях одной строки;
- middleware строк сохранять, не подменять на «живой» после dispose.

**Границы:** только этот переключатель и его consumer; не менять прочие аватары, store-ключи и backup;
не выдумывать новые OE*-алиасы.

**Критерии готовности:** off = стоковые строки (узлов мини-аватаров не остаётся после toggle),
on = аватар у каждой видимой строки отправителя; многократные toggle + прокрутка без дублей и утечек;
скриншоты desktop и mobile, LTR и RTL, оба состояния config (off/on).

**Проверка:** `corepack pnpm test --run src/tests/exteralessSettings.test.ts src/tests/exteralessTabs.test.tsx src/tests/settingsSearchIndex.test.ts`, `corepack pnpm typecheck`,
затем изолированный браузерный fixture без авторизации со скриншотами до/после в обоих состояниях. Без коммитов.
В ответе максимум 5 строк: файлы, что сделано, что не проверено.
