import type {Editor} from '@tiptap/core';
import {Slice} from '@tiptap/pm/model';
import {NodeSelection} from '@tiptap/pm/state';
import '@/tests/mocks/chatInputEditorEngineUi';
import {mountChatInputEditor} from '@/tests/helpers/chatInputEditor';
import type {ChatInputEditor} from '@components/chat/inputEditor/types';
import {setExteralessSetting} from '@stores/exteralessSettings';

const cleanerState = vi.hoisted(() => ({
  calls: 0,
  defer: false,
  reject: false,
  resolveDeferred: undefined as ((text: string) => void) | undefined
}));

vi.mock('@lib/linkCleaner', async(importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/linkCleaner')>();
  return {
    ...actual,
    cleanLinksInText: (text: string, where: 'open' | 'paste') => {
      cleanerState.calls++;
      if(cleanerState.defer) {
        return new Promise<string>((resolve) => cleanerState.resolveDeferred = resolve);
      }
      return cleanerState.reject ? Promise.reject(new Error('cleaner failed')) :
        actual.cleanLinksInText(text, where);
    }
  };
});

vi.mock('@components/wrappers/photo', () => ({
  default: vi.fn(async() => ({images: {full: null, thumb: null}, loadPromises: {}}))
}));
vi.mock('@components/wrappers/document', () => ({default: vi.fn(async() => document.createElement('div'))}));
vi.mock('@components/wrappers/video', () => ({default: vi.fn(async() => document.createElement('video'))}));

type TiptapEditorInternals = ChatInputEditor & {editor: Editor};

const pasteEvent = (plain: string, html = '') => {
  const event = new Event('paste', {bubbles: true, cancelable: true}) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => type === 'text/plain' ? plain : type === 'text/html' ? html : ''
    }
  });
  return event;
};

