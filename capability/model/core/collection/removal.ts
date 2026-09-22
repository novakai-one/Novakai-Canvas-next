import type { ObjectId } from '../../contract/brands.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Change } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { cascadeContent } from './cascade-content.js';
import { cascadeSection } from './cascade-views.js';
import { cascadeChanges } from './cascade-changes.js';

type ObjectDeletion = Extract<Change, { op: 'delete-object' }>;
type RecordRemoval = Extract<Change, { op: 'remove' }>;

/** Compute the full cascade before deciding whether deletion needs explicit consent. */
function cascadeObjectDeletion(collection: Collection, removedId: ObjectId): Collection {
  const incidentRelationships = collection.relationships.filter(
    (relationship) =>
      relationship.source.object === removedId || relationship.target.object === removedId,
  );
  const removedRelationshipIds = incidentRelationships.map((relationship) => relationship.id);
  const survivingObjects = collection.objects.filter((object) => object.id !== removedId);
  const objects = survivingObjects.map((object) => cascadeContent(object, removedId));
  const relationships = collection.relationships.filter(
    (relationship) => !removedRelationshipIds.includes(relationship.id),
  );
  const sections = collection.sections.map((section) =>
    cascadeSection(section, removedId, removedRelationshipIds),
  );
  const cascaded = { ...collection, objects, relationships, sections };
  return { ...cascaded, changes: cascadeChanges(cascaded) };
}

/** Any difference beyond removing the object itself constitutes a dependency cleanup. */
function planObjectDeletion(collection: Collection, change: ObjectDeletion): Result<Collection> {
  const cascaded = cascadeObjectDeletion(collection, change.id);
  const objectOnly = {
    ...collection,
    objects: collection.objects.filter((object) => object.id !== change.id),
  };
  const requiresCascade = JSON.stringify(cascaded) !== JSON.stringify(objectOnly);
  if (!change.cascade && requiresCascade) {
    return failure(
      'delete-referenced',
      `objects.${change.id}`,
      'Explicit cascade required for referenced object',
    );
  }
  return success(cascaded);
}

/**
 * Deletes a canonical object; removing dependent content requires cascade=true.
 * Returns not-found or delete-referenced without exposing a partial result. Pure replay
 * against the same snapshot is safe. Authoring owns admission and commit/recovery.
 */
export function deleteObject(collection: Collection, change: ObjectDeletion): Result<Collection> {
  const objectExists = collection.objects.some((object) => object.id === change.id);
  if (!objectExists) return failure('not-found', `objects.${change.id}`, 'Object must exist');
  return planObjectDeletion(collection, change);
}

/** Filter preserves record order and the namespace-specific ID type. */
function withoutRecord<T extends { readonly id: string }>(
  items: readonly T[],
  removedId: RecordRemoval['id'],
): readonly T[] {
  return items.filter((item) => item.id !== removedId);
}

/**
 * Removes exactly one record without cascade. References are checked on the final batch,
 * allowing a later operation to repair them. Missing IDs fail. Pure snapshot replay;
 * planChanges owns final validation and Authoring owns commit/recovery.
 */
export function removeRecord(collection: Collection, change: RecordRemoval): Result<Collection> {
  const recordExists = collection[change.target].some((record) => record.id === change.id);
  if (!recordExists)
    return failure('not-found', `${change.target}.${change.id}`, 'Remove requires existing ID');
  return success(removeFromNamespace(collection, change));
}

/** Namespace-specific lists retain their distinct record schemas in the returned collection. */
function removeFromNamespace(collection: Collection, change: RecordRemoval): Collection {
  const removers: Readonly<Record<RecordRemoval['target'], () => Collection>> = {
    objects: () => ({ ...collection, objects: withoutRecord(collection.objects, change.id) }),
    relationships: () => ({
      ...collection,
      relationships: withoutRecord(collection.relationships, change.id),
    }),
    sections: () => ({ ...collection, sections: withoutRecord(collection.sections, change.id) }),
    assets: () => ({ ...collection, assets: withoutRecord(collection.assets, change.id) }),
    sources: () => ({ ...collection, sources: withoutRecord(collection.sources, change.id) }),
    definitions: () => ({
      ...collection,
      definitions: withoutRecord(collection.definitions, change.id),
    }),
  };
  return removers[change.target]();
}
