import type { Json } from '../../contract/records/storage.js';
import type { Request } from '../../contract/records/request.js';
import type { Hasher } from '../../contract/ports/runtime.js';
import type { Digest } from '../../contract/brands.js';
import { digest } from '../../contract/brands.js';
import { readShape } from '../validation/input.js';
import { accepted } from '../validation/outcomes.js';
/** Object order is immaterial; array order remains part of submitted intent. Authoring owns retry recovery. */
export function canonical(value: Json): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(',')}]`;
  return canonicalScalarOrObject(value);
}
/** A separate scalar path keeps null and ordinary objects readable without assertion casts. */
function canonicalScalarOrObject(value: Json): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  const pairs = Object.entries(value).toSorted(([left], [right]) => (left < right ? -1 : 1));
  return `{${pairs.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
}
/** Fingerprint exactly the checked submitted fields; never substitute newly resolved alias pins. */
export function fingerprint(request: Request, hash: Hasher): Digest {
  const { request: excluded, ...submitted } = request;
  void excluded;
  return readShape(digest, accepted(hash.digest(canonical(submitted))), 'corrupt-record');
}
