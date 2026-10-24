/**
 * The `.extera` wrapper — invisible-Unicode obfuscation. A byte-port of
 * exteraless `backup/InvisibleEncryptor.java` (itself a byte-port of
 * exteraGram 12.9.0): every UTF-8 byte is written in base 11 over an alphabet
 * of invisible characters, bytes are joined by U+2000 and the string starts
 * with U+2001 U+2002. The format must match to the character or exteraGram
 * will not read our files, and we will not read its.
 */
const PREFIX = '\u2001\u2002';
const SEPARATOR = '\u2000';
const ALPHABET = '\u200a\u200b\u200c\u200f\u202f\u206a\u206b\u206c\u206d\u206e\u206f';
const BASE = 11;

/**
 * exteraGram's character class has no U+2000 in it: on Android it passes `\s`
 * because of ICU regexes. We name it explicitly — same meaning, no reliance on
 * the regex implementation.
 */
const PATTERN = new RegExp(`^${PREFIX}([${ALPHABET}${SEPARATOR}\\s]*)`);

export const invisibleEncryptor = {
  encode(text: string): string {
    // * TextEncoder gives the UTF-8 bytes the Android port writes
    const bytes = new TextEncoder().encode(text);
    let out = PREFIX;
    for(let i = 0; i < bytes.length; i++) {
      if(i > 0) out += SEPARATOR;
      out += toStr(bytes[i]);
    }

    return out;
  },

  decode(text: string): string {
    const parts = text.replace(new RegExp(`^${PREFIX}`), '').split(SEPARATOR);
    const bytes = new Uint8Array(parts.length);
    for(let i = 0; i < parts.length; i++) {
      bytes[i] = toNum(parts[i]);
    }

    return new TextDecoder().decode(bytes);
  },

  isEncrypted(text: string): boolean {
    return !!text && PATTERN.test(text);
  }
};

function toNum(text: string): number {
  let value = 0;
  for(let i = 0; i < text.length; i++) {
    const position = text.length - i;
    const digit = ALPHABET.indexOf(text[position - 1]);
    value += digit * Math.pow(BASE, i);
  }

  return value;
}

function toStr(value: number): string {
  let out = '';
  while(value > 0) {
    out = ALPHABET[value % BASE] + out;
    value = Math.floor(value / BASE);
  }

  return out;
}
