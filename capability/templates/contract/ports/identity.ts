import type { Digest } from '../brands.js';
import type { Result } from '../errors.js';
/** Hash canonical UTF8 JSON. No ambient keys or changing salts; failures are typed. */
export interface IdentityPort {
  hash(canonical: string): Result<Digest>;
}
