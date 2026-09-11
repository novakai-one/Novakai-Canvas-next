import { reject, origin } from './outcomes.js';
/** Enforce UTF8 byte and Unicode limits before token allocation. Language owns correction, no side effects. */
export function readSource(source: unknown): string {
  if (typeof source !== 'string')
    reject('invalid-input', origin, 'UTF8 source string', 'Source must be text');
  checkUnicode(source);
  if (new TextEncoder().encode(source).length > 16 * 1024 * 1024)
    reject('limit', origin, 'At most 16MiB UTF8', 'Source exceeds byte limit');
  return source;
}
/** Unpaired UTF16 surrogates cannot be represented faithfully as UTF8. */
function checkUnicode(source: string): void {
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(source))
    reject(
      'invalid-input',
      origin,
      'Paired Unicode surrogates',
      'Source contains an unpaired surrogate',
    );
}
