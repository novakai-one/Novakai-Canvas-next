import type { Collection } from '../../contract/records/collection.js';
import type { Result } from '../../contract/errors.js';
import type { ChangePlan } from '../../contract/types.js';
import { validateCollection } from '../invariants/validate.js';
import { failure, success } from '../invariants/issues.js';
import { freeze } from '../invariants/freeze.js';
import { stageChanges } from './stage.js';
import { describeImpact } from './impact.js';

/** Stage shares exact structural semantics; final validation alone turns a prefix into a valid plan. */
function validateFinalCandidate(snapshot: unknown, changes: unknown): Result<ChangePlan> {
  const before = validateCollection(snapshot);
  if (!before.ok) return before;
  const staged = stageChanges(before.value, changes);
  if (!staged.ok) return staged;
  return finalizeCandidate(before.value, staged.value.candidate);
}
/** Final invariants are never inferred from successful structural staging. */
function finalizeCandidate(before: Collection, unchecked: Collection): Result<ChangePlan> {
  const candidate = validateCollection(unchecked);
  if (!candidate.ok) return candidate;
  return success({ candidate: candidate.value, impact: describeImpact(before, candidate.value) });
}
/**
 * Return a detached valid candidate and net impact. Ordered changes may temporarily break references;
 * final invariants must hold. Neither revision nor inputs change. Authoring owns commit/recovery.
 */
export function planChanges(snapshot: unknown, changes: unknown): Result<ChangePlan> {
  try {
    return freeze(validateFinalCandidate(snapshot, changes));
  } catch {
    return freeze(failure('shape', 'changes', 'Input could not be read as plain data'));
  }
}
