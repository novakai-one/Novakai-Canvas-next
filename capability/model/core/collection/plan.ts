import type { Collection } from '../../contract/records/collection.js';
import { changesSchema, type Change } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import type { ChangePlan } from '../../contract/types.js';
import { validateCollection, shapeErrors } from '../invariants/validate.js';
import { inspectInput } from '../invariants/input.js';
import { failure, success } from '../invariants/issues.js';
import { freeze } from '../invariants/freeze.js';
import { applyOperation } from './operations.js';
import { describeImpact } from './impact.js';
function next(result: Result<Collection>, change: Change): Result<Collection> {
  if (!result.ok) return result;
  return applyOperation(result.value, change);
}
function candidate(before: Collection, changes: readonly Change[]): Result<ChangePlan> {
  const reduced = changes.reduce(next, success(before));
  if (!reduced.ok) return reduced;
  return complete(before, reduced.value);
}
function complete(before: Collection, candidate: Collection): Result<ChangePlan> {
  const validated = validateCollection(candidate);
  if (!validated.ok) return validated;
  return success({ candidate: validated.value, impact: describeImpact(before, validated.value) });
}
function parsed(before: Collection, changes: unknown): Result<ChangePlan> {
  const parsed = changesSchema.safeParse(changes);
  if (!parsed.success) return { ok: false, diagnostics: shapeErrors(parsed.error.issues) };
  return candidate(before, parsed.data);
}
function prepare(snapshot: unknown, changes: unknown): Result<ChangePlan> {
  const before = validateCollection(snapshot);
  if (!before.ok) return before;
  const inspected = inspectInput(changes);
  if (!inspected.ok) return inspected;
  return parsed(before.value, changes);
}
/** Pure replay; Authoring owns commit, revision increment and crash recovery. */
export function planChanges(snapshot: unknown, changes: unknown): Result<ChangePlan> {
  try {
    return freeze(prepare(snapshot, changes));
  } catch {
    return freeze(failure('shape', 'changes', 'Input could not be read as plain data'));
  }
}
