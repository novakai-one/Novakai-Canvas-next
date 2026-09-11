import type { Request } from '../../contract/records/request.js';
import type { Receipt } from '../../contract/records/storage.js';
import type { CommitRequest, Committer, ReceiptReader } from '../../contract/ports/store.js';
import { readReceipt } from '../validation/snapshot.js';
import { reconcile } from '../identity/receipts.js';
import { accepted, reject } from '../validation/outcomes.js';
/** Validate successful provider identity before returning an authoritative outcome. */
function checkCommitted(request: Request, input: unknown, commit: CommitRequest): Receipt {
  const receipt = readReceipt(input, request.request);
  if (receipt.fingerprint !== commit.fingerprint)
    reject('corrupt-record', 'receipt', 'Commit returned a different request fingerprint');
  return receipt;
}
/** A returned error or thrown acknowledgement still reconciles the request after physical settlement. */
export async function commitAndReconcile(
  request: Request,
  commit: CommitRequest,
  commits: Committer,
  receipts: ReceiptReader,
): Promise<Receipt> {
  try {
    return checkCommitted(request, accepted(await commits.commit(commit)), commit);
  } catch (error) {
    return recoverTerminalCommit(request, commit, receipts, error);
  }
}

/** After physical settlement, durable receipt wins over an acknowledgement failure; Authoring retains retry ownership. */
async function recoverTerminalCommit(
  request: Request,
  commit: CommitRequest,
  receipts: ReceiptReader,
  error: unknown,
): Promise<Receipt> {
  const receipt = await reconcile(request, commit.fingerprint, receipts);
  if (receipt !== null) return receipt;
  throw error;
}
