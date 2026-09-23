import type { Collection } from '../../contract/records/owners.js';
import type { WireDraft, WirePlanner } from '../../contract/records/wire-editor.js';
import { editedWire, wireChanges } from './wire-edits.js';
import { functionTarget, newFunctionProblem } from './wire-functions.js';
import { plainIssues, staleDraft } from './wire-problems.js';
/**
 * Why Apply is off for this draft, as one plain sentence; null only when the Model's own planner
 * accepts the exact change list Apply would send. The planner is the gate; rules only word it.
 */
export function wireApplyBlock(
  draft: WireDraft,
  current: Collection,
  planner: WirePlanner,
): string | null {
  if (draft.collection.revision !== current.revision) return staleDraft;
  return namingBlock(draft) ?? plannedBlock(draft, current, planner);
}
/** An unusable new-function name stages nothing, so the planner would see an unchanged wire. */
function namingBlock(draft: WireDraft): string | null {
  const edited = editedWire(draft);
  const naming = edited.naming ?? null;
  const target = functionTarget(draft.collection, edited.relationship);
  if (naming === null || target === null) return null;
  return newFunctionProblem(naming, target, null);
}
function plannedBlock(draft: WireDraft, current: Collection, planner: WirePlanner): string | null {
  const outcome = planner(current, wireChanges(draft));
  if (outcome.ok) return null;
  const issues = outcome.error.diagnostics;
  const context = {
    kind: editedWire(draft).relationship.kind,
    picker: functionTarget(draft.collection, editedWire(draft).relationship) !== null,
  };
  const first = issues[0]?.message ?? outcome.error.code;
  return plainIssues(issues, context) ?? `The wire cannot be saved: ${first}`;
}
