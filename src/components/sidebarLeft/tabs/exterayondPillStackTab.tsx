import CheckboxFieldTsx from '@components/checkboxFieldTsx';
import Row from '@components/rowTsx';
import Section from '@components/section';
import {toastNew} from '@components/toast';
import {For, createMemo} from 'solid-js';
import {i18n, LangPackKey} from '@lib/langPack';
import {getHubPillGroups, getRegisteredPill, resetPillLayout, setPillActive} from '@stores/exterayondPills';
import {useExterayondSettings} from '@stores/exterayondSettings';

/**
 * The Pill Stack screen of the exteraless Preferences hub, ported from
 * Android's `PillStackSettingsActivity` (PILLS-01/02/12): which pills the
 * search-field strip shows, in which order (the stored layout strings), and
 * the strip's one behavior switch so far — infinite scrolling. A pill moves
 * between the lists on click, exactly Android's `onItemClick`; the lists show
 * only the pills the web registry can really back (`@stores/exterayondPills`),
 * the same set the strip renders.
 */

const PillListSection = (props: {nameKey: LangPackKey, activate: boolean}) => {
  const groups = createMemo(() => getHubPillGroups());
  const pills = () => props.activate ? groups().hidden : groups().active;

  return (
    <Section name={props.nameKey}>
      <For each={pills()}>{(id) => (
        <Row clickable={() => setPillActive(id, props.activate)}>
          <Row.Title>{i18n(getRegisteredPill(id)?.nameKey ?? 'Exterayond.PillStack.CacheName')}</Row.Title>
        </Row>
      )}</For>
      <For each={pills().length ? [] : [1]}>{() => (
        <Row>
          <Row.Title>{i18n('Exterayond.PillStack.Empty')}</Row.Title>
        </Row>
      )}</For>
    </Section>
  );
};

const ExterayondPillStack = () => {
  const [exterayondSettings, setExterayondSetting] = useExterayondSettings();

  return (
    <>
      <Section name="Exterayond.PillStack" caption="Exterayond.PillStack.Info">
        <Row>
          <Row.CheckboxFieldToggle>
            <CheckboxFieldTsx
              toggle
              checked={exterayondSettings.OEPillInfiniteScrolling}
              onChange={(value) => setExterayondSetting('OEPillInfiniteScrolling', value)}
            />
          </Row.CheckboxFieldToggle>
          <Row.Title>{i18n('Exterayond.PillStack.InfiniteScrolling')}</Row.Title>
        </Row>
      </Section>
      <PillListSection nameKey="Exterayond.PillStack.ActivePills" activate={false} />
      <PillListSection nameKey="Exterayond.PillStack.HiddenPills" activate={true} />
      <Section>
        <Row clickable={() => {
          resetPillLayout();
          toastNew({langPackKey: 'Exterayond.PillStack.ResetDone'});
        }}>
          <Row.Title>{i18n('Exterayond.PillStack.ResetToDefault')}</Row.Title>
        </Row>
      </Section>
    </>
  );
};

export default ExterayondPillStack;
