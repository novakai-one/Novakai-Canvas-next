import type {
  RecordKey,
  Snapshot,
  StoredRecord,
  ReadVersion,
} from '../../contract/records/storage.js';
/** Kind is part of identity; delimiter cannot collide with the checked kind namespace. */
export function keyText(key: RecordKey): string {
  return `${key.kind}/${key.id}`;
}
/** Missing is explicit null; tombstoned identities remain readable as retained version tokens. */
export function findRecord(snapshot: Snapshot, key: RecordKey): StoredRecord | null {
  return snapshot.records.find((record) => keyText(record.key) === keyText(key)) ?? null;
}
/** Absence means never observed in storage, not a tombstone or falsy revision zero. */
export function versionOf(snapshot: Snapshot, key: RecordKey): ReadVersion {
  const record = findRecord(snapshot, key);
  if (record === null) return { key, version: 'absent' };
  return { key, version: record.version };
}
