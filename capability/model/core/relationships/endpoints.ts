import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { Endpoint } from '../../contract/records/content.js';
import type { DiagramObject, ObjectKind } from '../../contract/records/object.js';
import type { Relationship, RelationshipKind } from '../../contract/records/relationship.js';
import { descendants, type ObjectDescendant } from '../objects/content.js';
import { diagnoseWhen, referenceIssue } from '../invariants/issues.js';

// Unlisted object kinds support generic ports and table rows as addressed endpoints.
const endpointKinds: Readonly<Partial<Record<ObjectKind, readonly ObjectDescendant['kind'][]>>> = {
  entity: ['field', 'port'],
  module: ['member', 'signature', 'port'],
  interface: ['member', 'signature', 'port'],
  function: ['member', 'signature', 'port'],
};
const genericEndpointKinds: readonly ObjectDescendant['kind'][] = ['port', 'row'];

// An absent relationship policy means no additional restriction on that endpoint's object kind.
const sourceKinds: Readonly<Partial<Record<RelationshipKind, readonly ObjectKind[]>>> = {
  association: ['entity'],
  imports: ['module'],
  calls: ['module', 'function'],
  implements: ['module', 'function'],
  contains: ['module', 'system'],
  transition: ['start', 'state'],
};
const targetKinds: Readonly<Partial<Record<RelationshipKind, readonly ObjectKind[]>>> = {
  association: ['entity'],
  imports: ['module', 'interface', 'function'],
  calls: ['function'],
  implements: ['interface'],
  transition: ['state', 'end'],
};

/** Missing canonical objects are unresolved addresses; membership is checked separately. */
function resolveEndpoint(endpoint: Endpoint, collection: Collection): DiagramObject | undefined {
  return collection.objects.find((object) => object.id === endpoint.object);
}

/** A missing member differs from an existing descendant of the wrong semantic kind. */
function isAllowedMember(member: ObjectDescendant | undefined, ownerKind: ObjectKind): boolean {
  if (member === undefined) return false;
  const allowed = endpointKinds[ownerKind] ?? genericEndpointKinds;
  return allowed.includes(member.kind);
}

/** An omitted member addresses the whole object; a missing object is diagnosed by the endpoint check. */
function validateMember(
  endpoint: Endpoint,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (endpoint.member === undefined) return [];
  const object = resolveEndpoint(endpoint, collection);
  if (object === undefined) return [];
  const member = descendants(object).find((item) => item.id === endpoint.member);
  return diagnoseWhen(
    !isAllowedMember(member, object.kind),
    'endpoint',
    `${path}.member`,
    'Endpoint must address a legal field/member/signature/port/row',
  );
}

/** No allowed-kind policy means unrestricted; unresolved objects have their own diagnostic. */
function validateObjectKind(
  object: DiagramObject | undefined,
  allowed: readonly ObjectKind[] | undefined,
  path: string,
): readonly Diagnostic[] {
  if (allowed === undefined) return [];
  if (object === undefined) return [];
  return diagnoseWhen(
    !allowed.includes(object.kind),
    'endpoint',
    path,
    'Object kind is incompatible with relationship kind',
  );
}

/** Independently check object existence, descendant addressability and relationship role compatibility. */
function validateEndpoint(
  endpoint: Endpoint,
  collection: Collection,
  path: string,
  allowedKinds: readonly ObjectKind[] | undefined,
): readonly Diagnostic[] {
  const object = resolveEndpoint(endpoint, collection);
  const referenceIssues = referenceIssue(object === undefined, path);
  const memberIssues = validateMember(endpoint, collection, path);
  const kindIssues = validateObjectKind(object, allowedKinds, path);
  return [...referenceIssues, ...memberIssues, ...kindIssues];
}

/** ER associations require both cardinalities; other relationship kinds forbid them. */
function validateCardinalities(relationship: Relationship, path: string): readonly Diagnostic[] {
  if (relationship.kind === 'association') {
    const missingCardinality = relationship.from === undefined || relationship.to === undefined;
    return diagnoseWhen(
      missingCardinality,
      'endpoint',
      path,
      'Association requires both cardinalities',
    );
  }
  const hasCardinality = relationship.from !== undefined || relationship.to !== undefined;
  return diagnoseWhen(
    hasCardinality,
    'endpoint',
    path,
    'Cardinalities are only valid for associations',
  );
}

/** Source and target policies may differ, for example module imports versus function calls. */
function validateRelationship(
  relationship: Relationship,
  collection: Collection,
): readonly Diagnostic[] {
  const path = `relationships.${relationship.id}`;
  const sourceIssues = validateEndpoint(
    relationship.source,
    collection,
    `${path}.source`,
    sourceKinds[relationship.kind],
  );
  const targetIssues = validateEndpoint(
    relationship.target,
    collection,
    `${path}.target`,
    targetKinds[relationship.kind],
  );
  const cardinalityIssues = validateCardinalities(relationship, path);
  return [...sourceIssues, ...targetIssues, ...cardinalityIssues];
}

/**
 * Validates canonical relationship endpoints and ER cardinalities, accumulating failures.
 * Wire routes and FK inference are outside this responsibility. Pure replay; Authoring
 * owns correction, admission and commit/recovery.
 */
export function validateRelationships(collection: Collection): readonly Diagnostic[] {
  return collection.relationships.flatMap((relationship) =>
    validateRelationship(relationship, collection),
  );
}
