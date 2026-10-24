/**
 * The AdGuard `removeparam` rule parser, ported from exteraless
 * `TMessagesProj/src/main/kotlin/app/exteraless/links/AdGuardRule.kt`
 * (byte-port of the semantics; the filter asset ships beside it in
 * `src/assets/adguard_url_tracking.txt`).
 */

export type UrlMatcher =
  | {kind: 'any'}
  | {kind: 'host', host: string, hostRegex: RegExp | null, pathRegex: RegExp | null}
  | {kind: 'fullRegex', regex: RegExp};

export type ParamMatcher =
  | {kind: 'all'}
  | {kind: 'literal', name: string}
  | {kind: 'pattern', regex: RegExp}
  | {kind: 'inverted', inner: ParamMatcher};

export const paramMatches = (matcher: ParamMatcher, name: string, value: string | null): boolean => {
  switch(matcher.kind) {
    case 'all':
      return true;
    case 'literal':
      return matcher.name === name;
    case 'pattern':
      return matcher.regex.test(value === null ? name : `${name}=${value}`);
    case 'inverted':
      return !paramMatches(matcher.inner, name, value);
  }
};

export type AdGuardRule = {
  exception: boolean,
  urlMatcher: UrlMatcher,
  paramMatcher: ParamMatcher,
  domainInclude: string[],
  domainExclude: string[]
};

const NON_DOCUMENT_TYPES = new Set([
  'xmlhttprequest', 'script', 'image', 'stylesheet', 'font', 'media', 'object',
  'subdocument', 'websocket', 'webrtc', 'ping', 'other', 'popup', 'object-subrequest',
  'csp', 'webtransport'
]);
const DOCUMENT_TYPES = new Set(['document', 'main_frame', 'main-frame', 'all']);
const NEUTRAL_MODIFIERS = new Set(['important', 'third-party', 'match-case']);
const DISQUALIFYING_MODIFIER_PREFIXES = [
  'app=', 'header=', 'method=', 'replace=', 'csp=', 'redirect=',
  'redirect-rule=', 'rewrite=', 'jsonprune', 'removeheader=', 'permissions=',
  'cookie=', 'stealth=', 'to=', 'from=', 'client=', 'ctag=', 'dnstype=', 'dnsrewrite='
];
const DISQUALIFYING_MODIFIERS = new Set(['first-party', 'specifichide', 'generichide', 'elemhide']);

const REGEX_META = new Set('\\.+?()[]{}|^$'.split(''));
const WILDCARD_META = new Set('\\.+?()[]{}|'.split(''));

export const parseAdGuardRule = (rawLine: string): AdGuardRule | null => {
  const line = rawLine.trim();
  if(!line.length || line.startsWith('!') || line.startsWith('[')) return null;
  if(line.includes('##') || line.includes('#@#') || line.includes('#%#') || line.includes('#$#')) return null;

  const exception = line.startsWith('@@');
  const body = exception ? line.substring(2) : line;

  const dollar = findModifierDollar(body);
  if(dollar === null) return null;
  const pattern = body.substring(0, dollar);
  const mods = splitModifiers(body.substring(dollar + 1));

  let paramSpec: string | null = null;
  let hasRemoveparam = false;
  let domainSpec: string | null = null;
  let denyallowSpec: string | null = null;
  let sawDocumentType = false;
  let sawNonDocumentPositiveType = false;

  for(const m of mods) {
    if(m === 'removeparam') {
      hasRemoveparam = true;
      paramSpec = null;
    } else if(m.startsWith('removeparam=')) {
      hasRemoveparam = true;
      paramSpec = m.substring('removeparam='.length);
    } else if(m.startsWith('domain=')) {
      domainSpec = m.substring('domain='.length);
    } else if(m.startsWith('denyallow=')) {
      denyallowSpec = m.substring('denyallow='.length);
    } else if(NEUTRAL_MODIFIERS.has(m)) {
      // neutral
    } else if(DOCUMENT_TYPES.has(m)) {
      sawDocumentType = true;
    } else if(NON_DOCUMENT_TYPES.has(m)) {
      sawNonDocumentPositiveType = true;
    } else if(m.startsWith('~')) {
      if(DISQUALIFYING_MODIFIERS.has(m.substring(1))) return null;
    } else if(DISQUALIFYING_MODIFIERS.has(m)) {
      return null;
    } else if(DISQUALIFYING_MODIFIER_PREFIXES.some((prefix) => m.startsWith(prefix))) {
      return null;
    } else {
      return null;
    }
  }

  if(!hasRemoveparam) return null;
  if(sawNonDocumentPositiveType && !sawDocumentType) return null;

  const paramMatcher = parseParamSpec(paramSpec);
  if(!paramMatcher) return null;
  const urlMatcher = parseUrlPattern(pattern);
  if(!urlMatcher) return null;
  const [incl, excl] = parseDomains(domainSpec);
  const [denyallow] = parseDomains(denyallowSpec);
  return {exception, urlMatcher, paramMatcher, domainInclude: incl, domainExclude: [...excl, ...denyallow]};
};

