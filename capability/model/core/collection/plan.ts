import type { Collection } from '../../contract/records/collection.js';
import { changesSchema, type Change } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import type { ChangePlan } from '../../contract/types.js';
import { validateCollection } from '../invariants/validate.js';
import { shapeErrors } from '../invariants/shape-diagnostics.js';
import { inspectInput } from '../invariants/input.js';
import { failure, success } from '../invariants/issues.js';
import { freeze } from '../invariants/freeze.js';
import { applyOperation } from './operations.js';
import { describeImpact } from './impact.js';

/** Once an operation fails, later operations cannot run or expose a partial collection. */
function applyNextOperation(current: Result<Collection>, change: Change): Result<Collection> {
  if (!current.ok) return current;
  return applyOperation(current.value, change);
}

/** Final-state validation permits related records to be changed together in one batch. */
function validateCandidateAndDescribeImpact(
  before: Collection,
  candidate: Collection,
): Result<ChangePlan> {
  const validated = validateCollection(candidate);
  if (!validated.ok) return validated;
  const impact = describeImpact(before, validated.value);
  return success({ candidate: validated.value, impact });
}

/** Apply checked operations in order; intermediate records may await another operation's repair. */
function applyChangeBatch(before: Collection, changes: readonly Change[]): Result<ChangePlan> {
  const applied = changes.reduce(applyNextOperation, success(before));
  if (!applied.ok) return applied;
  return validateCandidateAndDescribeImpact(before, applied.value);
}

/** Structural parsing rejects unsupported operations before any candidate is constructed. */
function parseAndApplyChanges(before: Collection, changes: unknown): Result<ChangePlan> {
  const parsedChanges = changesSchema.safeParse(changes);
  if (!parsedChanges.success)
    return { ok: false, diagnostics: shapeErrors(parsedChanges.error.issues) };
  return applyChangeBatch(before, parsedChanges.data);
}

/** Validate the snapshot first, then inspect the untrusted change batch before parsing it. */
function validatePlanningInputs(snapshot: unknown, changes: unknown): Result<ChangePlan> {
  const validatedSnapshot = validateCollection(snapshot);
  if (!validatedSnapshot.ok) return validatedSnapshot;
  const inspectedChanges = inspectInput(changes);
  if (!inspectedChanges.ok) return inspectedChanges;
  return parseAndApplyChanges(validatedSnapshot.value, changes);
}

/**
 * Returns a detached, frozen valid candidate and net impact, or typed diagnostics with no
 * partial candidate. Neither input nor revision is changed. Replaying the same snapshot
 * and batch produces the same plan; applying a create to an already changed snapshot may
 * reject an existing ID. Input-read exceptions are translated here. Authoring owns
 * admission, revision increments, commit and crash recovery.
 */
export function planChanges(snapshot: unknown, changes: unknown): Result<ChangePlan> {
  try {
    const planned = validatePlanningInputs(snapshot, changes);
    return freeze(planned);
  } catch {
    return freeze(failure('shape', 'changes', 'Input could not be read as plain data'));
  }
}
