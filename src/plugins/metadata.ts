/**
 * Static plugin metadata reader — a port of exteraless
 * `src/main/python/extera_utils/metadata_parser.py` (itself AST-based, never
 * executing the module). The TS reader pulls top-level literal assignments out
 * of a plugin source the same way `ast.literal_eval` does: only literals,
 * only the module's top level, first assignment wins, anything dynamic is
 * ignored by design.
 */

export const METADATA_KEYS = [
  '__id__', '__name__', '__description__', '__author__', '__version__',
  '__icon__', '__app_version__', '__sdk_version__', '__min_version__',
  '__beta__', '__requirements__', '__permissions__'
] as const;

/** Mirrors `PluginPermissions`; the two lists cannot drift apart. */
export const KNOWN_PERMISSIONS = [
  'ui', 'messages.read', 'messages.send', 'network', 'files', 'intents',
  'settings', 'hooks', 'native'
] as const;

export const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{1,31}$/;

export type PluginMetadata = {
  id: string,
  name: string,
  description: string,
  author: string,
  version: string,
  icon?: string,
  app_version?: string,
  sdk_version?: string,
  beta: boolean,
  requirements: string[],
  permissions: string[],
  permissions_declared: boolean
};

// * a flat shape, not a discriminated union: this project compiles with
// * strictNullChecks off, where union narrowing by the discriminant does not
// * fire — every consumer would need casts otherwise
export type MetadataResult = {
  ok: boolean,
  meta?: PluginMetadata,
  error?: string
};

type Literal = string | number | boolean | null | Literal[] | {[k: string]: Literal};

/**
 * Pulls the top-level literal assignments of a Python module. A value that is
 * not a plain literal (a call, an f-string, a name…) leaves its key absent —
 * exactly `_extract_constants`' contract.
 */
export const extractConstants = (source: string): Record<string, Literal> => {
  const constants: Record<string, Literal> = {};
  const scanner = new TopLevelAssignments(source);
  for(const {target, value} of scanner) {
    if(!(METADATA_KEYS as readonly string[]).includes(target)) continue;
    if(target in constants) continue;
    try {
      constants[target] = parseLiteral(value);
    } catch(e) {
      // * dynamic / non-literal metadata is ignored by design
    }
  }

  return constants;
};

/**
 * Yields `{target, value}` for every top-level `NAME = <text>` (and annotated
 * `NAME: T = <text>`), with `value` the raw right-hand-side text. Bracket and
 * string state is tracked so multi-line literals stay whole and nothing inside
 * a string can fake a top-level statement.
 */
class TopLevelAssignments {
  constructor(private source: string) {}

