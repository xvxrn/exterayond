# exterayond

exterayond brings the preferences and desktop-friendly parts of
[exteraless](https://github.com/exteraless/exteraless) to the web. It uses
[Telegram Web K](https://github.com/morethanwords/tweb) as its Telegram client
and UI foundation. The project targets desktop browsers on Linux, BSD, macOS
and Windows.

The port is in progress. See the [feature checklist](docs/exterayond-feature-checklist.md),
the [source inventory](docs/exteraless-feature-inventory.md), and the
[task and integration log](docs/tasks/README.md). Plugin execution and parts of
the Material 3 player are still unfinished.
For a new work session, start with [current state and next work](docs/tasks/CURRENT.md).

Updates: [@exterayond](https://t.me/exterayond).

## Development

Use Node.js 22.18+ or 24.11+ and pnpm 11.16.0:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm start
```

The development server uses `http://localhost:8080/` by default. Run focused
tests with `corepack pnpm exec vitest run <test-file> --maxWorkers=1`.

## Production build

```sh
corepack pnpm exec vite build
node scripts/publish-local.mjs
```

The second command combines `dist/` and the static assets in `public/` into
`tmp/startup-verified-dist/`. To serve the build directly, use
`node server.js 0 8080 --dist`; that server reads both `dist/` and `public/`.
The repository does not contain generated JavaScript bundles or source maps.

For a container image, run
`docker build -f .docker/Dockerfile_production -t exterayond .`.

## License and attribution

exterayond is an unofficial project and is not affiliated with Telegram.
It is based on Telegram Web K by Eduard Kuzmenko and contributors, itself based
on Webogram. Android behavior is referenced from exteraless and its upstream
projects. The project is distributed under [GPL-3.0](LICENSE); third-party
notices and licenses are retained in the source tree and in
[third-party attribution](docs/attribution.md).
