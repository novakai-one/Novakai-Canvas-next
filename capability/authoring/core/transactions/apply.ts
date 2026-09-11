import type { Request, ApplyOptions } from '../../contract/records/request.js';
import type { PreparedCandidate } from '../../contract/records/proposal.js';
import type { Receipt } from '../../contract/records/storage.js';
import type { Committer, ReceiptReader } from '../../contract/ports/store.js';
import type { Clock, Cancellation, Notifications } from '../../contract/ports/runtime.js';
import { createJournal } from '../history/journal.js';
import { checkCancellation } from '../admission/pipeline.js';
import { commitAndReconcile } from './commit.js';
import { notifyCommitted } from './notifications.js';
import { reject } from '../validation/outcomes.js';
export interface CommitDependencies {
  readonly commits: Committer;
  readonly receipts: ReceiptReader;
  readonly clock: Clock;
  readonly cancellation: Cancellation;
  readonly notifications: Notifications;
}
/** Hash comparison supplements original client preconditions; it never trusts submitted prepared writes. */
function checkPreparation(candidate: PreparedCandidate, options: ApplyOptions): void {
  if (options.candidateHash === undefined) return;
  if (options.candidateHash !== candidate.preparation.candidateHash)
    reject('revision-conflict', 'candidateHash', 'Prepared candidate or its dependencies changed');
}
/** Single atomic admission result; resources remain held by the enclosing pipeline through reconciliation. */
export async function applyCandidate(
  request: Request,
  candidate: PreparedCandidate,
  options: ApplyOptions,
  deps: CommitDependencies,
): Promise<Receipt> {
  checkPreparation(candidate, options);
  const journal = createJournal(request, candidate, deps.clock);
  checkCancellation(request, deps.cancellation);
  const commit = {
    workspace: request.workspace,
    request: request.request,
    fingerprint: candidate.preparation.fingerprint,
    ...journal,
  };
  const receipt = await commitAndReconcile(request, commit, deps.commits, deps.receipts);
  await notifyCommitted(request, receipt, deps.notifications);
  return receipt;
}
