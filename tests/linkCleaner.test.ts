import {describe, expect, it} from 'vitest';
import filterText from '../assets/adguard_url_tracking.txt?raw';
import {UrlCleaner} from '@lib/linkCleaner/urlCleaner';
import {cleanLinksInText, filterTimeUpdated} from '@lib/linkCleaner';

// * the shipped AdGuard URL-tracking filter: rules are parsed, never executed
const cleaner = UrlCleaner.fromAdGuardFilter(filterText);

describe('exteraless link cleaner (AdGuard removeparam engine)', () => {
  it('drops the tracking parameters the filter names, keeps the rest', () => {
    // `$removeparam=fbclid` — a generic rule from the shipped filter
    expect(cleaner.clean('https://example.com/post?fbclid=AbCdEf&id=2')).toBe('https://example.com/post?id=2');
    // `$removeparam=gclid`
    expect(cleaner.clean('https://example.com/?gclid=xyz')).toBe('https://example.com/');
    // nothing the filter names: untouched
    expect(cleaner.clean('https://example.com/?a=1&b=2')).toBe('https://example.com/?a=1&b=2');
  });

  it('does not touch non-http strings or break fragments', () => {
    expect(cleaner.clean('mailto:someone@example.com')).toBe('mailto:someone@example.com');
    expect(cleaner.clean('https://example.com/?fbclid=x#section')).toBe('https://example.com/#section');
  });

  it('cleans every link in a piece of text', async() => {
    // * the engine (like Android's) parses only scheme'd URLs, so the second
    // * link carries http://
    const text = 'look https://example.com/?fbclid=1&id=3 and http://www.example.org/?gclid=2 please';
    const cleaned = await cleanLinksInText(text, 'paste');
    expect(cleaned).toBe('look https://example.com/?id=3 and http://www.example.org/ please');
  });

  it('reads the filter version like LinkCleaner.lastUpdated', () => {
    expect(filterTimeUpdated(filterText)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
