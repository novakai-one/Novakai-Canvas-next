import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import type { Decision } from '../../contract/ports/store.js';
import type { Receipt, WorkspaceState } from '../../contract/records/storage.js';
import type { CommitRequest } from '../../contract/records/transaction.js';
import { protect, success } from '../validation/outcomes.js';
import { validateState } from '../validation/state.js';
import { keyText } from './keys.js';
import { reconcileReceipt } from './receipts.js';
import { RECEIPT_LIMIT } from './limits.js';
import { compareVersions, checkWrites, writeSlot } from './versions.js';
/** Ordered transaction gates operate only on parsed data; new independent gates join this list. */
const commitGates: readonly ((state: WorkspaceState, request: CommitRequest) => Result<void>)[] = [
  (state, request) => compareVersions(state, request.expected),
  (state, request) => checkWrites(state, request.writes),
  (state) =>
    state.sequence === Number.MAX_SAFE_INTEGER
      ? fail('invalid-input', 'sequence', 'Workspace sequence exhausted')
      : success(undefined),
];
/** Construct all writes and receipt together; failed final validation yields no installed candidate. */
function createCommit(state: WorkspaceState, request: CommitRequest): Result<Decision<Receipt>> {
  const kept = request.writes.filter((write) => write.kind !== 'purge');
  const replacements = kept.map((write) => writeSlot(state, write));
  const removed = new Set(request.writes.map((write) => keyText(write.key)));
  const retained = state.slots.filter((slot) => !removed.has(keyText(slot.key)));
  const purged = request.writes.filter((write) => write.kind === 'purge');
  const receipt: Receipt = {
    request: request.request,
    fingerprint: request.fingerprint,
    sequence: state.sequence + 1,
    versions: [
      ...replacements.map((slot) => ({ key: slot.key, version: slot.version })),
      ...purged.map((write) => ({ key: write.key, version: 'absent' as const })),
    ],
    outcome: request.outcome,
  };
  const candidate = {
    ...state,
    sequence: receipt.sequence,
    slots: [...retained, ...replacements],
    receipts: [...state.receipts, receipt].slice(-RECEIPT_LIMIT),
  };
  const validated = protect(() => validateState(candidate), 'invalid-input');
  if (!validated.ok) return validated;
  return success({ state: validated.value, value: receipt });
}
/** Precondition failures never expose a partial plan or allocate a receipt. */
function admitCommit(state: WorkspaceState, request: CommitRequest): Result<Decision<Receipt>> {
  const failure = commitGates.map((gate) => gate(state, request)).find((result) => !result.ok);
  if (failure && !failure.ok) return failure;
  return createCommit(state, request);
}
/** Pure receipt-first decision. SQLite owns atomic install; Authoring owns retry reconciliation. */
export function planCommit(
  state: WorkspaceState,
  request: CommitRequest,
): Result<Decision<Receipt>> {
  const reconciled = reconcileReceipt(state, request);
  if (!reconciled.ok) return reconciled;
  if (reconciled.value) return success({ state, value: reconciled.value });
  return admitCommit(state, request);
}
