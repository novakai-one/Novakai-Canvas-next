import type { Digest } from '../brands.js';
import type { Result } from '../errors.js';

/**
 * Reads every digest still referenced by current documents, retained history and presets.
 * Collection calls it inside its storage transaction, so no lease or deletion runs in between.
 * A failure it returns is passed on unchanged and nothing is deleted.
 */
export type ReachabilityReader = () => Result<readonly Digest[]>;
