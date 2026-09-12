import { createHash } from 'node:crypto';
import type { Encoding } from '../../contract/ports/encoding.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
/** Fatal UTF-8 decoding prevents replacement characters from disguising corrupt DSL or manifests. */
function text(bytes: Uint8Array): Result<string> {
  try {
    return { ok: true, value: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return failure('invalid-bundle', 'bytes', 'Malformed UTF-8');
  }
}
/** Re-encoding checks padding and unused bits as well as the accepted base64 alphabet. */
function decode(value: string): Result<Uint8Array> {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
    return failure('invalid-bundle', 'base64', 'Malformed base64');
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value)
    return failure('invalid-bundle', 'base64', 'Noncanonical base64');
  return { ok: true, value: Uint8Array.from(bytes) };
}
/** Pure codecs perform no file or network access; caller owns retries of enclosing operations. */
export function createEncoding(): Encoding {
  return Object.freeze({
    utf8: (value) => new TextEncoder().encode(value),
    text,
    base64: (bytes) => Buffer.from(bytes).toString('base64'),
    decode,
    hash: (bytes) => createHash('sha256').update(bytes).digest('hex'),
  } satisfies Encoding);
}
