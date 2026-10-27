# 005 — скрытие плавающей кнопки нового чата

Рабочая папка: `/home/aiden/extra/git/exterayond`.
Задание выполняется ПО ОДНОМУ в этом checkout: `src/lang.ts`, `src/stores/exteralessSettings.ts`,
`src/lib/exteraBackup/etgBackup.ts` общие — не запускай соседние задания параллельно.
Прочитай AGENTS.md и docs/upstream/AGENTS.md; UI-часть — через skill `creative-frontend`.
Из приложения ничего не коммить. Не трогай .env, сессии/авторизацию, плагины, tmp/seed*, приватные
скриншоты/экспорты. Не утверждай готовность по наличию строки или ключа.

**Точная цель.** Настройка скрывает ТОЛЬКО плавающую кнопку создания чата. Кнопка `#new-menu` и отдельная update-кнопка
имеют связанную логику видимости; другой реальный путь создания чата остаётся доступным.

**Текущие факты (src):**
- src/components/sidebarLeft/index.ts:225-226 — `newBtnMenu` создаётся и добавляется в DOM;
  `createNewChatsMenuButton` :1131-1157 (id `new-menu`, классы `btn-new-menu btn-corner`).
- Состояния, которые нельзя сломать: :403 (видимость update-кнопки зависит от `is-hidden` кнопки),
  :1644 (вернуть после закрытия поиска), :1659 (спрятать при фокусе поиска).
- CSS: src/scss/partials/_foldersSidebar.scss:216-234, src/scss/partials/_leftSidebar.scss:195-197.
- Слот строки: массив TOGGLES — src/components/sidebarLeft/tabs/exteralessChatsTab.tsx:15-27.
- Другой путь создания: пункт `CreateANew` src/components/sidebarLeft/index.ts:741-750
  (`verify: () => this.isCollapsed()`) → `createNewChatsSubmenu` :1160, опции :1083-1129
  (NewChannel / NewGroup / NewPrivateChat).
- src/lib/settingsSearch/generated.ts НЕ править руками (Vite-плагин scripts/settings-search-plugin.mjs,
  vite.config.ts:17, :229); язык — src/lang.ts, блок Exteraless.

**Ключи (проверено, не выдумывать):** persisted Android key = `DisableDialogsFloatingButton`, default
`false` — .research/android/TMessagesProj/src/main/kotlin/xyz/nextalone/nagram/NaConfig.kt:352-357;
строка и чтение состояния — .research/android/TMessagesProj/src/main/java/app/exteraless/settings/
OpenExteraChatsActivity.java:728, 2207, 2915. `.extera` alias = `hideFloatingButton`
(src/lib/exteraBackup/etgBackup.ts:47, KNOWN_UNSUPPORTED → перенести в SUPPORTED, обновить
reset/validation тесты src/tests/exteraBackup.test.ts). В текущей namespaced-записи используй `DisableDialogsFloatingButton` с Android default, без OE*-алиаса.

**Границы:** `#new-menu` — сама кнопка создания, а `updateBtn` — отдельная кнопка.
Не связывай видимость обновления с новым запретом создания; не трогать search/фолдеры/прочие `btn-corner`; не добавлять фиктивный пункт создания — если другого пути нет, расширь verify существующего CreateANew для нового режима.
Не делай отдельное меню и не оставляй пользователя без создания чата.

**Критерии готовности:** off = стоковая кнопка везде; on = кнопка создания скрыта на desktop и mobile,
update-кнопка и открытие/закрытие поиска ведут себя как раньше, «CreateANew»-путь работает; скриншоты
desktop и mobile, LTR и RTL, оба состояния config (off/on).

**Проверка:** `corepack pnpm test --run src/tests/exteralessSettings.test.ts src/tests/exteraBackup.test.ts`,
`corepack pnpm typecheck`, затем изолированный браузерный fixture без авторизации со скриншотами до/после. Сброс уже
реализован (`resetExteralessSettings`, src/stores/exteralessSettings.ts:156) — новый ключ обязан им покрываться. Добавь проверку нового поведения; прогони settingsSearchIndex.test.ts. Без коммитов.
В ответе максимум 5 строк: файлы, что сделано, что не проверено.