const parseParamSpec = (spec: string | null): ParamMatcher | null => {
  if(spec === null) return {kind: 'all'};
  if(spec.startsWith('~')) {
    const inner = parseParamSpec(spec.substring(1));
    if(!inner) return null;
    if(inner.kind === 'all') return null;
    return {kind: 'inverted', inner};
  }

  if(spec.startsWith('/')) {
    const endSlash = spec.lastIndexOf('/');
    if(endSlash <= 0) return null;
    const regexBody = spec.substring(1, endSlash);
    const opts = spec.substring(endSlash + 1).includes('i') ? 'i' : '';
    try {
      return {kind: 'pattern', regex: new RegExp(regexBody, opts)};
    } catch(e) {
      return null;
    }
  }

  return {kind: 'literal', name: spec};
};

const findModifierDollar = (s: string): number | null => {
  let inRegex = false;
  let lastDollar = -1;
  let i = 0;
  while(i < s.length) {
    const c = s[i];
    if(c === '\\' && i + 1 < s.length) {
      i += 2;
      continue;
    } else if(c === '/') {
      const prev = i > 0 ? s[i - 1] : ' ';
      inRegex = inRegex ? false : (prev === '=' || prev === '$' || i === 0);
    } else if(c === '$' && !inRegex) {
      lastDollar = i;
    }
    i++;
  }

  return lastDollar >= 0 ? lastDollar : null;
};

const splitModifiers = (s: string): string[] => {
  const out: string[] = [];
  let buf = '';
  let inRegex = false;
  let i = 0;
  while(i < s.length) {
    const c = s[i];
    if(c === '\\' && i + 1 < s.length) {
      buf += c + s[i + 1];
      i += 2;
      continue;
    } else if(c === '/') {
      const prev = buf.length ? buf[buf.length - 1] : ' ';
      inRegex = inRegex ? false : (prev === '=');
      buf += c;
    } else if(c === ',' && !inRegex) {
      out.push(buf);
      buf = '';
    } else {
      buf += c;
    }
    i++;
  }

  if(buf.length) out.push(buf);
  return out;
};

const parseUrlPattern = (pattern: string): UrlMatcher | null => {
  if(!pattern.length || pattern === '*') return {kind: 'any'};

  if(pattern.length >= 2 && pattern.startsWith('/') && pattern.endsWith('/')) {
    try {
      return {kind: 'fullRegex', regex: new RegExp(pattern.substring(1, pattern.length - 1))};
    } catch(e) {
      return null;
    }
  }

  if(!pattern.startsWith('||')) return null;
  const body = pattern.substring(2);
  const hostEndMatch = /[\^\/]/.exec(body);
  const hostEnd = hostEndMatch ? hostEndMatch.index : body.length;
  const host = body.substring(0, hostEnd);
  if(!host.length) return null;
  const rest = body.substring(hostEnd);

  const hostRegex = host.includes('*') ? buildHostRegex(host) : null;
  const pathRegex = rest.length ? wildcardToRegex(rest) : null;
  return {kind: 'host', host: host.toLowerCase(), hostRegex, pathRegex};
};

const buildHostRegex = (host: string): RegExp => {
  let out = '^(?:.+\\.)?';
  for(const c of host) {
    if(c === '*') out += '[^/]+';
    else if(REGEX_META.has(c)) out += '\\' + c;
    else out += c.toLowerCase();
  }

  return new RegExp(out + '$');
};

const wildcardToRegex = (glob: string): RegExp => {
  let out = '';
  for(const c of glob) {
    if(c === '*') out += '.*';
    else if(c === '^') out += '(?:[^A-Za-z0-9._%~-]|$)';
    else if(WILDCARD_META.has(c)) out += '\\' + c;
    else out += c;
  }

  return new RegExp(out);
};

const parseDomains = (spec: string | null): [string[], string[]] => {
  if(!spec) return [[], []];
  const incl: string[] = [];
  const excl: string[] = [];
  for(const raw of spec.split('|')) {
    const d = raw.trim();
    if(!d.length) continue;
    if(d.startsWith('~')) excl.push(d.substring(1).toLowerCase());
    else incl.push(d.toLowerCase());
  }

  return [incl, excl];
};
