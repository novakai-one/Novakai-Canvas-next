import type { Collection, Snapshot, RecordKey, AuthoringResult } from '../records/owners.js';
import type { WorkspaceContents, WorkspaceReader } from '../records/workspace.js';
import type { RenderingJob } from '../records/rendering.js';
import type { DiagramProducer } from './rendering.js';
import type { Scene } from '@novakai/canvas-layout';
/** Resource-backed job construction remains separate from scheduling and rendered scene admission. */
export interface RenderJobs {
  create(
    collection: Collection,
    view: WorkspaceContents,
    previous: Scene | null,
    id: string,
  ): AuthoringResult<RenderingJob>;
}
export interface FeasibilityOwners {
  readonly workspace: WorkspaceReader;
  readonly jobs: RenderJobs;
  readonly producer: DiagramProducer;
}
export interface ChangedCollections {
  read(snapshot: Snapshot, changed: readonly RecordKey[]): AuthoringResult<readonly Collection[]>;
}
