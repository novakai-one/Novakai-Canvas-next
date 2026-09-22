import { requestId } from './brands.js';
import { fail } from './errors.js';
import type { Result } from './errors.js';
import type { Persistence } from './types.js';
import type { Decision, StorePort } from './ports/store.js';
import type { WorkspaceId } from './brands.js';
import type { WorkspaceState, Receipt } from './records/storage.js';
import { validateState, isAdmitted } from '../core/validation/state.js';
import { validateRequest } from '../core/validation/request.js';
import { freeze, parse, protect, protectAsync, success } from '../core/validation/outcomes.js';
import { planCommit } from '../core/transaction/commit.js';
import { createBackup } from '../core/recovery/backup.js';
import { restoreBackup } from '../core/recovery/restore.js';
/** Every operation validates loaded state and its workspace before invoking domain-neutral storage policy. */
function readValidated<T>(
  store: StorePort,
  workspace: WorkspaceId,
  decide: (state: WorkspaceState) => Result<Decision<T>>,
): Result<T> {
  return store.transact((raw) => validateAndDecide(raw, workspace, decide));
}
/** The store hands back the same parsed object while the stored text is unchanged; validate it once. */
const validated = new WeakMap<object, Result<WorkspaceState>>();
function validatedOnce(raw: unknown): Result<WorkspaceState> {
  if (raw === null || typeof raw !== 'object') return validateState(raw);
  if (isAdmitted(raw)) return success(raw);
  const known = validated.get(raw);
  if (known !== undefined) return known;
  const checked = freeze(validateState(raw));
  if (checked.ok) validated.set(raw, checked);
  return checked;
}
/** A database location cannot silently change logical workspace on reopen or malformed writes. */
function validateAndDecide<T>(
  raw: unknown,
  workspace: WorkspaceId,
  decide: (state: WorkspaceState) => Result<Decision<T>>,
): Result<Decision<T>> {
  const checked = validatedOnce(raw);
  if (!checked.ok) return checked;
  if (checked.value.workspace !== workspace)
    return fail('invalid-input', 'workspace', 'Database belongs to another workspace');
  return decide(checked.value);
}
/** Unknown request shape is rejected before any write; receipt-first semantics apply to valid envelopes. */
function commitInput(store: StorePort, workspace: WorkspaceId, input: unknown): Result<Receipt> {
  const request = validateRequest(input);
  if (!request.ok) return request;
  if (request.value.workspace !== workspace)
    return fail('invalid-input', 'workspace', 'Request belongs to another workspace');
  return readValidated(store, workspace, (state) => planCommit(state, request.value));
}
/** Receipt absence is explicit null; retry the original persisted request envelope to reconcile uncertainty. */
function findReceipt(
  store: StorePort,
  workspace: WorkspaceId,
  input: unknown,
): Result<Receipt | null> {
  const checked = parse(requestId, input, 'invalid-input');
  if (!checked.ok) return checked;
  return readValidated(store, workspace, (state) =>
    success({
      state,
      value: state.receipts.find((receipt) => receipt.request === checked.value) ?? null,
    }),
  );
}
/**
 * Bind trusted storage once. Authoring owns mutations/reconciliation; maintenance host owns restore activation.
 * Returned methods preserve typed failures and detach/freeze data; no StorePort escapes the facade.
 */
export function createPersistence(store: StorePort, workspace: WorkspaceId): Persistence {
  /** Read one consistent state; adapter owns rollback, Authoring owns reconciliation. */
  const readSnapshot = (): Result<WorkspaceState> =>
    protect(
      () => readValidated(store, workspace, (state) => success({ state, value: state })),
      'storage-unavailable',
    );
  return Object.freeze({
    readSnapshot,
    commit: (input: unknown) => protect(() => commitInput(store, workspace, input)),
    receipt: (input: unknown) => protect(() => findReceipt(store, workspace, input)),
    backup: (resources) =>
      protectAsync(async () => {
        const snapshot = readSnapshot();
        if (!snapshot.ok) return snapshot;
        return createBackup(snapshot.value, resources);
      }),
    restore: (input, resources, validateDomain) =>
      protectAsync(() => restoreBackup(input, resources, validateDomain, store)),
    close: () => protect(() => store.close(), 'storage-unavailable'),
  } satisfies Persistence);
}
