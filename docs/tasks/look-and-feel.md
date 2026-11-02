# Look & feel stream — user-directed web adaptations (2026-11-01)

The user reviewed exteraless on Android after their own customization and
named the visual gaps between it and the web client. The ported settings so
far change behavior; this stream closes the look. Private reference
screenshots (settings root + chat) live in the session only — never commit
them; the palette values are taken from them as a local reference.

Every item keeps the locked model: a setting gates it, off = stock Web K,
no blanket restyle, no replacement screens. New checklist entries live in a
clearly-marked user-directed section; the original 296 catalog IDs stay
untouched. Each item gets: Android source research first, exact keys, a
focused regression test where logic exists, a runbook step, and a hub row.

## V-1 — Wallpaper pattern toggle

The user: Android can turn the wallpaper pattern (узоры) off; web cannot.

Research: find who owns the pattern on Android — Telegram's own pattern
dimming vs an exteraless/Neko/Na toggle (`git -C .research/android grep -n
"pattern" HEAD -- '*exteraless*'`, plus WallpaperActivity/Mot). Web: the
background renderer draws the pattern layer from the wallpaper record; gate
that layer on the setting. Off = color/gradient only, on = stock. Exact key
follows the Android owner; if Android only has dimming (0–100), the web
toggle maps to it (0 = off) rather than inventing a separate bool.

Accept: toggle in Appearance; pattern disappears/applies live without a
reload; wallpaper image/color still respects dimming; test over the
renderer's decision logic; runbook step in the visuals batch.

## V-2 — Floating vs attached sidebar (both with proper rounding)

The user: Android has no floating panels; web floats and cannot be turned
off. The left sidebar must support both modes — floating (stock Web K) and
attached — each with correct corner handling.

Research: Web K `.sidebar-left` (and the right sidebar / topbar, for later
scope decisions) get their float from margins + outer radius. The setting
(default off = stock floating) adds a root class that zeroes the margins and
outer rounding and makes the panel full-height; inner surfaces keep their
radius so the attached mode still reads "exteraless" rather than square.
`singleCornerRadius`/`sectionRadius` interplay must stay consistent.

