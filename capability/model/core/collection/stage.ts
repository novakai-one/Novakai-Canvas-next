import type { Collection } from '../../contract/records/collection.js';
import { changesSchema, type Change } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import type { ChangeStage } from '../../contract/types.js';
import { validateCollection } from '../invariants/validate.js';
import { shapeErrors } from '../invariants/shape-diagnostics.js';
import { inspectInput } from '../invariants/input.js';
import { failure, success, rejected } from '../invariants/issues.js';
import { freeze } from '../invariants/freeze.js';
import { applyOperation } from './operations.js';

/** Stop after the first failed structural operation; never apply to a rejected prefix. */
function applyNextOperation(current: Result<Collection>, change: Change): Result<Collection> {
  if (!current.ok) return current;
  return applyOperation(current.value, change);
}
/** Check operation shapes once, then expose their exact ordered structural effects to the compiler. */
function applyCheckedChanges(before: Collection, changes: unknown): Result<ChangeStage> {
  const parsed = changesSchema.safeParse(changes);
  if (!parsed.success) return rejected(shapeErrors(parsed.error.issues));
  const applied = parsed.data.reduce(applyNextOperation, success(before));
  if (!applied.ok) return applied;
  return success({ validity: 'unchecked', candidate: applied.value, changes: parsed.data });
}
/** A valid original is mandatory; only intermediate dependency completeness may be deferred. */
function inspectStageInputs(snapshot: unknown, changes: unknown): Result<ChangeStage> {
  const before = validateCollection(snapshot);
  if (!before.ok) return before;
  const inspected = inspectInput(changes);
  if (!inspected.ok) return inspected;
  return applyCheckedChanges(before.value, changes);
}
/**
 * Return detached checked operations and an explicitly unchecked candidate. Unresolved final references
 * are permitted here; consumers must call plan for validity. Pure replay, no revision allocation or I/O.
 * Language owns syntax correction; Authoring owns final admission, commit and recovery.
 */
export function stageChanges(snapshot: unknown, changes: unknown): Result<ChangeStage> {
  try {
    return freeze(inspectStageInputs(snapshot, changes));
  } catch {
    return freeze(failure('shape', 'changes', 'Input could not be read as plain data'));
  }
}
