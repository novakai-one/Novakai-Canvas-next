import type { Result } from '../errors.js';
import type { SourceSet } from '../records/source.js';
import type { ArtifactSet, ArtifactManifest } from '../records/artifacts.js';
import type { TokenSource } from './token-source.js';
import type { TokenArtifacts } from './token-artifacts.js';
/** Build binding owns file access; pure source/artifact validation is injected at composition. */
export interface BuildChecks {
  source(input: unknown): Result<SourceSet>;
  artifacts(input: unknown): Result<ArtifactSet>;
}
export interface TokenFileBindings {
  readonly source: TokenSource;
  readonly artifacts: TokenArtifacts;
  readActive(): Promise<Result<ArtifactSet>>;
  verifySnapshots(artifacts: ArtifactSet): Promise<Result<readonly string[]>>;
  writeSnapshots(artifacts: ArtifactSet): Promise<Result<ArtifactManifest>>;
}
