# Four next small candidates — Android + WebK source audit

Read-only, 2026-10-26. Android = `.research/android@8b7ec40` (read via `git show`), WebK = this tree.
No app/test/build/browser run: every "live" claim below is a static path, runtime **UNVERIFIED**.
`S/M/L` = size of the smallest complete implementation incl. live behavior, not feature value.

## GEN-06 Locally hide own phone number — S
- Android: `NekoConfig.java:87` key `HidePhone`, bool, default **true**; row `OpenExteraGeneralActivity.java:203,372,1199`.
- `.extera`: `hidePhoneNumber`, section `exteraconfig` — `EtgBackup.java:318` through `bool()` `:601`. Web: `KNOWN_UNSUPPORTED` `src/lib/exteraBackup/etgBackup.ts:46`.
- Android semantics (own number): self profile phone row not built `ProfileActivity.java:11165`, value `PhoneHidden` `:14199`; edit-profile number row reads `MobileHidden` `:14323`; settings header drops the number but keeps `@username` `SettingsActivity.java:623-628`; drawer header `DrawerHeaderView.java:300`. Quirk: the nameless-user fallback hides *any* phone `ProfileSearchCell.java:536`.
- Web surfaces: the self card in Settings `tabs/settings.tsx:350-356` → `PeerProfile.Phone` `peerProfile.tsx:722-742` is the only place own phone is drawn (own profile as dialog already hides it via `canBeDetailed` `:230`; `editProfile.tsx` has no phone row). WebK has no hide-phone today (`grep HidePhone src/` = backup list only).
- Smallest complete: store key `HidePhone` (Android name, default true) → memo guard `peerId === myId` in `peerProfile.tsx` → one toggle row in `exteralessGeneralTab.tsx` → lang + `hidePhoneNumber`→SUPPORTED + reset/fixture tests. No cleanup.
- Risks: default true changes stock WebK on first run (Android contract vs stock-compat) — must be decided, not guessed; the alias/store/lang edit collides with task 004.

## GEN-14 Hide archive folder — S (already native)
- Inventory: GEN-14 = `hideArchiveRow` `docs/exteraless-feature-inventory.md:104`; persisted key is NaConfig `HideArchive` `NaConfig.kt:918-923`, bool, default false (not an `OE*` key). Row `OpenExteraGeneralActivity.java:211,374,1202`; on toggle `:438-450` calls `checkArchiveFolder()` + dialogs reload and drops the now-useless "archive on pull" row.
- Semantics: remove folder dialog 1 from the chat list `MessagesController.java:10087-10093,12643`; the archive stays reachable from the overflow menu `DialogsActivity.java:14263`.
- `.extera`: `hideArchiveFolder` `EtgBackup.java:319` (exteraconfig); web `KNOWN_UNSUPPORTED` `etgBackup.ts:46`.
- WebK already implements it: `showArchiveInChatList` `src/config/state.ts:161,592` (default true) gates the chat-list archive row `archiveDialog.tsx:132`, pinned via `autonomousDialogList/dialogs.ts:110-135,935-939`; hide/show lives in the row's context menu `archiveDialogContextMenu.ts:59-71`; the hamburger "Archived chats" entry stays `sidebarLeft/index.ts:714-726,1862` — the same escape hatch Android keeps.
- Smallest complete: do **not** add a second state. Either close GEN-14 as native, or add one discoverability row in `exteralessGeneralTab.tsx` that writes the existing `showArchiveInChatList` (inverted); live already works through the reactive app setting. No new OE key; backup alias stays unsupported until the backup layer can target app settings.
- Risks: none material; the optional row duplicates an existing control surface.

## GEN-04 Zalgo filtering — M
- Android: `NaConfig.kt:204-207` key `ZalgoFilter`, bool, default false; row `OpenExteraGeneralActivity.java:183,368,1181`. `.extera`: `filterZalgo` `EtgBackup.java:316` (exteraconfig); web `KNOWN_UNSUPPORTED` `etgBackup.ts:45`.
- Algorithm `MessageHelper.java:888-889,953-975`: skip empty/<4/>2048 chars; trigger only on `\p{M}{4}`; then delete **every** `\p{M}+` in the whole string (Spannable spans preserved). Not a cap — a rewrite.
- Callers: message text/captions `MessageObject.java:3967,6316,6331,7925`; names `UserObject.java:122`; dialog title/preview `DialogCell.java:1205,1890,2346,6145`; search `ProfileSearchCell.java:914,944`; chat titles `ChatActivity.java:16404,30651`; emoji text `Emoji.java:724,775`; contacts `ContactsController.java:3119`.
- Web surfaces: message text, captions, service text and reply quotes go through `wrapRichText` `bubbles.ts:8846,9405,9815`, `replyContainer.ts:249` (raw slices appended at `wrapRichText.ts:259,788`); names/titles through `wrapEmojiText` `peerTitle.ts:141`. WebK has no combining-mark filter (`graphemes.ts:56` only segments clusters).
- Smallest complete: one `zalgoFilter(text)` helper applied per emitted chunk inside `wrapRichText` and `wrapEmojiText` — offsets stay valid because each slice is filtered in place (filtering before `parseEntities` would shift every entity). Live: drawn bubbles keep old text until re-rendered, same as Android, whose toggle only rebuilds the settings screen (`OpenExteraGeneralActivity.java:368-370`).
- Risks: `\p{M}+` deletion eats legitimate Arabic/Hebrew/Indic vowel marks once a single 4-mark run exists (Android's own behavior); the 2048 cap leaves long messages unfiltered; a regex runs on every rendered chunk.

## OEChatsKeepAttachButton — no behavior to port (cleanup S)
- Android: `ChatsConfig.kt:149-151` key `OEChatsKeepAttachButton`, bool, false; row `OpenExteraChatsActivity.java:190,490,2815`. No `.extera` entry at all (absent from `EtgBackup.entries()`), so no alias/section.
- Semantics `ChatActivityEnterView.java:8124,8145-8170`: with the setting, `checkAttachButton(use=true)` is forced to `use=false`, so the paperclip never morphs into the "three dots" menu button and keeps opening the picker.
- WebK: the attach button is always the attach-menu toggle `input.ts:1507-1580` / `attachMenuButton.tsx:26-40`, send is a separate button `input.ts:1625-1642`. There is no paperclip-opens-picker state to preserve — WebK sits in Android's *menu* state permanently.
- Audit: store key only `exteralessSettings.ts:58`; no UI, no consumer, no backup, no lang. `docs/exteraless-map.md:67` already records web N/A.
- Smallest complete: delete the ghost key (`exteralessSettings.ts:58`, fixture `src/tests/exteralessSettings.test.ts:60`); do not add a toggle.

## Order (feasible, meaningful)
1. GEN-06 — real missing behavior, one condition + one row (after 004 releases store/lang/backup).
2. keepAttach deletion — pure cleanup, no UI, no behavior.
3. GEN-14 — close as native; add the discoverability row only if the user wants one control surface.
4. GEN-04 — last: two shared text builders, offset-safe filter, real script damage risk.
