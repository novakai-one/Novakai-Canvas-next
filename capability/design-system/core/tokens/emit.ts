import type { TokenValue, TokenValues } from '../../contract/records/tokens.js';
import { reject } from '../validation/outcomes.js';
/** Stable public CSS names derive from token identity, never an independent naming registry. */
export function cssName(id: string): string {
  return (
    '--nv-' + id.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase()).replaceAll('.', '-')
  );
}
/** Emit already-resolved primitives; recipes are not reimplemented in CSS. */
export function cssValue(value: TokenValue): string {
  return serializers[value.type](value);
}
/** Numeric types retain their explicit unit. */
function numericCss(value: TokenValue): string {
  if (!('unit' in value)) return String(value.value);
  return String(value.value) + value.unit;
}
/** Approved generic families stay generic; named families are safely quoted. */
function fontCss(value: TokenValue): string {
  if (value.type !== 'fontFamily')
    return reject('type-mismatch', 'font', 'fontFamily', 'Invalid font serializer');
  return value.value.map((family) => fontName(family)).join(', ');
}
/** The parser excludes CSS punctuation; JSON quoting retains embedded spaces safely. */
function fontName(family: string): string {
  if (['system-ui', 'ui-monospace', 'sans-serif', 'monospace', 'serif'].includes(family))
    return family;
  return JSON.stringify(family);
}
const serializers: Readonly<Record<TokenValue['type'], (value: TokenValue) => string>> = {
  color: (value) => String(value.value),
  number: numericCss,
  dimension: numericCss,
  duration: numericCss,
  fontFamily: fontCss,
};
/** A complete scope repeats every derived value, preventing stale inherited aliases. */
export function emitVariables(values: TokenValues): Readonly<Record<string, string>> {
  const entries = Object.entries(values).map(([id, value]) => [cssName(id), cssValue(value)]);
  const output = Object.fromEntries(entries);
  if (Object.keys(output).length !== entries.length)
    return reject(
      'invalid-input',
      'tokens',
      'unique CSS names',
      'Token names collide after CSS conversion',
    );
  return output;
}
