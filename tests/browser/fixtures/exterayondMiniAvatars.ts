// Test fixture for task002: real avatarNew + AppDialogsManager.setLastMessageN over popup sandbox mocks. No account, no worker.
import '@components/popupSandbox/bootstrapState';
import {installSandboxEnvironment} from '@components/popupSandbox/environment';
import {contactUser, premiumUser, makeMessage, NOW, GROUP_PEER_ID, CONTACT_PEER_ID, PREMIUM_PEER_ID} from '@components/popupSandbox/fixtures';
import {DialogElement} from '@components/dialogElement';
import {setExteralessSetting} from '@stores/exteralessSettings';
import I18n from '@lib/langPack';
import '@/scss/style.scss';

type Expected = {avatars: number, sender: string};

const resultEl = document.getElementById('fixture-result')!;
const detailEl = document.getElementById('fixture-detail')!;
const toggle = document.getElementById('fixture-toggle') as HTMLInputElement;
const sameButton = document.getElementById('fixture-same') as HTMLButtonElement;
const senderButton = document.getElementById('fixture-sender') as HTMLButtonElement;
const deleteButton = document.getElementById('fixture-delete') as HTMLButtonElement;
const createButton = document.getElementById('fixture-create') as HTMLButtonElement;
const dirButton = document.getElementById('fixture-dir') as HTMLButtonElement;
const rowHost = document.getElementById('fixture-list') as HTMLElement;
const miniAvatar = () => element?.dom.listEl.querySelector<HTMLElement>('.dialog-sender-mini-avatar');
const setControlsDisabled = (disabled: boolean) =>
  [toggle, sameButton, senderButton, deleteButton, createButton, dirButton].forEach((control) => control.disabled = disabled);

const LONG_SUBTITLE = 'A deliberately long subtitle that has to elide inside the stock row without pushing the sender name out of the line';

let element: DialogElement;
let manager: any;
let senderPeerId: PeerId = CONTACT_PEER_ID;
let update = 0;
const newMessage = (age: number, text: string) => makeMessage({
  mid: 2001,
  peerId: GROUP_PEER_ID,
  fromId: senderPeerId,
  from_id: {_: 'peerUser', user_id: senderPeerId.toString()},
  date: NOW - 60 + age,
  message: text
});
let message = newMessage(0, LONG_SUBTITLE);
const dialog = {_: 'dialog', pFlags: {}, peerId: GROUP_PEER_ID, top_message: message.mid, topMessage: message} as any;

const senderName = () => senderPeerId === CONTACT_PEER_ID ? contactUser.first_name : premiumUser.first_name;
const expected = (): Expected => ({avatars: element && toggle.checked ? 1 : 0, sender: element ? senderName() : ''});

const snapshot = () => {
  const row = element?.dom.listEl;
  const avatars = row ? Array.from(row.querySelectorAll<HTMLElement>('.dialog-sender-mini-avatar')) : [];
  const rect = avatars[0]?.getBoundingClientRect();
  const senderEl = row?.querySelector<HTMLElement>('.dialog-subtitle-span .primary-text .peer-title');
  const sender = (senderEl?.textContent || '').replace(/\s*:\s*$/, '').trim();
  const main = document.querySelector('main');
  const overflow = (main && main.scrollWidth > main.clientWidth + 1) || !!row && (row.scrollWidth > row.clientWidth + 1 || document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  return {avatars: avatars.length, size: rect ? `${Math.round(rect.width)}×${Math.round(rect.height)}` : '—', sender, overflow};
};

const matches = (state: ReturnType<typeof snapshot>, want: Expected) =>
  state.avatars === want.avatars && (want.avatars === 0 || state.size === '20×20') && (!want.sender || state.sender.includes(want.sender)) && !state.overflow;

const report = async(want: Expected, extra?: () => {label: string, pass: boolean}) => {
  resultEl.textContent = 'CHECKING';
  for(let i = 0; i < 60; ++i) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    if(matches(snapshot(), want)) break;
  }

  const state = snapshot();
  const extraResult = extra?.();
  const pass = matches(state, want) && (!extraResult || extraResult.pass);
  resultEl.textContent = pass ? 'PASS' : 'FAIL';
  resultEl.dataset.state = pass ? 'pass' : 'fail';
  detailEl.textContent =
    `avatars ${state.avatars} / expected ${want.avatars}; ` +
    `size ${state.size} / expected 20×20; ` +
    `sender "${state.sender}" / expected "${want.sender || '—'}"; ` +
    `horizontal overflow ${state.overflow ? 'yes' : 'none'}; ` +
    `direction ${document.documentElement.dir || 'ltr'}` +
    (extraResult ? `; ${extraResult.label} ${extraResult.pass ? 'kept' : 'failed'}` : '') + '.';
};

