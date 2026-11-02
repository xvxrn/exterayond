import {describe, expect, test, vi} from 'vitest';
import {MessageEntity} from '@layer';
import {getMiddleware} from '@helpers/middleware';
import wrapRichText from '@lib/richTextProcessor/wrapRichText';
import wrapEmojiText from '@lib/richTextProcessor/wrapEmojiText';
import {setExteralessSetting} from '@stores/exteralessSettings';

vi.mock('@lib/apiManagerProxy', () => ({default: {addEventListener: () => {}, getState: () => Promise.resolve({})}}));

const codeMocks = vi.hoisted(() => ({highlightCode: vi.fn()}));
vi.mock('@/codeLanguages', () => ({
  CodeLanguageAliases: {ts: 'TypeScript'},
  highlightCode: codeMocks.highlightCode
}));

vi.hoisted(() => {
  class IntersectionObserverMock {
    public observe() {}
    public unobserve() {}
    public disconnect() {}
    public takeRecords(): IntersectionObserverEntry[] { return []; }
  }

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: IntersectionObserverMock
  });

  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  Object.defineProperty(globalThis, 'Worker', {configurable: true, writable: true, value: class Worker {}});
  Object.defineProperty(globalThis, 'CSS', {configurable: true, value: {supports: () => true}});
});

function wrapTag(text: string, type: 'messageEntityHashtag' | 'messageEntityCashtag') {
  const entities: MessageEntity[] = [{_: type, offset: 0, length: text.length}];
  return wrapRichText(text, {entities}).querySelector('a.anchor-hashtag');
}

describe('wrapRichText tags', () => {
  test('wraps chat-specific hashtags', () => {
    const anchor = wrapTag('#news@telegram', 'messageEntityHashtag');

    expect(anchor.textContent).toBe('#news@telegram');
    expect(anchor.getAttribute('href')).toBe('tg://search_hashtag?hashtag=news%40telegram');
    expect(anchor.getAttribute('onclick')).toBe('searchByHashtag(this)');
  });

  test('wraps chat-specific cashtags without losing the dollar prefix', () => {
    const anchor = wrapTag('$TON@telegram', 'messageEntityCashtag');

    expect(anchor.textContent).toBe('$TON@telegram');
    expect(anchor.getAttribute('href')).toBe('tg://search_hashtag?hashtag=%24TON%40telegram');
    expect(anchor.getAttribute('onclick')).toBe('searchByHashtag(this)');
  });

  test('skips streamed highlighting and rejects stale async highlight results', async() => {
    const entity: MessageEntity.messageEntityPre = {
      _: 'messageEntityPre',
      offset: 0,
      length: 7,
      language: 'ts'
    };

    wrapRichText('const x', {entities: [entity], noCodeHighlight: true});
    expect(codeMocks.highlightCode).not.toHaveBeenCalled();

    let resolveHighlight: (html: string) => void;
    codeMocks.highlightCode.mockReturnValueOnce(new Promise<string>((resolve) => resolveHighlight = resolve));
    const middlewareHelper = getMiddleware();
    const fragment = wrapRichText('const x', {
      entities: [entity],
      middleware: middlewareHelper.get()
    });
    const code = fragment.querySelector('code');
    expect(code.textContent).toBe('const x');

    middlewareHelper.destroy();
    resolveHighlight('<b>stale</b>');
    await Promise.resolve();
    await Promise.resolve();
    expect(code.innerHTML).toBe('const x');
  });
});


