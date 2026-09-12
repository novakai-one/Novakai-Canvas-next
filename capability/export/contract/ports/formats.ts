import type { Result } from '../errors.js';
import type { Snapshot, Selection, Encoded } from '../records/artifact.js';
import type { ExportRequest, Cancellation } from '../records/input.js';
import type { Page } from '../records/pages.js';
/** Five composed handlers share one revision-pinned contract; none writes the workspace. */
export interface RenderInput {
  readonly snapshot: Snapshot;
  readonly selection: Selection;
  readonly request: ExportRequest;
  readonly pages: readonly Page[];
  readonly signal: Cancellation;
}
export interface FormatHandler {
  encode(input: RenderInput): Promise<Result<Encoded>>;
}
export type FormatRegistry = Readonly<Record<ExportRequest['format'], FormatHandler>>;
