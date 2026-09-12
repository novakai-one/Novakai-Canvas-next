import type {
  RenderDocument,
  SceneStamp,
  EditIntent,
  Change,
  Collection,
  Section,
} from './owners.js';
import type { Result } from '../errors.js';
/** Canvas generation identifies the exact gesture base in addition to the document revision and layout input key. */
export interface EditContext {
  readonly document: RenderDocument;
  readonly stamp: SceneStamp;
}
export interface EditPlanner {
  plan(intent: EditIntent, context: EditContext): Result<readonly Change[]>;
}
export interface SectionEdit {
  readonly before: Section;
  readonly after: Section;
}
export interface HumanRequestInput {
  readonly snapshot: import('./owners.js').Snapshot;
  readonly collection: Collection;
  readonly request: string;
  readonly changes: readonly Change[];
}
