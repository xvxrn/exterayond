# 003 — секунды во времени сообщений

Рабочая папка: `/home/aiden/extra/git/exterayond`.
Задание выполняется ПО ОДНОМУ в этом checkout: `src/lang.ts`, `src/stores/exteralessSettings.ts`,
`src/lib/exteraBackup/etgBackup.ts` общие — не запускай соседние задания параллельно.
Прочитай AGENTS.md и docs/upstream/AGENTS.md; UI-часть — через skill `creative-frontend`.
Из приложения ничего не коммить. Не трогай .env, сессии/авторизацию, плагины, tmp/seed*, приватные
скриншоты/экспорты. Не утверждай готовность по наличию строки или ключа.

**Точная цель.** Настройка «показывать секунды во времени сообщений»: выкл = текущий вид HH:MM
без изменений; вкл = HH:MM:SS, в том числе в уже открытом чате, без перезахода в него.

**Текущие факты (src):**
- src/helpers/date.ts:133 — `formatTimeOptions` (только hour+minute), читают `formatTime` :200 и
  `formatFullSentTimeRaw` :152/:170/:180: единственная узкая точка времени сообщений.
- Цепочка сообщения: src/components/chat/utils.ts:40 `makeTime` → src/components/chat/messageRender.ts:268
  (`MessageRender.setTime`) → src/components/chat/bubbles.ts:9584; время правки messageRender.ts:81.
- Кэш Intl-форматтера: src/lib/langPack.ts:191-193 `cachedDateTimeFormats.clear()` и цикл повторного
  `instance.update()` по смонтированным `.i18n` (:197-209) внутри `setTimeFormat` (:189-211) — образец
  обновления; src/lib/langPack.ts:820-827 `IntlDateElement.update`: ветка ровно hour+minute (2 ключа)
  идёт в `formatTimeString`, иначе `getDateTimeFormat`. Toggle обязан учесть кэш и смонтированные элементы.
- src/lib/settingsSearch/generated.ts НЕ править руками (Vite-плагин scripts/settings-search-plugin.mjs,
  vite.config.ts:17, :229); язык — src/lang.ts, блок Exteraless.

**Ключи (проверено, не выдумывать):** persisted Android key = `showSeconds`, default `false` —
.research/android/TMessagesProj/src/main/java/tw/nekomimi/nekogram/NekoConfig.java:83; строка и
`LocaleController.recreateFormatters()` — .research/android/TMessagesProj/src/main/java/app/exteraless/
settings/OpenExteraGeneralActivity.java:181, 412-414. `.extera` alias = `formatTimeWithSeconds`
(src/lib/exteraBackup/etgBackup.ts:44, сейчас KNOWN_UNSUPPORTED → перенести в SUPPORTED).
В текущей namespaced-записи используй ключ `showSeconds` с Android default; не придумывай OE*-алиас.

**Границы:** только время сообщений (и ровно те места, что рендерятся тем же форматтером). Не менять
indiscriminately длительности медиа, date-сепараторы, выбор дат/расписание, статусы «в сети», пока
off-состояние этих мест не доказано неизменным.

**Критерии готовности:** toggle в открытом чате обновляет уже видимые времена сразу (без навигации);
off = прежний HH:MM байт-в-байт; секунды не просачиваются в длительности и даты; скриншоты desktop
и mobile, LTR и RTL, оба состояния config (off/on).

**Проверка:** `corepack pnpm test --run src/tests/exteralessSettings.test.ts src/tests/exteraBackup.test.ts`
(точный fixture ключей, supported-mapping, reset/validation), `corepack pnpm typecheck`, затем изолированный браузерный fixture без авторизации со скриншотами до/после. Сброс уже реализован (`resetExteralessSettings`,
src/stores/exteralessSettings.ts:156) — новый ключ обязан им покрываться. Добавь проверку нового поведения; прогони settingsSearchIndex.test.ts. Без коммитов.
В ответе максимум 5 строк: файлы, что сделано, что не проверено.
