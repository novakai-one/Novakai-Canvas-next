import type { Span } from '../../contract/records/syntax.js';
import { reject } from '../validation/outcomes.js';
const escapes: Readonly<Record<string, string>> = { '"': '"', '\\': '\\', n: '\n', t: '\t' };
/** Decode only the four declared escapes. Language owns source correction; text is never evaluated. */
export function decodeString(text: string, span: Span): string {
  return text
    .slice(1, -1)
    .replace(/\\([\s\S])/g, (_whole: string, code: string) => decodeEscape(code, span));
}
/** Unknown escapes reject explicitly; no JSON decoder silently broadens the grammar. */
function decodeEscape(code: string, span: Span): string {
  const value = escapes[code];
  if (value === undefined)
    reject('syntax', span, 'quote, backslash, n or t escape', 'Unknown string escape');
  return value;
}
