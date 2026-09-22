import type { DescendantId } from '../../contract/brands.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { ContentBlock, Endpoint, Field, KeyGroup } from '../../contract/records/content.js';
import type { DiagramObject } from '../../contract/records/object.js';
import { duplicates } from '../invariants/duplicates.js';
import { diagnoseWhen, referenceIssue } from '../invariants/issues.js';
import { typeUseKey } from '../definitions/type-uses.js';

type OrderedKey = readonly DescendantId[];

/** Only ER field blocks participate in scalar and composite key definitions. */
function entityFields(object: DiagramObject): readonly Field[] {
  return object.content.filter((block): block is Field => block.kind === 'field');
}

/** A missing member or a non-field descendant does not resolve to an ER field. */
function findField(object: DiagramObject, memberId: DescendantId | undefined): Field | undefined {
  return entityFields(object).find((field) => field.id === memberId);
}

/** Primary and unique definitions are candidate keys; foreign definitions are not. */
function candidateKeys(object: DiagramObject): readonly OrderedKey[] {
  const scalarKeys = entityFields(object).filter(
    (field) => field.key === 'primary' || field.key === 'unique',
  );
  const keyGroups = object.content.filter((block): block is KeyGroup => block.kind === 'keygroup');
  const compositeKeys = keyGroups.filter((group) => group.key !== 'foreign');
  return [...scalarKeys.map((field) => [field.id]), ...compositeKeys.map((group) => group.fields)];
}

/** Missing targets have no candidate keys; their unresolved addresses are also diagnosed. */
function targetKeys(object: DiagramObject | undefined): readonly OrderedKey[] {
  if (object === undefined) return [];
  return candidateKeys(object);
}

/** Foreign references must address fields on entities, never ports or other object kinds. */
function resolveForeignField(endpoint: Endpoint, collection: Collection): Field | undefined {
  const object = collection.objects.find((candidate) => candidate.id === endpoint.object);
  if (object?.kind !== 'entity') return undefined;
  return findField(object, endpoint.member);
}

/** The referenced field order must exactly match one declared primary or unique key. */
function matchesOrderedKey(key: OrderedKey, references: readonly Endpoint[]): boolean {
  if (key.length !== references.length) return false;
  return key.every((fieldId, index) => fieldId === references[index]?.member);
}

/** Resolve every address so one missing target does not hide other FK failures. */
function missingForeignFields(
  references: readonly Endpoint[],
  resolved: readonly (Field | undefined)[],
  path: string,
): readonly Diagnostic[] {
  return references.flatMap((endpoint, index) => {
    const memberPath = endpoint.member ?? 'member';
    return referenceIssue(resolved[index] === undefined, `${path}.${memberPath}`);
  });
}

/** Check arity, target entity, ordered key identity and corresponding field types independently. */
function validateForeignKey(
  localFields: readonly Field[],
  references: readonly Endpoint[],
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  const firstReference = references[0];
  const target = collection.objects.find((object) => object.id === firstReference?.object);
  const resolvedFields = references.map((endpoint) => resolveForeignField(endpoint, collection));
  const arityIssues = diagnoseWhen(
    localFields.length !== references.length,
    'key',
    path,
    'Foreign key arity must match',
  );
  const spansEntities = references.some((endpoint) => endpoint.object !== target?.id);
  const entityIssues = diagnoseWhen(
    spansEntities,
    'key',
    path,
    'Composite foreign key targets one entity',
  );
  const referenceIssues = missingForeignFields(references, resolvedFields, path);
  const matchesCandidateKey = targetKeys(target).some((key) => matchesOrderedKey(key, references));
  const keyIssues = diagnoseWhen(
    !matchesCandidateKey,
    'key',
    path,
    'Foreign references must match an ordered primary or unique key',
  );
  const typesDiffer = localFields.some(
    (field, index) => !sameFieldType(field, resolvedFields[index]),
  );
  const typeIssues = diagnoseWhen(
    typesDiffer,
    'key',
    path,
    'Foreign field types must match target types',
  );
  return [...arityIssues, ...entityIssues, ...referenceIssues, ...keyIssues, ...typeIssues];
}

