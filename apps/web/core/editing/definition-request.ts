/*
 * Turning a definition draft into a model request: create and replace carry the definition,
 * remove carries its ID. The request goes through the workspace bindings' model input; Authoring
 * owns admission, commit and recovery.
 */
import type { Result } from '../../contract/errors.js';
import type { WorkspaceBindings } from '../../contract/ports/workspace.js';
import type { Change, Request } from '../../contract/records/owners.js';
import type { DefinitionDraft } from '../../contract/records/definitions.js';

/** Builds the model request of a definition draft, reusing the draft's own request when present. */
export function definitionRequest(
  draft: DefinitionDraft,
  bindings: WorkspaceBindings,
): Result<Request> {
  if (draft.request !== undefined) {
    return { ok: true, value: draft.request };
  }
  return bindings.inputs.model(
    draft.base,
    draft.collection.id,
    definitionChanges(draft),
    bindings.nextId(),
  );
}

/** The changes of a draft: remove carries the ID; create and replace carry the definition. */
function definitionChanges(draft: DefinitionDraft): readonly Change[] {
  if (draft.operation === 'remove') {
    return [{ op: 'remove', target: 'definitions', id: draft.definition.id }];
  }
  return [{ op: draft.operation, target: 'definitions', value: draft.definition }];
}
