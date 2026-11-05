import {IconTsx} from '@components/iconTsx';
import {i18n} from '@lib/langPack';

/**
 * GHOST-12 — the desktop analog of Android's long-press lock on a Ghost Mode
 * essential (GhostModeActivity's `onItemLongClick`): an explicit,
 * keyboard-reachable lock button on the row; a locked row's toggle is
 * disabled. Android caps the locks at four so the master toggle keeps at
 * least one flag of its own (`getGhostModeLockedCount() >= 4` shake) — the
 * web disables the button for a fifth lock instead.
 *
 * Lives outside the hub tab file: the settings-search extractor indexes every
 * literal `i18n()` call a tab renders, and the button's aria-label is not a
 * row.
 */
export const GhostLockButton = (props: {locked: boolean, disabled: boolean, onToggle: () => void}) => (
  <button
    class="exterayond-ghost-lock-button"
    aria-pressed={props.locked}
    aria-label={i18n('Exterayond.Ghost.LockOption').textContent}
    disabled={props.disabled}
    onClick={(e) => {
      e.stopPropagation();
      props.onToggle();
    }}
  >
    <IconTsx icon={props.locked ? 'lock' : 'lockoff'} />
  </button>
);
