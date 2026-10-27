# Аудит потребителей `formatNumber` — read-only

Снимок `src/` на 2026-10-26, без правок; параллельная задача 002 может сдвинуть номера строк. Найдено 25 живых вызовов в 19 файлах (плюс `src/tests/formatNumber.test.ts`). Все импортируют default `formatNumber` из `@helpers/number/formatNumber`; re-export, `as`-алиасов и namespace-импортов нет. `src/lib/appDialogsManager.ts:2589` — закомментированный вызов, `src/components/badge.tsx:18` — только JSDoc.

| file:line | что форматирует | класс | DOM-обновление и cleanup | live при toggle |
|---|---|---|---|---|
| `src/lib/appDialogsManager.ts:2590` | непрочитанные в бейдже строки диалога | count | `setBadgeState` → `setRollingText`; вызывается из `setUnreadMessages` по `dialog_unread`/`folder_unread`; строки и listener'ы принадлежат `AutonomousDialogList` | да; повторно `setUnreadMessagesN` для смонтированных строк, без перерисовки чата |
| `src/components/archiveDialog.tsx:111` | всего непрочитанных в архиве, `<Badge format>` | count | Solid `Badge` → `createEffect` → `rollBadgeCount`; dispose через `Show`/owner | да; чтение store внутри `format` обновит только бейдж |
| `src/components/stargifts/stargiftsGrid.tsx:323` | `availability_total` уникального подарка | count | Solid JSX в `StarGiftBadge`; dispose с гридом | да; существующее реактивное выражение |
| `src/components/stargifts/stargiftsGrid.tsx:355` | `availability_total` лимитированного подарка | count | Solid JSX в `StarGiftBadge`; dispose с гридом | да; существующее реактивное выражение |
| `src/components/appSelectPeers.tsx:356` | звёзды, нужные для контакта | count (звёзды) | императивный `span` после async-запросов; живёт в строке селектора, удаляется с ней | да, если селектор смонтирован; повторно обогатить строки (отдельного updater'а нет) |
| `src/components/sidebarLeft/index.ts:262` | непрочитанные архивной папки | count | `updateArchivedCount` → `setBadgeCount`; `rootScope:folder_unread` + generation guard | да; вызвать существующий `updateArchivedCount` |
| `src/components/sidebarRight/tabs/statistics.tsx:198` | текущее значение обзора статистики | count | Solid-компонент считает `v` один раз в теле, не в reactive-выражении; owner — middleware вкладки | да, но только remount/пересчёт обзора: granular-пути нет |
| `src/components/sidebarRight/tabs/statistics.tsx:211` | абсолютная разница current−previous | count | то же тело `StatisticsOverviewItem`, значение фиксируется при монтировании | да, но только remount/пересчёт обзора |
| `src/components/sidebarRight/tabs/statistics.tsx:665` | реакции/репосты поста | count | императивный `DocumentFragment` в `renderRecentPost`; DOM вкладки, cleanup middleware | да; пересобрать список постов вкладки (не чат) |
| `src/components/sidebarRight/tabs/statistics.tsx:788` | просмотры верхнего поста | count | императивная строка через `renderPeer`; middleware вкладки | да; пересобрать top peers вкладки |
| `src/components/stories/viewer.tsx:830` | счётчик реакции сторис | count | Solid `<div>` из `createEffect`/`setChildren`; `onCleanup` owner'а viewer'а | да; store-read в выражении |
| `src/components/stories/viewer.tsx:2572` | просмотры сторис | count | Solid JSX футера; dispose owner'ом | да; store-read в выражении |
| `src/components/communities/communityPendingRequest.tsx:140` | число участников в пилюле | count | Solid `Show`/`span`; dispose owner'ом | да; store-read в выражении |
| `src/components/communities/communityDialog.tsx:91` | непрочитанные строки community | count | Solid `createEffect` → `setBadgeState`; `middlewareHelper.onDestroy(disposeState)` (:118) | да; store-read внутри эффекта |
| `src/components/chat/reaction.ts:1041` | счётчик реакции | count | custom element; `renderCounter` пишет `textContent`; middleware реакции из `reactions.ts` | да; повторный `renderCounter()` на смонтированных элементах |
| `src/components/chat/bubbleParts/pollMessageContent/PollOption.tsx:169` | голоса за вариант опроса | count | Solid `Show`/`div`; dispose owner'ом сообщения | да; store-read в выражении |
| `src/components/chat/bubbleParts/pollMessageContent/parts.tsx:174` | всего голосов в футере опроса | count | `I18nTsx`: `args` вычисляются в его `createEffect`; owner сообщения | да; store-read в `args` |
| `src/components/chat/replies.ts:145` | число ответов у кнопки | count | custom element; `render()` пишет `innerHTML`; элемент принадлежит bubble | да; `render()` на смонтированных replies-элементах |
| `src/components/chat/messageRender.ts:290` | просмотры поста | count | `span.textContent` при рендере сообщения; DOM принадлежит bubble | да; один проход по `.post-views` (как `bubbles.ts:2579`) |
| `src/components/chat/bubbles.ts:2579` | просмотры при `messages_views` | count | listener через `listenerSetter` + `fastRaf`, обновляет все `.post-views`; cleanup с bubbles | да; тот же проход с текущими `message.views`, сообщения не рендерить |
| `src/components/popups/starsRating.tsx:79` | баланс звёзд | count (звёзды) | Solid `hint` JSX для `LimitLineTsx`; dispose popup-owner'ом | да; store-read в выражении |
| `src/components/popups/starsRating.tsx:83` | звёзды следующего уровня | count (звёзды) | тот же `hint`; dispose popup-owner'ом | да; store-read в выражении |
| `src/components/chat/similarChannels.tsx:111` | участники/активные пользователи бота | count | Solid JSX бейджа `SimilarPeer`; dispose owner'ом списка | да; store-read в выражении |
| `src/components/chat/bubbles/starGift.tsx:119` | `availability_total` подарка в сообщении | count | Solid `I18nTsx args`; owner сообщения | да; store-read в `args` |
| `src/components/chat/topbar.ts:992` | непрочитанные на кнопке «назад» (mobile) | count | `rootScope:folder_unread` через `listenerSetter` → `setBadgeCount`; cleanup topbar'а | да; тот же обработчик с сохранённым `size` |

Все 25 вызовов — счётчики (включая звёзды); bytes, duration и chart среди них нет. `src/lib/tchart/utils.ts:223-225` — собственный K/M-форматтер осей, не `formatNumber`, вне объёма. `formatNumber` принимает параметр с именем `bytes`, но это просто число, не размер.

## Предлагаемый штатный механизм (не код)

1. Рядом с `formatNumber` добавить `formatCount(n, decimals)`: при `DisableNumberRounding` — `numberThousandSplitter(n)` (NBSP, уже RTL-safe), иначе — прежний `formatNumber(n, decimals)`. Off остаётся байт-в-байт; локализация не через «сырой» `toLocaleString`.
2. В Solid-вызовах (строки 2–4, 6, 11–14, 16–18, 21–24) читать store прямо в уже существующем JSX/effect. Это не новый эффект: обновляются только смонтированные текстовые узлы.
3. Для императивных узлов (строки 1, 5, 7–10, 15, 19–20, 25) не заводить эффект на сообщение/строку. Один `rootScope`-эвент из `setExteralessSetting` (подписка владельца с существующим cleanup) вызывает готовые updater'ы только для смонтированного DOM: `setUnreadMessagesN`, `updateArchivedCount`, обработчик `folder_unread`, проход `.post-views` из `bubbles.ts`, `renderCounter()`/`render()`, пересборку вкладки статистики.
4. Чат не перерисовывается; вечных эффектов на каждое сообщение нет. Cleanup — существующие `listenerSetter`/middleware/owner, новых глобальных хранилищ не нужно.
