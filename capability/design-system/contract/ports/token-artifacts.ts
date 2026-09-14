import type { Result } from '../errors.js';
import type { ArtifactSet, ArtifactManifest } from '../records/artifacts.js';
/** Safe replay publishes immutable bytes then swaps manifest; writer owns failed-generation recovery. */
export interface TokenArtifacts {
  publish(artifacts: ArtifactSet): Promise<Result<ArtifactManifest>>;
}
