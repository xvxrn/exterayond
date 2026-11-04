# exterayond — manual acceptance runbook

This document is the manual acceptance checklist for the features ported into
exterayond. Nothing in the repo so far has been verified on a real account by a
person: every integration was checked by targeted tests, fixtures and offline
browser passes only, and the porting agents never touched the user's session.
This runbook closes that gap: it lists, per feature, where the control lives,
what toggling it on must visibly do (sourced from the Android reference and the
porting journal), and what toggling it off must restore.

**Snapshot.** This is a snapshot at **54/296** checklist entries checked
(2026-10-31, packets 001–036; CHAT-30 from packet 036 was appended to batch 2
right after the first snapshot, packets 037–040 appended 2.14, 2.15, 5.3a and
5.3b, packet 044 appended 5.1a; the checklist is at 59/296 plus the four
user-directed V entries as of packet 048, whose acceptance steps are 1.21–1.24
below). Future porting packets append their own
entries to the checklist in `docs/exterayond-feature-checklist.md` and should
append their acceptance steps to the matching batch here. The count and the
batch tally at the bottom go stale by design; the checklist stays the source
of truth for completion.

**The off = stock guarantee.** Every setting must satisfy the product rule
from `AGENTS.md`: setting **off** preserves stock Telegram Web K behavior,
setting **on** produces the exteraless behavior. Several toggles *default* to
the Android exteraless default rather than to stock (each step below names its
default) — that is intentional and still obeys the rule per toggle. A setting
whose off state is *not* stock is a defect; record it in the FAIL line.

**Authenticated checks belong to the user.** Per `AGENTS.md`, verification on
a signed-in account is performed by the user; no agent may inspect or copy the
session. Every step below carries a marker:

- **[AUTH]** — requires a signed-in account. You perform these. The whole
  Preferences hub lives inside the authenticated client (Web K shows only the
  sign-in screen logged out), so no step is fully account-free; a disposable
  secondary session is fine wherever no real content is needed.
- **[AUTH · content: …]** — additionally needs specific account content
  (a group, a channel, a playing track, stories, a poll…), named in the step.
- **[no chat data]** — any signed-in session works; nothing chat-specific to
  prepare.
- Steps whose only prior verification was an offline fixture with synthetic
  peers say so explicitly ("fixture-only so far").

## How to verify

For each feature:

1. Open **Settings → exterayond Preferences** (the star row subtitled
   "Make the client truly yours") and go to the named category tab
   (**General / Appearance / Chats / Plugins / Other**). Row and section names
   below are the exact visible labels from `src/lang.ts`.
2. Set the control to the state under test and observe the expected behavior
   described for that checklist ID. The behavior notes come from the Android
   reference (`exteraless` revision `8b7ec40`, read-only in
   `.research/android`) and the porting journal
   (`docs/tasks/progress.md`, packets 001–035). Where the journal itself says
   something was never exercised (live recording, real hidden-tab media,
   RTL…), the step repeats that caveat — those are exactly the things this
   runbook exists to check.
3. Toggle **off** (or set the stock value) and confirm the stock appearance/
   behavior returns, immediately where the step says "live".
4. Fill in the PASS/FAIL line. Edge cases named in the step (midnight
   crossing, RTL, reduced motion, reopening a chat) are part of PASS.

Useful knobs while verifying:

- **RTL**: switch the interface to an RTL language (e.g. Arabic) for steps that
  mention RTL; several journal entries verified RTL only on fixtures.
- **Reduced motion**: enable the OS/browser "reduce motion" preference for the
  player steps that mention it.
- **Recovery**: **Other → Reset exterayond settings** restores all defaults
  (Batch 5, OTHER-03) without touching the Telegram account.
- **Search**: the hub's settings search indexes every ported control; if a
  control can't be found by eye, find it by name — a control that exists but
  is not searchable is itself a (minor) FAIL.

## What the automated tests already cover

One line per area, from `docs/tasks/progress.md`. A failure in a step whose
area is covered here means either a regression since the packet or a
behavior the tests stubbed out (the fixture gaps are listed per step) — not
"feature never worked".

- Settings store (defaults, validation/clamping, reset, live root classes):
  `tests/exteralessSettings.test.ts` (21 tests, packet 040).
- Hub rows, sections and row order: `tests/exteralessTabs.test.tsx` (14).
- Settings search index (regenerated, 479 entries): `settingsSearchIndex` (8).
- `.extera` backup round-trips, strict types/ranges, alias mappings
  (`tabCounter` boolean, `hideStories`, `hideAllChats`, `hideCameraTile`,
  `pauseOnMinimizeVideo`, `newSliderStyle`/`newSwitchStyle`):
  `tests/exteraBackup.test.ts` (27).
- Pause-on-minimize through the real playback controller's `visibilitychange`
  handler (video default-on, voice/round off-by-default, music never pauses):
  `tests/pauseOnMinimize.test.ts` (packet 030).
- Link-preview gate (CHAT-31) over the real composer `processWebPage`:
  `chatInputEditorAsyncActions` (13: suppressed fresh composition, dropping a
  fetched preview, in-flight defusal, edits unaffected, stock restore).
- Voice/round send confirmation (CHAT-33) over the real release handler:
  `confirmAvMessage` (4: pause on release, preview send commits, stock
  release, short-recording cancel).
- Player style wiring, live reshape of every wired setting and the wavy line
  decay: `outgoingConfirmations` (8) plus the player popup regression (12,
  including the three-step repeat cycle).
- Folder tab counter modes over the real store: `foldersStoreRecovery` (5,
  packet 040 also covers the live HideAllTab hide/unhide cycle and the
  no-folders case).
- Link-preview rewrite rules (CHAT-30) over the built-in rule table:
  `pagePreviewRules` (5, packet 036).
- Sort-by-unread index layout and live re-sort (GEN-12) over the real dialogs
  storage: `dialogSortByUnread` (6, packet 044).
- Exact counters: `tests/formatNumber.test.ts` (off state byte-identical)
  plus packet 004's 79 tests across 11 files over 25 counter consumers.
- Per-feature regression suites accumulated per packet (mini avatars, seconds,
  archive hiding, Zalgo, edited icon, ID/DC, call/command confirmations,
  forward date/time hint, tails, send-as, replies trio, sticker size/shape/
  time, reaction hiding, trending/group stickers, greeting, status hiding,
  relative last seen, link-open policy, bottom button, floating button,
  Premium/Help hiding): the targeted suites recorded per packet in
  `progress.md` (169, 59, 55, 49, 47, 36, 41, 28, 17, 47, 73, 44, 42, 51, 64,
  73, 82 tests respectively).
- Not covered by automation anywhere: real-account content, the live recording
  UX, a real hidden tab mid-playback, RTL on most 028/029 surfaces, screen
  readers, and the full test suite itself (only targeted runs were executed).

---

## Batch 1 — Forced MD3 group and the MD3 player style rows

Highest risk: the most invasive styling in the port. Implemented in packets
028/029 with regression tests, **desktop visual review is pending for every
item in this batch** — that review is this batch. Nothing here is confirmed
against a real desktop screen yet. All playback-dependent checks need a
playing track: **[AUTH · content: an audio track in any chat]**.

Hub location: **Appearance** tab. The MD3 group is the first section,
"Forced MD3", with the subtitle "Use Material Design 3 for the selected
components. Changes apply immediately." and a "Choose components" expander
holding the eight component rows. The player style rows follow in three
sections: **Cover**, **Title**, **Layout**.

### 1.1 Forced MD3 master (no separate checklist ID; semantics of the LOOK-18…23 group)

- On → checks all eight components on: the six booleans plus Sliders=2 and
  Switches=3; the master subtitle shows `n/8`. Off → clears all eight. There
  is no persisted `ForcedMD3` key — the master is on whenever any style is on.
- Stock: all eight off. Android defaults ship five on (Loading, Player,
  Mini-player, Sliders, Switches) — expect that state after a reset.
- Look at: toggling one component off must drop the count but keep the rest;
  the expander expands when settings search selects a nested row (packet 028).
- **[no chat data]**
- PASS/FAIL:

### 1.2 LOOK-18 — "Loading indicators"

- On → the existing indeterminate/progressive loading owners render the MD3
  wavy circular variant (web adaptation; Android's separate morphing-shape
  renderer is not recreated). Track gap 2, circular wave amplitude 1.6,
  wavelength 15.
- Off → stock spinner.
- Look at: any spinner during media load or upload. Byte progress,
  cancellation and animation-level ownership stay native — only the look
  changes.
- **[AUTH · content: any transfer that shows a spinner]**
- PASS/FAIL:

### 1.3 LOOK-19 — "Sliders"

- On → every settings slider uses the 8px track, 3×24px thumb with a 6px gap
  (from Android `SeekBarView`).
- Off → stock slider geometry. `SliderStyle` 0 = off; the master sets 2.
- Look at: the hub's own sliders (Batch 5 CHAT-01 sticker size, Batch 1 player
  rows) are the easiest specimens.
- **[no chat data]**
- PASS/FAIL:

### 1.4 LOOK-20 — "Switches"

