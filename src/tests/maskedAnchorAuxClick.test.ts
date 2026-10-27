import {listenForMaskedAnchorAuxClicks, confirmExternalAnchorClick} from '@helpers/addAnchorListener';
import addAnchorListener from '@helpers/addAnchorListener';
import {setExteralessSetting, setOpenLinkConfirmation} from '@stores/exteralessSettings';

describe('masked anchor aux click', () => {
  let showMaskedAlert: ReturnType<typeof vi.fn>;

  const auxClick = (element: Element, button = 1) => {
    const event = new MouseEvent('auxclick', {bubbles: true, cancelable: true, button});
    element.dispatchEvent(event);
    return event;
  };

  const makeAnchor = (attributes: Record<string, string>) => {
    const anchor = document.createElement('a');
    anchor.href = 'https://evil.example/login';
    anchor.target = '_blank';
    anchor.textContent = 'https://telegram.org';
    for(const name in attributes) anchor.setAttribute(name, attributes[name]);
    document.body.append(anchor);
    return anchor;
  };

  beforeAll(() => {
    listenForMaskedAnchorAuxClicks();
  });

  beforeEach(() => {
    setOpenLinkConfirmation(0);
    showMaskedAlert = vi.fn();
    (window as any).showMaskedAlert = showMaskedAlert;
  });

  afterEach(() => {
    setOpenLinkConfirmation(0);
    delete (window as any).showMaskedAlert;
    document.body.replaceChildren();
  });

  test('asks before a middle click opens a masked link', () => {
    const anchor = makeAnchor({onclick: 'showMaskedAlert(this)'});

    const event = auxClick(anchor);

    expect(showMaskedAlert).toHaveBeenCalledTimes(1);
    expect(showMaskedAlert.mock.calls[0][0]).toBe(anchor);
    expect(event.defaultPrevented).toBe(true);
  });

  // a web-page box keeps the same handler in its dataset instead of an inline attribute
  test('asks before a middle click opens a masked web-page box', () => {
    const box = makeAnchor({'data-callback': 'showMaskedAlert'});

    const event = auxClick(box);

    expect(showMaskedAlert).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  test('leaves a plain link to the browser', () => {
    const event = auxClick(makeAnchor({}));

    expect(showMaskedAlert).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  // the alert names `anchor.href`, so it must not answer for a link the user did not click
  test('leaves a plain link nested in a masked box to the browser', () => {
    const box = makeAnchor({'data-callback': 'showMaskedAlert'});
    const nested = document.createElement('a');
    nested.href = 'https://telegram.org';
    box.append(nested);

    const event = auxClick(nested);

    expect(showMaskedAlert).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  test('ignores a right click, which opens no tab of its own', () => {
    auxClick(makeAnchor({onclick: 'showMaskedAlert(this)'}), 2);

    expect(showMaskedAlert).not.toHaveBeenCalled();
  });

  // hidden links (a non-contact's message) are swallowed before this listener runs
  test('keeps its hands off an already cancelled click', () => {
    const anchor = makeAnchor({onclick: 'showMaskedAlert(this)'});
    anchor.addEventListener('auxclick', (e) => e.preventDefault());

    auxClick(anchor);

    expect(showMaskedAlert).not.toHaveBeenCalled();
  });

  test('All also guards ordinary middle clicks while Never leaves them alone', () => {
    setOpenLinkConfirmation(1);
    const anchor = makeAnchor({});
    expect(auxClick(anchor).defaultPrevented).toBe(true);
    expect(showMaskedAlert.mock.lastCall[2]).toBeTypeOf('function');
    showMaskedAlert.mockClear();
    setOpenLinkConfirmation(2);
    expect(auxClick(anchor).defaultPrevented).toBe(false);
    expect(showMaskedAlert).not.toHaveBeenCalled();
  });

  test('All preserves the original Telegram handler arguments until consent', () => {
    const execute = vi.fn();
    addAnchorListener({name: 'im', callback: execute});
    const anchor = makeAnchor({});
    anchor.href = 'https://t.me/example/42?thread=7';
    setOpenLinkConfirmation(1);
    const event = new MouseEvent('click', {ctrlKey: true});
    (window as any).im(anchor, event);
    expect(execute).not.toHaveBeenCalled();
    anchor.href = 'https://changed.example/';
    showMaskedAlert.mock.lastCall[2]();
    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.lastCall[0].pathnameParams).toEqual(['example', '42']);
    expect(execute.mock.lastCall[0].uriParams.thread).toBe('7');
    expect(execute.mock.lastCall[0].href).toBe('https://t.me/example/42?thread=7');
    expect(execute.mock.lastCall[0].event).toBe(event);
    delete (window as any).im;
  });

  test('All does not add a second gate to bot commands or media timestamps', () => {
    setExteralessSetting('ConfirmAllLinks', true);
    for(const name of ['execBotCommand', 'setMediaTimestamp'] as const) {
      const execute = vi.fn();
      addAnchorListener({name, callback: execute});
      (window as any)[name](makeAnchor({}));
      expect(execute).toHaveBeenCalledOnce();
      delete (window as any)[name];
    }
    expect(showMaskedAlert).not.toHaveBeenCalled();
  });

  test('All leaves downloadable and already cancelled middle clicks to their owner', () => {
    setOpenLinkConfirmation(1);
    const anchor = makeAnchor({download: 'test.txt'});
    expect(auxClick(anchor).defaultPrevented).toBe(false);
    anchor.removeAttribute('download');
    anchor.addEventListener('auxclick', (event) => event.preventDefault());
    auxClick(anchor);
    expect(showMaskedAlert).not.toHaveBeenCalled();
  });

  test('All guards existing external anchors at click time and retains the owner continuation', () => {
    const anchor = makeAnchor({});
    anchor.href = 'https://example.com/path';
    const execute = vi.fn();
    setOpenLinkConfirmation(1);
    const event = new MouseEvent('click', {bubbles: true, cancelable: true});
    expect(confirmExternalAnchorClick(event, anchor, execute)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(showMaskedAlert.mock.lastCall[2]).toBe(execute);
    setOpenLinkConfirmation(0);
    expect(confirmExternalAnchorClick(new MouseEvent('click'), anchor, execute)).toBe(false);
  });

  test('the document guard respects editors, local navigation, downloads and existing actions', () => {
    setOpenLinkConfirmation(1);
    const execute = vi.fn();
    const check = (anchor: HTMLAnchorElement) => expect(confirmExternalAnchorClick(new MouseEvent('click'), anchor, execute)).toBe(false);
    check(makeAnchor({download: 'test.txt'}));
    check(makeAnchor({href: '#local-peer'}));
    check(makeAnchor({onclick: 'im(this)'}));
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    editor.setAttribute('contenteditable', 'true');
    const draft = makeAnchor({});
    editor.append(draft);
    check(draft);
    const canceled = new MouseEvent('click', {cancelable: true});
    canceled.preventDefault();
    expect(confirmExternalAnchorClick(canceled, makeAnchor({}), execute)).toBe(false);
    expect(showMaskedAlert).not.toHaveBeenCalled();
  });
});
