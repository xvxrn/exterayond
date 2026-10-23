# exteraless source map — what it changes and how

Reference for porting exteraless behaviors into exterayond (Web K base `654ffd8`).
Source of truth: `.research/android` snapshot of `exteraless/exteraless` @ `8b7ec40`,
read via `git -C .research/android show HEAD:<path>` / `git grep <pat> HEAD -- <pathspec>`.
Paths below are relative to `TMessagesProj/src/main/` (`java/` = J, `kotlin/` = K).

Portability classes (see AGENTS.md): **1** = Web K has the component (direct port),
**2** = web analog exists (adapt), **3** = no web counterpart (unsupported, shown as such).

## 1. Architecture of the changes

Four layers, cleanly separable:

1. **Five Kotlin configs** — the single source of truth. `object`s of `ConfigItem`s
   (key prefix `OE*`) in NekoConfig's SharedPreferences, lazily loaded, booted from
   `J/org/telegram/messenger/ApplicationLoader.java:289-297`:
   `K/app/exteraless/appearance/AppearanceConfig.kt`, `chats/ChatsConfig.kt`,
   `general/GeneralConfig.kt`, `OpenExteraConfig.kt`, `pillstack/PillStackConfig.kt`,
   `glyph/GlyphConfig.kt`, plus `utils/UtilsConfig.kt`, `icons/IconPacksConfig.kt`.
2. **~120 stock Telegram files under `J/org/telegram/**`** reference `app.exteraless`
   directly. Modification patterns:
   - injected branch in draw/layout code (`AvatarDrawable.drawBackgroundShape`,
     `MessageDrawable.invalidatePath`);
   - **central choke points** — one hook covers the whole client:
     `messenger/ImageReceiver.java` `setRoundRadiusForAvatar`/`applyRoundRadiusInternal`
     (all avatars), `ActionBar/Theme.java` `getColor(key_divider)` returning transparent
     (all dividers), `Components/RecyclerListView.setSections` (all section cards);
   - **helper classes** that isolate branching so stock diffs stay small:
     `ChatHeaderUiHelper`, `MainTabsUiHelper`, `GlassMenuHelper`, `M3ListItems`,
     `AiFeaturesHelper`, `MainMenuLayout`, `Material3SwitchHelper`;
   - **factory swaps**: `player/Md3Player.create()` replaces stock `AudioPlayerAlert`;
     `ChatsConfig.cameraType()` selects the camera engine.
