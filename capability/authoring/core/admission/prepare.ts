import type { Digest } from '../../contract/brands.js';
import type { ReceiptReader } from '../../contract/ports/store.js';
import type { Request } from '../../contract/records/request.js';
import type { Receipt } from '../../contract/records/storage.js';
import type { PreparedCandidate } from '../../contract/records/proposal.js';
import type { AdmissionDependencies } from '../../contract/types.js';
import { fingerprint } from '../identity/canonical.js';
import { reconcile } from '../identity/receipts.js';
import { readSnapshot } from '../validation/snapshot.js';
import { accepted } from '../validation/outcomes.js';
import { checkRequest } from './dependencies.js';
import { buildCandidate, checkCancellation } from './pipeline.js';
import { releaseProtection } from './resources.js';
/** Receipt-first admission; Authoring reconciles every rejected attempt in case an identical caller committed meanwhile. */
export async function withCandidate<T>(
  request: Request,
  preview: boolean,
  deps: AdmissionDependencies,
  continueWith: (candidate: PreparedCandidate) => Promise<T>,
): Promise<T | Receipt> {
  const identity = fingerprint(request, deps.hash);
  const receipt = await reconcile(request, identity, deps.receipts);
  if (receipt !== null) return receipt;
  try {
    return await prepareUncommitted(request, identity, preview, deps, continueWith);
  } catch (error) {
    return reconcileRejected(request, identity, deps.receipts, error);
  }
}
/** No receipt/snapshot atomicity is assumed; a late durable receipt supersedes an obsolete rejection. */
async function reconcileRejected(
  request: Request,
  identity: Digest,
  receipts: ReceiptReader,
  error: unknown,
): Promise<Receipt> {
  const receipt = await reconcile(request, identity, receipts);
  if (receipt !== null) return receipt;
  throw error;
}
/** Lease lifetime encloses prepare/commit continuation; Authoring owns final reconciliation and draft retention. */
async function prepareUncommitted<T>(
  request: Request,
  identity: Digest,
  preview: boolean,
  deps: Omit<AdmissionDependencies, 'receipts'>,
  continueWith: (candidate: PreparedCandidate) => Promise<T>,
): Promise<T> {
  checkCancellation(request, deps.cancellation);
  const before = readSnapshot(
    accepted(await deps.snapshots.read(request.workspace)),
    request.workspace,
  );
  checkRequest(request, before);
  const lease = accepted(await deps.resources.acquire(request, before));
  try {
    return await continueWith(
      await buildCandidate(request, identity, before, lease, preview, deps),
    );
  } finally {
    await releaseProtection(lease);
  }
}