const showMessage = async() => {
  message = newMessage(++update, `${LONG_SUBTITLE} (update ${update})`);
  dialog.top_message = message.mid;
  dialog.topMessage = message;
  await manager.setLastMessageN({dialog, lastMessage: message, dialogElement: element, setUnread: false});
};

const createRow = async() => {
  element?.remove();
  const loadPromises: Promise<any>[] = [];
  element = new DialogElement({peerId: GROUP_PEER_ID, controlled: true, loadPromises, wrapOptions: {}});
  rowHost.append(element.dom.listEl);
  await Promise.all(loadPromises);
  await showMessage();
};

const fail = (reason: string) => {
  resultEl.textContent = 'FAIL';
  resultEl.dataset.state = 'fail';
  detailEl.textContent = reason;
};

const requireRow = () => {
  if(element) return true;
  fail('No row is mounted. Press Create row first.');
  return false;
};

let busy = false;
const run = async(action: () => Promise<void>) => {
  if(busy) return;
  busy = true;
  setControlsDisabled(true);
  try {
    await action();
  } catch(err) {
    fail(`Fixture action failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    busy = false;
    setControlsDisabled(false);
  }
};

toggle.addEventListener('change', () => void run(async() => {
  setExteralessSetting('OEAppearanceSenderMiniAvatars', toggle.checked);
  await report(expected());
}));

sameButton.addEventListener('click', () => void run(async() => {
  if(!requireRow()) return;
  const before = miniAvatar();
  // Bit-identical message and dialog: only the renderKey skip may keep this row alive.
  for(let i = 0; i < 3; ++i) {
    await manager.setLastMessageN({dialog, lastMessage: message, dialogElement: element, setUnread: false});
  }

  await report(expected(), () => ({label: 'same avatar node', pass: !toggle.checked || (!!before && miniAvatar() === before)}));
}));

senderButton.addEventListener('click', () => void run(async() => {
  if(!requireRow()) return;
  senderPeerId = senderPeerId === CONTACT_PEER_ID ? PREMIUM_PEER_ID : CONTACT_PEER_ID;
  await showMessage();
  await report(expected());
}));

deleteButton.addEventListener('click', () => void run(async() => {
  const retired = element?.dom.listEl;
  element?.remove();
  element = undefined;
  await report({avatars: 0, sender: ''}, () => ({label: 'retired row avatar cleanup', pass: !retired || !retired.querySelector('.dialog-sender-mini-avatar')}));
}));

createButton.addEventListener('click', () => void run(async() => {
  await createRow();
  await report(expected());
}));

dirButton.addEventListener('click', () => void run(async() => {
  const rtl = !I18n.getIsRTL();
  I18n.forceRTL(rtl);
  dirButton.textContent = `Direction: ${rtl ? 'RTL' : 'LTR'}`;
  dirButton.setAttribute('aria-pressed', String(rtl));
  await report(expected());
}));

const boot = async() => {
  try {
    await installSandboxEnvironment();
    // The registry is imported only after the sandbox environment is installed.
    await import('@lib/solidjs/hotReloadGuardValue');
    manager = (await import('@lib/appDialogsManager')).default;
    setExteralessSetting('OEAppearanceSenderMiniAvatars', toggle.checked);
    await createRow();
    await report(expected());
    setControlsDisabled(false);
  } catch(err) {
    fail(`Fixture boot failed: ${err instanceof Error ? err.message : String(err)}`);
  }
};

void boot();
