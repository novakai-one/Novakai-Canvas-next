import type { Request } from '../../contract/records/request.js';
import type { Digest } from '../../contract/brands.js';
import type { Receipt } from '../../contract/records/storage.js';
import type { ReceiptReader } from '../../contract/ports/store.js';
import { readReceipt } from '../validation/snapshot.js';
import { accepted, reject } from '../validation/outcomes.js';
/** Receipt-first lookup does not touch snapshot, assets or aliases; Authoring owns retry reconciliation. */
export async function reconcile(
  request: Request,
  fingerprint: Digest,
  reader: ReceiptReader,
): Promise<Receipt | null> {
  const raw = accepted(await reader.find(request.workspace, request.request));
  if (raw === null) return null;
  const receipt = readReceipt(raw, request.request);
  if (receipt.fingerprint !== fingerprint)
    reject('request-reused', 'request', 'Request ID already belongs to different submitted intent');
  return receipt;
}