  *[Symbol.iterator](): Generator<{target: string, value: string}> {
    const {source} = this;
    let i = 0;
    while(i < source.length) {
      const c = source[i];
      if(c === '\n') {
        i++;
        continue;
      }
      if(c === ' ' || c === '\t' || c === '\r') {
        // * a line that starts indented is nested in a block — never a
        // * top-level statement; skip it whole
        let end = i;
        while(end < source.length && source[end] !== '\n') {
          if(source[end] === '"' || source[end] === "'") {
            end = skipString(source, end);
            continue;
          }
          end++;
        }
        i = end;
        continue;
      }
      if(c === '#' || c === '@') {
        // * a comment or a decorator — the decorator's line is not an assignment
        i = skipToLineEnd(source, i);
        continue;
      }

      const match = /^(?:([A-Za-z_]\w*)\s*(?::[^#\n=]+)?=(?!=)|)/.exec(source.slice(i, i + 4096))!;
      if(!match[1]) {
        i = skipToLineEnd(source, i);
        continue;
      }
      i += match[0].length;
      const {end} = readBalanced(source, i);
      yield {target: match[1], value: source.slice(i, end).trim()};
      i = end;
      i = skipToLineEnd(source, i);
    }
  }
}

const skipToLineEnd = (source: string, i: number): number => {
  while(i < source.length && source[i] !== '\n') {
    // * a string on the skipped line may hold a newline escape but not a real
    // * newline; a real newline inside a triple-quoted string on the same
    // * line continues past it
    if(source[i] === '"' || source[i] === "'") {
      i = skipString(source, i);
      continue;
    }
    i++;
  }

  return i;
};

const skipString = (source: string, i: number): number => {
  const quote = source[i];
  const triple = source.startsWith(quote.repeat(3), i);
  const delimiter = triple ? quote.repeat(3) : quote;
  i += delimiter.length;
  while(i < source.length) {
    if(source[i] === '\\') {
      i += 2;
      continue;
    }
    if(source.startsWith(delimiter, i)) {
      return i + delimiter.length;
    }
    i++;
  }

  return i;
};

/** The extent of a right-hand side: to the line end, or past balanced brackets across lines. */
const readBalanced = (source: string, start: number): {end: number} => {
  let i = start;
  let depth = 0;
  while(i < source.length) {
    const c = source[i];
    if(c === '"' || c === "'") {
      i = skipString(source, i);
      continue;
    }
    if(c === '#' && depth === 0) {
      return {end: i};
    }
    if('([{'.includes(c)) depth++;
    else if(')]}'.includes(c)) {
      depth--;
      if(depth <= 0) return {end: i + 1};
    } else if(c === '\n' && depth === 0) {
      return {end: i};
    } else if(c === '\\' && source[i + 1] === '\n') {
      i += 2;
      continue;
    }
    i++;
  }

  return {end: i};
};

/** A Python literal, as `ast.literal_eval` accepts it. Throws on anything else. */
const parseLiteral = (text: string): Literal => {
  const parser = new LiteralParser(text);
  const value = parser.parseValue();
  parser.skipWs();
  if(!parser.atEnd()) {
    throw new Error('trailing tokens');
  }

  return value;
};

class LiteralParser {
  private i = 0;

  constructor(private text: string) {}

  atEnd(): boolean {
    return this.i >= this.text.length;
  }

  skipWs(): void {
    while(this.i < this.text.length) {
      const c = this.text[this.i];
      if(c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        this.i++;
        continue;
      }
      if(c === '#') {
        while(this.i < this.text.length && this.text[this.i] !== '\n') this.i++;
        continue;
      }
      if(c === '\\' && this.text[this.i + 1] === '\n') {
        this.i += 2;
        continue;
      }
      return;
    }
  }

  parseValue(): Literal {
    this.skipWs();
    const c = this.text[this.i];
    if(c === undefined) throw new Error('empty literal');
    if(c === '"' || c === "'") return this.parseString();
    if(c === '[') return this.parseCollection(']', (items) => items);
    if(c === '(') {
      return this.parseCollection(')', (items) => {
        // * a one-element tuple keeps its comma, `(x,)`; `(x)` is a group
        return items.length === 1 && this.text.lastIndexOf(',', this.i) >= 0 ?
          items :
          items.length === 1 && /^\s*,/.test(this.text.slice(this.i)) ? items : items;
      });
    }
    if(c === '{') {
      return this.parseCollection('}', (items) => {
        // * dict entries arrive as [key, value] pairs
        return items.every((item) => Array.isArray(item)) ?
          Object.fromEntries(items as [string, Literal][]) :
          items;
      });
    }

    const rest = this.text.slice(this.i);
    const number = /^(0[xXoObB][0-9a-fA-F_]+|\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?)/.exec(rest);
    if(number) {
      this.i += number[0].length;
      const raw = number[0].replace(/_/g, '');
      if(/^0[xX]/.test(raw)) return parseInt(raw.slice(2), 16);
      if(/^0[oO]/.test(raw)) return parseInt(raw.slice(2), 8);
      if(/^0[bB]/.test(raw)) return parseInt(raw.slice(2), 2);
      return Number(raw);
    }

    if(rest.startsWith('True')) {
      this.i += 4;
      return true;
    }
    if(rest.startsWith('False')) {
      this.i += 5;
      return false;
    }
    if(rest.startsWith('None')) {
      this.i += 4;
      return null;
    }

    throw new Error('not a literal');
  }

  private parseString(): string {
    // * prefixes: r/b allowed, f makes it dynamic (not a literal)
    // * (handled by the caller seeing `f` first — the quote itself never
    // * carries it, so scan back for a prefix)
    let start = this.i;
    let prefix = '';
    while(start > 0 && /[rbfuRBFU]/.test(this.text[start - 1]) && /[A-Za-z_]/.test(this.text[start - 2] ?? ' ') === false) {
      prefix = this.text[start - 1] + prefix;
      start--;
    }
    if(prefix.toLowerCase().includes('f')) {
      throw new Error('f-strings are not literals');
    }

    const quote = this.text[this.i];
    const triple = this.text.startsWith(quote.repeat(3), this.i);
    const delimiter = triple ? quote.repeat(3) : quote;
    this.i += delimiter.length;
    let out = '';
    while(this.i < this.text.length) {
      if(this.text.startsWith(delimiter, this.i)) {
        this.i += delimiter.length;
        if(prefix.toLowerCase().includes('r')) return out;
        return unescapePython(out);
      }
      if(this.text[this.i] === '\\' && !prefix.toLowerCase().includes('r')) {
        out += this.text[this.i] + (this.text[this.i + 1] ?? '');
        this.i += 2;
        continue;
      }
      out += this.text[this.i];
      this.i++;
    }

    throw new Error('unterminated string');
  }

  private parseCollection(closer: string, wrap: (items: Literal[]) => Literal): Literal {
    this.i++; // the opener
    const items: Literal[] = [];
    while(true) {
      this.skipWs();
      if(this.atEnd()) throw new Error('unterminated collection');
      if(this.text[this.i] === closer) {
        this.i++;
        return wrap(items);
      }
      // * a dict entry is `key: value`
      const key = this.parseValue();
      this.skipWs();
      if(this.text[this.i] === ':') {
        this.i++;
        const value = this.parseValue();
        items.push([key as string, value]);
      } else {
        items.push(key);
      }
      this.skipWs();
      if(this.text[this.i] === ',') {
        this.i++;
        continue;
      }
      if(this.text[this.i] === closer) {
        this.i++;
        return wrap(items);
      }
      throw new Error('expected , or ' + closer);
    }
  }
}

const ESCAPES: Record<string, string> = {
  n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', a: '\x07', b: '\b', f: '\f', v: '\v', '0': '\0'
};

const unescapePython = (raw: string): string => {
  let out = '';
  for(let i = 0; i < raw.length; i++) {
    if(raw[i] !== '\\') {
      out += raw[i];
      continue;
    }
    const next = raw[++i];
    if(next === undefined) break;
    if(ESCAPES[next] !== undefined) {
      out += ESCAPES[next];
      continue;
    }
    if(next === 'x' && /[0-9a-fA-F]{2}/.test(raw.slice(i + 1, i + 3))) {
      out += String.fromCharCode(parseInt(raw.slice(i + 1, i + 3), 16));
      i += 2;
      continue;
    }
    if(next === 'u' && /[0-9a-fA-F]{4}/.test(raw.slice(i + 1, i + 5))) {
      out += String.fromCharCode(parseInt(raw.slice(i + 1, i + 5), 16));
      i += 4;
      continue;
    }
    out += next;
  }

  return out;
};

// * ── the metadata reader proper (`_read_metadata_uncached`) ─────────────────

const splitBare = (text: string): string[] => {
  const parts: string[] = [];
  for(const raw of text.replace(/\n/g, ',').split(',')) {
    const chunk = raw.trim();
    if(!chunk.length) continue;
    if(parts.length && '<>=!~'.includes(chunk[0])) {
      parts[parts.length - 1] += ',' + chunk;
    } else {
      parts.push(chunk);
    }
  }

  return parts;
};

const validatePermissions = (declared: unknown): string[] => {
  let list = declared;
  if(typeof list === 'string') {
    // * the same leniency as __requirements__: a single permission is often bare
    list = splitBare(list);
  }
  if(!Array.isArray(list)) {
    throw new Error('__permissions__ must be a list of permission keys');
  }

  const out: string[] = [];
  for(const item of list) {
    if(typeof item !== 'string') {
      throw new Error('__permissions__ entries must be strings');
    }
    const key = item.trim();
    if(!(KNOWN_PERMISSIONS as readonly string[]).includes(key)) {
      throw new Error(
        `unknown permission '${item}' in __permissions__; known keys: ${KNOWN_PERMISSIONS.join(', ')}`
      );
    }
    if(!out.includes(key)) out.push(key);
  }

  return out;
};

/** The `read_metadata_json` contract shape: `{ok, meta}` or `{ok: false, error}`. */
export const readPluginMetadata = (source: string): MetadataResult => {
  try {
    const constants = extractConstants(source);

    const pluginId = constants['__id__'];
    if(pluginId === undefined) {
      throw new Error('plugin metadata is missing the required __id__ constant');
    }
    if(typeof pluginId !== 'string') {
      throw new Error('__id__ must be a string');
    }
    if(!ID_PATTERN.test(pluginId)) {
      throw new Error(`invalid __id__ ${pluginId}: must be 2-32 characters, start with a letter and contain only Latin letters, digits, '_' or '-'`);
    }
    // * (the Python reader also refuses stdlib module names — that guard is
    // * about the Python import namespace and has no web counterpart)

    const name = constants['__name__'];
    if(name === undefined) {
      throw new Error('plugin metadata is missing the required __name__ constant');
    }
    if(typeof name !== 'string' || !name.trim().length) {
      throw new Error('__name__ must be a non-empty string');
    }

    let version = constants['__version__'] ?? '1.0';
    if(typeof version !== 'string') version = String(version);

    let appVersion = constants['__app_version__'];
    const minVersion = constants['__min_version__'];
    if(appVersion === undefined && minVersion !== undefined) {
      appVersion = `>=${minVersion}`;
    }

    let requirements = constants['__requirements__'] ?? [];
    if(typeof requirements === 'string') requirements = splitBare(requirements);
    if(!Array.isArray(requirements) || !requirements.every((item) => typeof item === 'string')) {
      throw new Error('__requirements__ must be a string or a list of PEP 508 strings');
    }

    const declaredPermissions = '__permissions__' in constants;
    const permissions = declaredPermissions ?
      validatePermissions(constants['__permissions__'] ?? []) :
      [];

    return {
      ok: true,
      meta: {
        id: pluginId,
        name,
        description: typeof constants['__description__'] === 'string' ? constants['__description__'] as string : '',
        author: typeof constants['__author__'] === 'string' ? constants['__author__'] as string : '',
        version,
        icon: typeof constants['__icon__'] === 'string' ? constants['__icon__'] as string : undefined,
        app_version: typeof appVersion === 'string' ? appVersion : undefined,
        sdk_version: typeof constants['__sdk_version__'] === 'string' ? constants['__sdk_version__'] as string : undefined,
        beta: !!constants['__beta__'],
        requirements: requirements as string[],
        permissions,
        permissions_declared: declaredPermissions
      }
    };
  } catch(e) {
    return {ok: false, error: (e as Error)?.message ?? String(e)};
  }
};
