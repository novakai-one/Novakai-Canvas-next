import { requestId } from '../../contract/brands.js';
import type { WorkspaceId } from '../../contract/brands.js';
import type { Dependencies } from '../../contract/types.js';
import type { Snapshot, Receipt } from '../../contract/records/storage.js';
import type { HistoryStatus } from '../../contract/records/history.js';
import { navigationKey, historyStatus } from './navigation.js';
import { findRecord, versionOf } from '../records/keys.js';
import { readSnapshot, readReceipt } from '../validation/snapshot.js';
import { copyJson, storedLimits } from '../validation/plain-data.js';
import { accepted, reject } from '../validation/outcomes.js';
const migrationId = requestId.parse('history-adoption-v1');
/** Startup is the only writer of the baseline. Existing history and content are never rewritten. */
export async function initializeHistory(
  workspace: WorkspaceId,
  deps: Dependencies,
): Promise<HistoryStatus> {
  const receipt = accepted(await deps.receipts.find(workspace, migrationId));
  const snapshot = readSnapshot(accepted(await deps.snapshots.read(workspace)), workspace);
  const record = findRecord(snapshot, navigationKey);
  if (record !== null)
    return reopened(snapshot, accepted(await deps.receipts.find(workspace, migrationId)), deps);
  if (receipt !== null)
    reject('corrupt-record', 'history', 'Adoption receipt exists without navigation');
  return adopt(snapshot, deps);
}
function reopened(snapshot: Snapshot, receipt: Receipt | null, deps: Dependencies): HistoryStatus {
  if (receipt === null)
    reject('corrupt-record', 'history', 'Navigation exists without adoption receipt');
  readReceipt(receipt, migrationId);
  if (
    receipt.fingerprint !== accepted(deps.hash.digest(`history-adoption-v1:${snapshot.workspace}`))
  )
    reject('corrupt-record', 'history', 'Adoption receipt identity differs');
  const status = historyStatus(snapshot);
  checkAdoptionReceipt(receipt);
  return status;
}
function checkAdoptionReceipt(receipt: Receipt): void {
  if (!receipt.versions.some((item) => item.key.kind === 'history' && item.key.id === 'navigation'))
    reject('corrupt-record', 'history', 'Adoption receipt does not identify navigation');
}
/** Baseline CAS includes every existing record and a unique receipt; concurrent adoption is idempotent. */
async function adopt(snapshot: Snapshot, deps: Dependencies): Promise<HistoryStatus> {
  const frontier = snapshot.records
    .filter((item) => item.key.kind !== 'history')
    .map((item) => versionOf(snapshot, item.key));
  const fingerprint = accepted(deps.hash.digest(`history-adoption-v1:${snapshot.workspace}`));
  const outcome = {
    status: 'committed' as const,
    transaction: null,
    pins: null,
    diff: { kind: 'history-adoption' },
    warnings: [],
  };
  const commit = {
    workspace: snapshot.workspace,
    request: migrationId,
    fingerprint,
    expected: [
      ...snapshot.records.map((item) => versionOf(snapshot, item.key)),
      versionOf(snapshot, navigationKey),
    ],
    writes: [
      {
        kind: 'put' as const,
        key: navigationKey,
        resources: [],
        value: copyJson(
          {
            schemaVersion: 1,
            baselineSequence: snapshot.sequence,
            actions: [],
            cursor: 0,
            frontier,
          },
          storedLimits,
        ),
      },
    ],
    outcome,
  };
  await commitBaseline(commit, deps);
  return initializeHistory(snapshot.workspace, deps);
}
async function commitBaseline(
  commit: import('../../contract/ports/store.js').CommitRequest,
  deps: Dependencies,
): Promise<void> {
  try {
    accepted(await deps.commits.commit(commit));
  } catch (error) {
    await reconcileBaseline(commit, deps, error);
  }
}

async function reconcileBaseline(
  commit: import('../../contract/ports/store.js').CommitRequest,
  deps: Dependencies,
  error: unknown,
): Promise<void> {
  const receipt = accepted(await deps.receipts.find(commit.workspace, migrationId));
  if (receipt === null) throw error;
  if (receipt.fingerprint !== commit.fingerprint)
    reject('corrupt-record', 'history', 'Adoption request identity collision');
}