- On → every toggle uses Android's scaled track/thumb geometry: 42.25×26
  track, 19.5 checked thumb, 16.25 travel (Android's 0.8125 scale).
  `SwitchStyle` 2 and 3 both count as MD3; 0 = stock.
- Off → stock Web K switch.
- Look at: every checkbox row in the hub.
- **[no chat data]**
- PASS/FAIL:

### 1.5 LOOK-21 — "Chat header"

- On → the chat header becomes a flat tonal surface spanning the full chat
  column with a 46px avatar. The desktop pinned-panel geometry is retained by
  design; Android's status-bar fade is not recreated.
- Off → stock header.
- Look at: an open chat's top bar; toggle live; then check RTL (unreviewed).
- **[AUTH · content: any chat]**
- PASS/FAIL:

### 1.6 LOOK-22 — "Folder navigation"

- On → the existing folder rail/tabs get a tonal active indicator, 64px rail
  items and a 56×32 icon plate (from `MainTabsUiHelper`). No new navigation
  shell is created.
- Off → stock folder bar.
- Look at: the folder rail with at least two folders; active and inactive
  states.
- **[AUTH · content: at least two folders]**
- PASS/FAIL:

### 1.7 LOOK-23 — "List items"

- On → settings-style list rows become 56/72px MD3 rows in tonal segments with
  separate headers; inner corners capped at 4.
- Off → stock rows.
- Look at: the Preferences hub lists themselves are the visible surface.
- **[no chat data]**
- PASS/FAIL:

### 1.8 "Music player" + "Mini-player" MD3 toggles (part of PLAYER-01, packet 028)

- On → the music popup gets the MD3 base surface and the desktop audio plate
  (mini-player) gets tonal treatment with a 36px cover, 10px cover corners and
  a 20px card radius; the native 48px-high plate and its controls remain.
  The mini-player shows artwork when available.
- Off → stock popup/plate.
- Look at: play a track, open the popup and the mini-player; then see 3.5 for
  the functional playback checks. The full Android player editor, queue,
  lyrics and gestures are deliberately absent — do not expect them.
- **[AUTH · content: a playing audio track]**
- PASS/FAIL:

### 1.9 PLAYER-02 — "Cover style" (Card / Wide / Full screen / Disc)

- Card → framed cover card. Wide → a full-width 6:5 plate. Full screen → the
  artwork becomes the dialog backdrop behind a light scrim, controls at the
  bottom. Disc → circular cover.
- Look at: switch through all four live while a track plays; blocks must stay
  usable in every style.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.10 PLAYER-03 — "Size" (60–100%)

- Drives the cover as a 0.6–1.0 fraction for the framed covers (Card, Disc)
  only; the row hides itself for Wide/Full screen (Android
  `refreshVisibility`).
- Look at: 60% vs 100% on Card and Disc.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.11 PLAYER-04 — "Corner radius" (0–48)

- Applies to the Card cover only; the row hides itself for the other styles.
  Default 28.
- Look at: 0 (square) vs 48 on the Card.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.12 PLAYER-05 — "Spin while playing" (Disc only)

- On → the Disc cover spins one turn per 16 seconds while playing. Off or the
  OS reduced-motion preference → no spin. The row hides itself except for
  Disc.
- Look at: spin while playing, still while paused, no spin under reduced
  motion.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.13 PLAYER-08 — "Title alignment" (Left / Centered)

- Left is Android's start default; Centered centers title and artist.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.14 PLAYER-09 — "Title size" (Small / Medium / Large)

- Title 22/26/31px, artist 15/16/17px (Android `PlayerSheet.applyStyle`).
- Look at: all three stops; text must not clip at Large.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.15 PLAYER-10 — "Title position" (Below cover / Above cover)

- For the framed covers (Card, Disc) only; row hides otherwise. Default Below.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.16 PLAYER-12 — "Playing from"

- On → a "Playing from chat" line shows the real peer title (via
  `PeerTitleTsx`). Off → the line is hidden in place (Android
  `View.INVISIBLE` semantics — no layout jump).
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.17 PLAYER-15 — "Shuffle and repeat"

- Off → the repeat control hides. On → the repeat button returns and cycles
  off → playlist → track (each mode announced; the popup regression covers
  all three transitions). **Partial by design:** shuffle has no web
  counterpart (the controller lacks it) — do not expect a shuffle button.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.18 PLAYER-16 — "Wavy progress bar"

- On → the seek bar renders the `WavySeekBar` wave (amplitude 4, wavelength
  34, 6 rad/s, 4px stroke) over the existing seek owner; seeking still works.
  Off (amplitude 0) → flat stock bar; reduced motion → flat; a paused track
  eases the wave back into the line.
- Look at: wave only on the music player's progress line, not on voice/round
  players; drag-seek during the wave.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.19 PLAYER-17 — "Buttons" (Compact / Normal / Large)

- Transport scale 0.84 / 1 / 1.14 (Android `PlayerStyle.controlsScale`).
- Look at: all three stops; buttons must stay hit-testable at Compact.
- **[AUTH · content: a playing track]**
- PASS/FAIL:

### 1.20 Deliberately absent from this batch (do not file as FAIL)

Block order (PLAYER-13), the speed/lyrics/queue actions (PLAYER-14),
cover-derived colors (PLAYER-18), background modes (PLAYER-19) and the
mini-player customization rows (PLAYER-20…30) wait on missing web primitives
and were not faked (packet 029). PLAYER-01's remaining subsystem (queue,
lyrics, gestures) likewise stays open.

### 1.21 V-1 — "Wallpaper Pattern" (Appearance, beside Custom Themes)

- Default **on** (stock). Off → every wallpaper's pattern layer (узоры)
  disappears live, without a reload: the chat background keeps its colors and
  gradient only; the wallpaper picker tiles and the passcode lock show the
  same gradient-only rendering. On → the pattern returns with its own
  intensity dimming. An image wallpaper (a custom photo) and its dimming are
  unaffected either way.
- Look at: the default wallpaper's doodles, a dark theme (the night mask
  render falls back to the pure gradient), the folders sidebar mirror
  brightening with the gradient when a dark mask pattern is hidden, and the
  toggle's live round trip (off → on, no reload).
- **[AUTH · content: any chat; the settings row]**
- PASS/FAIL:

### 1.22 V-2 — "Attached Sidebar" (Appearance, under Center Title)

- Default **off** (stock floating). On → the left panel loses the page
  margins and shadow and runs the window's full height, edge to edge. The
  rounding lives only on the **content-facing edge** (acceptance round 2,
  G-3): the right edge of the left sidebar in LTR keeps its top/bottom
  corners rounded, the window-facing corners are square; mirrored in RTL.
  The folders rail keeps its place beside it and the section cards inside
  keep their rounding. The toggle eases its margins and rounding (F-6);
  everything else stays instant. Off → the floating panel returns, all four
  corners rounded.
- The attached panel **never overlays the chat** (G-3): the chat column and
  its header/pinned/composer plates re-center beside the panel at every
  width, including the collapsed sidebar popped out for an open tab (stock
  overlays it there with a scrim — attached pushes the chat instead, and no
  scrim shows); in the 601–925 drawer range the chat offsets while the panel
  is shown. Off → the stock overlay/pop-out behavior returns.
- Look at: both directions live; the rounded content-facing corners and the
  square window-facing corners at full height (attached), with the folders
  rail shown and hidden; a chat open beside the panel — header, pinned bar
  and input all clear it; the collapsed sidebar with an open tab (the chat
  must offset beside the full panel, no dark scrim); RTL (the corners and
  the offset mirror); no scrollbar regressions; dialogs and popups stay
  above the attached panel.
- **[AUTH · content: any chat]**
- PASS/FAIL:

### 1.23 V-4 — "Theme Palette" and "Accent Color" (Appearance, top)

- Theme Palette is a **single toggle** since acceptance round 1 (F-2 — the
  Stock/Exteraless/AMOLED selector is gone, AMOLED is removed). Default **off**
  (stock). On → on a dark theme (night or tinted) the surfaces go near-black
  **tinted Material-You style (F-3): every surface of the family takes its hue
  from the accent color** — pick a different accent and the chrome follows.
  Off → the theme's own surfaces return. On a light theme the toggle does
  nothing (a dark palette by design). The chat wallpaper is not part of the
  palette — it keeps whatever Chat Wallpaper holds, with one exception below.
- An explicit background choice wins over the palette: pick **Set a color** on
  the Chat Wallpaper tab (or an image, or a grid pick) and the palette tints
  its surfaces with THAT color's hue instead of the accent's; toggling the
  palette off and on re-derives from the pick. Accent changes no longer
  replace a picked background.
- An explicit background choice wins over everything (acceptance round 2,
  G-1): pick **Set a color** on the Chat Wallpaper tab and the chat background
  repaints **at once, without a page-wide transition** (background re-applies
  no longer run the theme-switch view transition), and the pick beats the
  accent, the wallpaper-derived tint (below) and the accent's material
  wallpaper. The priority chain is: explicit background color > explicit
  accent PICK > wallpaper-derived > the theme's own accent > palette default.
