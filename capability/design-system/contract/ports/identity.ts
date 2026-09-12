import type { Digest } from '../brands.js';
import type { Result } from '../errors.js';
/** Synchronous portable content identity; caller handles typed provider failure without applying a scope. */
export interface Identity {
  hash(canonical: string): Result<Digest>;
}
