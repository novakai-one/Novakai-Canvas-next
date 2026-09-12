import type { Result } from '../errors.js';
import type { Resource } from '../records/bundle.js';
/** Owning capabilities inspect exact bytes and metadata. Validation never publishes resource bindings. */
export interface Resources {
  inspect(resources: readonly Resource[]): Promise<Result<readonly Resource[]>>;
}
