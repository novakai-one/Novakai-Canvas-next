import { snapshotSchema, receiptSchema } from '../../contract/records/storage.js';
import type { Snapshot, Receipt, StoredRecord } from '../../contract/records/storage.js';
import type { WorkspaceId, RequestId } from '../../contract/brands.js';
import { uniqueKeys } from '../records/versions.js';
import { readShape } from './input.js';
import { storedLimits } from './plain-data.js';
import { reject } from './outcomes.js';
/** Stored tombstones never retain a live payload or resources; history carries retained references. */
function checkTombstone(record: StoredRecord): void {
  if (!record.deleted) return;
  if (record.value !== null || record.resources.length > 0)
    reject('corrupt-record', 'records', 'Malformed tombstone');
}
/** Owner output cannot switch workspaces or smuggle duplicate record identities. */
export function readSnapshot(input: unknown, workspace: WorkspaceId): Snapshot {
  const snapshot = readShape(snapshotSchema, input, 'corrupt-record', storedLimits);
  if (snapshot.workspace !== workspace)
    reject('corrupt-record', 'workspace', 'Snapshot belongs to a different workspace');
  uniqueKeys(
    snapshot.records.map((record) => record.key),
    'records',
  );
  snapshot.records.forEach(checkTombstone);
  snapshot.records.forEach(checkPayloadRevision);
  return snapshot;
}
/** Successful receipts are validated before exposing a recovered outcome to any caller. */
export function readReceipt(input: unknown, request: RequestId): Receipt {
  const receipt = readShape(receiptSchema, input, 'corrupt-record', storedLimits);
  if (receipt.request !== request)
    reject('corrupt-record', 'request', 'Receipt belongs to a different request');
  uniqueKeys(
    receipt.versions.map((read) => read.key),
    'receipt.versions',
  );
  return receipt;
}

/** Live versioned documents must agree with their authoritative slot, including reads before planning. */
function checkPayloadRevision(record: StoredRecord): void {
  if (record.deleted) return;
  if (!['collection', 'catalog'].includes(record.key.kind)) return;
  checkDocumentHeader(record);
}
/** Provider shape validation alone cannot prove slot/payload identity and revision agreement. */
function checkDocumentHeader(record: StoredRecord): void {
  const data = record.value;
  if (data === null || typeof data !== 'object')
    reject('corrupt-record', 'records', 'Versioned payload is not an object');
  const fields = Object.fromEntries(Object.entries(data));
  if (fields.id !== record.key.id || fields.revision !== record.version)
    reject('corrupt-record', 'records', 'Versioned payload header differs from its slot');
}