/** Shared refs compare by canonical key and plain string types retain exact string equality. */
function sameFieldType(left: Field, right: Field | undefined): boolean {
  if (right === undefined) return false;
  return typeUseKey(left.type) === typeUseKey(right.type);
}

/** Entity ids name the valid reference targets in the E010 message. */
function entityList(collection: Collection): string {
  return collection.objects
    .filter((object) => object.kind === 'entity')
    .map((object) => `@${object.id}`)
    .join(', ');
}

/** A scalar foreign field must declare a reference; every other field forbids one. */
function validateFieldKey(
  field: Field,
  object: DiagramObject,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (field.key !== 'foreign')
    return diagnoseWhen(
      field.references !== undefined,
      'key',
      path,
      'Only foreign fields have references',
    );
  if (field.references === undefined)
    return diagnoseWhen(
      true,
      'key',
      path,
      `E010 key: @${object.id}.@${field.id} is foreign; add references=@e.@f. Entities: ${entityList(collection)}.`,
    );
  return validateForeignKey([field], [field.references], collection, path);
}

/** Missing local fields are diagnosed separately; resolved fields retain declaration order. */
function validateGroupReferences(
  group: KeyGroup,
  object: DiagramObject,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (group.key !== 'foreign')
    return diagnoseWhen(
      group.references !== undefined,
      'key',
      path,
      'Nonforeign keygroup forbids references',
    );
  if (group.references === undefined)
    return diagnoseWhen(true, 'key', path, 'Foreign keygroup requires references');
  const fields = group.fields
    .map((id) => findField(object, id))
    .filter((field) => field !== undefined);
  return validateForeignKey(fields, group.references, collection, path);
}

/** A composite definition names distinct local fields before it can reference another key. */
function validateKeyGroup(
  group: KeyGroup,
  object: DiagramObject,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  const duplicateFields = duplicates(group.fields, (id) => id, path);
  const unresolvedFields = group.fields.flatMap((id) =>
    referenceIssue(findField(object, id) === undefined, `${path}.${id}`),
  );
  const referenceIssues = validateGroupReferences(group, object, collection, path);
  return [...duplicateFields, ...unresolvedFields, ...referenceIssues];
}

/** Non-key content contributes no key diagnostics. */
function validateBlockKey(
  block: ContentBlock,
  object: DiagramObject,
  collection: Collection,
): readonly Diagnostic[] {
  const path = `objects.${object.id}.content.${block.id}`;
  if (block.kind === 'field') return validateFieldKey(block, object, collection, path);
  if (block.kind === 'keygroup') return validateKeyGroup(block, object, collection, path);
  return [];
}

/** Scalar and composite primary definitions share the same one-primary-per-object limit. */
function validateObjectKeys(object: DiagramObject, collection: Collection): readonly Diagnostic[] {
  const primaryDefinitions = object.content.filter(
    (block) => 'key' in block && block.key === 'primary',
  );
  const primaryIssues = diagnoseWhen(
    primaryDefinitions.length > 1,
    'key',
    `objects.${object.id}.content`,
    'At most one primary definition',
  );
  const blockIssues = object.content.flatMap((block) =>
    validateBlockKey(block, object, collection),
  );
  return [...primaryIssues, ...blockIssues];
}

/**
 * Validates scalar/composite keys and foreign-key references, preserving field order.
 * No relationship or schema is inferred or written. Returns all failures; pure replay.
 * Authoring owns correction, admission and commit/recovery.
 */
export function validateKeys(collection: Collection): readonly Diagnostic[] {
  return collection.objects.flatMap((object) => validateObjectKeys(object, collection));
}
