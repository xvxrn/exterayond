import Row from '@components/rowTsx';
import Section from '@components/section';
import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {GhostLockButton} from '@components/exterayondGhostLockButton';
import type {JSX} from 'solid-js';
import {i18n} from '@lib/langPack';
import {toastNew} from '@components/toast';
import confirmationPopup from '@components/confirmationPopup';
import {useSuperTab} from '@components/solidJsTabs/superTabProvider';
import noop from '@helpers/noop';
import {resetExterayondPreferences} from '@stores/exterayondPreferences';
import {
  GHOST_FLAG_KEYS,
  GHOST_LOCKED_OF,
  isExterayondGhostModeActive,
  setExterayondGhostMode,
  useExterayondSettings
} from '@stores/exterayondSettings';
import {isFlagInGhostState} from '@lib/exterayondGhost';
import {
  EXTENSION,
  applyExteraBackup,
  backupImportReport,
  buildExteraBackup,
  etgBackup
} from '@lib/exteraBackup/etgBackup';

/**
 * The Other category of the exteraless Preferences hub: Ghost Mode
 * (`GhostModeActivity`, reached from here on Android too — through the
 * AyuMoments screen) and the `.extera` settings backup, byte-compatible with
 * exteraGram (`EtgBackup`).
 */

/** The essentials' row titles, Android's own strings (GhostModeActivity). */
const GHOST_ROW_TITLES: Record<(typeof GHOST_FLAG_KEYS)[number], JSX.Element> = {
  sendReadMessagePackets: i18n('Exterayond.Ghost.NoReadMessages'),
  sendReadStoriesPackets: i18n('Exterayond.Ghost.NoReadStories'),
  sendOnlinePackets: i18n('Exterayond.Ghost.NoOnline'),
  sendUploadProgress: i18n('Exterayond.Ghost.NoTyping'),
  sendOfflinePacketAfterOnline: i18n('Exterayond.Ghost.OfflineAfter')
};

/**
 * One essential's row: the checkbox shows the ghost state (Android's
 * CheckBoxCell checkValue, inverted except "Go Offline Automatically"), the
 * lock button is GHOST-12's desktop analog. The title is a literal at the
 * call site because the settings-search extractor indexes rendered labels.
 */
const GhostEssentialRow = (props: {
  flagKey: typeof GHOST_FLAG_KEYS[number],
  locked: boolean,
  lockDisabled: boolean,
  onToggleLock: () => void,
  children: JSX.Element
}) => {
  const [exterayondSettings, setExterayondSetting] = useExterayondSettings();
  return (
    <Row>
      <Row.CheckboxFieldToggle>
        <CheckboxFieldTsx
          toggle
          checked={isFlagInGhostState(props.flagKey, exterayondSettings[props.flagKey] as boolean)}
          disabled={props.locked}
          onChange={(value) => setExterayondSetting(props.flagKey, isFlagInGhostState(props.flagKey, value))}
        />
      </Row.CheckboxFieldToggle>
      <Row.Title titleRight={
        <GhostLockButton
          locked={props.locked}
          disabled={props.lockDisabled}
          onToggle={props.onToggleLock}
        />
      }>{props.children}</Row.Title>
    </Row>
  );
};

const ExterayondOther = () => {
  const [tab] = useSuperTab();
  const [exterayondSettings, setExterayondSetting] = useExterayondSettings();

  // * Android's "%d/5": how many essentials currently sit in their ghost state
  const ghostCount = () => GHOST_FLAG_KEYS.filter(
    (key) => isFlagInGhostState(key, exterayondSettings[key] as boolean)
  ).length;
  const ghostLockedCount = () => GHOST_FLAG_KEYS.filter(
    (key) => exterayondSettings[GHOST_LOCKED_OF[key]] as boolean
  ).length;

  const toggleGhostMode = (value: boolean) => {
    setExterayondGhostMode(value);
    toastNew({langPackKey: value ? 'Exterayond.Ghost.Enabled' : 'Exterayond.Ghost.Disabled'});
  };
  const resetSettings = () => confirmationPopup({
    managers: tab.managers,
    titleLangKey: 'Exterayond.Reset.Title',
    descriptionLangKey: 'Exterayond.Reset.Description',
    button: {langKey: 'Reset', isDanger: true}
  }).then(() => {
    resetExterayondPreferences();
    toastNew({langPackKey: 'Exterayond.Reset.Done'});
  }).catch(noop);

  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = EXTENSION + ',application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result ?? '');
        const read = etgBackup.readBackup(content);
        if(!read || read.knownCount <= 0) {
          toastNew({langPackKey: 'Exterayond.Backup.NotABackup'});
          return;
        }

        const result = applyExteraBackup(read.root);
        // * the report carries the applied count plus the unsupported key
        // * names when the file had Android-only settings (packet 080)
        toastNew(backupImportReport(result));
      };
      reader.readAsText(file);
    };

    input.click();
  };

  const exportBackup = () => {
    const content = buildExteraBackup(true);
    const blob = new Blob([content], {type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = etgBackup.generateBackupName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <Section name="Exterayond.Ghost" caption="Exterayond.Ghost.Notice">
        {/* GHOST-01 — the master toggle (GhostModeActivity's TypeCheck2 row);
            the counter is Android's "%d/5" essentials-in-ghost-state */}
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={isExterayondGhostModeActive()}
              onChange={toggleGhostMode}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.Ghost.Title')}</Row.Title>
          <Row.Subtitle>{`${ghostCount()}/5`}</Row.Subtitle>
        </Row>
        {GHOST_FLAG_KEYS.map((key) => {
          const locked = () => !!exterayondSettings[GHOST_LOCKED_OF[key]];
          return (
            <GhostEssentialRow
              flagKey={key}
              locked={locked()}
              lockDisabled={!locked() && ghostLockedCount() >= 4}
              onToggleLock={() => setExterayondSetting(GHOST_LOCKED_OF[key], !locked())}
            >
              {GHOST_ROW_TITLES[key]}
            </GhostEssentialRow>
          );
        })}
      </Section>
      <Section caption="Exterayond.Backup.Info">
        <Row clickable={importBackup}>
          <Row.Icon icon="download" />
          <Row.Title>{i18n('Exterayond.Backup.Import')}</Row.Title>
        </Row>
        <Row clickable={exportBackup}>
          <Row.Icon icon="download" />
          <Row.Title>{i18n('Exterayond.Backup.Export')}</Row.Title>
        </Row>
      </Section>
      <Section caption="Exterayond.Reset.Info">
        <Row clickable={resetSettings}>
          <Row.Icon icon="delete" />
          <Row.Title>{i18n('Exterayond.Reset')}</Row.Title>
        </Row>
      </Section>
    </>
  );
};

export default ExterayondOther;