3. **Legacy exteraGram shim** `J/com/exteragram/messenger/` (41 files).
   `ExteraConfig.java` (2,257 lines) is a plugin-compatibility facade: getters/setters
   delegate to the five configs; its own prefs file `exteraconfig` holds only keys with
   no fork equivalent (values persist for plugin API fidelity but don't affect the app).
   `MappedEditor` reroutes ~100 exteraGram key names into the real configs. For porting
   values this layer is irrelevant; it matters only as the plugin API surface.
4. **NagramX/NekoX heritage** (`tw/nekomimi` 201 files, `xyz/nextalone` 92 files in
   `org/telegram`, plus their own packages) — separate lineage; exteraless settings that
   delegate there (e.g. `titleText` marquee, translate providers) hit Neko/Na configs.

Heaviest modified files: `ChatActivity` (50 refs), `LaunchActivity` (27),
`InstantCameraView` (37), `Switch` (15), `MessageObject` (14), `DialogsActivity` (17).

## 2. Settings inventory → portability class

Defaults in parentheses. Mechanism column names the Android consumer; the K-side
counterpart is decided per task by reading the owning K component.

### AppearanceConfig (`getAvatarCorners(size)` helpers scale corner geometry)

| key (default) | mechanism / consumer | effect | class |
|---|---|---|---|
| avatarCorners (28=circle) | `ImageReceiver.applyRoundRadiusInternal` + `AvatarDrawable.drawBackgroundShape` + `AvatarSpan`; ~20 `getAvatarCorners()` call sites | 0 square … 28 circle, everywhere | 1 |
| singleCornerRadius (false) | corner-type branch in `getAvatarCorners` | forum/community avatars same radius | 1 |
| senderMiniAvatars (true) | `DialogCell.addSenderAvatar` → `AvatarSpan` in preview | mini sender avatar in dialog list | 1 |
| gooeyAvatarAnimation (true) | `ProfileActivity.updateGooey` pull-progress branch | avatar stretch on profile pull | 2 |
| hideActionBarStatus (false) | `ActionBar.getVisibleTitleRightDrawable` nulled | no emoji-status/premium star by titles | 1 |
| titleText (0) | `TypefaceHelper.getTitleText` → ActionBar/DialogsActivity title + marquee | title = app/username/name/Chats/custom | 2 |
| monetStyle (0) | `Theme.monetAssetName` picks `.attheme` token dict | which monet palette loads | 2 |
| squareFab (true) | `UIUtil.createFabSelectorDrawable` radius math | squircle vs round FAB | 1 |
| sectionRadius (20) | `RecyclerListView.setSections` + `SectionCardRecyclerView` | corner radius of settings section cards | 1 |
| separateHeaders (true) | `HeaderCell` excluded from section card | headers float as own pill | 1 |
| dividerStyle (1) | `Theme.getColor(key_divider)` transparent (HIDDEN) / `useSegmentedSections` (SEGMENTS); volatile cache | no dividers / lines / row-cards | 1 |
| m3ListItems (false) | `M3ListItems` metrics in stock cells' onMeasure + tonal icons; forces segments+separated+hidden | M3 settings rows | 1 |
| glassOutlineStyle (0) | `blur3/GlassOutlineStyle` enum in blur drawables | glare / stroke / none on glass | 2 (CSS backdrop-filter) |
| glassMessageMenu (true) | `GlassMenuHelper` → `ChatActivity` menus + `ReactionsContainerLayout` | frosted message menu/reactions | 2 |
| newLoadingStyle (true) | `RadialProgressView.applyConfiguredStyle` / `LineProgressView` | M3 wavy spinners | 1 |
| newChatHeaderStyle (false) | `ChatHeaderUiHelper` constants in `ChatActivity`/`ActionBar` | bigger avatar, no glass pill, taller fade | 2 |
| newNavigationBarStyle (false) | `MainTabsUiHelper` geometry in `MainTabsLayout` consumers | 64dp square M3 bottom bar | 2 |
| iosNavigationBarStyle (false) | `MainTabsUiHelper` (loses to M3) | wide iOS capsule bar | 2 |
| iosChatHeader (false) | `ChatActivity.canShowCenteredTitle` | centered title, avatar-tap menu | 2 |
| md3Player / md3MiniPlayer (true/true) | `Md3Player` factory swap + `FragmentContextView` suppression | full MD3 player + mini-player card | 2 |
| player* family (~28 keys) | read only inside `player/PlayerStyle`+`PlayerSheet`+`PlayerMiniView` | player sizes/colors/layout | 2 (with player) |
| lrclibAllowed (false) | `PlayerSheet` lyrics fetch gate | synced lyrics | 2 (with player) |
| profileMusicCard (true) | `ProfileActivity` row swap → `ProfileMusicCard` | saved-music card on profile | 3 (K has none) |
| hideAiEditor / hideMessageSummary / hideIvSummary (false) | `AiFeaturesHelper` gates in composer/`ChatMessageCell`/`ArticleViewer` | hide AI UI entry points | 3 until K has AI features |
| customThemes (true) | early-return in `ChatActivity.setupChatTheme` + `ChatThemeController.getDialogWallpaper` | ignore per-chat themes | 1 |
| navigationDrawer (false) | `LaunchActivity.syncDrawerContainerEnabled` + `DialogsActivity` gates | exteraless side drawer | 2 (→ left sidebar) |
| immersiveDrawerAnimation (false) | `DrawerContainer` scrim/shift branches | full-push drawer animation | 2 (with drawer) |
| mainMenuLayout ("") | `MainMenuLayout` "visible;hidden" list → `MainMenuHelper`/`DrawerMenuView` | reorder/hide drawer items | 2 (with drawer) |
| showFeedTab (false) | `MainTabsActivity` FEED tab → `FeedActivity` | bottom Feed tab | 2 (see §3 Feed) |
| showFeedUnreadCounter (true) | `FeedController.getUnreadCount` gate | badge on feed tab | 2 (with feed) |

### ChatsConfig

| key (default) | mechanism / consumer | effect | class |
|---|---|---|---|
| stickerShape (1) | `setRoundRadius` branch in `ChatMessageCell`/`StickerCell`/`StickerEmojiCell` | square/rounded/as-bubble stickers | 1 |
| stickerTimeSide (false) | `StickerTime` layout helper in `ChatMessageCell` | sticker time overlay/beside/hidden | 1 |
| replyColors / replyEmoji / replyBackground (true) | `ReplyMessageLine.check()` color/emoji/underlay branches | peer-colored reply blocks | 1 |
| bottomButton (1) | `ChatActivity.shouldShowDiscussButton` | channel bottom button: hide/mute/discuss | 1 |
| keepAttachButton (false) | `ChatActivityEnterView.checkAttachButton` | attach button doesn't morph to send | 1 |
| hideCameraTile (false) | `ChatAttachAlertPhotoLayout` tile + floating camera button | gallery drawer camera tile | 2 (K attach differs) |
| inlineMathResult / inlineMathCurrency (true) | `InlineMathController` on input `=` keypress | live math/currency ghost above input | 1 |
| alwaysSendInHD (true) | `MediaController` `PhotoEntry.isHighQuality` default | HD by default + SD badge | 1 |
| hdrPhotos (true) | `PhotoViewer.updateWindowHdrColorMode` | HDR display of gainmap photos | 3 (browser HDR) |
| hideReactionsInChannels/Groups/Private (false) | `MessageObject.oeReactionsHiddenForDialog` → draw + panel visibility | hide reactions per chat kind | 1 |
| wideChannelPosts / wideFeedPosts (false) | `MessageObject.isWideChannelPost` → ~15 `ChatMessageCell` layout sites | edge-to-edge channel posts | 2 |
| removeMessageTail (true) | `MessageDrawable.invalidatePath` branch + cell geometry | no bubble tail | 1 |
| showResultsBeforeVoting (false) | `ChatMessageCell.isPollResultsPreviewEnabled` | poll results before voting | 1 |
| hideChannelSearchButton (false) | `ChatActivity.updateBottomOverlay` | channel bottom search button | 1 |
| hideCallButton (false) | `ChatActivity` menu/icon flags | call button in chat | 1 |
| hideMoneyButton (false) | `ChatAttachAlert` buttons count | wallet tab in attach drawer | 2 |
| translateInSheet (false) | `ChatActivity` menu → `TranslateAlert2` Neko providers | in-sheet translate flow | 2 |
| stripTrackingOnOpen / OnPaste (true) | `LinkCleaner.clean` in `Browser.openUrl` / `EditTextCaption` paste wrapper | tracking-param stripping | 1 |
| preferOriginalQuality (false) | `VideoPlayer.getSavedQuality` precedence | original quality first | 2 |
| pauseOnMinimizeVoice / Round (false) | `MediaController.pauseInBackgroundIfNeeded` | pause on background | 1 (visibilitychange) |
| doubleTapSeekDuration (1) | `PhotoViewer.doubleTapSeekMillis` | 5/10/15/30s seek step | 1 |
| swipeToPip (false) | `PhotoViewer.enableSwipeToPiP` gate | swipe-down → PiP | 2 |
| camera* (type, mirror, wide-angle, stabilization, fps, zoomSlider, staticZoom, flashWarmth/Intensity, rememberCamera) | `InstantCameraView*`, `CameraXSession`, `Camera2Session` | round-video camera engine | 3 (hardware) |
| unmuteWithVolumeButtons (false) | `LaunchActivity.dispatchKeyEvent` | volume keys unmute video | 3 |

### OpenExteraConfig / GeneralConfig

| key (default) | mechanism | effect | class |
|---|---|---|---|
| relativeLastSeen (false) | `LocaleController.formatDateOnline(relative)` | "5 min ago" last seen | 1 |
| addCommaAfterMention (true) | `ChatActivity`/`MentionsContainerView` insertion string | comma after @mention | 1 |
| downloadEmojiPacks (false) | `EmojiHelper` metadata source | emoji-pack catalog channel | 2 |
| proxyDisableConditions (0) | `ProxyUtil.shouldDisableProxyOn` bitmask + network callback | auto-disable proxy on VPN/data/wifi | 1 |
| lastfmNick / lastfmExplained | `ProfileMusicStamp` steganographic tag in saved music | last.fm now-playing card | 3 |
| downloadSpeedBoost (0) | `FileLoadOperation.updateParams` chunk/parallel sizes | faster downloads | 2 |
| showNagramSettings (false) | `SettingsActivity`/`ProfileActivity` row flag | N-Settings entry visibility | n/a (NagramX) |
| crashReports / contentCapture (false) | Crashlytics gate / `ContentCaptureManager` | reporting/autocomplete | 3 (Android) |

### PillStackConfig (pill strip inside dialogs search field, `PillStackController.attach` from `DialogsActivity:3431`)

activePills/hiddenPills ("5,6"/""), infiniteScrolling (true), lastActiveId, rate
instances + caches, weather location keys — the strip shows one pill at a time
(cache/proxy/rates/weather/lastseen…), vertical swipe switches. **Class 2** if/when the
K search field hosts a strip; the pill set itself splits: cache/proxy/lastSeen ≈ 2,
weather/rates need their fetchers ≈ 2, ram/cpu/netspeed ≈ 3.

### GlyphConfig — Nothing Phone Glyph backlight (`GlyphController`, Ketchum SDK). **Class 3 entirely.**

## 3. Structural systems

- **Drawer** `app/exteraless/drawer/` — `DrawerContainer` injected into stock
  `DrawerLayoutContainer` by `LaunchActivity.syncDrawerContainerEnabled` (on/off switch);
  300dp panel, edge swipe, `MainMenuLayout` item order, plugin items appended via
  `MenuInjector.appendDrawerItems`. K counterpart: left sidebar + its menu → class 2.
- **Pill stack** `app/exteraless/pillstack/` — see above; two hooks added to stock
  `FragmentSearchField` (`setPillStackController`, `updatePillStack`). Class 2.
- **Feed** `app/exteraless/feed/` — biggest system: `FeedController` (per-account
  singleton, fetch/merge via `FeedTimelineLoader`/`FeedStore`), `FeedChatIntegration`
  (bridge driving a stock `ChatActivity` in `searchType == 4` mode through a `Host`
  interface), `FeedActivity` tab fragment, `ConnectionsManager:458` request rewrite.
  K has no feed; class 3 for now — a deliberate later project, not a setting port.
- **Glass** `GlassMenuHelper` on `Components/blur3/*` — real blur popups. Web analog:
  CSS `backdrop-filter`; class 2.
- **Settings design system** `SectionCardRecyclerView` (section cards + forced shadow),
  `Material3SwitchHelper` (drives stock `Switch` M3 painting), `AltSeekbar` (detent
  seekbar with value pill), preview cells (`AvatarCornersPreviewCell`,
  `ChatListPreviewCell`, `FoldersPreviewCell`, `FabShapeCell`). Needed to reproduce the
  hub's look — class 1 (build in K idiom from these specs).
- **Hub & updater** — see §4; `AboutHeaderCell` (logo clipped to launcher-icon shape on
  `0xFFE83030`), `UpdaterSheet`/`GitHubUpdater` (release/beta/off channels).

## 4. Settings hub wiring

- Entry: `J/org/telegram/ui/SettingsActivity.java:793` — `SettingCell` id **-1** (not
  102; the 102 comment in `OpenExteraSettingsActivity` is stale), exteraless icon tile,
  opens `OpenExteraSettingsActivity`. NekoX entry id 100, hidden unless
  `GeneralConfig.showNagramSettings`.
- Root screen: transparent borderless ActionBar (search id 24000, prefix `OpenExtera`;
  cloud sync → `OpenExteraCloudActivity`), rows: About header → General / Appearance /
  Chats / Plugins / Other → links (@exteraless, GitHub) → design credits
  (@the8055u, @BlueprintDsgn). Sub-screens: `OpenExteraGeneralActivity` (1348 ln),
  `OpenExteraAppearanceActivity` (1244), `OpenExteraChatsActivity` (3118),
  `OpenExteraOtherActivity` (614), `OpenExteraGlyphActivity`, `OpenExteraCloudActivity`,
  `OpenExteraAppNavigationActivity`, plugins → `app/exteraless/plugins/ui/*`.
- K counterpart: new tab in `src/components/sidebarLeft/tabs/` following the same
  section structure; settings search hooks into `src/lib/settingsSearch/`.

## 5. `.extera` backup contract (port as-is)

`app/exteraless/backup/EtgBackup.java` (byte-port of exteraGram 12.9.0
`PreferencesUtils`), `InvisibleEncryptor.java`, `EtgBackupUi.java`.

- JSON, top-level sections = exteraGram prefs names: `exteraconfig`, `pillstackconfig`,
  `mainconfig` (import also accepts `mainconfig\d+`, first match). Pretty-printed.
- Values: bool = JSON bool; int = exact integer (`BigDecimal.intValueExact`); float =
  finite number; string ≤ 1 MiB. Unknown keys ignored; only valid+present entries apply.
- Mapping table `Entry` list: exteraGram key → our `OE*` config with kind/range/remap:
  `integer(min,max)`, `floatToInt(min,max,scale)`, `remap(...)` (e.g. translationProvider
  etg 0/1/2/3 ↔ ours 8/1/3/7), `boolInverted` (inAppVibration ↔ disableVibration),
  string predicates (`isCurrency`, `isPillsLayout`, `isIdArray`, customSavePath/targetLang
  regexes). Sample: `avatarCorners` float 0–28 ×1; `activePills` CSV ints 1–100000 unique
  ≤100; `mainMenuLayout` JSON int array ≤100; `bubbleRadius` int 0–17; `fons_size` 12–30;
  `pluginsSafeMode/pluginsDevMode/pluginsCompactView/pluginsDisableArtOpts` bools (the
  only plugin data in `.extera`).
- `InvisibleEncryptor` = obfuscation, not crypto: UTF-8 bytes in base 11 over an
  invisible-unicode alphabet (`\u200a\u200b\u200c\u200f\u202f\u206a-\u206f`), digits
  joined by `\u2000`, prefix `\u2001\u2002`. Export always encrypts; import accepts
  plain JSON too (detects prefix). Port verbatim for file interop.
- Plugins travel separately: `.plugins.zip` (`manifest.json` format
  `exteraless-plugins` v1 + `plugins/<id>.<ext>` + per-plugin settings JSON); grants
  never exported (signed store `exteraless_plugin_grants`).

## 6. Plugin SDK contract (facade-level compat; SDK version `1.4.5.7`)

- **Packages**: single-file `.plugin`/`.py` with dunder metadata (`__id__`
  `^[A-Za-z][A-Za-z0-9_-]{1,31}$`, `__name__`, `__version__`, `__author__`,
  `__permissions__`, `__requirements__`, `__app_version__`/`__sdk_version__`
  constraints); archive `.elyx`/`.eaf` = ZIP with `refmap.{yaml,json}` (`main`,
  `metainfo`, `assets`, `strings`, `wheels`) + `metainfo.{yaml,json}`. Limits: 4096
  members, 128 MB total, zip-slip rejected. Metadata parsed via AST, never executed.
- **Runtime surface** (`python/base_plugin.py`, `elyx_runtime/`, `extera_utils/`):
  lifecycle `on_plugin_load/unload`, `on_app_event(START/STOP/PAUSE/RESUME)`,
  `create_settings()`; event hooks `pre_request_hook/post_request_hook/
  on_send_message_hook/on_update_hook/on_updates_hook` returning
  `HookResult(strategy)` with strategies `DEFAULT/CANCEL/MODIFY/MODIFY_FINAL`;
  Xposed-style `hook_method/hook_all_methods/hook_all_constructors` with declarative
  filters (argument_is_*/result_is_*/condition(MVEL)/or_) — **this half is
  Android-bound (LSPlant/JNI) and maps to documented web extension points instead**;
  menus `MenuItemData` for MESSAGE_CONTEXT_MENU / DRAWER_MENU / MAIN_MENU /
  CHAT_ACTION_MENU / PROFILE_ACTION_MENU; UI `AlertDialogBuilder`,
  `BulletinHelper`, settings models `Header/Divider/Switch/Selector/Input/Text/
  EditText/Custom/Slider` (JSON schema in `PluginsConstants.Settings`); client access
  `send_request`, `send_text/…`, per-plugin JSON settings store; class aliases rewrite
  `com.exteragram.messenger.*` → `app.exteraless.*` (incl. `_FIELD_SHAPED` field→getter
  mapping for ExteraConfig) — this is how Botile-style exteraGram plugins resolve.
- **Permissions** (`PluginPermissions`): `ui` (implicit), `messages.read`,
  `messages.send`, `network`, `files`, `intents`, `settings`, `hooks`, `native`
  (last two dangerous). Trust levels ISOLATED/GATED/TRUSTED clamp effective grants;
  grants signed, stored per plugin (`plugin_perms_<id>`); safe mode disables all plugin
  loading (auto on crash loop); denials logged once and surfaced in UI.

## 7. K-side porting playbook (patterns → targets)

| Android choke point | Web K counterpart to own the change |
|---|---|
| `ImageReceiver`/`AvatarDrawable` avatar radius | avatar rendering component(s) (`src/components/avatarNew.tsx` + dialog/chat avatar call sites) |
| `Theme.getColor(key_divider)` | divider color resolution / SCSS variable at the list level |
| `RecyclerListView.setSections` | settings/sidebar list section styling |
| `DialogCell` branches | dialog row component in the chat list |
| `ChatMessageCell`/`MessageObject` branches | message bubble component + message layout math |
| `ChatActivity` header/menu gates | chat header component + context menu construction |
| `ActionBar/ActionBarLayout` | `src/components/sidebarLeft` header/tab machinery |
| `LaunchActivity` shell hooks | app root / lifecycle managers |

Unknown-to-K mappings are resolved per slice by reading the K component that owns the
behavior; this map guarantees the setting inventory and semantics are complete.
