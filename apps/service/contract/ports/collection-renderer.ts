import type { Collection } from '../records/owners.js';
import type { WorkspaceContents } from '../records/workspace.js';
import type { RenderDocument } from '../records/rendering.js';
import type { Result } from '../errors.js';
/** A committed read rendering holds its exact bytes until worker settlement independently from mutation admission. */
export interface CollectionRenderer {
  render(
    collection: Collection,
    workspace: WorkspaceContents,
    signal: AbortSignal,
  ): Promise<Result<RenderDocument>>;
}
