import type { Result } from '../errors.js';
import type { Resource } from '../records/bundle.js';

/**
 * The owning capabilities' check of transferred resources (assets, presets, fonts), supplied by
 * the host. Export calls it when building a bundle (for the snapshot's resources) and when
 * inspecting one (for the bundle's resources), after its own checks (at most 2,000
 * resources, no repeated kind and digest, at most 20 MiB each, bytes matching their digest).
 * Inspection never publishes or binds a resource; the host admits resources later, through
 * Authoring.
 */
export interface Resources {
  /**
   * Checks the exact bytes and metadata of every resource.
   *
   * @param resources - The resources, in bundle order.
   * @returns The admitted resources, or the owner's failure (passed through unchanged). The
   * admitted list may be new objects, but its content and metadata must equal the input's, in the
   * same order; otherwise Export fails with `resource-rejected`.
   */
  inspect(resources: readonly Resource[]): Promise<Result<readonly Resource[]>>;
}
