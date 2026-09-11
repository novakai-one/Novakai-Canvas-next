import type { Collection } from '../../contract/records/collection.js';
import type { ContentBlock, Endpoint, Field, KeyGroup } from '../../contract/records/content.js';
import type { DiagramObject } from '../../contract/records/object.js';
import { duplicates, issue, present, required } from '../invariants/issues.js';
const fields = (object: DiagramObject) =>
  object.content.filter((block): block is Field => block.kind === 'field');
const keyGroups = (object: DiagramObject) =>
  object.content.filter((block): block is KeyGroup => block.kind === 'keygroup');
const fieldAt = (object: DiagramObject, id: string | undefined) =>
  fields(object).find((field) => field.id === id);
function keyDefinitions(object: DiagramObject): readonly (readonly string[])[] {
  return [
    ...fields(object)
      .filter((field) => ['primary', 'unique'].includes(field.key ?? ''))
      .map((field) => [field.id]),
    ...keyGroups(object)
      .filter((group) => group.key !== 'foreign')
      .map((group) => group.fields),
  ];
}
function targetField(endpoint: Endpoint, collection: Collection) {
  const object = collection.objects.find((object) => object.id === endpoint.object);
  if (object?.kind !== 'entity') return undefined;
  return fieldAt(object, endpoint.member);
}
function foreign(
  local: readonly Field[],
  references: readonly Endpoint[],
  collection: Collection,
  path: string,
) {
  const target = collection.objects.find((object) => object.id === references[0]?.object);
  const resolved = references.map((endpoint) => targetField(endpoint, collection));
  return [
    ...issue(local.length !== references.length, 'key', path, 'Foreign key arity must match'),
    ...issue(
      references.some((endpoint) => endpoint.object !== target?.id),
      'key',
      path,
      'Composite foreign key targets one entity',
    ),
    ...references.flatMap((endpoint, index) =>
      required(resolved[index] !== undefined, `${path}.${endpoint.member ?? 'member'}`),
    ),
    ...issue(
      !keyDefinitionsFor(target).some(
        (key) =>
          JSON.stringify(key) === JSON.stringify(references.map((endpoint) => endpoint.member)),
      ),
      'key',
      path,
      'Foreign references must match an ordered primary or unique key',
    ),
    ...issue(
      local.some((field, index) => field.type !== resolved[index]?.type),
      'key',
      path,
      'Foreign field types must match target types',
    ),
  ];
}
function keyDefinitionsFor(object: DiagramObject | undefined) {
  return object ? keyDefinitions(object) : [];
}
function fieldKey(field: Field, collection: Collection, path: string) {
  if (field.key !== 'foreign')
    return issue(
      field.references !== undefined,
      'key',
      path,
      'Only foreign fields have references',
    );
  if (!field.references) return issue(true, 'key', path, 'Foreign field requires reference');
  return foreign([field], [field.references], collection, path);
}
function groupForeign(
  group: KeyGroup,
  object: DiagramObject,
  collection: Collection,
  path: string,
) {
  if (group.key !== 'foreign')
    return issue(
      group.references !== undefined,
      'key',
      path,
      'Nonforeign keygroup forbids references',
    );
  if (!group.references) return issue(true, 'key', path, 'Foreign keygroup requires references');
  return foreign(
    group.fields.map((id) => fieldAt(object, id)).filter(present),
    group.references,
    collection,
    path,
  );
}
function groupKey(group: KeyGroup, object: DiagramObject, collection: Collection, path: string) {
  return [
    ...duplicates(group.fields, (id) => id, path),
    ...group.fields.flatMap((id) => required(fieldAt(object, id) !== undefined, `${path}.${id}`)),
    ...groupForeign(group, object, collection, path),
  ];
}
function blockKey(block: ContentBlock, object: DiagramObject, collection: Collection) {
  const path = `objects.${object.id}.content.${block.id}`;
  if (block.kind === 'field') return fieldKey(block, collection, path);
  if (block.kind === 'keygroup') return groupKey(block, object, collection, path);
  return [];
}
export function validateKeys(collection: Collection) {
  return collection.objects.flatMap((object) => [
    ...issue(
      object.content.filter((block) => 'key' in block && block.key === 'primary').length > 1,
      'key',
      `objects.${object.id}.content`,
      'At most one primary definition',
    ),
    ...object.content.flatMap((block) => blockKey(block, object, collection)),
  ]);
}
