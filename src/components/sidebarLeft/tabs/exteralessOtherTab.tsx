import Row from '@components/rowTsx';
import Section from '@components/section';
import {i18n} from '@lib/langPack';
import {toastNew} from '@components/toast';
import {
  EXTENSION,
  applyExteraBackup,
  buildExteraBackup,
  etgBackup
} from '@lib/exteraBackup/etgBackup';

/**
 * The Other category of the exteraless Preferences hub: the `.extera`
 * settings backup, byte-compatible with exteraGram (`EtgBackup`).
 */
const ExteralessOther = () => {
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
          toastNew({langPackKey: 'Exteraless.Backup.NotABackup'});
          return;
        }

        const result = applyExteraBackup(read.root);
        toastNew({
          langPackKey: 'Exteraless.Backup.Applied',
          langPackArguments: [result.applied]
        });
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
    <Section caption="Exteraless.Backup.Info">
      <Row clickable={importBackup}>
        <Row.Icon icon="download" />
        <Row.Title>{i18n('Exteraless.Backup.Import')}</Row.Title>
      </Row>
      <Row clickable={exportBackup}>
        <Row.Icon icon="download" />
        <Row.Title>{i18n('Exteraless.Backup.Export')}</Row.Title>
      </Row>
    </Section>
  );
};

export default ExteralessOther;
