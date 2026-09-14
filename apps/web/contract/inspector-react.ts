import type { ContentBlock, Collection } from './records/owners.js';
import type { ObjectEdit } from './records/inspector.js';
/** Content controls submit typed local intentions; they cannot write to canonical records. */
export interface ContentEditorProps {
  readonly item: ContentBlock;
  readonly collection: Collection;
  edit(command: ObjectEdit): void;
}
