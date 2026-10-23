# exterayond

Unofficial web implementation of **exteraless** for Linux, BSD, macOS and Windows.
The name is always written lowercase: `exterayond`. GPL-3.0; preserve tweb's license,
notices and attribution.

tweb repo mechanics (dev server, preview leases, tests, lint, conventions) live in
[`docs/upstream/AGENTS.md`](docs/upstream/AGENTS.md) — read it before working in the
codebase; it is subordinate to this file.

## Product model — locked decisions

- exterayond is a **total web client with the exteraless character**: Telegram Web K is
  the engine (MTProto, sessions, workers, media, screens) and the UI foundation.
  The foundation choice (Web K / Solid) is decided; do not propose Web A/React or a
  rewrite.
- The core deliverable is the **exteraless Preferences hub**, ported into Web K's
  settings (left sidebar tabs), its structure taken 1:1 from the Android root screen
  `OpenExteraSettingsActivity`: About header, categories General / Appearance / Chats /
  Plugins / Other, links, design credits, settings search.
- Every setting wires into **existing** Web K components: setting off preserves stock
  behavior, setting on produces the exteraless behavior. No parallel UI, no replacement
  screens, no freestanding app shell, no blanket restyle, no toggle without its behavior.

## Backward compatibility — hard requirements

Nothing is invented anew; the contracts already exist in the Android source and are
ported as-is.

- **Configurations.** Store settings under the same `OE*` keys and defaults as the
  Android configs (`AppearanceConfig`, `ChatsConfig`, `GeneralConfig`,
  `OpenExteraConfig`, `PillStackConfig`, `GlyphConfig`) in a namespaced, validated
  browser record; no account/session material there. Import/export must support the
  exteraGram `.extera` format exactly as `EtgBackup` implements it: JSON with sections
  `exteraconfig` / `pillstackconfig` / `mainconfig`, the exteraGram-key mapping table,
  and range validation of untrusted files. Unknown Android-only keys are ignored and
  shown as unsupported, never treated as working.
- **Plugins.** Implement the existing plugin contract at explicit, documented Web K
  extension points (avatar render, dialog row, message render, menus, events):
  the `elyx_runtime` facade (`base_plugin`, `hook_utils`, `plugin_settings`,
  `ui/alert`, `ui/bulletin`), the permission model — `ui`, `messages.read`,
  `messages.send`, `network`, `files`, `intents`, `settings`, `hooks`, `native` —
  granted at install time, and the plugin settings models (Switch/Selector/Slider).
  Botile 1.2.0 is a compatibility target only: never copy its implementation, never
  bundle any plugin. Android/JNI/reflection hooks are unsupported in a browser and
  must be surfaced as unsupported, never faked.

## Portability classes

Classify every Android setting before porting:

1. **Direct** — Web K has the component (e.g. avatarCorners, dividerStyle,
   sectionRadius, hidden reactions, removeMessageTail, reply colors).
2. **Adapted** — a web analog exists (navigation drawer → left sidebar).
3. **Unsupported** — no web counterpart (camera hardware, volume buttons, app icon
   packs, JNI/reflection). Shown as unsupported in the hub, not hidden and not faked.

Web K lags Telegram Android. If a setting depends on a primitive Web K lacks, it is
class 3 until Web K gains the primitive upstream; do not speculatively rebuild Telegram
features underneath it.

## Sources

- tweb base: this repository, based on `morethanwords/tweb` revision `654ffd8`.
- Official reference clone: `.research/official` (`TelegramOrg/Telegram-web-k`, `ed0b0de`).
- Android source: `.research/android` (`exteraless/exteraless`, `8b7ec40`), sparse and
  read-only. Read with `git -C .research/android show HEAD:<path>`, list with
  `git -C .research/android ls-tree -r --name-only HEAD`. The settings hub is
  `TMessagesProj/src/main/java/app/exteraless/settings/`, configs under
  `TMessagesProj/src/main/kotlin/app/exteraless/`.
- Values come from source, not guessed from screenshots. Screenshots reveal effective
  configuration; the user's before/after pairs live sanitized in
  `docs/reference/before/` and `docs/reference/after/` at matching viewport/state.

## Work and verification

- Small tasks: one visible behavior per commit, touching the existing Web K component
  that owns it. No speculative bundles, no research reports before code — read the two
  relevant source paths (Web K + Android) directly.
- `corepack pnpm typecheck`, targeted `corepack pnpm test --run <target>`, and a real
  browser screenshot at matching before/after viewports in both config states (stock
  unchanged, enabled = ported behavior). Build after a meaningful slice.
- Authenticated verification is performed by the user. Never inspect or copy their
  session. No "pixel perfect" claims without side-by-side screenshots.

## Security

User-provided config exports and screenshots are private fixtures: never commit, log
or inline them in tests or docs. No credentials, sessions, phone numbers, codes or
private message content anywhere. No additional message-relay backend.
