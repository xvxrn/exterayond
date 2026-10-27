# 028 — Forced MD3

Priority changed at the user's request: finish the MD3 group before taking
another small checklist item. New project text is English. Do not start servers
or browser processes for routine checks; run heavy checks sequentially.

## Android contract

Reference revision: `8b7ec40ecada6ab3cfcc24e9f3d8ae262c02de63`.
`OpenExteraAppearanceActivity.java:1124–1220` composes eight styles. The master
is on when any style is enabled; switching it off clears all eight. Switching
it on sets the six booleans, `SliderStyle=2` and `SwitchStyle=3`. There is no
independent persisted `ForcedMD3` key. Defaults select five styles.

Boolean keys/defaults from `AppearanceConfig.kt`: `OEAppearanceNewLoadingStyle`
true, `OEAppearanceNewChatHeaderStyle` false, `OEAppearanceNewNavigationBarStyle`
false, `OEAppearanceM3ListItems` false, `OEAppearanceMd3Player` true and
`OEAppearanceMd3MiniPlayer` true. NaConfig's `SliderStyle` and `SwitchStyle`
both default to 2; switch values 2 and 3 count as MD3.

## Web owners and adaptation

- Existing switches: 42.25 by 26 track, 19.5 checked thumb, 16.25 travel, from
  `Material3SwitchHelper` (Android's 0.8125 scale).
- Existing settings sliders: track 8, thumb 3 by 24, gap 6, from `SeekBarView`.
- Loading: existing indeterminate/progressive owners, track gap 2 and circular
  wave amplitude 1.6/wavelength 15 from `M3CircularProgress`. Byte progress,
  cancellation and animation-level ownership remain native. The web uses the
  wavy circular variant, rather than Android's separate morphing-shape renderer.
- Header: 46 avatar, flat tonal surface across the current chat column. Native
  desktop pinned-panel geometry is retained; Android's status-bar fade is not
  recreated.
- Existing folder rail/tabs: tonal active indicator, 64 rail item, 56 by 32 icon
  plate, from `MainTabsUiHelper`; no new navigation shell.
- Existing section rows: 56/72 heights and inner corners capped at 4, from
  `M3ListItems` and `RecyclerListView` segmented sections.
- Music popup: cover, metadata, timeline, transport and shared repeat cycle use
  the existing playback controller. It follows media events and the account
  session. Voice/round playback keeps its current entry. This is the base music
  surface; Android's full PlayerStyle editor, queue, lyrics and gestures remain
  separate work.
- Mini-player: the existing desktop audio plate gains tonal treatment and a
  36 cover with 10 corners (Android's compact cover), plus a 20 card radius.
  Its native 48-high desktop plate and existing controls remain in place.

EtgBackup exports `newLoadingStyle`, `newChatHeaderStyle`,
`newNavigationBarStyle`, and boolean `newSliderStyle`/`newSwitchStyle` aliases.
Import maps the latter to 2/0 and 3/0. It does not export the list/player keys;
do not invent aliases. Settings search reveals the collapsed component group.

Visual review is pending. Keep the affected checklist entries unchecked until
the desktop adaptation is reviewed; do not treat the complete PLAYER-01
subsystem as finished by this base popup.
