# exterayond

Unofficial web implementation of **exteraless** for Linux, BSD, macOS and Windows.
The name is always written lowercase: `exterayond`. GPL-3.0; preserve tweb's license,
notices and attribution.

tweb repo mechanics (dev server, preview leases, tests, lint, conventions) live in
[`docs/upstream/AGENTS.md`](docs/upstream/AGENTS.md) — read it before working in the
codebase; it is subordinate to this file.

## Product model — locked decisions

- **Project language (user instruction, 2026-10-27).** Write all new or revised
  project text in English: UI copy, documentation, comments and task notes.
  Keep the conversation with the user in Russian. Preserve upstream reference
  material and language-pack compatibility.

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
- **Plugins are deferred.** Do not work on plugin execution until the user
  explicitly resumes it. When that work resumes, implement the existing plugin
  contract at explicit, documented Web K
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

1. **Direct** — Web K has the component (e.g. avatarCorners, sectionRadius,
   hidden reactions, removeMessageTail, reply colors).
2. **Adapted** — a web analog exists (navigation drawer → left sidebar;
   dividerStyle → section-card look: Web K has no inner row hairlines).
3. **Unsupported** — no web counterpart. Hardware-bound Android settings (camera
   engines, volume buttons, Nothing Phone glyphs, app icon packs) are **removed from
   the hub entirely** — the web client has no device for them to act on. Settings that
   could exist on the web but wait on a Web K primitive are shown as unsupported, not
   faked. JNI/reflection plugin capabilities are surfaced as unsupported, never faked.

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

- **Resume a session.** Start with `docs/tasks/CURRENT.md`, the canonical feature
  checklist, and `git status`. Read the latest relevant section of the progress
  log and inspect the actual code before choosing work. Update the current-state
  note and the checklist after each integration; leave partial work unchecked.
  Commit or push only when explicitly requested.

- **Feature scope (user instruction).** The complete working list is
  `docs/exterayond-feature-checklist.md`, with all 296 original catalog IDs.
  Choose work from that list, from small integrations to larger ones; do not
  invent additional feature work. Keep partial/native-but-unverified entries
  unchecked. After integrating a feature, check and strike through its entry
  and record material limits in `docs/tasks/progress.md`. Keep source links and
  pending entries intact; do not mark exclusions as completed work.

- **Model budget.** Delegate routine implementation to free OpenCode DeepSeek
  (`opencode/deepseek-v4.1-flash-free`); if unavailable, use free GLM
  (`opencode/glm-5.3-flash-free`). Do not choose MiMo. Do not switch to a paid
  provider without the user's explicit authorization. Review delegated changes
  against the owning Web K behavior, not only the agent's test summary.
  If free providers are rate-limited or a bounded task needs repeated repair,
  continue locally instead of waiting or repeatedly retrying agents.

- **Desktop scope and speed (user instruction, 2026-10-26).** This client targets
  desktop only. Do not run mobile viewport checks or a desktop/mobile matrix.
  This overrides mobile-review requirements in skills, upstream instructions and
  older task briefs. Use a short desktop check of the changed behavior; check RTL
  when direction/layout changes. Do not build a separate fixture or a large test
  matrix for each small toggle. Reuse existing fixtures and tests. Add focused
  regression tests for nontrivial logic or a reproduced bug. Run typecheck when
  types change and production build/startup once per meaningful group of features,
  not after each small edit. Do not repeat passing checks without a relevant
  change or failure. Prefer delivering features over expanding QA infrastructure.

- **Memory and servers (user instruction, 2026-10-27).** Do not start a server
  for every task. Reuse an explicitly needed existing server; otherwise work
  without a background server. Run memory-heavy checks sequentially with bounded
  workers. The user has reported out-of-memory failures. Do not launch another
  browser/server pair merely to satisfy a routine verification checklist.

- Small tasks: one visible behavior per commit, touching the existing Web K component
  that owns it. No speculative bundles, no research reports before code — read the two
  relevant source paths (Web K + Android) directly.
- Verify the changed behavior on desktop, in both config states where relevant.
  Use targeted tests and typecheck as needed under the speed policy above.
  Build after a meaningful group of changes.
- Authenticated verification is performed by the user. Never inspect or copy their
  session. No "pixel perfect" claims without side-by-side screenshots.

## Security

User-provided config exports and screenshots are private fixtures: never commit, log
or inline them in tests or docs. No credentials, sessions, phone numbers, codes or
private message content anywhere. No additional message-relay backend.
