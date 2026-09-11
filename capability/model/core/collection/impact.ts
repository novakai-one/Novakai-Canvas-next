import type { Collection } from '../../contract/records/collection.js';
import type { Impact, Target } from '../../contract/types.js';

type CollectionMetadata = Omit<Collection, Target>;

/** Inputs are detached JSON data; comparison intentionally includes array order and explicit overrides. */
function hasChanged(before: unknown, after: unknown): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

/** Report additions, removals, then updates within one record namespace. */
function describeRecordImpact(
  before: Collection,
  after: Collection,
  target: Target,
): readonly Impact[] {
  const previousRecords = before[target];
  const nextRecords = after[target];
  const added = nextRecords.filter(
    (record) => !previousRecords.some((previous) => previous.id === record.id),
  );
  const removed = previousRecords.filter(
    (record) => !nextRecords.some((next) => next.id === record.id),
  );
  const updated = nextRecords.filter((record) => {
    const previous = previousRecords.find((candidate) => candidate.id === record.id);
    return previous !== undefined && hasChanged(previous, record);
  });
  const additions = added.map((record): Impact => ({ target, id: record.id, action: 'added' }));
  const removals = removed.map((record): Impact => ({ target, id: record.id, action: 'removed' }));
  const updates = updated.map((record): Impact => ({ target, id: record.id, action: 'updated' }));
  return [...additions, ...removals, ...updates];
}

/** Child records have their own impact entries; this comparison covers only collection metadata. */
function collectionMetadata(collection: Collection): CollectionMetadata {
  const { objects, relationships, sections, assets, sources, ...metadata } = collection;
  void objects;
  void relationships;
  void sections;
  void assets;
  void sources;
  return metadata;
}

/**
 * Describes net changes between validated snapshots, not the intermediate operation log.
 * Pure and repeatable; planChanges returns this report and Authoring owns commit/recovery.
 */
export function describeImpact(before: Collection, after: Collection): readonly Impact[] {
  const targets: readonly Target[] = ['objects', 'relationships', 'sections', 'assets', 'sources'];
  const records = targets.flatMap((target) => describeRecordImpact(before, after, target));
  const metadataChanged = hasChanged(collectionMetadata(before), collectionMetadata(after));
  if (!metadataChanged) return records;
  return [...records, { target: 'collection', id: after.id, action: 'updated' }];
}
