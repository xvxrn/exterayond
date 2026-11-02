import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import Row from '@components/rowTsx';
import Section from '@components/section';
import {toastNew} from '@components/toast';
import {For, createMemo} from 'solid-js';
import {i18n, LangPackKey} from '@lib/langPack';
import {getHubPillGroups, getRegisteredPill, resetPillLayout, setPillActive} from '@stores/exteralessPills';
import {useExteralessSettings} from '@stores/exteralessSettings';

/**
 * The Pill Stack screen of the exteraless Preferences hub, ported from
 * Android's `PillStackSettingsActivity` (PILLS-01/02/12): which pills the
 * search-field strip shows, in which order (the stored layout strings), and
 * the strip's one behavior switch so far — infinite scrolling. A pill moves
 * between the lists on click, exactly Android's `onItemClick`; the lists show
 * only the pills the web registry can really back (`@stores/exteralessPills`),
 * the same set the strip renders.
 */

const PillListSection = (props: {nameKey: LangPackKey, activate: boolean}) => {
  const groups = createMemo(() => getHubPillGroups());
  const pills = () => props.activate ? groups().hidden : groups().active;

  return (
    <Section name={props.nameKey}>
      <For each={pills()}>{(id) => (
        <Row clickable={() => setPillActive(id, props.activate)}>
          <Row.Title>{i18n(getRegisteredPill(id)?.nameKey ?? 'Exteraless.PillStack.CacheName')}</Row.Title>
        </Row>
      )}</For>
      <For each={pills().length ? [] : [1]}>{() => (
        <Row>
          <Row.Title>{i18n('Exteraless.PillStack.Empty')}</Row.Title>
        </Row>
      )}</For>
    </Section>
  );
};

const ExteralessPillStack = () => {
  const [exteralessSettings, setExteralessSetting] = useExteralessSettings();

  return (
    <>
      <Section name="Exteraless.PillStack" caption="Exteraless.PillStack.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exteralessSettings.OEPillInfiniteScrolling}
              onChange={(value) => setExteralessSetting('OEPillInfiniteScrolling', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exteraless.PillStack.InfiniteScrolling')}</Row.Title>
        </Row>
      </Section>
      <PillListSection nameKey="Exteraless.PillStack.ActivePills" activate={false} />
      <PillListSection nameKey="Exteraless.PillStack.HiddenPills" activate={true} />
      <Section>
        <Row clickable={() => {
          resetPillLayout();
          toastNew({langPackKey: 'Exteraless.PillStack.ResetDone'});
        }}>
          <Row.Title>{i18n('Exteraless.PillStack.ResetToDefault')}</Row.Title>
        </Row>
      </Section>
    </>
  );
};

export default ExteralessPillStack;
