import {afterEach, describe, expect, it, vi} from 'vitest';
import {render} from 'solid-js/web';
import Section from '@components/section';
import {OE_DEFAULTS, setExteralessSetting} from '@stores/exteralessSettings';

let dispose: () => void;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
  setExteralessSetting('OEAppearanceSeparateHeaders', OE_DEFAULTS.OEAppearanceSeparateHeaders);
  setExteralessSetting('OEAppearanceM3ListItems', OE_DEFAULTS.OEAppearanceM3ListItems);
});

describe('Section', () => {
  it('invokes its ref callback once', () => {
    const mount = document.createElement('div');
    const ref = vi.fn();
    document.body.append(mount);

    dispose = render(() => (
      <Section ref={ref}>
        Content
      </Section>
    ), mount);

    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref.mock.calls[0][0]).toBe(mount.firstElementChild);
  });

  it('can render its caption above the section content', () => {
    const mount = document.createElement('div');
    document.body.append(mount);

    dispose = render(() => (
      <Section
        caption={(<span data-testid="caption">Caption</span>) as HTMLElement}
        captionTop
      >
        <span data-testid="content">Content</span>
      </Section>
    ), mount);

    const caption = mount.querySelector('[data-testid="caption"]');
    const content = mount.querySelector('[data-testid="content"]');
    expect(caption.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING)
    .toBeTruthy();
  });

  it('can render only a caption without an empty content section', () => {
    const mount = document.createElement('div');
    document.body.append(mount);

    dispose = render(() => (
      <Section caption="RemovedUsers" noContent />
    ), mount);

    const section = mount.firstElementChild;
    expect(section.childElementCount).toBe(1);
    expect(section.firstElementChild.classList.contains(
      'sidebar-left-section-caption'
    )).toBe(true);
  });
});

// * exteraless separateHeaders (LOOK-12): Android excludes the HeaderCell
// * from the section card while `sectionsSeparatedHeaders()` holds — the web
// * renders the name outside the card instead of inside it. `m3ListItems()`
// * forces the same on Android, so the web gate reads
// * separateHeaders || M3ListItems (there is no SEGMENTS divider style here).
describe('Section separated headers (LOOK-12)', () => {
  const renderSection = () => {
    const mount = document.createElement('div');
    document.body.append(mount);
    dispose = render(() => (
      <Section name="Exteraless.General.Info">Content</Section>
    ), mount);
    return mount;
  };

  it('keeps the header inside the card while separateHeaders is off', () => {
    setExteralessSetting('OEAppearanceSeparateHeaders', false);
    const mount = renderSection();

    const card = mount.querySelector('.sidebar-left-section');
    const name = card.querySelector('.sidebar-left-section-name');
    expect(name).toBeTruthy();
    expect(name.classList.contains('is-separated')).toBe(false);
    expect(mount.querySelector('.is-separated')).toBeNull();
  });

  it('floats the header free of the card while separateHeaders is on', () => {
    setExteralessSetting('OEAppearanceSeparateHeaders', true);
    const mount = renderSection();

    const card = mount.querySelector('.sidebar-left-section');
    expect(card.querySelector('.sidebar-left-section-name')).toBeNull();
    const name = mount.querySelector('.sidebar-left-section-name.is-separated');
    expect(name).toBeTruthy();
    // * the separated header is a previous sibling of the card, not inside it
    expect(name.nextElementSibling).toBe(card);
  });

  it('follows a live toggle in both directions', () => {
    setExteralessSetting('OEAppearanceSeparateHeaders', false);
    const mount = renderSection();

    expect(mount.querySelector('.is-separated')).toBeNull();
    setExteralessSetting('OEAppearanceSeparateHeaders', true);
    const name = mount.querySelector('.sidebar-left-section-name.is-separated');
    expect(name).toBeTruthy();

    setExteralessSetting('OEAppearanceSeparateHeaders', false);
    expect(mount.querySelector('.is-separated')).toBeNull();
    // * back inside the content card (a descendant, not the container's child)
    expect(mount.querySelector('.sidebar-left-section-content > .sidebar-left-section-name')).toBeTruthy();
  });

  it('stays separated with M3 list items on even when separateHeaders is off', () => {
    setExteralessSetting('OEAppearanceSeparateHeaders', false);
    setExteralessSetting('OEAppearanceM3ListItems', true);
    const mount = renderSection();

    expect(mount.querySelector('.sidebar-left-section-name.is-separated')).toBeTruthy();
    expect(mount.querySelector('.sidebar-left-section-content > .sidebar-left-section-name')).toBeNull();
  });
});
