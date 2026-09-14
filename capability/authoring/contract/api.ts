import { workspaceId, requestId } from './brands.js';
import type { Request } from './records/request.js';
import type { Authoring, Dependencies } from './types.js';
import type { Result } from './errors.js';
import type { Snapshot, Receipt } from './records/storage.js';
import type { Preparation } from './records/proposal.js';
import { readShape, readRequest, readOptions } from '../core/validation/input.js';
import { readSnapshot, readReceipt } from '../core/validation/snapshot.js';
import { accepted, protect, reject } from '../core/validation/outcomes.js';
import { validateRegistry } from '../core/admission/registry.js';
import { withCandidate } from '../core/admission/prepare.js';
import { applyCandidate } from '../core/transactions/apply.js';
/** Assert an explicit convenience method without inventing a second request fingerprint/envelope. */
function requireKind(request: Request, kind: Request['intent']['kind'] | null): void {
  if (kind === null) return;
  if (request.intent.kind !== kind)
    reject('invalid-input', 'intent', 'Intent does not match the selected authoring operation');
}
/**
 * Bind admission roles without I/O. Invalid planner registration is captured now and returned by each
 * operation as a typed failure. Authoring owns receipt reconciliation, atomic admission and inverse recovery;
 * caller owns transport authentication, durable outbox and recoverable drafts.
 */
export function createAuthoring(deps: Dependencies): Authoring {
  const registration = validateRegistry(deps.planners);
  /** Read one checked consistent workspace without changing sequence or domain records. */
  function read(workspace: unknown): Promise<Result<Snapshot>> {
    return protect(async () => {
      accepted(registration);
      const id = readShape(workspaceId, workspace);
      return readSnapshot(accepted(await deps.snapshots.read(id)), id);
    }, 'authoring-read');
  }
  /** Recover without source files, aliases or a live draft; Authoring owns retry decisions. */
  function receipt(workspace: unknown, request: unknown): Promise<Result<Receipt | null>> {
    return protect(async () => {
      accepted(registration);
      const id = readShape(workspaceId, workspace);
      const transaction = readShape(requestId, request);
      const raw = accepted(await deps.receipts.find(id, transaction));
      if (raw === null) return null;
      return readReceipt(raw, transaction);
    }, 'authoring-receipt');
  }
  /** Preview reserves no revision; successful retry returns its original receipt before resource resolution. */
  function prepare(input: unknown, preview = false): Promise<Result<Preparation | Receipt>> {
    return protect(async () => {
      accepted(registration);
      const request = readRequest(input);
      if (typeof preview !== 'boolean')
        reject('invalid-input', 'preview', 'Preview flag must be boolean');
      return withCandidate(request, preview, deps, async (candidate) => candidate.preparation);
    }, 'authoring-prepare');
  }
  /** All mutation methods share immutable decoding, receipt-first admission and one atomic commit continuation. */
  function submit(
    input: unknown,
    options: unknown,
    kind: Request['intent']['kind'] | null,
  ): Promise<Result<Receipt>> {
    return protect(async () => {
      accepted(registration);
      const request = readRequest(input);
      const checked = readOptions(options);
      requireKind(request, kind);
      return withCandidate(request, false, deps, (candidate) =>
        applyCandidate(request, candidate, checked, deps),
      );
    }, 'authoring-apply');
  }
  /** Apply semantic intent; Authoring reconciles uncertain acknowledgement before releasing resources. */
  function apply(input: unknown, options: unknown = {}): Promise<Result<Receipt>> {
    return submit(input, options, null);
  }
  /** Undo an original transaction by new validated writes; never rewind storage or alter request identity. */
  function undo(input: unknown, options: unknown = {}): Promise<Result<Receipt>> {
    return submit(input, options, 'undo');
  }
  /** Redo against post-undo participant versions; divergent edits require a new deliberate request. */
  function redo(input: unknown, options: unknown = {}): Promise<Result<Receipt>> {
    return submit(input, options, 'redo');
  }
  return Object.freeze({ read, receipt, prepare, apply, undo, redo });
}
