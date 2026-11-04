/**
 * The hub's Main Menu editor screen (FOLD-10/11/12/13): the stock halves on an
 * uncustomized key, the reorder buttons and the divider rows of the desktop
 * adaptation, and the toggles that move an id between the halves. Row/Section
 * render as lightweight DOM fakes — the real Row pulls the app's
 * animation-intersection machinery, which jsdom cannot host; the store
 * contract itself is covered by `exterayondMenuLayout`.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render} from 'solid-js/web';

vi.mock('@lib/langPack', () => ({
  i18n: (key: string) => document.createTextNode(key)
}));
vi.mock('@components/toast', () => ({toastNew: vi.fn()}));
// * `webpSupport` probes a canvas at import time and jsdom returns null for toDataURL
vi.mock('@environment/webpSupport', () => ({default: false}));

vi.mock('@components/rowTsx', async() => {
  const {insert} = await import('solid-js/web');
  const Container = (props: any, baseClass?: string) => {
    const element = document.createElement('div');
    baseClass && element.classList.add(baseClass);
    if(props.clickable) element.addEventListener('click', props.clickable);
    insert(element, () => props.children);
    return element;
  };
  const Row = Object.assign((props: any) => Container(props, 'row'), {
    CheckboxFieldToggle: (props: any) => Container(props, 'row-checkbox-field-toggle'),
    Icon: (props: any) => {
      const icon = document.createElement('div');
      icon.classList.add('row-icon');
      icon.dataset.icon = props.icon;
      return icon;
    },
    Subtitle: (props: any) => Container(props, 'row-subtitle'),
    Title: (props: any) => {
      const element = document.createElement('div');
      element.classList.add('row-title');
      const text = document.createElement('span');
      text.classList.add('row-title-text');
      insert(text, () => props.children);
      element.append(text);
      if(props.titleRight) insert(element, () => props.titleRight);
      return element;
    }
  });

  return {default: Row};
});

vi.mock('@components/checkboxFieldTsx', () => ({
  default: (props: any) => {
    const button = document.createElement('button');
    button.className = 'checkbox-field';
    button.addEventListener('click', () => props.onChange(!props.checked));
    return button;
  }
}));

vi.mock('@components/section', async() => {
  const {insert} = await import('solid-js/web');
  return {
    default: (props: any) => {
      const section = document.createElement('section');
      section.dataset.name = String(props.name ?? '');
      insert(section, () => props.children);
      return section;
    }
  };
});

import ExterayondMainMenu from '@components/sidebarLeft/tabs/exterayondMainMenuTab';
import {OE_DEFAULTS, exterayondSettings, setExterayondSetting} from '@stores/exterayondSettings';
import {MAIN_MENU_ITEMS, getEditorVisibleEntries} from '@stores/exterayondMenuLayout';

const RESET_STORAGE = () => {
  localStorage.clear();
  for(const key of Object.keys(OE_DEFAULTS) as Array<keyof typeof OE_DEFAULTS>) {
    setExterayondSetting(key, OE_DEFAULTS[key]);
  }
};

let dispose: () => void;

beforeEach(RESET_STORAGE);

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

const renderTab = () => {
  const mount = document.createElement('div');
  document.body.append(mount);
  dispose = render(() => <ExterayondMainMenu />, mount);
  return mount;
};

const visibleRows = (mount: Element) =>
  [...(mount.querySelector('section[data-name="Exterayond.MainMenu.Visible"]')?.querySelectorAll('.row') ?? [])] as HTMLElement[];

const visibleTitles = (mount: Element) =>
  visibleRows(mount).map((row) => row.querySelector('.row-title-text')?.textContent);

describe('the Main Menu editor screen', () => {
  it('lists the stock items as visible, with an add-divider row', () => {
    const mount = renderTab();

    expect(visibleTitles(mount)).toEqual([
      'SavedMessages',
      'ArchivedChats',
      'Contacts',
      'Calls',
      'Settings',
      'Exterayond.MainMenu.AddDivider'
    ]);
    // * every item row carries the two reorder buttons
    expect(mount.querySelectorAll('.exteraless-menu-move-button').length).toBe(10);
  });

  it('the move buttons reorder the visible half and the DOM follows', () => {
    const mount = renderTab();

    // * move the second row (Archive) up
    const secondRow = visibleRows(mount)[1];
    secondRow.querySelector<HTMLButtonElement>('.exteraless-menu-move-button')!.click();
    expect(visibleTitles(mount).slice(0, 5)).toEqual(['ArchivedChats', 'SavedMessages', 'Contacts', 'Calls', 'Settings']);
    expect(exterayondSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('14,11,6,10,8');
  });

  it('a row toggle moves the item to the hidden half and back', () => {
    const mount = renderTab();

    // * hide the first row (Saved Messages)
    visibleRows(mount)[0].querySelector<HTMLButtonElement>('.checkbox-field')!.click();
    expect(exterayondSettings.OEAppearanceMainMenuLayout.split(';')[0]).toBe('14,6,10,8');
    expect(getEditorVisibleEntries()).toEqual([14, 6, 10, 8]);

    // * the hidden section lists it; toggling restores at the end
    const hiddenRow = [...mount.querySelectorAll('.row')]
      .find((row) => row.querySelector('.row-title-text')?.textContent === 'SavedMessages') as HTMLElement;
    hiddenRow.querySelector<HTMLButtonElement>('.checkbox-field')!.click();
    expect(getEditorVisibleEntries()).toEqual([14, 6, 10, 8, MAIN_MENU_ITEMS.SAVED]);
  });

  it('the add-divider row appends a divider, its row removes it again', () => {
    const mount = renderTab();
    visibleRows(mount)[visibleRows(mount).length - 1].click();
    expect(getEditorVisibleEntries()).toEqual([11, 14, 6, 10, 8, MAIN_MENU_ITEMS.DIVIDER]);

    // * the divider row rendered after Settings, before the add-divider row;
    // * clicking it removes the divider
    const rows = visibleRows(mount);
    const dividerRow = rows[rows.length - 2];
    expect(dividerRow.querySelector('.row-title-text')?.textContent).toBe('Exterayond.MainMenu.Divider');
    dividerRow.click();
    expect(getEditorVisibleEntries()).toEqual([11, 14, 6, 10, 8]);
  });

  it('an imported layout with unbacked ids and dividers renders only the backed entries', () => {
    setExterayondSetting('OEAppearanceMainMenuLayout', '14,18,-1,8,17,106;2,6,11');
    const mount = renderTab();

    // * 18/17/106 (Profile, QR, Feed) have no web backing — never rendered
    expect(visibleTitles(mount)).toEqual([
      'ArchivedChats',
      'Exterayond.MainMenu.Divider',
      'Settings',
      'Exterayond.MainMenu.AddDivider'
    ]);
  });
});
