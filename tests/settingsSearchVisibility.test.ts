import {searchSettings, getSettingsSearchSuggestions} from '@lib/settingsSearch';
import {setExterayondSetting} from '@stores/exterayondSettings';

vi.mock('@lib/langPack', () => {
  const strings = new Map([
    ['TelegramFAQ', 'Telegram FAQ'],
    ['Premium.Boarding.Title', 'Telegram Premium'],
    ['Exterayond.HideHelpSection', 'Hide Help section'],
    ['Exterayond.HideHelpSection.SearchKeywords', 'faq,help'],
    ['Exterayond.HidePremiumSection', 'Hide Premium section']
  ]);
  return {default: {strings, weakMap: new WeakMap(), format: (key: string) => strings.get(key) || key}};
});

beforeEach(() => {
  setExterayondSetting('HideHelpSection', false);
  setExterayondSetting('HidePremiumSection', false);
});
afterEach(() => {
  setExterayondSetting('HideHelpSection', true);
  setExterayondSetting('HidePremiumSection', false);
});

test.each([
  ['FAQ', 'HideHelpSection', 'AppSettingsTab:TelegramFAQ', 'AppExterayondChatsTab:Exterayond.HideHelpSection'],
  ['Premium', 'HidePremiumSection', 'AppSettingsTab:Premium.Boarding.Title', 'AppExterayondChatsTab:Exterayond.HidePremiumSection']
] as const)('hidden %s rows leave search and recents, but their preference stays discoverable', (query, key, rowId, toggleId) => {
  const ids = () => searchSettings(query).map((item) => item.id);
  expect(ids()).toContain(rowId);
  expect(ids()).toContain(toggleId);
  setExterayondSetting(key, true);
  expect(ids()).not.toContain(rowId);
  expect(ids()).toContain(toggleId);
  expect(getSettingsSearchSuggestions([rowId, toggleId]).map((item) => item.id)).toEqual([toggleId]);
  setExterayondSetting(key, false);
  expect(ids()).toContain(rowId);
});
test('a settings search result reveals a component inside a collapsed disclosure', async() => {
  const {highlightControl} = await import('@lib/settingsSearch/highlight');
  const {default: I18n} = await import('@lib/langPack');
  const {getMiddleware} = await import('@helpers/middleware');
  const middleware = getMiddleware();
  const root = document.createElement('div');
  const details = document.createElement('details');
  const row = document.createElement('div');
  row.className = 'row';
  const label = document.createElement('span');
  label.className = 'i18n';
  I18n.weakMap.set(label, {key: 'Exterayond.Md3.Switches'} as unknown as Parameters<typeof I18n.weakMap.set>[1]);
  row.append(label);
  details.append(row);
  root.append(details);
  document.body.append(root);
  highlightControl('Exterayond.Md3.Switches', {root, middleware: middleware.get()});
  expect(details.open).toBe(true);
  expect(row.classList.contains('is-settings-highlighted')).toBe(true);
  middleware.destroy();
  root.remove();
});
