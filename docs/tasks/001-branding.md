# 001 — единое имя exterayond

Рабочая папка: `/home/aiden/extra/git/exterayond`.
Самостоятельная небольшая задача. Прочитай AGENTS.md и применимые frontend-инструкции.
Не коммить. Сохрани все существующие незакоммиченные изменения, особенно
`strictExecutionOrder` в vite.config.ts: это исправление падения после входа.

Сделай согласованное пользовательское название `exterayond`:

- `src/lang.ts`: только значения `Exteraless` и `Exteraless.Preferences`.
  Сами ключи не переименовывать; название настроек — `exterayond Preferences`.
- `vite.config.ts`: title в handlebars context = `exterayond`;
  description = `An unofficial Telegram web client inspired by exteraless.`
- `public/site.webmanifest`: name/short_name = `exterayond`, та же description.
  Не менять id, scope, start_url и пути ресурсов.
- `src/components/sidebarLeft/index.ts`: только видимый текст footer в
  getVersionLink(), сохранив реальные App.version/App.build и ссылку на upstream.

Не изменяй другие файлы. Не заменяй упоминания Telegram/exteraless в лицензиях,
ссылках на upstream, именах API, настройках OE*, путях, комментариях или credits.
Не трогай плагины, авторизацию, .env, tmp/seed*, сессии и browser storage.
Не запускать build, typecheck или браузер — оркестратор проверит общий пакет.
Не писать новые тесты на простую замену текста.

В ответе максимум 5 строк: изменённые файлы, что заменено, что не проверено.
