import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import Row from '@components/rowTsx';
import Section from '@components/section';
import {toastNew} from '@components/toast';
import {For, createMemo} from 'solid-js';
import {i18n, LangPackKey} from '@lib/langPack';
import {
  MAIN_MENU_ITEMS,
  WEB_MENU_ITEM_IDS,
  getEditorMainMenuLayout,
  isMainMenuCustomized,
  resetMainMenuLayout,
  setMenuItemVisible
} from '@stores/exteralessMenuLayout';

/**
 * The main menu layout screen (FOLD-11/13; the reorder of FOLD-10 stays with
 * the Android editor and the `.extera` backup): which of the tools-menu items
 * that map to Android's `MainMenuItem` ids the left sidebar's burger menu
 * shows. A row toggles its id between the halves of
 * `OEAppearanceMainMenuLayout` exactly like Android's editor save; Settings
 * is never hideable (the web always runs without the bottom navigation bar,
 * Android's `ensureSettingsVisibility`); ids without a web backing are not
 * offered (the pill-registry rule).
 */

const MENU_ITEM_NAME_KEYS: {[id: number]: LangPackKey} = {
  [MAIN_MENU_ITEMS.SAVED]: 'SavedMessages',
  [MAIN_MENU_ITEMS.ARCHIVE]: 'ArchivedChats',
  [MAIN_MENU_ITEMS.CONTACTS]: 'Contacts',
  [MAIN_MENU_ITEMS.CALLS]: 'Calls',
  [MAIN_MENU_ITEMS.SETTINGS]: 'Settings'
};

const MenuItemListSection = (props: {nameKey: LangPackKey, infoKey?: LangPackKey, visible: boolean}) => {
  // * Android's editor read: an uncustomized key lists the layout the menu
  // * really runs (the stock halves), so the first toggle edits it instead of
  // * collapsing the menu to the one toggled item
  const layout = createMemo(() => getEditorMainMenuLayout());
  const ids = () => {
    const half = props.visible ? layout().visible : layout().hidden;
    return half.filter((id) => WEB_MENU_ITEM_IDS.includes(id) && MENU_ITEM_NAME_KEYS[id]);
  };

  return (
    <Section name={props.nameKey} caption={props.infoKey}>
      <For each={ids()}>{(id) => (
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={props.visible}
              onChange={(value) => setMenuItemVisible(id, value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n(MENU_ITEM_NAME_KEYS[id])}</Row.Title>
        </Row>
      )}</For>
      <For each={ids().length ? [] : [1]}>{() => (
        <Row>
          <Row.Title>{i18n('Exteraless.PillStack.Empty')}</Row.Title>
        </Row>
      )}</For>
    </Section>
  );
};

const ExteralessMainMenu = () => {
  const customized = createMemo(() => isMainMenuCustomized());

  return (
    <>
      <Section name="Exteraless.MainMenu" caption="Exteraless.MainMenu.Info" />
      <MenuItemListSection nameKey="Exteraless.MainMenu.Visible" visible={true} />
      <MenuItemListSection nameKey="Exteraless.MainMenu.Hidden" visible={false} />
      <Section>
        <Row clickable={() => {
          resetMainMenuLayout();
          toastNew({langPackKey: 'Exteraless.MainMenu.ResetDone'});
        }}>
          <Row.Title>{i18n('Exteraless.MainMenu.ResetToDefault')}</Row.Title>
          {customized() ? null : <Row.Subtitle>{i18n('Exteraless.MainMenu.NotCustomized')}</Row.Subtitle>}
        </Row>
      </Section>
    </>
  );
};

export default ExteralessMainMenu;
