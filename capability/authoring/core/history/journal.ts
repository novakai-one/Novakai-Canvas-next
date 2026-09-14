import { transactionSchema, headSchema } from '../../contract/records/history.js';
import type { Request } from '../../contract/records/request.js';
import type { PreparedCandidate } from '../../contract/records/proposal.js';
import type {
  Write,
  ReadVersion,
  CommitOutcome,
  StoredRecord,
  RecordKey,
} from '../../contract/records/storage.js';
import type { Clock } from '../../contract/ports/runtime.js';
import { timestamp } from '../../contract/brands.js';
import type { Digest } from '../../contract/brands.js';
import { findRecord, versionOf } from '../records/keys.js';
import { transactionKey, headKey } from './read.js';
import { checkDependencies } from '../admission/dependencies.js';
import { readShape } from '../validation/input.js';
import { copyJson, storedLimits } from '../validation/plain-data.js';
import { accepted, reject } from '../validation/outcomes.js';
export interface Journal {
  readonly writes: readonly Write[];
  readonly expected: readonly ReadVersion[];
  readonly outcome: CommitOutcome;
}
/** No-op has a receipt but no transaction, timestamp allocation or history revision. */
function outcome(request: Request, candidate: PreparedCandidate): CommitOutcome {
  const prepared = candidate.preparation;
  if (prepared.changes.length === 0)
    return {
      status: 'no-op',
      transaction: null,
      pins: prepared.pins,
      diff: prepared.diff,
      warnings: prepared.warnings,
    };
  return {
    status: 'committed',
    transaction: request.request,
    pins: prepared.pins,
    diff: prepared.diff,
    warnings: prepared.warnings,
  };
}
/** Every changed participant must have its exact stamped result in the validated snapshot. */
function transition(candidate: PreparedCandidate, write: Write): unknown {
  const after = findRecord(candidate.after, write.key);
  if (after === null)
    reject('corrupt-record', 'candidate', 'Changed participant is missing from the candidate');
  return { key: write.key, before: findRecord(candidate.before, write.key), after };
}
/** One immutable journal entry and original-transaction head are written with content and receipt. */
function historyWrites(
  request: Request,
  candidate: PreparedCandidate,
  clock: Clock,
): readonly Write[] {
  const target = request.intent.kind === 'change' ? null : request.intent.transaction;
  const original = target ?? request.request;
  const entry = readShape(
    transactionSchema,
    {
      kind: 'transaction',
      id: request.request,
      actor: request.actor,
      timestamp: readShape(timestamp, accepted(clock.now())),
      mode: request.intent.kind,
      target,
      transitions: candidate.preparation.changes.map((write) => transition(candidate, write)),
    },
    'corrupt-record',
    storedLimits,
  );
  const resources = [
    ...new Set(
      entry.transitions.flatMap((item) => [
        ...retainedResources(item.before),
        ...item.after.resources,
      ]),
    ),
  ];
  const head = readShape(headSchema, {
    kind: 'head',
    original,
    state: request.intent.kind === 'undo' ? 'undone' : 'active',
    participants: entry.transitions.map((item) => versionOf(candidate.after, item.key)),
    last: request.request,
  });
  return [
    {
      kind: 'put',
      key: transactionKey(request.request),
      value: copyJson(entry, storedLimits),
      resources,
    },
    { kind: 'put', key: headKey(original), value: copyJson(head), resources: [] },
  ];
}
/** Deleted/previously absent data contributes no resource list; retained before-images do. */
function retainedResources(record: StoredRecord | null): readonly Digest[] {
  if (record === null) return [];
  return record.resources;
}
/** Generated transaction keys must be absent; a prior receipt is the only lawful request reuse. */
function checkJournalIdentity(request: Request, candidate: PreparedCandidate): void {
  requireAbsent(candidate, transactionKey(request.request));
  if (request.intent.kind !== 'change') return;
  requireAbsent(candidate, headKey(request.request));
}
/** Build atomic history only after candidate admission; Authoring owns receipt/inverse recovery. */
export function createJournal(
  request: Request,
  candidate: PreparedCandidate,
  clock: Clock,
): Journal {
  const prepared = candidate.preparation;
  const result = outcome(request, candidate);
  if (prepared.changes.length === 0)
    return { writes: [], expected: prepared.reads, outcome: result };
  checkJournalIdentity(request, candidate);
  const history = historyWrites(request, candidate, clock);
  const reads = history.map((write) => versionOf(candidate.before, write.key));
  return {
    writes: [...prepared.changes, ...history],
    expected: checkDependencies(candidate.before, [prepared.reads, reads]),
    outcome: result,
  };
}

/** Reject a generated-key collision before attempting the atomic transaction. */
function requireAbsent(candidate: PreparedCandidate, key: RecordKey): void {
  if (findRecord(candidate.before, key) !== null)
    reject(
      'corrupt-record',
      'history',
      'Generated history already exists without a reconciled receipt',
    );
}