Accept: live toggle, both directions; dialogs/popups stay on top; RTL holds
(the float is direction-agnostic but check); no scroll bars regressions;
runbook step; test the root-class decision logic only (visual result is the
user's acceptance).

## V-3 — Strengthen Forced MD3 (coverage + quality)

The user: either mediocre or not applied everywhere. Android themes
everything; the web pack styles selected surfaces only.

First produce an audit, not code: enumerate the app's shared surfaces
(chat list, popups, context menus, dialogs, right sidebar, profile, search,
media viewer chrome, composer) and mark covered/not-covered under the current
eight-part group. Then extend coverage behind the existing master (no new
master semantics), keeping off = stock. Extend, do not restyle: each surface
adopts the MD3 look only while its toggle is on.

Accept: the audit table lives in this file or the packet section; every
not-covered surface either gains MD3 styling or is listed as waiting on a
Web K primitive; the user's acceptance session judges the result.

## V-4 — Themes: presets and user taste

The user: 5–6 preset themes is poor next to Android's on-your-taste theming.

Research Web K's theme system first: what the settings expose, whether
custom themes can be created/edited/imported in stock tweb, which CSS
variables drive accent/surface colors. Then the web adaptation ladder, in
order of value: (1) an "exteraless" palette preset taken from the private
screenshots (near-black surfaces, muted cards), (2) a per-theme accent color
picker overriding the accent variables live, (3) AMOLED variant, (4) only if
the stock system cannot express it — a small custom-theme editor. Ship as
Appearance settings; stock themes remain the default.

Accept: presets apply live; the accent picker survives reload; the runbook
batch gains the steps; no theme edits ever touch the stock theme objects.

## Sequencing

Runs after the current porting agent (single-agent limit). Suggested order:
V-1 and V-2 (small, mechanical), V-4 ladder, V-3 last (largest, design-heavy).
Store keys default off except where Android's own default is on; every hub
row goes through settings-search indexing and the runbook.

## Acceptance round 1 (2026-11-01, user feedback)

Fix list from the user's first acceptance pass, in priority order:

### F-1 — Attached sidebar keeps its outer rounding
Packet 046 zeroed the outer corners; the user wants attached mode to keep
the rounding on the outer edges (full height, no page margins, rounded
outer corners — both modes are rounded, they differ in margins/height only).
Adjust the `oe-attached-sidebar` rule set; re-verify RTL and the folders-rail
offset.

### F-2 — Theme Palette becomes a single toggle
Drop the Stock/Exteraless/AMOLED selector: one toggle, off = stock, on = the
exteraless near-black palette. AMOLED is removed entirely. Rename the
user-visible label away from the brand (see F-5). Update store, tests,
runbook step 1.23, checklist entry.

### F-3 — Accent color must tint the background and carry Material elements
Two defects from acceptance: changing the accent does not change the
background, and the background shows no material elements. The accent preset
currently overrides accent variables only. Extend it Material-You style:
derive the surface/background tint from the accent (hue-consistent surfaces
while the palette toggle is on), and make the material elements the user
expects appear on the background. Research what the stock
`applyAccentPreset` touches and what derives from the accent in Web K's
theme objects (background color, gradient, pattern tint) before writing.

### F-4 — Chats → "Custom Themes in Chats" does nothing
LOOK-10 was wired-but-unchecked; the user confirmed it is dead. Investigate
the wiring end to end (what the row toggles, which owner should react),
find the break, fix it, and give it a real regression test. Either it ships
working or the entry is reverted to unchecked with the blocker recorded.

### F-5 — Remove the brand from user-visible code
Remove "exteraless" from every user-visible string and UI-facing identifier
(labels, theme names, aria text; the palette toggle and preset names get
neutral names). KEEP: (a) code comments citing the Android/exteraless
sources — provenance and attribution are required by AGENTS.md; (b) the
internal `Exteraless.*` lang-key prefix — renaming hundreds of keys is mass
churn with regression risk for zero user-visible gain; flag it in the report
so the user can order it explicitly if they want it anyway.

### F-6 — Animations, smooth scrolling, polish
Broad user ask: many places lack animation, smooth scrolling and general
polish. Audit first (list the surfaces where Web K jumps or scrolls
instantly), then a bounded first tranche: smooth scrolling behavior where
the platform supports it, transitions on the panels/menus the look stream
touched, nothing speculative. Record what was deliberately left out.

## Acceptance round 2 (2026-11-01, user feedback)

### G-1 — The background color picker still does not apply
"Background wallpaper color does not work correctly (the color does not
change)" — the chat background does not repaint when a color is picked, in
general. Trace the whole path in the current tree: background.tsx's color
pick → what it persists → every consumer that renders or overrides the
chat background (the V-4 palette's surface writes, the F-3 accent-tint
sources, the accent-bundled wallpaper attach). An explicit user color must
win over everything and actually repaint, live. Find why it does not today —
the palette/accent layers are the suspects, but verify against the render
path, do not assume.

### G-2 — The hub still has no animations
The `<details>` reveal from F-6 did not satisfy the ask: the settings UI
should feel animated like Android. First investigate Web K's animation-level
plumbing (what the stock setting controls, what the current default resolves
to — if the level gate kept the F-6 reveals instant for the user, that is
the finding). Then a real tranche: section/row motion in the hub (press and
hover states, expanding groups, tab switches), Material-style easing, gated
by the stock animation level like the rest of the app. Leave the app-wide
smooth-scroll and per-row list animations out as before, but write down what
else you deliberately skipped.

### G-3 — Attached sidebar rounds only the content-facing edge
Currently both vertical edges are rounded in attached mode; the user wants
the rounding only on the external side, which for them is the right edge of
the left sidebar — the edge facing the chat. In LTR: top-right and
bottom-right corners rounded, the window-facing corners square; mirror for
RTL. Re-check the folders-rail offset and the shadow rule.

### G-4 — Theme from wallpaper (Material You / Pixel-style)
The theme should derive from the wallpaper: on a Pixel, "appearance color"
and the whole palette follow the wallpaper. Port the idea: while the palette
toggle is on and the wallpaper is an image, extract its dominant colors
(canvas sampling at wallpaper-set time, cached) and derive the surface
family (and consider the accent, behind the existing accent picker's
priority rules: an explicit accent pick still wins; G-1's explicit color
still wins over everything). Wallpaper changes re-derive live. Define the
priority chain explicitly in the packet: explicit background color >
explicit accent > wallpaper-derived > palette default. JS-side extraction
only — no server, no workers unless the budget guard allows.
