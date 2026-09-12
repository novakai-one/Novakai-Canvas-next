import type { Result } from './errors.js';
import type { Artifact } from './records/artifact.js';
import type { BundleInspection, PreparedImport } from './records/bundle.js';
import type { Cancellation } from './records/input.js';
import type { SnapshotReader } from './ports/snapshot.js';
import type { Documents } from './ports/documents.js';
import type { Resources } from './ports/resources.js';
import type { Encoding } from './ports/encoding.js';
import type { FormatRegistry } from './ports/formats.js';
/** Same public operations serve HTTP downloads and headless agents; hosts own authoritative import. */
export interface Export {
  exportArtifact(input: unknown, signal?: Cancellation): Promise<Result<Artifact>>;
  inspectBundle(bytes: unknown): Promise<Result<BundleInspection>>;
  prepareImport(input: unknown): Promise<Result<PreparedImport>>;
}
export interface TransferDependencies {
  readonly documents: Documents;
  readonly resources: Resources;
  readonly encoding: Encoding;
}
export interface ProductionDependencies {
  readonly snapshots: SnapshotReader;
  readonly formats: FormatRegistry;
  readonly encoding: Pick<Encoding, 'hash'>;
}
export interface Dependencies extends TransferDependencies {
  readonly snapshots: SnapshotReader;
  readonly formats: FormatRegistry;
}

/** Preparation consumes parsing/validation but never source printing. */
export interface ImportDependencies extends Omit<TransferDependencies, 'documents'> {
  readonly documents: Pick<Documents, 'read' | 'parse'>;
}
/** Bundle inspection needs no semantic printer or parser. */
export type InspectionDependencies = Pick<TransferDependencies, 'resources' | 'encoding'>;
