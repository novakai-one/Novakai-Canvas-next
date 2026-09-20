import type { Collection } from '../../contract/records/collection.js';
import type { RecordChange } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { preserveSection } from './preservation.js';

/** Create appends; replacement retains the existing position in the ordered record list. */
function writeRecordList<T extends { readonly id: string }>(
  items: readonly T[],
  value: T,
  operation: RecordChange['op'],
): readonly T[] {
  if (operation === 'create') return [...items, value];
  return items.map((item) => replaceMatchingRecord(item, value));
}

/** Preserve unrelated record identities while copying only the changed list. */
function replaceMatchingRecord<T extends { readonly id: string }>(item: T, replacement: T): T {
  if (item.id !== replacement.id) return item;
  return replacement;
}

/** Namespace writers narrow the discriminated payload before constructing a collection. */
function writeObjects(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'objects') return collection;
  const objects = writeRecordList(collection.objects, change.value, change.op);
  return { ...collection, objects };
}

/** Relationship replacement changes semantics; section wire routing remains section-owned. */
function writeRelationships(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'relationships') return collection;
  const relationships = writeRecordList(collection.relationships, change.value, change.op);
  return { ...collection, relationships };
}

/** New sections have no prior overrides; existing sections inherit omitted geometry. */
function sectionReplacement(
  collection: Collection,
  change: Extract<RecordChange, { target: 'sections' }>,
): Collection['sections'][number] {
  const previous = collection.sections.find((section) => section.id === change.value.id);
  if (previous === undefined) return change.value;
  return preserveSection(change.value, previous);
}

/** Section writes preserve geometry before replacing the record at its existing position. */
function writeSections(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'sections') return collection;
  const replacement = sectionReplacement(collection, change);
  const sections = writeRecordList(collection.sections, replacement, change.op);
  return { ...collection, sections };
}

/** Asset metadata replacement performs no byte storage or fetch. */
function writeAssets(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'assets') return collection;
  const assets = writeRecordList(collection.assets, change.value, change.op);
  return { ...collection, assets };
}

/** Provenance replacement performs no source verification. */
function writeSources(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'sources') return collection;
  const sources = writeRecordList(collection.sources, change.value, change.op);
  return { ...collection, sources };
}

function writeDefinitions(collection: Collection, change: RecordChange): Collection {
  if (change.target !== 'definitions') return collection;
  const definitions = writeRecordList(collection.definitions, change.value, change.op);
  return { ...collection, definitions };
}

type RecordWriter = (collection: Collection, change: RecordChange) => Collection;
const recordWriters: Readonly<Record<RecordChange['target'], RecordWriter>> = {
  objects: writeObjects,
  relationships: writeRelationships,
  sections: writeSections,
  assets: writeAssets,
  sources: writeSources,
  definitions: writeDefinitions,
};

/** Replacement must resolve an existing ID; creation was checked at the entry point. */
function writeAfterIdentityCheck(
  collection: Collection,
  change: RecordChange,
  exists: boolean,
): Result<Collection> {
  if (change.op === 'replace' && !exists) {
    return failure(
      'not-found',
      `${change.target}.${change.value.id}`,
      'Replace requires existing ID',
    );
  }
  const writer = recordWriters[change.target];
  return success(writer(collection, change));
}

/**
 * Writes one complete record, rejecting duplicate creates and missing replacements.
 * Dispatch and payload share the same target, so namespace writers cannot be mismatched.
 * Pure replay against the same snapshot is safe; planChanges owns final validation and
 * Authoring owns commit/recovery. No partially written collection is exposed on failure.
 */
export function writeRecord(collection: Collection, change: RecordChange): Result<Collection> {
  const exists = collection[change.target].some((record) => record.id === change.value.id);
  if (change.op === 'create' && exists) {
    return failure(
      'already-exists',
      `${change.target}.${change.value.id}`,
      'Create requires absent ID',
    );
  }
  return writeAfterIdentityCheck(collection, change, exists);
}
