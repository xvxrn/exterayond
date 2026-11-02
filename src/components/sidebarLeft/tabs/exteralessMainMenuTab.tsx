import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import {IconTsx} from '@components/iconTsx';
import Row from '@components/rowTsx';
import Section from '@components/section';
import {toastNew} from '@components/toast';
import {For, createMemo} from 'solid-js';
import {i18n, LangPackKey} from '@lib/langPack';
import {MAIN_MENU_ITEMS, WEB_MENU_ITEM_IDS, addMenuDivider, getEditorMainMenuLayout, isMainMenuCustomized, moveMenuEntry, removeMenuDivider, resetMainMenuLayout, setMenuItemVisible} from '@stores/exteralessMenuLayout';

/**
 * The main menu layout screen (FOLD-10..13): which of the tools-menu items
 * that map to Android's `MainMenuItem` ids the left sidebar's burger menu
 * shows, in which order, and where the dividers sit. Android's editor
 * (`OpenExteraAppNavigationActivity`) reorders by long-press drag inside the
 * visible section and manages dividers with an "add divider" button and a
 * click on the divider row; the desktop adaptation moves an entry with the
 * row's up/down buttons and does the same to the dividers. A toggle moves its
 * id between the halves of `OEAppearanceMainMenuLayout` exactly like
 * Android's editor save; Settings is never hideable (the web always runs
 * without the bottom navigation bar, Android's `ensureSettingsVisibility`);
 * ids without a web backing are not offered (the pill-registry rule).
 */

const MENU_ITEM_NAME_KEYS: {[id: number]: LangPackKey} = {
  [MAIN_MENU_ITEMS.SAVED]: 'SavedMessages',
  [MAIN_MENU_ITEMS.ARCHIVE]: 'ArchivedChats',
  [MAIN_MENU_ITEMS.CONTACTS]: 'Contacts',
  [MAIN_MENU_ITEMS.CALLS]: 'Calls',
  [MAIN_MENU_ITEMS.SETTINGS]: 'Settings'
};

const MoveButtons = (props: {onMove: (direction: 'up' | 'down') => void}) => (
  <span class="exteraless-menu-move-buttons">
    <button
      class="exteraless-menu-move-button"
      aria-label={i18n('Exteraless.MainMenu.MoveUp').textContent}
      onClick={(e) => {
        e.stopPropagation();
        props.onMove('up');
      }}
    >
      <IconTsx icon="up" />
    </button>
    <button
      class="exteraless-menu-move-button"
      aria-label={i18n('Exteraless.MainMenu.MoveDown').textContent}
      onClick={(e) => {
        e.stopPropagation();
        props.onMove('down');
      }}
    >
      <IconTsx icon="down" />
    </button>
  </span>
);

const VisibleItemsSection = () => {
  // * Android's editor read: an uncustomized key lists the layout the menu
  // * really runs (the stock halves), so the first edit customizes it instead
  // * of collapsing the menu to the one touched item. The displayed entries
  // * are the backed ids and the dividers; unbacked ids stay in storage,
  // * invisible.
  const entries = createMemo(() => {
    const rows: {id: number, dividerOrdinal: number}[] = [];
    let dividers = 0;
    for(const id of getEditorMainMenuLayout().visible) {
      if(id === MAIN_MENU_ITEMS.DIVIDER) {
        rows.push({id, dividerOrdinal: dividers++});
      } else if(WEB_MENU_ITEM_IDS.includes(id) && MENU_ITEM_NAME_KEYS[id]) {
        rows.push({id, dividerOrdinal: -1});
      }
    }

    return rows;
  });

  return (
    <Section name="Exteraless.MainMenu.Visible">
      <For each={entries()}>{(entry, index) => {
        const move = (direction: 'up' | 'down') => moveMenuEntry(index(), direction);
        if(entry.id === MAIN_MENU_ITEMS.DIVIDER) {
          const ordinal = entry.dividerOrdinal;
          return (
            // * Android's editor: clicking a divider row removes it
            <Row clickable={() => removeMenuDivider(ordinal)}>
              <Row.Title titleRight={<MoveButtons onMove={move} />}>
                {i18n('Exteraless.MainMenu.Divider')}
              </Row.Title>
              <Row.Subtitle>{i18n('Exteraless.MainMenu.Divider.Remove')}</Row.Subtitle>
            </Row>
          );
        }

        return (
          <Row>
            <Row.CheckboxFieldToggle>
              <CheckboxFieldTsx
                toggle
                checked={true}
                onChange={() => setMenuItemVisible(entry.id, false)}
              />
            </Row.CheckboxFieldToggle>
            <Row.Title titleRight={<MoveButtons onMove={move} />}>
              {i18n(MENU_ITEM_NAME_KEYS[entry.id])}
            </Row.Title>
          </Row>
        );
      }}</For>
      <Row clickable={addMenuDivider}>
        <Row.Icon icon="add" />
        <Row.Title>{i18n('Exteraless.MainMenu.AddDivider')}</Row.Title>
      </Row>
    </Section>
  );
};

const HiddenItemsSection = () => {
  const ids = createMemo(() => getEditorMainMenuLayout().hidden
    .filter((id) => WEB_MENU_ITEM_IDS.includes(id) && MENU_ITEM_NAME_KEYS[id]));

  return (
    <Section name="Exteraless.MainMenu.Hidden">
      <For each={ids()}>{(id) => (
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={false}
              onChange={() => setMenuItemVisible(id, true)}
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
      <VisibleItemsSection />
      <HiddenItemsSection />
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
