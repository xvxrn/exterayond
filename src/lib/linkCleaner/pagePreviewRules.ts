/**
 * The page preview rules, ported from exteraless
 * `tw/nekomimi/nekogram/helpers/remote/PagePreviewRulesHelper.java`. The Neko/Na
 * consumer is `ChatActivity.messageWebPageSearch`, which rewrites the message
 * used for the `account.getWebPagePreview` request before fetching it; the sent
 * text is never rewritten.
 *
 * Android resolves the URL's authority to a domain, then applies every rule of
 * that domain as a `Matcher.replaceAll` over the whole URL. At the pinned
 * revision the remote rules channel is disabled — `BaseRemoteHelper
 * .hasMetadataSource()` is false, so `load()` no-ops and
 * `loadPagePreviewRules()` falls back to the built-in list — which this port
 * carries exactly (`addBuiltInRule`: one rule per domain, regex = domain).
 */

type PagePreviewRule = {regex: string, replace: string};

/** `PagePreviewRulesHelper.applyBuiltInRules` verbatim. */
const BUILT_IN_RULES: ReadonlyArray<readonly [domain: string, replace: string]> = [
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

const RULES_BY_DOMAIN = new Map<string, PagePreviewRule[]>();
for(const [domain, replace] of BUILT_IN_RULES) {
  RULES_BY_DOMAIN.set(domain, [{regex: domain, replace}]);
}

/**
 * Android `AndroidUtilities.getHostAuthority` without `removeWWW`: the
 * authority between the scheme and the first path, query or fragment
 * separator, lowercased. No scheme means no authority — a scheme-less host
 * matches nothing, like the Android URI parse.
 */
const getHostAuthority = (url: string): string | null => {
  const schemeEnd = url.indexOf('://');
  if(schemeEnd <= 0) return null;
  const rest = url.substring(schemeEnd + 3);
  const end = rest.search(/[/?#]/);
  const authority = end < 0 ? rest : rest.substring(0, end);
  return authority.length ? authority : null;
};

/**
 * Applies every rule of the URL's domain, in order, over the whole URL.
 * The domain lookup keys on the whole authority (port included), so an already
 * rewritten host (`fixupx.com`) matches nothing and is left alone, like
 * Android's map lookup.
 */
export const applyPagePreviewRules = (url: string): string => {
  const host = getHostAuthority(url.toLowerCase());
  const rules = host ? RULES_BY_DOMAIN.get(host) : undefined;
  if(!rules?.length) return url;

  let out = url;
  for(const rule of rules) {
    out = out.replace(new RegExp(rule.regex, 'g'), rule.replace);
  }

  return out;
};
