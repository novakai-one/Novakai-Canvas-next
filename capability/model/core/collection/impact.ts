import type { Collection } from '../../contract/records/collection.js';
import type { Impact, Target } from '../../contract/types.js';
function changed(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) !== JSON.stringify(right);
}
function recordImpact(before: Collection, after: Collection, target: Target): readonly Impact[] {
  const previous = before[target];
  const next = after[target];
  return [
    ...next
      .filter((record) => !previous.some((old) => old.id === record.id))
      .map((record): Impact => ({ target, id: record.id, action: 'added' })),
    ...previous
      .filter((record) => !next.some((item) => item.id === record.id))
      .map((record): Impact => ({ target, id: record.id, action: 'removed' })),
    ...next
      .filter((record) => previous.some((old) => old.id === record.id && changed(old, record)))
      .map((record): Impact => ({ target, id: record.id, action: 'updated' })),
  ];
}
function metadata(collection: Collection) {
  const { objects, relationships, sections, assets, sources, ...rest } = collection;
  void objects;
  void relationships;
  void sections;
  void assets;
  void sources;
  return rest;
}
export function describeImpact(before: Collection, after: Collection): readonly Impact[] {
  const targets: readonly Target[] = ['objects', 'relationships', 'sections', 'assets', 'sources'];
  const records = targets.flatMap((target) => recordImpact(before, after, target));
  if (!changed(metadata(before), metadata(after))) return records;
  return [...records, { target: 'collection', id: after.id, action: 'updated' }];
}
