import {render} from 'solid-js/web';
import {appSettings, setAppSettings, setAppSettingsSilent} from '@stores/appSettings';
import {isArchiveHidden, setArchiveHidden, resetExteralessPreferences} from '@stores/exteralessPreferences';
import {applyExteraBackup, buildExteraBackup, etgBackup} from '@lib/exteraBackup/etgBackup';
import {joinDeepPath} from '@helpers/object/setDeepProperty';

const write = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('@lib/rootScope', () => ({default: {
  managers: {appStateManager: {setByKey: write}},
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEventSingle: vi.fn()
}}));

beforeEach(() => {
  setAppSettingsSilent({showArchiveInChatList: true, cacheTTL: 123});
  write.mockClear();
});

afterEach(() => {
  document.body.replaceChildren();
});

test('the hub and native callers share one reactive, persisted value', async() => {
  const host = document.createElement('div');
  document.body.append(host);
  const dispose = render(() => <span>{isArchiveHidden() ? 'hidden' : 'shown'}</span>, host);
  expect(host.textContent).toBe('shown');
  await setArchiveHidden(true);
  expect(appSettings.showArchiveInChatList).toBe(false);
  expect(host.textContent).toBe('hidden');
  expect(write).toHaveBeenLastCalledWith(joinDeepPath('settings', 'showArchiveInChatList'), false);
  await setAppSettings('showArchiveInChatList', true);
  expect(isArchiveHidden()).toBe(false);
  expect(host.textContent).toBe('shown');
  dispose();
});

test('backup uses exactly the Android alias and strict boolean validation', async() => {
  await setArchiveHidden(true);
  const backup = JSON.parse(buildExteraBackup(false));
  expect(backup.exteraconfig.hideArchiveFolder).toBe(true);
  expect(backup.exteraconfig.HideArchive).toBeUndefined();
  const read = etgBackup.readBackup(JSON.stringify({exteraconfig: {hideArchiveFolder: false}}));
  expect(read.knownCount).toBe(1);
  expect(read.unsupported).toEqual([]);
  expect(applyExteraBackup(read.root)).toEqual({applied: 1, unsupported: []});
  expect(isArchiveHidden()).toBe(false);

  write.mockClear();
  for(const value of ['true', 1, null, [], {}]) {
    const root = {exteraconfig: {hideArchiveFolder: value}};
    expect(etgBackup.readBackup(JSON.stringify(root)).knownCount).toBe(0);
    expect(applyExteraBackup(root).applied).toBe(0);
  }
  expect(write).not.toHaveBeenCalled();
  expect(isArchiveHidden()).toBe(false);
});

test('reset restores the Android default without resetting unrelated native settings', async() => {
  await setArchiveHidden(true);
  write.mockClear();
  resetExteralessPreferences();
  expect(isArchiveHidden()).toBe(false);
  expect(appSettings.cacheTTL).toBe(123);
  expect(write.mock.calls).toEqual([[joinDeepPath('settings', 'showArchiveInChatList'), true]]);
  write.mockClear();
  resetExteralessPreferences();
  expect(write).not.toHaveBeenCalled();
});
