/**
 * The URL cleaner, ported from exteraless
 * `TMessagesProj/src/main/kotlin/app/exteraless/links/UrlCleaner.kt`.
 */
import {AdGuardRule, parseAdGuardRule, paramMatches} from './adGuardRule';

export class ParsedUrl {
  private constructor(
    public host: string,
    public params: Array<[string, string | null]>,
    public hadQuery: boolean,
    private scheme: string,
    private authority: string,
    private path: string,
    private fragment: string | null
  ) {}

  get pathAndQuery(): string {
    return this.hadQuery ? `${this.path}?${ParsedUrl.rebuildQuery(this.params)}` : this.path;
  }

  rebuild(keptParams: Array<[string, string | null]>): string {
    let out = `${this.scheme}://${this.authority}${this.path}`;
    if(keptParams.length) out += '?' + ParsedUrl.rebuildQuery(keptParams);
    if(this.fragment !== null) out += '#' + this.fragment;
    return out;
  }

  static parse(url: string): ParsedUrl | null {
    const schemeEnd = url.indexOf('://');
    if(schemeEnd <= 0) return null;
    const scheme = url.substring(0, schemeEnd);
    const afterScheme = url.substring(schemeEnd + 3);

    const fragIdx = afterScheme.indexOf('#');
    const beforeFrag = fragIdx < 0 ? afterScheme : afterScheme.substring(0, fragIdx);
    const fragment = fragIdx < 0 ? null : afterScheme.substring(fragIdx + 1);

    const qIdx = beforeFrag.indexOf('?');
    const authAndPath = qIdx < 0 ? beforeFrag : beforeFrag.substring(0, qIdx);
    const query = qIdx < 0 ? '' : beforeFrag.substring(qIdx + 1);

    const pathStart = authAndPath.indexOf('/');
    const authority = pathStart < 0 ? authAndPath : authAndPath.substring(0, pathStart);
    const path = pathStart < 0 ? '' : authAndPath.substring(pathStart);

    const hostPort = authority.substring(authority.lastIndexOf('@') + 1);
    const host = hostPort.split(':')[0] ?? '';
    if(!host.length) return null;

    return new ParsedUrl(
      host,
      query.length ? ParsedUrl.parseQuery(query) : [],
      qIdx >= 0,
      scheme,
      authority,
      path,
      fragment
    );
  }

  private static parseQuery(q: string): Array<[string, string | null]> {
    const out: Array<[string, string | null]> = [];
    for(const piece of q.split('&')) {
      if(!piece.length) continue;
      const eq = piece.indexOf('=');
      if(eq < 0) out.push([piece, null]);
      else out.push([piece.substring(0, eq), piece.substring(eq + 1)]);
    }

    return out;
  }

  private static rebuildQuery(params: Array<[string, string | null]>): string {
    return params.map(([k, v]) => v === null ? k : `${k}=${v}`).join('&');
  }
}

const hostMatches = (host: string, rule: string): boolean => host === rule || host.endsWith(`.${rule}`);

const ruleMatchesUrl = (rule: AdGuardRule, host: string, pathAndQuery: string, fullUrl: string): boolean => {
  if(rule.domainInclude.length && !rule.domainInclude.some((d) => hostMatches(host, d))) return false;
  if(rule.domainExclude.some((d) => hostMatches(host, d))) return false;

  const m = rule.urlMatcher;
  switch(m.kind) {
    case 'any':
      return true;
    case 'fullRegex':
      return m.regex.test(fullUrl);
    case 'host': {
      const hostOk = m.hostRegex ? m.hostRegex.test(host) : hostMatches(host, m.host);
      return hostOk && (!m.pathRegex || m.pathRegex.test(pathAndQuery));
    }
  }
};

export class UrlCleaner {
  constructor(private rules: AdGuardRule[]) {}

  clean(url: string): string {
    const parsed = ParsedUrl.parse(url);
    if(!parsed) return url;

    const host = parsed.host.toLowerCase();
    const pathAndQuery = parsed.pathAndQuery;
    const applicable = this.rules.filter((rule) => ruleMatchesUrl(rule, host, pathAndQuery, url));
    if(!applicable.length) return url;
    if(applicable.some((rule) => rule.exception && rule.paramMatcher.kind === 'all')) return url;

    const exceptions = applicable.filter((rule) => rule.exception);
    const removals = applicable.filter((rule) => !rule.exception);
    if(!removals.length) return url;

    const [dropped, kept] = parsed.params.reduce<[Array<[string, string | null]>, Array<[string, string | null]>]>(([drop, keep], [k, v]) => {
      const shouldDrop = removals.some((rule) => paramMatches(rule.paramMatcher, k, v)) &&
        !exceptions.some((rule) => paramMatches(rule.paramMatcher, k, v));
      (shouldDrop ? drop : keep).push([k, v]);
      return [drop, keep];
    }, [[], []]);

    const stripDelim = parsed.hadQuery && !kept.length &&
      removals.some((rule) => rule.paramMatcher.kind === 'all');

    if(!dropped.length && !stripDelim) return url;
    return parsed.rebuild(kept);
  }

  static fromAdGuardFilter(text: string): UrlCleaner {
    return new UrlCleaner(text.split('\n').reduce<AdGuardRule[]>((rules, line) => {
      const rule = parseAdGuardRule(line);
      if(rule) rules.push(rule);
      return rules;
    }, []));
  }
}