describe('wrapRichText blockquote line boundaries', () => {
  test.each([false, true])('replaces the separators around the middle quote (draft=%s)', (wrappingDraft) => {
    const fragment = wrapRichText('123123\n123123\n123123', {wrappingDraft, entities: [
      {_: 'messageEntityLinebreak', offset: 6, length: 1},
      {_: 'messageEntityBlockquote', pFlags: {}, offset: 7, length: 6},
      {_: 'messageEntityLinebreak', offset: 13, length: 1}
    ]});
    expect(fragment.firstChild?.textContent).toBe('123123');
    expect(fragment.lastChild?.textContent).toBe('123123');
    expect(fragment.querySelector(wrappingDraft ? '[data-markup="markup-quote"]' : 'blockquote')?.textContent).toBe('123123');
  });

  test('preserves the separators when block formatting is disabled', () => {
    const text = '123123\n123123\n123123';
    const fragment = wrapRichText(text, {noTextFormat: true, entities: [
      {_: 'messageEntityLinebreak', offset: 6, length: 1},
      {_: 'messageEntityBlockquote', pFlags: {}, offset: 7, length: 6},
      {_: 'messageEntityLinebreak', offset: 13, length: 1}
    ]});
    expect(fragment.textContent).toBe(text);
    expect(fragment.querySelector('blockquote')).toBeNull();
  });

  test('preserves additional authored blank lines around a quote', () => {
    const fragment = wrapRichText('first\n\nquote\n\nlast', {entities: [
      {_: 'messageEntityLinebreak', offset: 5, length: 1},
      {_: 'messageEntityLinebreak', offset: 6, length: 1},
      {_: 'messageEntityBlockquote', pFlags: {}, offset: 7, length: 5},
      {_: 'messageEntityLinebreak', offset: 12, length: 1},
      {_: 'messageEntityLinebreak', offset: 13, length: 1}
    ]});
    expect([...fragment.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('')).toBe('first\n\nlast');
  });
});

describe('Zalgo display filter', () => {
  const marks = '\u0301\u0302\u0303\u0304';
  beforeEach(() => setExteralessSetting('ZalgoFilter', true));
  afterEach(() => setExteralessSetting('ZalgoFilter', false));

  test('keeps stock text when off and follows Android trigger/length limits when on', () => {
    const text = 'A' + marks + ' e\u0301';
    setExteralessSetting('ZalgoFilter', false);
    expect(wrapRichText(text, {entities: []}).textContent).toBe(text);
    setExteralessSetting('ZalgoFilter', true);
    expect(wrapRichText(text, {entities: []}).textContent).toBe('A e');
    for(const untouched of ['e\u0301', 'A\u0301\u0302\u0303', 'x'.repeat(2045) + marks]) {
      expect(wrapRichText(untouched, {entities: []}).textContent).toBe(untouched);
    }
    expect(wrapRichText('x'.repeat(2044) + marks, {entities: []}).textContent).toBe('x'.repeat(2044));
  });

  test('handles a mark run split by entities without moving later link offsets or targets', () => {
    const text = 'A' + marks + ' link tail';
    const target = 'https://example.invalid/' + marks;
    const entities: MessageEntity[] = [
      {_: 'messageEntityBold', offset: 0, length: 3},
      {_: 'messageEntityItalic', offset: 3, length: 2},
      {_: 'messageEntityTextUrl', offset: 6, length: 4, url: target}
    ];
    const original = JSON.stringify(entities);
    const fragment = wrapRichText(text, {entities});
    expect(fragment.textContent).toBe('A link tail');
    expect(fragment.querySelector('strong').textContent).toBe('A');
    expect(fragment.querySelector('a').textContent).toBe('link');
    expect(fragment.querySelector('a').href).toBe(new URL(target).href);
    expect(JSON.stringify(entities)).toBe(original);
  });

  test('filters names through the existing emoji wrapper but leaves drafts unchanged', () => {
    const text = 'Name' + marks;
    expect(wrapEmojiText(text).textContent).toBe('Name');
    expect(wrapRichText(text, {wrappingDraft: true, entities: []}).textContent).toBe(text);
    expect(wrapEmojiText(text, true).textContent).toBe(text);
  });

  test('filters nested formatting, spoilers and displayed code before async highlighting', async() => {
    const text = 'A' + marks + ' tail';
    const nested = wrapRichText(text, {entities: [
      {_: 'messageEntityBold', offset: 0, length: text.length},
      {_: 'messageEntityItalic', offset: 0, length: 5}
    ]});
    expect(nested.textContent).toBe('A tail');
    expect(nested.querySelector('strong em').textContent).toBe('A');
    const spoiler = wrapRichText(text, {entities: [{_: 'messageEntitySpoiler', offset: 0, length: text.length}]});
    expect(spoiler.querySelector('.spoiler-text').textContent).toBe('A tail');

    codeMocks.highlightCode.mockResolvedValueOnce('<b>A tail</b>');
    const code = wrapRichText(text, {entities: [{_: 'messageEntityPre', offset: 0, length: text.length, language: 'ts'}]}).querySelector('code');
    expect(code.textContent).toBe('A tail');
    expect(codeMocks.highlightCode).toHaveBeenLastCalledWith('A tail', 'TypeScript');
    await Promise.resolve();
    await Promise.resolve();
    expect(code.innerHTML).toBe('<b>A tail</b>');
  });
});
