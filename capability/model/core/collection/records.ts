import type { Collection } from '../../contract/records/collection.js';
import type { RecordChange } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { preserveSection } from './preservation.js';
function records<T extends { readonly id: string }>(
  items: readonly T[],
  value: T,
  mode: 'create' | 'replace',
): readonly T[] {
  if (mode === 'create') return [...items, value];
  return items.map((item) => (item.id === value.id ? value : item));
}
function objects(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'objects') return collection;
  return { ...collection, objects: records(collection.objects, change.value, change.op) };
}
function relationships(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'relationships') return collection;
  return {
    ...collection,
    relationships: records(collection.relationships, change.value, change.op),
  };
}
function sections(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'sections') return collection;
  const value = preserveSection(
    change.value,
    collection.sections.find((section) => section.id === change.value.id),
  );
  return { ...collection, sections: records(collection.sections, value, change.op) };
}
function assets(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'assets') return collection;
  return { ...collection, assets: records(collection.assets, change.value, change.op) };
}
function sources(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'sources') return collection;
  return { ...collection, sources: records(collection.sources, change.value, change.op) };
}
const writers = { objects, relationships, sections, assets, sources };
export function writeRecord(collection: Collection, change: RecordChange): Result<Collection> {
  const exists = collection[change.target].some((record) => record.id === change.value.id);
  if (change.op === 'create' && exists)
    return failure(
      'already-exists',
      `${change.target}.${change.value.id}`,
      'Create requires absent ID',
    );
  return replaceExisting(collection, change, exists);
}
function replaceExisting(
  collection: Collection,
  change: RecordChange,
  exists: boolean,
): Result<Collection> {
  if (change.op === 'replace' && !exists)
    return failure(
      'not-found',
      `${change.target}.${change.value.id}`,
      'Replace requires existing ID',
    );
  return success(writers[change.target](collection, change));
}
