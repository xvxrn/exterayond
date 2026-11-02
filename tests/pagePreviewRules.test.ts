import {describe, expect, test} from 'vitest';

import {applyPagePreviewRules} from '../src/lib/linkCleaner/pagePreviewRules';

const BUILT_IN: ReadonlyArray<readonly [from: string, to: string]> = [
  ['x.com', 'fixupx.com'],
  ['twitter.com', 'fxtwitter.com'],
  ['coolapk.com', 'coolapk1s.com'],
  ['www.instagram.com', 'kkinstagram.com'],
  ['vm.tiktok.com', 'vm.kktiktok.com'],
  ['vt.tiktok.com', 'vt.kktiktok.com'],
  ['www.tiktok.com', 'www.kktiktok.com'],
  ['www.reddit.com', 'www.rxddit.com'],
  ['bsky.app', 'fxbsky.app'],
  ['www.pixiv.net', 'www.phixiv.net']
];

describe('applyPagePreviewRules', () => {
  test('rewrites every built-in domain like the Android rule table', () => {
    for(const [from, to] of BUILT_IN) {
      expect(applyPagePreviewRules(`https://${from}/a/b?c=1#d`)).toBe(`https://${to}/a/b?c=1#d`);
    }
  });

  test('an already rewritten host matches no rule and is left alone', () => {
    for(const to of BUILT_IN.map(([, to]) => to)) {
      expect(applyPagePreviewRules(`https://${to}/post`)).toBe(`https://${to}/post`);
    }
  });

  test('unknown hosts, scheme-less text and empty input pass through', () => {
    expect(applyPagePreviewRules('https://example.com/x.com/post')).toBe('https://example.com/x.com/post');
    expect(applyPagePreviewRules('x.com/post')).toBe('x.com/post');
    expect(applyPagePreviewRules('')).toBe('');
  });

  test('the lookup is case-insensitive like the Android authority parse, while the replace stays case-sensitive like Java Matcher', () => {
    expect(applyPagePreviewRules('https://X.COM/ABC')).toBe('https://X.COM/ABC');
  });

  test('the replacement hits the whole URL, including a repeated host mention in the path, like Matcher.replaceAll', () => {
    expect(applyPagePreviewRules('https://x.com/x.com')).toBe('https://fixupx.com/fixupx.com');
  });
});
