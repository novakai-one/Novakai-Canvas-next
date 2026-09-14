import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { Receipt, WorkspaceState } from '../../contract/records/storage.js';
import type { CommitRequest } from '../../contract/records/transaction.js';
import { success } from '../validation/outcomes.js';
/** Match identity before stale-version checks so a successful retry returns its original outcome. */
export function reconcileReceipt(
  state: WorkspaceState,
  request: CommitRequest,
): Result<Receipt | null> {
  const receipt = state.receipts.find((stored) => stored.request === request.request);
  if (!receipt) return success(null);
  if (receipt.fingerprint !== request.fingerprint)
    return fail(
      'request-reused',
      'request',
      'Request ID already belongs to different submitted intent',
    );
  return success(receipt);
}
