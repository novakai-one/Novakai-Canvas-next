import type { Result } from '../errors.js';
/** Strict platform codecs; malformed UTF-8/base64 produces a typed failure, never replacement data. */
export interface Encoding {
  utf8(text: string): Uint8Array;
  text(bytes: Uint8Array): Result<string>;
  base64(bytes: Uint8Array): string;
  decode(text: string): Result<Uint8Array>;
  hash(bytes: Uint8Array): string;
}
