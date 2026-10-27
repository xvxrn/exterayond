# Current state and session handoff

This is the entry point for a new session without conversation history. Read
the root [AGENTS.md](../../AGENTS.md), this file, and the
[feature checklist](../exterayond-feature-checklist.md). Inspect `git status`
and the relevant code before making changes. The checklist, not this note, is
the source of truth for completion counts and pending feature IDs.

## Priority

As of 27 October 2026, Forced MD3 is the active priority: its eight-part
settings group and base web adaptations exist, but desktop visual review and
parts of the full player are incomplete. Read [task 028](028-forced-md3.md)
and the last section of [progress.md](progress.md). Do not mark LOOK-18–23 or
PLAYER-01 complete merely because their controls exist. Finish or verify the
remaining work before choosing unrelated features, unless the user changes the
priority. If verification is unavailable, document the actual blocker and
continue independent work within the same priority where possible.

After that, pick unchecked items from the checklist, generally small to large.
Plugins are deferred until the user explicitly asks to resume them. Phone-only
hardware features are not desktop tasks. The latest recorded checklist count is
38/296; verify the file instead of assuming this number is still current.

## Operating constraints

- Project text is English; speak to the user in Russian. Product name: exterayond.
- Preserve existing work and do not inspect the user's authenticated session,
  private data, or personal screenshots. Authenticated checks belong to the user.
- Do not start a new server for every task: reuse an existing one when necessary,
  and avoid launching a browser/server pair for routine checks. The user reported
  out-of-memory failures. Run heavy checks sequentially with bounded workers.
- Target desktop; do not run mobile viewport checks. Keep tests focused and do
  not repeat passing checks without a relevant change or failure.
- Use free OpenCode DeepSeek for routine delegation, then free GLM if available;
  do not use MiMo or paid providers without explicit authorization. If free
  providers are unavailable, continue locally.
- The Android reference is pinned to exteraless revision `8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63`.
  `.research/android` is a local, read-only checkout and is not published. If it
  is absent, consult the pinned upstream files before inferring their behavior.
- Do not commit or push merely because work is complete. The user must explicitly
  request publication or a commit in that session.

## Before ending a work session

Update the checklist only for fully integrated entries, preserving IDs and source
links. Record changes, tests, and material unverified behavior in `progress.md`.
Replace this file's priority and current-state paragraphs when they change; keep
the next action concrete and do not present unverified work as finished.
