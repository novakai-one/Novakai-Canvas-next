import type {
  Snapshot,
  Write,
  StoredRecord,
  Json,
  RecordKey,
} from '../../contract/records/storage.js';
import { findRecord, keyText } from './keys.js';
import { canonical } from '../identity/canonical.js';
import { reject } from '../validation/outcomes.js';
/** Collection/catalog revision fields track storage slots; other record schemas remain owner-defined. */
function hasPayloadRevision(key: RecordKey): boolean {
  return ['collection', 'catalog'].includes(key.kind);
}
/** Check record-shaped domain payloads without making arbitrary JSON paths a mutation interface. */
function recordFields(value: Json): Readonly<Record<string, Json>> {
  if (value === null || typeof value !== 'object')
    reject('invalid-input', 'value', 'Versioned documents require object payloads');
  if (Array.isArray(value))
    reject('invalid-input', 'value', 'Versioned documents cannot be arrays');
  return Object.fromEntries(Object.entries(value));
}
/** Stamp authoritative revision and check identity; submitted revisions never become write preconditions. */
function stampValue(key: RecordKey, value: Json, version: number): Json {
  if (!hasPayloadRevision(key)) return value;
  const fields = recordFields(value);
  if (fields.id !== key.id)
    reject('invariant-violation', keyText(key), 'Document identity differs from its storage key');
  return { ...fields, revision: version };
}
/** Stable resources are a set; spelling/order cannot manufacture spurious revisions. */
function normalizePut(write: Extract<Write, { kind: 'put' }>, version: number): Write {
  return {
    ...write,
    value: stampValue(write.key, write.value, version),
    resources: [...new Set(write.resources)].toSorted(),
  };
}
/** Compare equal live content at its current revision before incrementing anything. */
function unchangedPut(
  previous: StoredRecord | null,
  write: Extract<Write, { kind: 'put' }>,
): boolean {
  if (previous === null || previous.deleted) return false;
  const normalized = normalizePut(write, previous.version);
  const current = {
    kind: 'put',
    key: previous.key,
    value: previous.value,
    resources: [...previous.resources].toSorted(),
  };
  return canonical(normalized) === canonical(current);
}
/** No-op deletions retain absent/tombstone tokens; only live deletion reaches physical persistence. */
function unchanged(previous: StoredRecord | null, write: Write): boolean {
  if (write.kind === 'put') return unchangedPut(previous, write);
  if (previous === null) return true;
  return previous.deleted;
}
/** Never wrap an exhausted version or conflate zero with absence. */
function nextVersion(previous: StoredRecord | null): number {
  if (previous === null) return 0;
  if (previous.version === Number.MAX_SAFE_INTEGER)
    reject('invalid-input', 'version', 'Record revision exhausted');
  return previous.version + 1;
}
/** One net write creates exactly one next version; Authoring owns atomic commit/retry recovery. */
export function netWrite(snapshot: Snapshot, write: Write): readonly Write[] {
  const previous = findRecord(snapshot, write.key);
  if (unchanged(previous, write)) return [];
  const version = nextVersion(previous);
  if (write.kind === 'delete') return [write];
  return [normalizePut(write, version)];
}
/** Materialize the exact storage result for validation/history; no persistence is performed here. */
export function nextRecord(snapshot: Snapshot, write: Write): StoredRecord {
  const version = nextVersion(findRecord(snapshot, write.key));
  if (write.kind === 'delete')
    return { key: write.key, version, value: null, deleted: true, resources: [] };
  return {
    key: write.key,
    version,
    value: write.value,
    deleted: false,
    resources: write.resources,
  };
}
/** Immutable replacement preserves unrelated slots and tombstones without consulting global sequence. */
export function installWrites(snapshot: Snapshot, writes: readonly Write[]): Snapshot {
  const replaced = new Set(writes.map((write) => keyText(write.key)));
  const retained = snapshot.records.filter((record) => !replaced.has(keyText(record.key)));
  return {
    ...snapshot,
    records: [...retained, ...writes.map((write) => nextRecord(snapshot, write))],
  };
}