describe('chat input paste: strip tracking on paste', () => {
  const editors: ChatInputEditor[] = [];
  const mountEditor = () => {
    const mounted = mountChatInputEditor();
    editors.push(mounted.editor);
    return mounted;
  };

  const paste = (tiptap: Editor, plain: string, html?: string) => {
    const event = pasteEvent(plain, html);
    const result = tiptap.view.someProp('handlePaste')?.(tiptap.view, event, Slice.empty);
    return {event, result};
  };

  beforeEach(() => {
    cleanerState.calls = 0;
    cleanerState.defer = false;
    cleanerState.reject = false;
    cleanerState.resolveDeferred = undefined;
  });

  afterEach(() => {
    editors.splice(0).forEach((editor) => editor.destroy());
    setExteralessSetting('OEChatsStripTrackingOnPaste', true);
  });

  test('inserts a link without tracking once instead of swallowing the paste', async() => {
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);

    expect(paste(tiptap, 'https://example.com/docs').result).toBe(true);
    expect(tiptap.state.doc.textContent).toBe('beforehttps://example.com/docsafter');

    await vi.waitFor(() => expect(cleanerState.calls).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(tiptap.state.doc.textContent).toBe('beforehttps://example.com/docsafter');
  });

  test('cleans a tracked link and inserts it once', async() => {
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);

    expect(paste(tiptap, 'https://example.com/post?fbclid=Abc&id=2').result).toBe(true);

    await vi.waitFor(() => {
      expect(tiptap.state.doc.textContent).toBe('beforehttps://example.com/post?id=2after');
    });
    expect(cleanerState.calls).toBe(1);
  });

  test('leaves a rich clipboard paste to the stock path', () => {
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);

    expect(paste(tiptap, 'https://example.com/?fbclid=1', '<p><a href="https://example.com/?fbclid=1">x</a></p>').result)
    .toBe(false);
    expect(tiptap.state.doc.textContent).toBe('beforeafter');
  });

  test('is stock when the setting is off', () => {
    setExteralessSetting('OEChatsStripTrackingOnPaste', false);
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);
    const {event, result} = paste(tiptap, 'https://example.com/?fbclid=1');

    expect(result).toBe(false);
    tiptap.view.dispatchEvent(event);
    expect(tiptap.state.doc.textContent).toBe('beforehttps://example.com/?fbclid=1after');
  });

  test('plain words and TSV keep the stock path', () => {
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);

    expect(paste(tiptap, 'just a word').result).toBe(false);
    expect(paste(tiptap, 'a\tb\nc\td').result).toBe(false);
    expect(tiptap.state.doc.textContent).toBe('beforeafter');
  });

  test('keeps the text when the cleaner fails', async() => {
    cleanerState.reject = true;
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);
    const link = 'https://example.com/docs';

    expect(paste(tiptap, link).result).toBe(true);
    expect(tiptap.state.doc.textContent).toBe(`before${link}after`);

    await vi.waitFor(() => expect(cleanerState.calls).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(tiptap.state.doc.textContent).toBe(`before${link}after`);
  });

  test('does not write into a destroyed editor when the cleaner finishes late', async() => {
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);
    expect(paste(tiptap, 'https://example.com/docs').result).toBe(true);
    const dispatch = vi.spyOn(tiptap.view, 'dispatch');
    editor.destroy();

    await vi.waitFor(() => expect(cleanerState.calls).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('a user edit during the deferred clean keeps the edit and the original link', async() => {
    cleanerState.defer = true;
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);
    const link = 'https://example.com/?fbclid=1';

    expect(paste(tiptap, link).result).toBe(true);
    tiptap.commands.insertContentAt(1 + tiptap.state.doc.firstChild!.textContent.length, 'X');
    expect(tiptap.state.doc.textContent).toBe(`before${link}afterX`);

    await vi.waitFor(() => expect(cleanerState.resolveDeferred).toBeTypeOf('function'));
    cleanerState.resolveDeferred!('https://example.com/clean');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tiptap.state.doc.textContent).toBe(`before${link}afterX`);
  });

  test('a cursor move does not block the clean and is not taken over by it', async() => {
    cleanerState.defer = true;
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');
    tiptap.commands.setTextSelection(7);

    expect(paste(tiptap, 'https://example.com/?fbclid=1').result).toBe(true);
    tiptap.commands.setTextSelection(2);

    await vi.waitFor(() => expect(cleanerState.resolveDeferred).toBeTypeOf('function'));
    cleanerState.resolveDeferred!('https://example.com/clean');
    await vi.waitFor(() => {
      expect(tiptap.state.doc.textContent).toBe('beforehttps://example.com/cleanafter');
    });
    expect(tiptap.state.selection.from).toBe(2);
  });

  test('undo removes the paste in one step and redo brings it back', async() => {
    cleanerState.defer = true;
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    const link = 'https://example.com/?fbclid=1';
    tiptap.commands.setTextSelection(1);

    expect(paste(tiptap, link).result).toBe(true);
    await vi.waitFor(() => expect(cleanerState.resolveDeferred).toBeTypeOf('function'));
    cleanerState.resolveDeferred!('https://example.com/clean');
    await vi.waitFor(() => expect(tiptap.state.doc.textContent).toBe('https://example.com/clean'));

    tiptap.commands.undo();
    expect(tiptap.state.doc.textContent).toBe('');

    // * the cleanup is out of history, so redo replays the paste as it stood
    tiptap.commands.redo();
    expect(tiptap.state.doc.textContent).toBe('https://example.com/clean');
  });

  test('falls back to the stock path over all text and over a node', () => {
    const {editor} = mountEditor();
    const tiptap = (editor as TiptapEditorInternals).editor;
    editor.setTextWithEntities('beforeafter');

    tiptap.commands.selectAll();
    expect(paste(tiptap, 'https://example.com/docs').result).toBe(false);

    tiptap.view.dispatch(tiptap.state.tr.setSelection(NodeSelection.create(tiptap.state.doc, 0)));
    expect(paste(tiptap, 'https://example.com/docs').result).toBe(false);
  });
});