- Theme from wallpaper (G-4, Pixel/Material You style): while the palette
  toggle is on, an **image** wallpaper (a photo upload or grid pick) tints
  the whole surface family with its dominant color — pick a different photo
  and the chrome follows it live; switching to a pattern/color wallpaper (or
  an accent pick) takes the wallpaper's tint away again. A gray-dominant
  photo carries no hue (the chrome falls back to the theme's accent). The
  explicit picks above always win over the derived tint; the theme's own
  (never-picked) accent yields to the wallpaper.
- Look at: the toggle on night and on tinted; a switch to a light theme with
  the toggle on (it must fall away); a theme re-apply with the toggle on (the
  palette must win over the theme's own writes); a theme switch with the
  toggle on and then off — the surfaces that return are the **new** theme's
  own, never the previous theme's (packet 058 fixed exactly that); the
  palette standing already on the login screen when the account's theme is
  dark (the boot apply follows the first theme paint, packet 058); the hue
  following the accent picker; a "Set a color" pick repainting the chat
  instantly and driving the chrome hue; a photo wallpaper driving the chrome
  hue and a wallpaper swap re-deriving it live; an accent pick outranking the
  photo; menus that opt into the `.night` mirror keep the underlying theme's
  surfaces (a documented limit, not a FAIL).
- Hub motion (G-2, judged here by eye): settings rows answer hover and press
  with an eased highlight (Material's standard easing; with Interface
  Animations off everything snaps); the "Customize" reveals fade their
  content in on every browser and grow open on Chromium 131+ at the full
  animation level.
- Accent Color default **theme's own**. "Pick a color" → the embedded picker;
  dragging previews the accent live and the pick commits (survives a reload);
  on a dark base the outgoing bubbles take the derived gradient. With the
  Theme Palette on, a committed accent **carries a Material-You wallpaper**
  (F-3): the chat background becomes a gradient of the accent's hue with the
  shared pattern elements — live, without a reload. If the current wallpaper
  is an explicit user pick (a "Set a color" choice, an upload, a grid pick),
  the accent never replaces it. The row's swatch follows the applied accent.
  "Reset to Default" → the factory theme entry (wallpaper included).
- Look at: preview during the drag, the commit after release, reload
  persistence, reset, and a pick on day/night/tinted alike; with the palette
  on, the background's hue following the accent and the pattern elements
  appearing; a picked background surviving an accent change.
- **[AUTH · content: any chat]**
- PASS/FAIL:

### 1.24 V-3 — Forced MD3 coverage extension (with the MD3 group on)

- The coverage audit table lives in the journal (packet 048 in
  `docs/tasks/progress.md`): switches, loading indicators, Section rows
  (left tabs, right sidebar/profile tabs, popup sections), settings sliders,
  chat header, folder navigation, player and mini player are covered; chat
  list rows are covered by contract; popup/menu/dialog card chrome, search
  input, media viewer chrome and the composer wait on an owning-toggle
  decision (do not file as FAIL).
- The one extension, behind **Forced MD3 → Sliders**: with Sliders on, a chat
  audio attachment's seek line takes the M3 track (8px) and the elongated
  gap handle the settings sliders wear; voice messages keep their waveform;
  the mini player and the media viewer keep their own chrome. Sliders off →
  the stock thin line and round thumb return.
- Look at: an audio attachment in a chat with Sliders on and off; a voice
  message (unchanged waveform); the settings sliders still fine.
- **[AUTH · content: an audio message]**
- PASS/FAIL:

### 1.25 V-3 — the ninth MD3 part, "Dialogs, menus and search" (packet 065; appended)

- Appearance tab → "Forced MD3" → "Choose components". The last row,
  **"Dialogs, menus and search"** (`OEAppearanceMd3Dialogs`), is an
  independent toggle: the master switch never flips it and the x/8 count
  ignores it. Default **off**.
- On → the M3 modal chrome (tonal surfaces, no behavior change):
  - every popup card (and dialog card — Web K renders both through one
    owner) is tinted from the accent instead of the flat background;
  - context menus and dropdown menu cards are opaque, accent-tinted
    surfaces instead of frosted glass;
  - the search fields (sidebar headers, settings) are accent-tinted pills
    with no outline.
- Off → the stock chrome byte-for-byte (frosted menus, flat cards, outlined
  fields). Colors only — no shape, layout or motion change on any surface;
  popups with their own background override (image popups, calls) keep it.
- Look at: with the toggle on, open a confirmation dialog, a right-click
  context menu, and use the chat-list search — day and night themes; then
  toggle off and confirm the stock look. Also confirm the x/8 master count
  does not change with this row.
- Packet 069 additions (the hunt fixed two cascade defects, tested in
  `tests/exterayondMd3DialogsChrome.test.ts`):
  - a search field **inside** a dialog card (the share / select-peers
    popup) takes a stronger accent step than the card itself — the pinned
    reference's `dialogSearchBackground` distinction — so the borderless
    pill no longer dissolves into the card. Look at: the share popup's
    search field with the toggle on, day and night — the field must read
    as its own surface against the card; fields outside dialogs (sidebar,
    settings) keep the card-level 8% pill.
  - with `oe-no-glass-menus` **also** on, the reactions strip of a message
    context menu now follows the tonal mix too (it kept the plain surface
    before, an element-level declaration beat the inherited one). Look at:
    both toggles on → right-click a message → the reactions strip matches
    the menu card's tint.
- **[AUTH · no chat data]**
- PASS/FAIL:

---

## Batch 2 — Composer and the sending path

Second risk tier: features that intercept sending, opening or destructive
actions. Misclicks here cost real messages and calls — use a test chat and
never confirm a deletion you do not mean.

### 2.1 CHAT-32 — "Ask before opening links" (Hidden links / All links / Never)

- Chats tab → section "Ask before opening links" (third row of the section,
  after the two preview rows). Default **Hidden links**.
- Hidden links → a link whose visible text is not the destination asks first;
  visible links continue directly (fixture-verified). All links → every link
  asks. Never → stock, nothing asks. The confirmation shows a non-clickable
  destination; **Open** continues exactly once with the captured URL and the
  original modifiers; Escape/Cancel restores focus and drops the action.
- Keep their own actions regardless: bot commands, hashtags, media timestamps,
  editor links, downloads, local UI hashes; middle clicks and the document
  external-link owner are covered; hub external links (Channel/GitHub rows)
  also ask under All.
- Look at: cancellation and an account change must stop a pending action;
  All/Never execution is test-covered but their **visual check is still
  pending** (packet 027's browser connection dropped) — check all three
  modes; also check RTL and the hub links.
- **[AUTH · content: a message with a hidden link, e.g. text that hides a URL]**
- PASS/FAIL:

### 2.2 CHAT-31 — "Disable link preview by default"

- Chats tab, second row of the links section. Default **off** (= stock).
- On → a fresh composition with a URL never fetches a preview and sends with
  the `no_webpage` flag; a live toggle drops an already shown preview plate
  and defuses a fetch left in flight; turning it off re-fetches from scratch;
  edits keep their own media handling; a restored draft keeps the
  `no_webpage` its composer saved; a message without a URL keeps the flag
  unset; scheduled posts go through the same gate.
- Off → stock preview fetching.
- Look at: send a URL to a test chat with the setting on — the message must
  arrive without a preview; then off — with one. What the server actually
  produces on a real send is unverified (packet 031 had no browser).
- **[AUTH · content: a test chat]**
- PASS/FAIL:

### 2.3 CHAT-33 — "Confirm before sending voice and video messages"

- Chats tab, in the ask-when rows (before "Confirm before calling").
  Default **off**.
- On → releasing the record button (past the minimum length) pauses into Web
  K's recorded preview instead of sending; sending from that preview is the
  explicit confirmation; discard cancels; resuming records on. A too-short
  recording still cancels; the send menu's Silent/Schedule/Send-when-online
  keep their explicit immediate send. Voice and round video share the
  handler.
- Off → release sends like stock.
- Look at: the whole flow needs microphone/camera — the live recording UX was
  never exercised (browser-owned, packet 033); verify release-pause, preview
  send, discard and the short-recording cancel by hand.
- **[AUTH · content: a test chat + microphone (and camera for round)]**
- PASS/FAIL:

### 2.4 CHAT-34 — "Confirm before calling"

- Chats tab. Default **on** (Android `AskBeforeCalling=true`).
- On → a manual voice/video call first asks "Start a voice call with …?" /
  "Start a video call with …?"; the existing privacy check still runs first;
  consent then starts (or replaces) the call; cancelling before consent never
  reaches the call path.
- Off → stock immediate call start.
- Look at: cancel path, voice and video variants.
- **[AUTH · content: a peer callable on Telegram]**
- PASS/FAIL:

### 2.5 CHAT-36 — "Confirm before sending bot commands"

- Chats tab. Default **off**.
- On → tapping a bot command (command link in a message, the bot's menu, or a
  "/" hint) shows "Send @bot command?" with the full command text; consent
  sends; cancel keeps the draft and the menu open. In-off mode the helper
  returns synchronously (stock).
- Look at: all three owner surfaces (in-message link, bot menu, "/" hints);
  cancel leaves the input untouched.
- **[AUTH · content: a bot with commands]**
- PASS/FAIL:

### 2.6 CHAT-38 — "When pasting links" (Remove tracking from links)

- Chats tab → section "Remove tracking from links" → second row. Default
  **on** (Android default).
- On → pasting a URL strips tracking parameters via the AdGuard URL-tracking
  filter shipped from the Android source; an ordinary link is preserved; the
  clean-up does not create a separate undo step (Ctrl+Z undoes the paste in
  one step); a deferred cleaner never overwrites your edits.
- Off → paste is stock (URL untouched).
- Look at: paste `https://example.com/?fbclid=…` — parameter gone; paste a
  plain URL — unchanged; Undo/Redo behavior.
- **[AUTH · content: a test chat]**
- PASS/FAIL:

### 2.7 MENU-01 — "Bottom Button" (Hide / Mute / Discuss)

- Chats tab → section "Bottom Button". Default **Mute**.
- Mute → the channel's bottom button mutes/unmutes for real; Discuss → shows
  when the channel has a linked discussion group; Hide → the button is gone.
- Off-equivalent: the selector's default is Android's (Mute); stock Web K
  shows its own mute button.
- Look at: a channel with a linked discussion group (Discuss must appear and
  open it) and one without (Mute/Unmute must work); switch modes live.
  Handler receivers, late answers and live switching were fixed in packet 008;
  the full chat with a real account was not checked — verify clicks by hand.
- **[AUTH · content: a channel you own or can mute, ideally with a linked
  discussion group]**
- PASS/FAIL:

### 2.8 HIDE-06 — "Hide “Send as” button"

- Chats tab. Default **off**.
- On → the sender-selector button in the message field hides together with
  its 44px field offset; your current sender stays selected; the bot-command
  offset (`data-offset=commands`) is untouched; the paid-reactions sender
  control is not affected.
- Off → the button returns without new requests or avatar re-creation.
- Look at: a channel where you can post as multiple identities; field layout
  shift on toggle; RTL (fixture-verified only: sender offset 44→0→44px,
  commands offset unchanged at −44px in RTL).
- **[AUTH · content: a channel with "post as" choices]**
- PASS/FAIL:

### 2.9 CHAT-16 — "Add comma after mention"

- General tab, last row. Default **on**.
- On → inserting a mention with a @username appends a comma (Android
  `appendMention`), except bots; named mentions keep a space; mention
  entity length/offset stay valid.
- Off → stock insertion.
- Look at: user mention vs bot mention vs named mention; a slow peer lookup
  must not land the comma in another chat after you switch chats (middleware
  guard, packet 021).
- **[AUTH · content: a chat where you can type @mentions]**
- PASS/FAIL:

### 2.10 CHAT-14 — "Delete for both sides by default"

- Chats tab. Default **on** (Android `DeleteChatForBothSides=true`).
- On → the existing "also delete for…" revoke checkbox comes pre-ticked in
  the delete-chat and message-delete dialogs where Telegram offers it. The
  final checkbox state is yours; opening the dialog deletes nothing;
  unavailable revoke variants stay unavailable; clear-history is unchanged.
- Off → no preselection.
- Look at: private chat delete, message delete with revoke available, a
  context where revoke is not offered, Escape with focus return. Deletion
  itself is real — confirm nothing in this step.
- **[AUTH · content: a test chat you may delete from (do not confirm)]**
- PASS/FAIL:

### 2.11 MEDIA-01 — "Always Send in HD" (wired; **checklist entry unchecked — completeness explicitly unverified**)

- Chats tab, last row of the main toggles. Default **on**.
- On → photos upload through the HD pipeline (2560px side limit, no forced
  re-encode quality). Off → Android's SD pipeline: 1280px side limit and the
  compressed re-encode. The web wiring lives in the photo upload preparation
  (`photoUploadPreparation.ts`); the checklist records only that "an
  implementation or part of it exists; completeness still to verify".
- Look at: send the same photo both ways to a test chat and compare received
  resolution/size; watch the HD badge if Web K shows one.
- **[AUTH · content: a test chat + a photo]**
- PASS/FAIL:

### 2.12 CHAT-37 — "When opening links" (packet 061; checklist entry unchecked — the click path awaits this review)

- Chats tab → section "Remove tracking from links" → first row. Default
  **on** (Android's default too).
- On → every opened link strips tracking parameters with the same AdGuard
  filter as 2.6 — both the app's own openUrl calls (bot buttons, poll links,
  stories) and, since packet 061, plain message anchors: the anchor's href is
  rewritten before the browser navigates, and every way a link opens (plain
  click, middle click, the 2.1 confirmation's re-click) reads the cleaned
  destination. The alert of 2.1 names the cleaned URL (Android cleans before
  its own confirm too). Off → URLs pass through untouched.
- Look at: open (not paste) a tracked URL from a message (e.g. an
  `?fbclid=` link); confirm the opened destination lost its tracking
  parameters; the link's hover preview and right-click "Copy link address"
  still show the original; middle-click the link — the new tab is cleaned
  too; with 2.1 set to confirm, the dialog names the cleaned URL and the
  opened page is cleaned; a link without tracking parameters navigates
  exactly as before (no tab-focus or timing change); a `tg://` link still
  routes inside the app.
- **[AUTH · content: a message with a tracked link]**
- PASS/FAIL:

### 2.13 CHAT-30 — "Fix link previews" (packet 036; appended after the snapshot)

- Chats tab, the link group beside 2.2's row. Default **on** (Android
  NaConfig default `true`).
- On → the URL the composer fetches the preview for is rewritten by the
  built-in `PagePreviewRulesHelper` rules before the fetch: x.com →
  fixupx.com, twitter.com → fxtwitter.com, www.instagram.com →
  kkinstagram.com, vm/vt/www.tiktok.com → their kktiktok hosts,
  www.reddit.com → www.rxddit.com, bsky.app → fxbsky.app, www.pixiv.net →
  www.phixiv.net, coolapk.com → coolapk1s.com. The sent text is never
  rewritten — only the preview's source URL is.
- Off → previews are fetched from the original URL (stock behavior).
- Look at: compose (do not send) a message with an x.com post link — the
  preview plate should render the fixupx embed; repeat with the setting off
  and compare. Then send one message with such a link and confirm the text
  arrived exactly as typed.
- Caveat carried from packet 036: whether fixupx/fxtwitter actually return
  an embed for a given post is a property of those third-party services — a
  missing embed there is not automatically a port defect.
- **[AUTH · content: a chat to compose in; a post link on x.com or
  twitter.com]**
- PASS/FAIL:

### 2.14 HIDE-08 — "Hide Gift Button in Channels" (packet 037; appended after the snapshot)

- Chats tab, after 2.8's "Hide share button" row. Default **off** (Android
  NaConfig default `false`).
- On → the channel "can't write" plate (the Mute/Subscribe row with side
  buttons) loses its trailing **gift** button. The plate's other side buttons
  (write-in-direct) and its centre button keep their behavior, and the user
  chat's own send-gift button (a different control, gated by the privacy
  `display_gifts_button` flags) is not affected.
- Off → the gift button returns on an eligible channel plate.
- Look at: open a broadcast channel you can't post in — the plate shows
  Mute + gift; toggle the row and confirm the gift button disappears/returns
  immediately (live), then reset and confirm it is back. Open a private chat
  with a user where the composer's send-gift button appears — it must be
  untouched in both states.
- **[AUTH · content: a broadcast channel you are subscribed to but cannot
  post in; optionally a private chat whose send-gift button is visible]**
- PASS/FAIL:

### 2.15 HIDE-13 / HIDE-11 — attach menu camera tile and money item (packet 039; documented equivalence — no controls)

These two are audit resolutions, not toggles — there is nothing to switch and
this entry only tells you what to confirm if you look at the attach menu.

- Android's `hideCameraTile` removes the **camera tile** from the attach
  panel's grid; Android's `hideMoneyButton` removes the wallet **"Money"**
  item (only shown while `walletAvailable`). The web attach menu (the
  paperclip popup) has neither: its fixed actions are Photo or Video, Audio,
  Document, Music, Location, article/collage/slideshow/edit, Gift Premium,
  Poll, Checklist plus the account's attach bots, and the instant camera is
  the composer's mic button — a different control. The settings' outcomes are
  therefore the web's permanent behavior, exactly like 5.17 (CHAT-20).
- Look at (optional): open any chat's paperclip popup and confirm there is no
  camera tile and no money item to hide.
- Importing an Android `.extera` backup that carries `hideCameraTile` applies
  it silently (the documented no-op); it must not appear as unsupported.
- PASS/FAIL:

### 2.16 CHAT-35 — "Repeat" action and its confirmation (packet 043)

Two rows: Chats tab → "Message menu" → **Repeat** (Android
`showRepeat`, default off — adds the action), and the ask-when group's
**Repeating messages** (Android `repeatConfirm`, default on — asks first).

- Off state: the message context menu has no Repeat item (stock).
- On: long-press / right-click a message → "Repeat" appears (redo icon,
  beside Forward; outgoing messages included). Invoking it either shows a
  "Repeat / Are you sure you want to Repost?" dialog (default) and, on OK,
  sends the message again into the same chat — no forward picker, the copy
  keeps its forward header — or, with "Repeating messages" off, sends at
  once. Cancel closes without sending.
- The item never shows in chats you cannot post in, noforwards chats, or
  scheduled / service messages.
- Look at: repeat a text message to the same chat and see it arrive with the
  forward header; toggle "Repeating messages" and see the dialog disappear.
- **[AUTH · content: a chat you can post in]**
- PASS/FAIL:

### 2.17 CHAT-10 / CHAT-11 — Double-tap actions (packet 051)

Chats tab → "Double tap": **Double Tap Incoming** and **Double Tap Outgoing**
selectors (Android NaConfig `DoubleTapAction` / `DoubleTapActionOut`,
defaults 1 = Send Reactions on both sides), and — while either side sends
reactions — a **Reaction on Double Tap** row that opens the stock Quick
Reaction subtab (the web's own account reaction chooser stands in for
Android's `reaction_on_double_tap`).

- The actions: None, Send Reactions, Show Reactions (opens the message's
  context menu at the bubble), Translate, Reply, Forward, Add to Saved
  Messages, Save to device (media only), Repeat (the repeat confirmation
  applies), Repeat as Copy (sent again without the forward header), Delete;
  the outgoing selector adds Edit. Android's LLM translate has no web
  provider and is not offered — an imported value of it does nothing.
- The stock web behavior (double click replies to an incoming message,
  nothing on outgoing) is the Reply / None combination.
- A double click that selects text stays a selection — no action fires on it.
- Look at: the defaults — double-click an incoming and an outgoing message,
  the quick reaction lands on both; set incoming to Reply and outgoing to
  None — the stock behavior returns; walk the other actions (Show Reactions,
  Translate on a foreign-language message, Forward, Add to Saved Messages,
  Save to device on a photo, Repeat with and without its confirmation,
  Repeat as Copy — no forward header on arrival, Delete, Edit on an outgoing
  message); the Reaction row disappears when neither side sends reactions and
  comes back otherwise; the chosen Quick Reaction is what the double click
  sends; double-click a word to select it — no action fires.
- **[AUTH · content: a chat you can post in; a photo message; a
  foreign-language message; Saved Messages visible]**
- PASS/FAIL:

---

## Batch 3 — Live playback

Real media, real tab-hiding. Packet 030's regression drives the real
`visibilitychange` handler, but "what a real hidden tab does with live media"
was explicitly left browser-owned — that is this batch.

### 3.1 MEDIA-13 — "Auto-Pause → Video"

- Chats tab → section "Auto-Pause" → row "Video". Default **on** (Android
  Neko `AutoPauseVideo`; the persisted key is the contract).
- On → hiding the tab (switch to another tab/window) while a video plays
  pauses it; music never pauses, like Android. Backup alias
  `pauseOnMinimizeVideo` round-trips.
- Off → video keeps playing in a hidden tab.
- Look at: video mid-playback, hide the tab, come back — paused; music
  playing during the same hide — still going.
- **[AUTH · content: a playing video]**
- PASS/FAIL:

### 3.2 MEDIA-14 — "Auto-Pause → Voice"

- Same section, row "Voice". Default **off** (= stock: voice keeps playing).
- On → a playing voice message pauses when the tab hides.
- Look at: as 3.1, with a voice message.
- **[AUTH · content: a playing voice message]**
- PASS/FAIL:

### 3.3 MEDIA-15 — "Auto-Pause → Round"

- Same section, row "Round". Default **off**.
- On → a playing round video message pauses when the tab hides.
- Look at: as 3.1, with a round video.
- **[AUTH · content: a playing round video]**
- PASS/FAIL:

### 3.4 MEDIA-17 — "Do not autoplay the next voice message"

- Chats tab, in the main toggle list. Default **off** (= stock: the next
  voice message autoplays).
- On → after a voice message finishes, playback stops instead of starting the
  next one. Music, round videos and a manual "next" are unchanged.
- Look at: two consecutive voice messages; toggle; no Android backup alias
  exists for this key (packet 015) — local persistence/reset only.
- **[AUTH · content: a chat with several voice messages]**
- PASS/FAIL:

### 3.5 PLAYER-01 (base music popup — implemented in 028, visual review pending)

- Play an audio track from any chat → the MD3 music popup opens with cover,
  metadata, timeline and transport driven by the existing playback
  controller; it follows media events and the account session; voice/round
  playback keeps its own entry. The repeat button cycles off → playlist →
  track with each mode announced (see 1.17).
- Look at: open/close, next/prev, seek, the mini-player artwork (1.8), and
  the style rows of Batch 1 acting on this popup live. Queue, lyrics and
  gestures are absent by design.
- **[AUTH · content: an audio track]**
- PASS/FAIL:

---

## Batch 4 — Dialogs, headers and message visuals

Chat list, chat header, profile and in-message visuals. Mostly low-risk CSS/
formatting changes with live toggles; the fixture history is noted where the
only prior check was synthetic.

### 4.1 LOOK-03 — "Sender Mini Avatars"

- Appearance tab → section "Avatar Corners" → row "Sender Mini Avatars".
  Default **on**.
- On → a 20×20 avatar of the row's last sender appears beside each group-chat
  row in the chat list; updates live; the same sender repeated keeps one
  avatar; clearing/retiring the sender removes it.
- Off → stock rows with no avatar nodes left behind.
- Look at: a busy group's rows while new messages arrive; scroll up/down for
  duplicates; RTL. Verified only on synthetic peers so far (packet 002) —
  real photos were never used; check with real avatars.
- **[AUTH · content: a group chat with recent senders]**
- PASS/FAIL:

### 4.2 GEN-03 — "Format Time with Seconds"

- General tab. Default **off**.
- On → message times show `HH:MM:SS` (12/24h respected), updating live in an
  already open chat; the full timestamp view too. Durations, dates without
  time and date separators stay untouched.
- Off → stock `HH:MM`, byte-identical.
- Look at: an open chat while toggling (no re-entry needed); both clock
  formats; the edited-time label.
- **[AUTH · content: any chat with messages]**
- PASS/FAIL:

### 4.3 GEN-02 — "Disable Number Rounding"

- General tab. Default **off**.
- On → counters show full digits with locale separators (`1 234`) instead of
  `1.2K/1.2M` — dialog unread badges, archive, message views, reactions,
  poll votes, replies, statistics, etc. (25 consumers). Already-rendered
  counters update in place.
- Off → stock rounded counters.
- Look at: a counter above 1000 (chat list badge, views on a channel post);
  live update when the count changes.
- **[AUTH · content: a chat or post with a 1000+ counter]**
- PASS/FAIL:

### 4.4 HIDE-12 — "Hide Reactions" (Channels / Groups / Private Chats)

- Chats tab → section "Hide Reactions" → three toggles. All default **off**.
- On (per type) → reaction strips hide in matching chats, instantly, from the
  peer type classified in the UI cache — no re-creation, no extra requests;
  broadcast channels are distinct from megagroups; a reused row's class
  updates.
- Off → reactions return with content intact.
- Look at: the same toggle against a channel, a megagroup and a private chat;
  existing selections/media inside strips must survive hide/unhide.
- **[AUTH · content: a channel, a group and a private chat with reactions]**
- PASS/FAIL:

### 4.5 CHAT-23 — "Remove Message Tail"

- Chats tab, first row. Default **on** (Android default).
- On → the bubble tail SVG is hidden and both bottom corners are fully
  rounded (15px preserved).
- Off → the tail returns and only the tail-side bottom corner is squared
  (incoming end-start, outgoing end-end).
- Look at: incoming and outgoing bubbles, live toggle, RTL flip (all
  fixture-verified in packet 025; confirm on real bubbles).
- **[AUTH · content: any chat with bubbles]**
- PASS/FAIL:

### 4.6 LOOK-02 — "Single Corner Radius" (wired; **checklist entry unchecked — completeness explicitly unverified**)

- Appearance tab → "Avatar Corners" section, second row, subtitle "Forums
  will have the same avatar shape as chats". Default **off**.
- On → all avatars get the same corner shape regardless of the circle-vs-
  squircle the stock code requested (Android `ImageReceiver` computes one
  uniform radius from the avatar diameter; the web wires a root class
  `oe-single-corner-radius`). The checklist says completeness is not yet
  verified.
- Off → stock per-context avatar shapes.
- Look at: a forum's topic list and chat rows vs regular chats — avatar shape
  must match across them when on; combined with the Avatar Corners slider
  (see the unverified-rows table below).
- **[AUTH · content: a forum (topic-enabled group)]**
- PASS/FAIL:

### 4.7 HIDE-01 — "Hide Premium and emoji status in headers"

- Appearance tab, third section, first row. Default **off**.
- On → Premium star and emoji-status icons hide beside titles in the chat
  header (`chat-info`) and the profile name only. The chat list stays stock;
  verified/scam badges are never touched; the emoji stays loaded (pure UI
  hide).
- Off → icons return instantly.
- Look at: a peer with an emoji status or Premium; chat header, profile,
  then the chat list row of the same peer (must keep its icons); story-viewer
  status is out of scope for now.
- **[AUTH · content: a peer with an emoji status / Premium]**
- PASS/FAIL:

### 4.8 CHAT-24 — "Replace “edited” with an icon"

- Chats tab. Default **on**.
- On → the "edited" text label becomes the stock Telegram edit icon with an
  accessible localized label; the primary-edited-date mode and the ephemeral
  "updated" label are preserved.
- Off → stock text label.
- Look at: an edited message's time area; screen-reader label if you use one
  (never tested with a screen reader).
- **[AUTH · content: an edited message]**
- PASS/FAIL:

### 4.9 CHAT-27 — "Original date in forwarded messages"

- Chats tab. Default **off**.
- On → the forwarded header shows the original date/time beside the forwarded
  author (from `fwd_from.date`, not `saved_date`), localized, order kept in
  RTL; messages already on screen update after reopening the chat (the row's
  caption says so).
- Off → stock forwarded header.
- Look at: a forwarded message with a known original date; reopen the chat to
  refresh; also confirm the native hover-title still shows its own saved
  date correctly (packet 023 fixed a saved_date-as-milliseconds bug there).
- **[AUTH · content: a forwarded message]**
- PASS/FAIL:

### 4.10 CHAT-28 — "Message time hint"

- Chats tab, next row. Default **off**.
- On → clicking a message timestamp opens a tooltip with localized "Sent: …",
  "Edited: …" (unless edit-hide) and "Original: …" lines, seconds included.
  Enter/Space open, Escape closes, auto-close on outside click; the off state
  keeps Web K's native hover tooltip and message selection.
- Off → stock hover behavior.
- Look at: keyboard open/close, focus restoration, RTL (`dir=auto` lines),
  selection-mode clicks untouched.
- **[AUTH · content: any message]**
- PASS/FAIL:

### 4.11 CHAT-04 — "Replies: Background Colors"

- Chats tab, in the reply rows. Default **on**.
- On → replies use the replied peer's individual accent color. Off → the
  accent and the reply line return to the theme color (this also resets the
  gradient line — the defect fixed in packet 019).
- **[AUTH · content: a reply with a colored peer]**
- PASS/FAIL:

### 4.12 CHAT-05 — "Replies: Emoji"

- Default **on**. Off → the reply's pattern/emoji and the collectible-gift
  thumbnail hide and the gift's inline padding is removed.
- Look at: a reply quoting a collectible gift (verified with a stand-in only).
- **[AUTH · content: a reply with an emoji pattern / collectible gift]**
- PASS/FAIL:

### 4.13 CHAT-06 — "Replies: Background"

- Default **on**. Off → the reply's tinted background (`rgba(...,.1)`)
  becomes transparent. Independent of 4.11/4.12; all three round-trip in
  backup.
- **[AUTH · content: any reply]**
- PASS/FAIL:

### 4.14 GEN-05 — "Relative Last Seen"

- General tab. Default **off**.
- On → statuses within the past 24 hours read "last seen X minutes/hours
  ago", including yesterday — across midnight and New Year; from 24h onward
  the ordinary date/time returns; negative differences clamp to 0.
- Never revealed: approximate/private statuses, `online`, bots, support and
  service users keep their stock strings.
- Look at: a peer last seen yesterday evening (midnight crossing), one seen
  >24h ago (falls back), an open chat header (refreshes on its own 60s timer
  or on reopen — the caption says so).
- **[AUTH · content: peers with different last-seen ages]**
- PASS/FAIL:

### 4.15 GEN-06 — "Hide my phone number"

- General tab. Default **on** (Android `HidePhone=true`).
- On → your phone number is removed from your own profile display — locally
  only; your Telegram privacy settings are unchanged; contacts, copy actions
  and anonymous numbers behave as before.
- Off → the number shows again.
- Look at: your own profile; a contact's profile (must keep the number).
- **[AUTH]**
- PASS/FAIL:

### 4.16 GEN-07 — "Show ID and data center" (Hidden / Telegram API / Bot API)

- General tab, first row. Default **Telegram API** (Android `IdDcType=1`).
- Telegram API → profiles show the raw Telegram ID (users `id`, ordinary
  groups `-id`, channels `-(1000000000000 + id)`); Bot API → the Bot API
  form; Hidden → stock, nothing shown. DC comes from the local connection for
  yourself, `stats_dc`/photo for chats, photo for other users; "data center
  unknown" when nothing is available — no guessing. Copy works.
- Off-equivalent: set Hidden.
- Look at: your profile, a contact, a channel, a group; copy to clipboard;
  switching modes by keyboard.
- **[AUTH]**
- PASS/FAIL:

### 4.17 GEN-04 — "Filter Zalgo text"

- General tab. Default **off**.
- On → displayed text (messages and names) with four or more consecutive
  combining marks in the first 4..2048 UTF-16 chars triggers the Android
  algorithm: all combining marks are stripped from the rendered text.
  Original entities, links and offsets are untouched; drafts are never
  filtered; already-rendered messages refresh on chat reopen (caption says
  so).
- Off → raw text renders as-is.
- Look at: send a Zalgo string to Saved Messages, toggle, reopen; confirm a
  normal link inside the same message still opens and text entities hold.
- **[AUTH · content: a Zalgo test message (Saved Messages is fine)]**
- PASS/FAIL:

### 4.18 LOOK-05 — "Center Title"

- Appearance tab, last section. Default **off** (= stock: start-aligned).
- On → every sidebar header's title (and its subtitle row) centers between
  the leading and trailing buttons; the chats header, settings tabs, the
  selection count header. Live toggle, no reload.
- Look at: the chat list header and a settings tab's header in both states;
  RTL (`?rtl=1`) — centering is direction-neutral either way.
- **[AUTH · any signed-in view]**
- PASS/FAIL:

### 4.19 LOOK-08 — "System Font"

- Appearance tab, last section. Default **on** (Android's
  `TypefaceUseDefault` = true): the interface renders with the platform
  fonts instead of the bundled Roboto.
- Off → the app returns to the built-in Roboto everywhere; on → the system
  stack applies. The serif, mono and rounded families (headings, code,
  counters) keep their own fonts — Android's switch covers the main Roboto
  requests only.
- Look at: a chat and a settings screen in both states — letterforms change
  app-wide, code blocks and headings do not.
- **[AUTH · any signed-in view]**
- PASS/FAIL:

### 4.20 CHAT-40 — "Wide posts" (Channel posts)

- Chats tab, "Channel posts" section. Default **off** (= stock: posts hug
  their content, capped at 85% of the column).
- On → a broadcast channel's posts (text-ish bubbles; albums and
  backgroundless media keep their own layout) stretch their bubble over the
  available width. Live toggle.
- Look at: open a channel you post in (or a channel with text posts), toggle,
  compare; check an album post stays a grid; check RTL keeps the stretch
  symmetric (width is direction-neutral).
- **[AUTH · content: a channel with posts]**
- PASS/FAIL:

### 4.21 LOOK-01 / LOOK-02 — "Avatar Corners" and "Single Corner Radius" (packets 059, appended)

- Appearance tab, "Avatar Corners" section (the slider with the avatar
  preview, then the toggle). Slider default **28** (= stock circles), toggle
  default **off**.
- Slider: drag it down — every avatar squares off (28 = circle … 0 = square);
  the live preview row follows. Forum chats (topics groups) now follow the
  slider too, at ~2/3 of the normal radius (Android's 42/64 forum scale) —
  check a topics-group avatar in the chat list against a regular chat's.
- Toggle on → forum avatars take exactly the common radius (no scale).
- Back to 28 → everything returns to the stock circles byte-for-byte
  (including the forum's own 37% squircle).
- Look at: chat list with a topics group, a chat header, the profile;
  RTL unchanged (radius is direction-neutral).
- **[AUTH · content: a topics group in the chat list]**
- PASS/FAIL:

### 4.22 LOOK-11 / LOOK-12 — "Section Radius" and "Separate Headers" (packets 060, appended)

- Appearance tab, "Sections" area. Radius default **20** (= stock Web K
  cards), Separate Headers default **on** (Android's default).
- Radius: set 0 → every settings card (both sidebars and popups that use the
  section card) goes square-cornered; set 28 → pill-like cards. Back to 20 →
  the stock 24px radius returns. The hub's own summary chips and MD3
  list-item segments follow the slider.
- Separate Headers: on → each section's title floats free above its card
  (its own line, not inside the card). Off → titles sit inside the card
  again (the stock Web K look). Live toggle anywhere in the Preferences hub.
  With the MD3 "List items" toggle on, titles stay separated even when
  Separate Headers is off.
- Look at: the Preferences hub tabs, a sidebarRight tab (e.g. Chat Settings
  of a peer), a popup with section cards; RTL — the separated header's
  margins are logical, the card edges mirror.
- **[AUTH · content: any account — hub only]**
- PASS/FAIL:

---

## Batch 5 — Folders, search, stickers and everything else

### 5.1 GEN-14 — "Hide archive folder"

- General tab. Default **off** (= stock: the archive row shows).
- On → the archive row in the chat list disappears, live; the "Archived
  chats" entry in the main menu remains. This inverts Web K's own
  `showArchiveInChatList` — one native source, no second state.
- Off → the row returns.
- Look at: with an archived chat present; the main-menu entry still opens the
  archive; reset restores the row.
- **[AUTH · content: at least one archived chat]**
- PASS/FAIL:

### 5.1a GEN-12 — "Sort by Unread" (packet 044; appended after the snapshot)

- General tab, right above "Hide archive folder". Default **off** (= stock:
  the list is ordered by the last message's date, pinned on top).
- On → chats with unread mentions, unread reactions or an unmuted unread
  counter rise above every read chat in the open folder, under the pinned
  ones; among themselves and among the read ones the date order holds. Muted
  unread chats stay in date order. The toggle is live: the open list rebuilds
  once (Android answers the same toggle with a full re-sort); folders,
  the archive and forum topic lists follow the same order.
- Off → the stock date order returns, live.
- Look at: a folder where an old chat is unread and a newer one is read —
  with the setting on the unread one must stand above; pin a chat and confirm
  it stays above the unread block; mark the unread chat read and watch it
  drop back; scroll deep into the list and page further (pagination walks the
  same indexes). A forum with unread topics rises as a whole.
- Caveats carried from packet 044: a freshly loaded forum sorts by date until
  its topics arrive; the rebuilt list's animation and RTL are unverified in a
  browser.
- **[AUTH · content: a folder with at least one unread chat and one read
  chat; ideally an old unread chat]**
- PASS/FAIL:

### 5.2 LOOK-27 — "Notification counter" (All chats / Except muted / Off)

- Appearance tab → section "Notification counter". Default **Except muted**
  (= Web K stock behavior).
- All chats → every tab's badge counts muted chats too, including the All
  tab. Off → folder-bar badges hidden whole. Except muted → stock.
- Look at: a folder bar with muted unread chats; badges recompute live on
  change and reset (Android itself only offers a restart hint). The folder
  bar's visual result and RTL are unverified in a browser (packet 034).
- **[AUTH · content: folders + muted chats with unread]**
- PASS/FAIL:

### 5.3 CHAT-22 — "Hashtag search" (Default hashtag page in chats / in channels)

- Chats tab → section "Hashtag search" → two selectors. Defaults **This
  Chat** (0) both.
- The page a hashtag search opens on: This Chat (stock), My Messages, Public
  Posts. Public broadcast channels use the channel key; everything else the
  chat key. Your own manual pick of the search strip still wins for that
  search, as in Android.
- Look at: click a hashtag in a private chat and in a public channel; confirm
  the preselected type strip; manually change the strip afterwards. The seed
  runs only inside a mounted chat and its runtime path over the real topbar
  is unverified in a browser (packet 032).
- **[AUTH · content: a message with a hashtag + a public channel]**
- PASS/FAIL:

### 5.3a CHAT-21 — "Disable Global Search" (packet 038; appended after the snapshot)

- Chats tab → section before "Hashtag search" (Android's search group order).
  Default **off** (Android NaConfig default `false`).
- On → the chat list search's **Global search** group (server-wide users you
  don't have as contacts) never renders; your own chats, your contacts, their
  messages and the sponsored chips keep their owners. Android's
  `DialogsSearchAdapter.globalResultsAllowed` is the source of the mapping.
- Off → the Global search group returns with the next search.
- Look at: type a username of someone who is NOT one of your contacts in the
  sidebar search — with the setting off they appear under "Global search";
  with it on, the group stays absent while your own matching chats/contacts
  still list. Search inside an open chat is unaffected in both states.
- Caveat carried from packet 038: the live toggle takes effect on the next
  search (the gate reads the setting when the results arrive); the runtime
  path over the real sidebar search is unverified in a browser.
- **[AUTH · content: a contact to search for; a non-contact username to
  search for]**
- PASS/FAIL:

### 5.3b HIDE-05 — 'Hide "All chats" Tab' (packet 040; appended after the snapshot)

- Chats tab, after the "Hide Floating Button" row. Default **off** (Android
  NekoConfig default `false`).
- On → the folder tab bar and the folder rail drop the **All chats** tab
  while at least one real folder remains; the open chat list moves to the
  first visible folder through the tab click path (the selection, the back
  stack and the folder swipes read the same list). With no real folders the
  All tab stays (the bar is never left empty). Backup alias `hideAllChats`
  round-trips.
- Off → the All tab returns (unselected; the current folder stays open until
  you click it).
- Look at: an account with folders — toggle live and confirm the All tab
  leaves and the first folder becomes the open list; toggle back and confirm
  it returns. Also confirm the folder tab counters still update and the
  context menu / unread-only bar still behave on a folder list.
- Caveat carried from packet 040: the tabs' live reshaping (removal/re-add
  animation, RTL) and the bootstrap on a fresh session are unverified in a
  browser.
- **[AUTH · content: an account with at least one folder]**
- PASS/FAIL:

### 5.4 HIDE-02 — "Disable Stories"

- Chats tab, hiding group (between the status and floating-button rows).
  Default **on** (Android `HideStoriesFromHeader=true`) — i.e. the strip is
  hidden out of the box.
- On → the stories strip above the chat list is never shown (main sidebar and
  archived container), out of layout and the accessibility tree. Stories in
  the chat header and the viewer remain available — this hides only the
  strip. Backup alias `hideStories` round-trips.
- Off → the strip returns.
- Look at: an account with stories; toggle live; the strip's visual result is
  unverified in a browser (packet 035) — that is this check.
- **[AUTH · content: an account with stories]**
- PASS/FAIL:

### 5.5 HIDE-03 — "Hide Floating Button"

- Chats tab. Default **off**.
- On → only the floating new-chat button hides; chat creation stays available
  through the existing "Create a new…" menu path; the update button's linked
  visibility and search focus behavior are unchanged.
- Off → the button returns.
- Look at: open/close search, the update button, and create a chat via the
  menu while hidden. Full sidebar on a real account was not verified
  (packet 005) — that is this check.
- **[AUTH]**
- PASS/FAIL:

### 5.6 HIDE-07 — "Hide share button on channel posts"

- Chats tab. Default **off**.
- On → the side share button hides on channel posts outside Saved Messages;
  the ordinary Forward action in the message menu is untouched.
- **[AUTH · content: a channel post (and Saved Messages to compare)]**
- PASS/FAIL:

### 5.7 HIDE-09 — "Hide Search Button in Channels"

- Chats tab. Default **off**. On → the search button hides in an open
  broadcast channel, **applied immediately to the already-open chat**.
- **[AUTH · content: an open channel]**
- PASS/FAIL:

### 5.8 HIDE-10 — "Hide Call Button"

- Chats tab. Default **off**. On → the call button hides in the open chat,
  applied immediately; calling stays possible through the menu (the call
  menu checks the setting); base availability is computed separately.
- Look at: toggle while a chat is open; then 2.4 still guards any call.
- **[AUTH · content: an open peer chat]**
- PASS/FAIL:

### 5.9 HIDE-14 — "Hide trending sticker packs"

- Chats tab. Default **on** (Android `DisableTrending=true`).
- On → recommended packs are neither requested nor shown in sticker search
  and in the empty-window tip card; explicit pack search still works; a late
  response never restores the hidden recommendations.
- Off → trending recommendations return.
- **[AUTH · content: sticker panel open]**
- PASS/FAIL:

### 5.10 HIDE-15 — "Hide group sticker pack"

- Chats tab. Default **off**.
- On → the group's sticker section is not requested or shown (including the
  admin placeholder) until full info arrives; reopening the panel refreshes;
  group custom emoji and installed sets are untouched.
- **[AUTH · content: a group with a sticker set]**
- PASS/FAIL:

### 5.11 HIDE-16 — "Hide greeting sticker"

- Chats tab. Default **on** (Android `DontSendGreetingSticker=true`).
- On → an empty chat keeps its text; the greeting sticker is not fetched or
  mounted. Already-open chats refresh on reopen (caption says so).
- Off → stock greeting sticker.
- **[AUTH · content: a chat with no history]**
- PASS/FAIL:

### 5.12 HIDE-21 — "Hide Premium section in Settings"

- Chats tab. Default **off**.
- On → the real Premium/Business/Stars/Gifts section of Settings hides,
  including its rows in settings search and recent results; server-side
  purchase limits are untouched.
- **[AUTH]**
- PASS/FAIL:

### 5.13 HIDE-22 — "Hide Help section in Settings"

- Chats tab. Default **on** (hidden by default, as in Android). The
  adaptation adds four Android help items to the existing Settings screen;
  support opens the official web form instead of an Android chat.
- Off → the Help section shows with the four items.
- Look at: search results respect the hide; the toggles themselves stay
  searchable. No agent ever sent anything through those forms.
- **[AUTH]**
- PASS/FAIL:

### 5.14 CHAT-01 — "Sticker size" (4–20, default 14)

- Chats tab → section "Sticker size", with the built-in static preview
  (UtyanDiscussion, no Telegram requests). Default 14 = Web K's stock 200px;
  scale `1+(size−14)/16` → 75..275px on desktop. Fractional values are kept
  (not rounded); the backup rejects out-of-range values.
- Look at: slider extremes with the preview; a sticker in a chat **after
  reopening the chat** (caption: existing stickers apply on reopen);
  enlarged emoji and explicit-box stickers must not scale.
- **[AUTH · content: a chat with stickers]**
- PASS/FAIL:

### 5.15 CHAT-02 — "Sticker Shape" (Default / Rounded / Message)

- Chats tab. Default **Rounded** (Android default, 6px); Default = as-is
  (0px); Message = the bubble's big corner radius.
- Look at: a sticker in a chat after changing the mode; live CSS, stickers
  only.
- **[AUTH · content: a chat with stickers]**
- PASS/FAIL:

### 5.16 CHAT-03 — "Time on stickers" (On the sticker / On the side / Hidden)

- Chats tab. Default **On the sticker**. Hidden wins over Side when both
  Android flags compose (the selector writes both consistently). Ordinary
  message times are untouched; live root CSS, stickers only.
- Look at: all three modes on a sticker; RTL arrows invert the selector
  direction (fixture-verified); regular bubble time unaffected.
- **[AUTH · content: a chat with stickers]**
- PASS/FAIL:

### 5.17 CHAT-20 — Keep attach button while typing (no toggle — documented equivalence)

- No row exists in the hub: Web K's composer never morphs the attach button
  while typing, so the setting's outcome is the base's permanent behavior and
  a toggle would be empty (packets 034/af8da51). The key
  `OEChatsKeepAttachButton` stays in the record for backup compatibility.
- Verify the stock behavior itself: type in a chat and confirm the attach
  button never changes into anything else.
- **[AUTH · content: any chat]**
- PASS/FAIL:

### 5.18 OTHER-03 — "Reset exterayond settings"

- Other tab → row "Reset exterayond settings". Confirmation popup ("Restore
  exterayond preferences to their defaults? Your Telegram account, chats and
  plugin settings will be kept.", danger button), then a toast "exterayond
  settings reset".
- Resets the OE record and the one native setting the hub owns
  (`showArchiveInChatList`); Telegram settings and account data are separate
  records and stay. The full Android `resetAllSettings` app-restart is not
  reproduced and not claimed.
- Look at: archive row returns (if 5.1 on); every toggled feature from the
  earlier batches returns to its default; counters update live.
- **[no chat data]**
- PASS/FAIL:

---

### 5.19 PILLS-01 / PILLS-06 / PILLS-12 — the Pill Stack strip and its cache pill (packet 052)

- Appearance tab → row "Pill Stack" opens the Pill Stack screen (the web
  analog of Android's `PillStackSettingsActivity`, reachable from Appearance
  on Android too).
- The strip lives at the inline end of the chat list search field. Default
  layout "5,6" shows one pill — **Storage Usage** (the web registry carries
  only the cache pill; Proxy has no web counterpart and stays in the stored
  layout unrendered).
- Look at: the pill shows the client's cached size and refreshes (3-minute
  interval, like `CachePill`); typing in the search field hides the strip,
  clearing it brings it back; the pill's click opens Data & Storage; hub →
  tap the pill in "Active Pills" (it moves to Hidden, the strip empties live),
  tap it in "Hidden Pills" (it returns); "Reset to Default" restores 5,6 with
  a toast; `?rtl=1` — the strip sits at the left edge of the field. The
  switch machinery (packet 053) is inert with one pill — it becomes visible
  when a second pill registers: wheel over the strip and ArrowUp/ArrowDown on
  the pill switch, `OEPillInfiniteScrolling` decides wrap vs. clamp. Where
  CacheStorage is unavailable (Firefox private mode), the pill keeps its name
  with an empty value and the console stays clean (packet 058 — the failed
  collection is contained, nothing rejects).
- **[no chat data]**
- PASS/FAIL:

### 5.20 FOLD-10..13 — the main menu layout over the burger menu (packets 054, 062)

- Appearance tab → row "Main Menu" opens the screen. The stock key (empty)
  keeps the burger menu byte-for-byte stock — check that first.
- On a fresh client (stock key) the hub's Visible list shows the five stock
  items (Saved Messages, Archive, Contacts, Calls, Settings) and Hidden is
  empty — Android's editor read of the current layout (packet 058). The first
  toggle edits that layout: unchecking "Saved Messages" hides exactly it and
  the menu keeps the rest.
- Reorder (packet 062): each visible row has up/down buttons — move "Archive"
  above "Saved Messages"; the next menu open shows the new order. "Settings"
  keeps its position; at the ends the buttons do nothing.
- Dividers (packet 062): "Add a divider" appends a Divider row at the end of
  the visible list (a hairline under the previous item in the burger menu);
  the up/down buttons move it between items; clicking the Divider row removes
  it again. Importing a `.extera` that carries a divider shows the same row.
- Set a layout (e.g. import a `.extera` carrying the Android string, or hide
  an item from the hub): the burger menu re-lays its id-mapped items on the
  next open. "Settings" is never hideable (the web always runs without the
  bottom navigation bar); ids without a web counterpart (Profile, QR, Feed,
  Wallet…) render nothing — never a stub — and cannot be grabbed by the move
  buttons (they drift along invisibly when their neighbors move).
- Look at: "Saved Messages", "Archive", "Contacts", "Calls" move between
  Visible/Hidden live (the next menu open follows); the reordered menu keeps
  its web-only composites in their stock frame; "Reset to Default" restores
  the stock menu with a toast; `?rtl=1` — the menu and the screen mirror
  themselves (the move buttons sit at the row's far end).
- **[no chat data]**
- PASS/FAIL:

### 5.21 W-1..W-3 — the message-menu toggles (packet 055)

- Chats tab → "Add to Saved Messages", "Copy Photo", "Report for incoming
  messages" (all off = stock by default; the user's own config runs the
  first two on).
- With "Add to Saved Messages" on: the message menu shows "Add to Saved
  Messages" on a forwardable message from another peer — clicking sends it
  to your own chat (the same direct forward the double-tap Save uses); the
  item never shows on your own chat or on protected messages. "Copy Photo"
  adds "Copy" on photos and clipboard-copyable documents (toast "Media
  copied" / "Media copy failed"). "Report for incoming messages" extends the
  per-message "Report" item (stock: channels and supergroups) to any chat
  peer — basic groups included — and to bot conversations, Android's
  `currentChat != null || currentUser.bot`; it never appears in a private
  chat with a human, and it opens the stock report popup (packet 058 fixed
  the wiring — the setting had no effect at all).
- Off: no item — byte-for-byte stock.
- **[no chat data]**
- PASS/FAIL:

### 5.22 W-6 — "Bubble Radius" (packet 056)

- Appearance tab → "Bubble Radius" slider (0–17, default 17 = Stock).
- 17 keeps the stock Web K bubble corners byte-for-byte; lower values round
  the far corners to the value in px and clamp the tail-side corners to
  min(6, value) — Android's `MessageDrawable` rule. 0 = square bubbles.
- Look at: a chat with bubbles at 8 then back to 17 (stock returns); both
  incoming and outgoing bubbles, grouped media (the group-first corner
  follows the far radius), the drawn tail keeps its own geometry.
- **[no chat data]**
- PASS/FAIL:

### 5.23 CHAT-26 — "Show Results Before Voting" (packet 063, appended)

- Chats tab, the polls area. Default **off** (= stock: a poll shows options
  until you vote).
- On → a public poll that arrives with results tallied (the server attached
  them; the viewer has not voted) shows its result bars immediately, like
  Android's preview. A `hide_results_until_close` poll keeps hiding them —
  except from the poll's creator. A closed poll always shows results
  (stock), the setting adds nothing there.
- Look at: a channel/group poll you have not voted in where the client
  received results (e.g. a poll someone voted in from another client); the
  bars and percentages appear without voting; voting still works and
  switching back to off restores the stock "vote to see results" state; a
  quiz poll behaves as before.
- **[AUTH · content: a poll with received results you have not voted in]**
- PASS/FAIL:

### 5.24 MEDIA-10 — "Show Small GIF" (packet 066, appended)

- Chats tab → the section captioned "GIF attachments render inside a
  compact 120 px box instead of filling the bubble." Row **"Show Small
  GIF"** (`ShowSmallGIF`, NaConfig bool, default off).
- On → a standalone GIF attachment in a chat renders inside a compact
  120 px box: its media keeps the aspect ratio (the web adaptation —
  Android pins a square 120dp cell and fills it, stretching non-square
  GIFs) and never takes the sizing's minimum-side or text-width
  expansions, so a wide GIF lands around 120 px wide instead of the stock
  ~200+ px. A GIF smaller than the box stays at its natural size (the web
  never zooms media up). Grouped albums, webpage previews, the GIFs search
  grid and the media viewer keep their own sizing, like Android's group
  layout does; the "GIF" label, caption and time keep their places.
- Off: byte-for-byte stock.
- Look at: a chat with a wide GIF and a tall GIF, toggle on (both compact,
  aspect-correct, captions still readable) and off (stock size returns);
  send one with a caption; confirm a grouped GIF album is unchanged.
- **[AUTH · content: a GIF attachment in any chat]**
- PASS/FAIL:

---

### 5.25 MENU-03 / MENU-05 — the menu composition toggles (packet 070, appended; 073 amended)

- Chats tab → **"Chat menu"** (`Exterayond.ChatMenu`): **"Boost Group"**
  (`ChatMenuItemBoostGroup`, default on) gates the chat header menu's
  Boost Channel / Boost Group rows; **"View discussion"**
  (`ChatMenuItemLinkedChat`, default on) gates the header menu's View
  Discussion row. Off hides the row from the menu; on and reset restore
  the stock menu. The menu re-reads the toggles on every open (nothing is
  frozen at build time).
- Chats tab → **"Message menu"** (`Exterayond.MessageMenu`), the rows with a
  real web handler behind them (8 of Android's 24; the rest are recorded in
  the checklist), in Android's row order: **"Repeat"** (packet 043),
  **"Reactions"** (`Reactions`, default on) keeps the reactions strip at the
  top of the message context menu, **"Copy Link"** (`CopyLink`, default on)
  keeps "Copy Message Link", **"Add to Favorites"** ("AddToFavorites",
  default on) keeps the sticker/GIF favorites item.
- Off on any of them → the item disappears from its menu on the next open;
  on or reset → the stock menu. Two Android escapes survive the off state
  (073): the double-tap Show Reactions action (CHAT-10) still opens its menu
  WITH the strip while "Reactions" is off (Android's `|| onDoubleTapped`),
  and "Copy Link" off still keeps the link row for a sticker or a poll post
  in a channel (Android's `isAnyKindOfSticker() || isPoll()`).
- Look at: right-click a message in a channel (a message with reactions) —
  toggle "Reactions" off and confirm the strip is gone and the menu stands
  correctly without it, then on again; with "Reactions" off, double-tap a
  message (the double-tap action set to Show Reactions) and confirm the
  strip IS there; toggle "Copy Link" off on a channel post and confirm the
  item is gone, then confirm it is still there for a channel sticker or poll
  post; toggle "Add to Favorites" off on a sticker and confirm "Delete from
  Favorites" still shows for an already favorited sticker; in a boostable
  channel/group toggle "Boost Group" off and confirm the header menu loses
  the boost row. Day and night themes.
- **[AUTH · content: a channel post with reactions, a sticker, a boostable
  chat]**
- PASS/FAIL:

### 5.26 PLAYER-22..24, 27, 29, 30 — the mini-player rows over the audio plate (packet 074, appended)

- Appearance tab → **"Mini player"** (`Exterayond.Player.Mini`), the rows of
  Android's mini section whose keys have a real surface over the pinned-audio
  plate: **"Cover"** (`OEPlayerMiniCover`, 0 rounded / 1 round / 2 hidden),
  **"Shape"** (`OEPlayerMiniShape`, 0 rounded / 1 pill / 2 square),
  **"Progress"** (`OEPlayerMiniProgress`, 0 ring / 1 line / 2 none /
  3 border), **"Show artist"** (`OEPlayerMiniArtist`, default on),
  **"Next track button"** (`OEPlayerMiniNext`, default on), **"Close
  button"** (`OEPlayerMiniClose`, default on).
- Play a music track so the audio plate shows (packet 028's artwork path
  needs **Settings → Appearance → MD3 → Mini player** on — the cover and the
  shape repaint only the MD3 card; with it off the plate is stock and the
  two rows do nothing, which is itself a check).
- Look at: with Mini player on, walk Cover through Rounded → Round (the
  artwork circles) → Hidden (the cover box leaves, the text follows);
  walk Shape through Rounded → Pill (the card becomes a capsule) → Square
  (10px corners); set Progress to None (the bottom line leaves) and back
  through Ring/Line/Border (the line stays — the ring and the border have no
  web surface, the declared partial); toggle "Show artist" off (the subtitle
  keeps the time, loses the artist; a voice message's date stays); toggle
  "Next track button" and "Close button" off (each button leaves, on and
  reset bring it back). Day and night themes; the plate keeps its layout
  with the cover hidden and the buttons gone.
- **[AUTH · content: a music track with artwork, a voice message]**
- PASS/FAIL:

### 5.27 MENU-06 / MENU-07 / MENU-08 — the text-style, media-viewer and selection-bar compositions (packet 075, appended; amended by packet 076)

- Chats tab → **"Text Style"** (`Exterayond.TextStyle`): **Bold, Italic,
  Underline, Strikethrough, Quote, Spoiler, Link, Date** — the eight
  formatting buttons the web tooltip carries of Android's `Text*` keys
  (all default on). Off removes the button from the formatting tooltip that
  opens over a text selection in the composer; on and reset restore it. The
  tooltip re-reads the toggles on every open.
- Chats tab → **"Media Viewer Menu"** (`Exterayond.MediaViewerMenu`):
  **"Forward"** (`MediaViewerMenuItemForward`, default on) gates the media
  viewer's Forward action. On desktop the viewer's Forward is the top
  button; the more-menu row that carries it on Android is a handheld
  surface only (the menu's trigger is hidden above the handheld
  breakpoint), so packet 076 gates both surfaces with the same key. Off
  removes the top button from the next photo you open (the viewer
  re-reads the key on every open/step) and the more-menu row on a
  handheld-width window.
- Chats tab → **"Action Bar Buttons"** (`Exterayond.ActionBarButtons`):
  **"Forward"** (`ActionBarButtonForward`, default on) gates the selection
  bar's forward button. Off hides it in the current selection too — the
  bar re-reads the key on every selection change, the way Android's
  `updateActionBar` re-applies its own visibility (packet 076); scheduled
  messages' "send now" button is a different action and never hides.
- Look at: select text in the composer and toggle each Text Style item off —
  the button leaves the tooltip and the tooltip keeps its layout; toggle
  Media Viewer Menu → Forward off, open a photo full-screen — the top
  forward button is gone (and on a handheld-width window the more-menu's
  Forward row too), on and the next open brings it back; select two
  messages, toggle Action Bar Buttons → Forward off with the selection
  still open — the bar's forward button leaves at once and returns with
  the toggle on. Day and night themes.
- **[AUTH · content: any chat for the composer and selection, a photo
  message for the viewer]**
- PASS/FAIL:

---

### 5.28 PLAYER-06 — the cover swipe of the MD3 music player (packet 077, appended)

- Appearance tab → **"Cover"** section → **"Swipe the cover to switch
  tracks"** (`OEPlayerCoverSwipe`, default on). The row shows for the card
  and disc covers only (Android's `refreshVisibility` hides it for wide and
  full, where the gesture does not exist either).
- Look at: open the MD3 music player (play a music track with the MD3 Music
  player style on) and drag the cover horizontally — the cover follows the
  pointer (sliding and, for the card, tilting, fading slightly); a release
  under ~70px springs it back, a wider release slides it out and switches to
  the next track (drag left) or the previous one (drag right), the new cover
  entering from the opposite side. A vertical drag does nothing. Off: the
  cover does not drag at all (the stock cover has no gesture) and on/reset
  restores it. A track with no cover (no artwork) still switches.
- Reduced-motion check (Settings → Power Saving → Interface Animations off,
  or `?a11y=1` with motion effects off): the release crossfades instead of
  sliding; with animations fully off the track switches at once.
- **[AUTH · content: a chat with two music tracks]**
- PASS/FAIL:

---

## Batch 6 — Settings backup (.extera) round-trip

Hub location: **Other** tab → "Import settings (.extera)" and "Export
settings". The format is exteraGram's (`EtgBackup`): JSON with sections
`exteraconfig` / `pillstackconfig` / `mainconfig`, wrapped in invisible
characters on export; a plain JSON body with the same sections is accepted on
import. Files are untrusted: wrong types or out-of-range values are rejected
or fall back like a foreign file. The checklist entry OTHER-01 is
**unchecked** — the implementation is regression-tested but awaits exactly
this real-file round trip.

### 6.1 OTHER-01 — Export / import round-trip with a real .extera file

- Export → a file named `exterayond-XXXX.extera` downloads.
- Set a recognizable spread of settings first, e.g.: Remove Message Tail off,
  Notification counter Off, Sticker Shape Message, Sticker size 6, Ask before
  opening links → All links, Disable link preview on, Auto-Pause Voice on,
  folder counter mode 0, Safe mode (Plugins tab) on, Pill Stack: hide the
  cache pill and Infinite Scrolling off (packet 052: the pill layout strings
  travel under `pillstackconfig.activePills` / `hiddenPills`, the scrolling
  flag under `exteraconfig.infiniteScrolling`).
- Import the file on a reset profile (or after OTHER-03): the toast "Applied
  N settings from the backup" appears and every setting above returns,
  including **plugin flags** — `pluginsSafeMode` and `pluginsDevMode` travel
  inside `exteraconfig` and are applied to the plugin manager (counted in N).
  `pluginsCompactView` / `pluginsDisableArtOpts` stay recognized-but-
  unsupported.
- Negative checks: a random JSON file → toast "This file is not a compatible
  .extera backup"; a `.extera` carrying an Android-only key (e.g.
  `tabletMode`) imports fine but that key is never applied and never counted
  as working; a boolean alias given a non-boolean (`tabCounter: "yes"`,
  `hideStories: 1`) is rejected like an untrusted file; out-of-range floats
  (`stickerSize: 99`, `avatarCorners: 30`) are rejected.
- Known mapping edges (expected, not FAILs): `tabCounter` is a boolean in the
  format (true = All chats, false = Off; the middle mode never round-trips);
  `newSliderStyle`/`newSwitchStyle` map boolean ↔ 2/3; the sticker-time mode
  composes two flags; HideArchive maps onto Web K's native setting.
- **[no chat data]**
- PASS/FAIL:

---

## Hub rows you will see that are NOT verified features

These rows are visible in the hub and wired to real consumers, but their
checklist entries are open with the annotation "an implementation or part of
it exists in the code; completeness still to verify". They are not counted in
the tally. Smoke-check them if you like, but do not treat a pass here as
verification:

| Row (label) | Tab | Intended behavior (from the store wiring) | Status |
|---|---|---|---|
| "Avatar Corners" | Appearance | 0 = square → 28 = circle, applied to every avatar | LOOK-01 unchecked |
| "Square FAB" | Appearance | floating button takes the squircle shape | LOOK-07 unchecked |
| "Custom Themes in Chats" | Appearance | per-chat themes | LOOK-10 unchecked |
| "Section Radius" | Appearance | section-card corner radius; 20 keeps the stock radius | LOOK-11 unchecked |
| "Separate Headers" | Appearance | separate section headers | LOOK-12 unchecked |
| "Frosted Message Menu" | Appearance | frosted message/reaction menus | LOOK-14 unchecked |
| "Show Results Before Voting" | Chats | public-poll results visible before voting, only where the server provides them | CHAT-26 unchecked |

The **Plugins** tab (Plugins category of the hub) is deferred work per
`AGENTS.md` and is not part of this runbook, except for the two backup flags
in Batch 6.

## Progress tally

Fill in `Y` / `N` per batch after walking its steps. "Features" counts the
PASS/FAIL blocks above; IDs in parentheses are the checklist entries pending
visual review.

| Batch | Features | Checklist IDs covered | Checked by user (Y/N) | Date | Notes |
|---|---|---|---|---|---|
| 1 — Forced MD3 + player style | 23 | LOOK-18…23, PLAYER-02…05, 08…10, 12, 15…17 (+ master; the MD3 Music player / Mini-player toggles share one block); V-1, V-2, V-3, V-4 appended from packets 045–048 | | | desktop visual review pending for all |
| 2 — Composer / sending path | 15 | CHAT-32, 31, 33, 30, 34, 36, 38, 16, 14, 35; MENU-01; HIDE-06; MEDIA-01*, CHAT-37*; CHAT-10/11 appended from packet 051 | | | * unchecked entries, completeness unverified; CHAT-35 appended from packet 043 |
| 3 — Live playback | 5 | MEDIA-13, 14, 15, 17; PLAYER-01 (base) | | | needs real media and tab-hiding |
| 4 — Dialogs / headers / message visuals | 20 | LOOK-03, 02*, 05, 08; GEN-02…07; CHAT-04…06, 23, 24, 27, 28, 40; HIDE-01, 12 | | | * unchecked entry; LOOK-05/08 + CHAT-40 appended from packets 041/042 |
| 5 — Folders, search, stickers, rest | 18 | GEN-14; LOOK-27; CHAT-01…03, 20, 22; HIDE-02, 03, 07, 09, 10, 14…16, 21, 22; OTHER-03 | | | |
| 6 — Backup round-trip | 1 | OTHER-01 (unchecked entry) | | | with plugin flags |
| **Total** | **82** | 49 checked + 20 packet-028/029 items (17 entries + master + player toggles + base popup) + 2 wired-but-unchecked (MEDIA-01, CHAT-37) + OTHER-01 + 4 user-directed V entries (045–048) | | | snapshot at 58/296; CHAT-30 (036), LOOK-05/08 (041), CHAT-40 (042), CHAT-35 (043), V-1..V-4 (045–048), CHAT-10/11 (051) appended; PILLS-01/06/12 + FOLD-11/13 (052–054) and W-1..W-3, W-6 (055–056) appended — steps 5.19–5.22; LOOK-01/02 (059) and LOOK-11/12 (060) appended — steps 4.21–4.22; FOLD-10/12 joined 5.20 (062), 2.12 rewritten for the CHAT-37 anchor strip (061), CHAT-26 appended — 5.23 (063) |

After each session of user verification, record the outcomes: update the
tally here, and let the maintainer strike through or annotate the matching
checklist entries and log material findings in `docs/tasks/progress.md`.
### 6.2 The 079 import-behavior amendments (packet 079, appended)

Three changes to the Batch 6 behavior, each proven by a regression test
(`tests/exteraBackup.test.ts`, "the full Android key-set sweep"):

- A `.extera` whose only known keys are the **plugin flags** — e.g. a body
  of `{"exteraconfig":{"pluginsSafeMode":true,"pluginsDevMode":false}}` —
  imports now (the toast "Applied 2 settings from the backup"); before
  packet 079 the hub rejected it as "not a compatible backup" although it
  exports exactly such flags.
- A backup whose Telegram-level section is **account-suffixed** —
  `mainconfig2` instead of `mainconfig`, as exteraGram writes per-account —
  is read: `bubbleRadius` under `mainconfig2` applies (and counts as known).
- Android-only keys **`customSavePath`, `gramTargetCurrency`,
  `btcTargetCurrency`, `usdTargetCurrency`, `ethTargetCurrency`,
  `eurTargetCurrency`, `goldTargetCurrency`, `springAnimations`** are now
  reported as unsupported (like `tabletMode` in 6.1): they apply nothing and
  are never counted. Before, they were silently ignored without appearing in
  the unsupported report.

Walk: craft the three small JSON files, import each through the Other tab,
check the toasts above; the unsupported keys change no setting (spot-check
one: `bubbleRadius` after a `mainconfig2` import, Settings → Appearance →
Bubble Radius).
- **[no chat data]**
- PASS/FAIL:

---
