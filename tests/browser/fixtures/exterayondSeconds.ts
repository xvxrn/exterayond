// Test fixture for task003: message times from the real I18n/date formatter, toggled live.
// Only the popup sandbox mocks are used; no account and no Telegram worker.
import '@helpers/peerIdPolyfill';
import '@components/popupSandbox/bootstrapState';
import {installSandboxEnvironment} from '@components/popupSandbox/environment';
import I18n from '@lib/langPack';
import {formatDateAccordingToTodayNew, formatFullSentTimeRaw, formatTime} from '@helpers/date';
import formatDuration from '@helpers/formatDuration';
import {setExteralessSetting} from '@stores/exteralessSettings';
import '@/scss/style.scss';

const resultEl = document.getElementById('fixture-result')!;
const detailEl = document.getElementById('fixture-detail')!;
const toggle = document.getElementById('fixture-toggle') as HTMLInputElement;
const cycleButton = document.getElementById('fixture-cycle') as HTMLButtonElement;
const dirButton = document.getElementById('fixture-dir') as HTMLButtonElement;
const timeHost = document.getElementById('fixture-time') as HTMLElement;
const combinedHost = document.getElementById('fixture-combined') as HTMLElement;
const separatorHost = document.getElementById('fixture-separator') as HTMLElement;
const durationHost = document.getElementById('fixture-duration') as HTMLElement;

const date = new Date();
date.setHours(12, 34, 56, 0);

let timeEl: HTMLElement;
let combinedEl: HTMLElement;
let cycle: 'h23' | 'h12' = 'h23';
let separatorText = '';
let durationText = '';

const colons = (text: string) => (text.match(/:/g) || []).length;
const isRTL = () => document.documentElement.dir === 'rtl';

const matches = () => {
  const text = timeEl?.textContent || '';
  const expectedColons = toggle.checked ? 2 : 1;
  return colons(text) === expectedColons &&
    colons(combinedEl?.textContent || '') === expectedColons &&
    (cycle === 'h12') === /[AP]M$/.test(text) &&
    separatorHost.textContent === separatorText &&
    durationHost.textContent === durationText;
};

const report = async() => {
  resultEl.textContent = 'CHECKING';
  for(let i = 0; i < 40; ++i) {
    if(matches()) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const pass = matches();
  resultEl.textContent = pass ? 'PASS' : 'FAIL';
  resultEl.dataset.state = pass ? 'pass' : 'fail';
  detailEl.textContent =
    `time "${timeEl?.textContent || ''}"; ` +
    `combined "${combinedEl?.textContent || ''}"; ` +
    `seconds ${toggle.checked ? 'on' : 'off'}; ` +
    `cycle ${cycle}; ` +
    `separator "${separatorHost.textContent}"; ` +
    `duration "${durationHost.textContent}"; ` +
    `direction ${isRTL() ? 'rtl' : 'ltr'}.`;
};

const fail = (reason: string) => {
  resultEl.textContent = 'FAIL';
  resultEl.dataset.state = 'fail';
  detailEl.textContent = reason;
};

const renderSamples = () => {
  // * mounted once: the toggle must update these same elements, not replace them
  timeEl = formatTime(date);
  timeHost.replaceChildren(timeEl);
  combinedEl = formatFullSentTimeRaw(date.getTime() / 1000, {combined: true}).dateEl;
  combinedHost.replaceChildren(combinedEl);
  separatorHost.replaceChildren(formatDateAccordingToTodayNew(new Date()));
  durationHost.textContent = JSON.stringify(formatDuration(754, 2));
  separatorText = separatorHost.textContent!;
  durationText = durationHost.textContent!;
};

toggle.addEventListener('change', async() => {
  setExteralessSetting('showSeconds', toggle.checked);
  await report();
});

cycleButton.addEventListener('click', async() => {
  cycle = cycle === 'h23' ? 'h12' : 'h23';
  I18n.setTimeFormat(cycle);
  cycleButton.textContent = `Hour cycle: ${cycle === 'h23' ? '24h' : '12h'}`;
  // * the stock hour-cycle switch re-renders every date too: re-baseline the sentinels
  separatorText = separatorHost.textContent!;
  durationText = durationHost.textContent!;
  await report();
});

dirButton.addEventListener('click', async() => {
  I18n.forceRTL(!isRTL());
  dirButton.textContent = `Direction: ${isRTL() ? 'RTL' : 'LTR'}`;
  dirButton.setAttribute('aria-pressed', String(isRTL()));
  await report();
});

const boot = async() => {
  if(!new URLSearchParams(location.search).has('popups')) {
    fail('Open this fixture with ?popups=1 so the popup sandbox bootstrap stays standalone.');
    return;
  }

  try {
    await installSandboxEnvironment();
    setExteralessSetting('showSeconds', false);
    I18n.setTimeFormat(cycle);
    toggle.checked = false;
    renderSamples();
    await report();
  } catch(err) {
    fail(`Fixture boot failed: ${err instanceof Error ? err.message : String(err)}`);
  }
};

void boot();
