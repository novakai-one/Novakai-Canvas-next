import type { Digest } from '../brands.js';
import type { Result } from '../errors.js';
/** Read current documents, retained history and presets while Assets maintenance is serialized. */
export type ReachabilityReader = () => Result<readonly Digest[]>;
