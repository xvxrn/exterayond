# Узкая сверка первых небольших фич — только исследование

Рабочая папка: `/home/aiden/extra/git/exterayond`.
Прочитай AGENTS.md. Приложение не менять и не коммитить.
Единственный разрешённый выходной файл:
`docs/tasks/research-small-features.md`, максимум 70 строк.

Проверь 5 небольших следующих задач по сложности и наличию кода:

1. LOOK-03 мини-аватары отправителей: store → реальный consumer → переключатель.
2. OTHER-03 сброс настроек клиента: посмотри актуальные ID в каталоге; проверь
   безопасный сброс только OE-настроек без Telegram-сессии и плагинов.
3. GEN-02 точные числа вместо K/M (не размеры файлов/длительности).
4. GEN-03 секунды во времени сообщений.
5. HIDE: скрытие плавающей кнопки нового чата.

Основные источники: src/stores/exteralessSettings.ts,
src/components/sidebarLeft/tabs/exteraless*.tsx,
src/components/wrappers/dialogSubtitle.ts, src/helpers/number/formatNumber.ts,
src/helpers/date.ts, src/components/sidebarLeft/index.ts.
Android read-only: git -C .research/android show HEAD:TMessagesProj/src/main/...
Найди для новых настроек точные Android keys/defaults и 1–3 consumer-места.
Не читай весь большой каталог: достаточно rg по перечисленным ID/именам.

Для каждого пункта: существующий UI/хранилище/consumer, видимый пробел,
узкий список файлов для исправления, ключ/default, оценка S/M/L.
Каждый факт подтверждай `file:line`; сомнения помечай UNVERIFIED.
Не объявляй функцию работающей по наличию строки/переключателя.
Не читать .env, сессии, приватные скриншоты/экспорты и tmp/seed*.
Не запускать серверы, тесты и build. Не исследовать плагины/крупные подсистемы.
В ответе максимум 5 строк + путь отчёта.
