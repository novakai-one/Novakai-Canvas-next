import type { Collection, DiagramObject, Relationship } from '../../contract/records/owners.js';
import type {
  EditedWire,
  WireDraft,
  WirePlanOutcome,
  WirePlanner,
} from '../../contract/records/wire-editor.js';
import { editedChanges, editedWire } from './wire-edits.js';
import {
  functionTarget,
  moduleFunctions,
  newFunctionProblem,
  withNewFunction,
} from './wire-functions.js';
import type { ModuleFunction } from './wire-functions.js';
import {
  nothingChanged,
  ownerMessage,
  pickFunction,
  plainIssues,
  staleDraft,
} from './wire-problems.js';
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
  const edited = editedWire(draft);
  const changes = editedChanges(draft, edited);
  return (
    namingBlock(draft, edited) ??
    functionBlock(draft, edited) ??
    (changes.length === 0 ? nothingChanged : null) ??
    plannedBlock(draft, edited, planner(current, changes))
  );
}
/**
 * A module or interface wire names one of its functions, so it is off until the target is one of
 * them (existing or staged) and the label is that name. The Model alone would accept a module
 * target with any label.
 */
function functionBlock(draft: WireDraft, edited: EditedWire): string | null {
  const collection = withNewFunction(draft.collection, edited.created ?? null);
  const owner = functionTarget(collection, edited.relationship);
  if (owner === null) return null;
  return namesFunction(owner, edited.relationship) ? null : pickFunction;
}
function namesFunction(owner: DiagramObject, relationship: Relationship): boolean {
  const { member } = relationship.target;
  const named = (item: ModuleFunction): boolean =>
    item.id === member && item.label === relationship.label;
  return moduleFunctions(owner).some(named);
}
/** An unusable new-function name stages nothing, so the planner would see an unchanged wire. */
function namingBlock(draft: WireDraft, edited: EditedWire): string | null {
  const naming = edited.naming ?? null;
  const target = functionTarget(draft.collection, edited.relationship);
  if (naming === null || target === null) return null;
  return newFunctionProblem(naming, target, null);
}
function plannedBlock(
  draft: WireDraft,
  edited: EditedWire,
  outcome: WirePlanOutcome,
): string | null {
  if (outcome.ok) return null;
  const issues = outcome.error.diagnostics;
  const context = {
    kind: edited.relationship.kind,
    picker: functionTarget(draft.collection, edited.relationship) !== null,
  };
  return (
    plainIssues(issues, context) ??
    ownerMessage('The wire cannot be saved', issues[0]?.message, outcome.error.code)
  );
}
