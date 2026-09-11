import type { ObjectId } from '../../contract/brands.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Change } from '../../contract/records/change.js';
import type { Result } from '../../contract/errors.js';
import { failure, success } from '../invariants/issues.js';
import { cascadeContent } from './cascade-content.js';
import { cascadeSection } from './cascade-views.js';
function cascade(collection: Collection, id: ObjectId): Collection {
  const relationships = collection.relationships
    .filter((relationship) => [relationship.source.object, relationship.target.object].includes(id))
    .map((relationship) => relationship.id);
  return {
    ...collection,
    objects: collection.objects
      .filter((object) => object.id !== id)
      .map((object) => cascadeContent(object, id)),
    relationships: collection.relationships.filter(
      (relationship) => !relationships.includes(relationship.id),
    ),
    sections: collection.sections.map((section) => cascadeSection(section, id, relationships)),
  };
}
export function deleteObject(
  collection: Collection,
  change: Extract<Change, { op: 'delete-object' }>,
): Result<Collection> {
  if (!collection.objects.some((object) => object.id === change.id))
    return failure('not-found', `objects.${change.id}`, 'Object must exist');
  return deletion(collection, change);
}
function deletion(
  collection: Collection,
  change: Extract<Change, { op: 'delete-object' }>,
): Result<Collection> {
  const candidate = cascade(collection, change.id);
  const simple = {
    ...collection,
    objects: collection.objects.filter((object) => object.id !== change.id),
  };
  if (!change.cascade && JSON.stringify(candidate) !== JSON.stringify(simple))
    return failure(
      'delete-referenced',
      `objects.${change.id}`,
      'Explicit cascade required for referenced object',
    );
  return success(candidate);
}
const without = <T extends { readonly id: string }>(items: readonly T[], id: string) =>
  items.filter((item) => item.id !== id);
export function removeRecord(
  collection: Collection,
  change: Extract<Change, { op: 'remove' }>,
): Result<Collection> {
  if (!collection[change.target].some((record) => record.id === change.id))
    return failure('not-found', `${change.target}.${change.id}`, 'Remove requires existing ID');
  const removers = {
    objects: () => ({ ...collection, objects: without(collection.objects, change.id) }),
    relationships: () => ({
      ...collection,
      relationships: without(collection.relationships, change.id),
    }),
    sections: () => ({ ...collection, sections: without(collection.sections, change.id) }),
    assets: () => ({ ...collection, assets: without(collection.assets, change.id) }),
    sources: () => ({ ...collection, sources: without(collection.sources, change.id) }),
  };
  return success(removers[change.target]());
}
