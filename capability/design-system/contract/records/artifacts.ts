import type { Digest, Version } from '../brands.js';
export interface Artifact {
  readonly path: string;
  readonly content: string;
  readonly hash: Digest;
}
/** Readers pin one complete generation; writer publishes manifest only after all bytes verify. */
export interface ArtifactManifest {
  readonly generation: Digest;
  readonly version: Version;
  readonly files: readonly { readonly path: string; readonly hash: Digest }[];
}
export interface ArtifactSet {
  readonly digest: Digest;
  readonly version: Version;
  readonly files: readonly Artifact[];
  readonly manifest: ArtifactManifest;
}
export interface StyleDeclaration {
  readonly file: string;
  readonly selector: string;
  readonly layer: string;
  readonly property: string;
  readonly value: string;
  readonly important: boolean;
}
export interface StyleCoverage {
  readonly denominator: number;
  readonly primary: number;
  readonly tokenized: number;
  readonly excluded: number;
  readonly primaryRatio: number;
  readonly tokenRatio: number;
  readonly violations: readonly {
    readonly file: string;
    readonly selector: string;
    readonly property: string;
    readonly reason: string;
  }[];
}
