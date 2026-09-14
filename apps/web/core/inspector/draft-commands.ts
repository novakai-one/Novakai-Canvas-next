import type { ObjectSelection, ObjectEdit, ObjectDraft } from '../../contract/records/inspector.js';
import type { WireSelection, WireEdit, WireDraft } from '../../contract/records/wire-editor.js';
import { objectDraftKey } from './object-edits.js';
import { wireDraftKey } from './wire-edits.js';
/** The first edit captures the exact displayed object; later commands never adopt a foreign revision. */
export function retainObjectCommand(
  selection: ObjectSelection,
  command: ObjectEdit,
  drafts: readonly ObjectDraft[],
): ObjectDraft {
  const key = objectDraftKey(selection.collection.id, selection.object.id);
  const original = drafts.find((draft) => draft.key === key) ?? { ...selection, key, edits: [] };
  return { ...original, edits: [...original.edits, command] };
}
/** Shared semantics and local route controls remain tied to the same captured collection version. */
export function retainWireCommand(
  selection: WireSelection,
  command: WireEdit,
  drafts: readonly WireDraft[],
): WireDraft {
  const key = wireDraftKey(
    selection.collection.id,
    selection.section.id,
    selection.relationship.id,
  );
  const original = drafts.find((draft) => draft.key === key) ?? { ...selection, key, edits: [] };
  return { ...original, edits: [...original.edits, command] };
}
