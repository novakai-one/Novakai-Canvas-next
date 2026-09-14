import type { Submission } from '../../contract/records/submission.js';
import type { Request } from '../../contract/records/owners.js';

/** One in-flight request per collection prevents overlapping browser edits; different collections remain independent. */
export function blocksSubmission(pending: readonly Submission[], request: Request): boolean {
  return pending
    .filter((item) => item.state !== 'rejected')
    .some((item) => sameCollection(item.request, request));
}
/** Non-collection operations conflict only with an identical key in their declared write scopes. */
function sameCollection(left: Request, right: Request): boolean {
  if (left.workspace !== right.workspace) return false;
  return left.scope.some((key) =>
    right.scope.some((other) => key.kind === other.kind && key.id === other.id),
  );
}
/** Replace a status by immutable identity; this never changes request contents or captured versions. */
export function submissionStatus(
  pending: readonly Submission[],
  id: string,
  state: Submission['state'],
): readonly Submission[] {
  return pending.map((item) => (item.request.request === id ? { ...item, state } : item));
}

/** These owner refusals occur before commit. Infrastructure/cancellation responses require receipt reconciliation. */
export function refused(code: string): boolean {
  return [
    'invalid-input',
    'unsupported-version',
    'unknown-reference',
    'invariant-violation',
    'constraint-conflict',
    'revision-conflict',
    'missing-asset',
    'permission-denied',
  ].includes(code);
}
