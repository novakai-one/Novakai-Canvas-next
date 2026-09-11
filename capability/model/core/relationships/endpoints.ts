import type { Collection } from '../../contract/records/collection.js';
import type { Endpoint } from '../../contract/records/content.js';
import type { Relationship } from '../../contract/records/relationship.js';
import { descendants } from '../objects/content.js';
import { issue, required } from '../invariants/issues.js';
const endpointKinds: Readonly<Record<string, readonly string[]>> = {
  entity: ['field', 'port'],
  module: ['member', 'signature', 'port'],
  interface: ['member', 'signature', 'port'],
  function: ['member', 'signature', 'port'],
};
const sourceKinds: Readonly<Record<string, readonly string[]>> = {
  association: ['entity'],
  imports: ['module'],
  calls: ['module', 'function'],
  implements: ['module', 'function'],
  contains: ['module', 'system'],
  transition: ['start', 'state'],
};
const targetKinds: Readonly<Record<string, readonly string[]>> = {
  association: ['entity'],
  imports: ['module', 'interface', 'function'],
  calls: ['function'],
  implements: ['interface'],
  transition: ['state', 'end'],
};
export function resolveEndpoint(endpoint: Endpoint, collection: Collection) {
  return collection.objects.find((object) => object.id === endpoint.object);
}
function memberErrors(endpoint: Endpoint, collection: Collection, path: string) {
  if (!endpoint.member) return [];
  const object = resolveEndpoint(endpoint, collection);
  if (!object) return [];
  const member = descendants(object).find((item) => item.id === endpoint.member);
  const allowed = endpointKinds[object.kind] ?? ['port', 'row'];
  return issue(
    !allowed.includes(member?.kind ?? ''),
    'endpoint',
    `${path}.member`,
    'Endpoint must address a legal field/member/signature/port/row',
  );
}
function endpointErrors(
  endpoint: Endpoint,
  collection: Collection,
  path: string,
  kinds: readonly string[] | undefined,
) {
  const object = resolveEndpoint(endpoint, collection);
  return [
    ...required(object !== undefined, path),
    ...memberErrors(endpoint, collection, path),
    ...kindError(object?.kind, kinds, path),
  ];
}
function kindError(kind: string | undefined, allowed: readonly string[] | undefined, path: string) {
  if (!allowed || !kind) return [];
  return issue(
    !allowed.includes(kind),
    'endpoint',
    path,
    'Object kind is incompatible with relationship kind',
  );
}
function cardinalities(relationship: Relationship, path: string) {
  if (relationship.kind === 'association')
    return issue(
      !relationship.from || !relationship.to,
      'endpoint',
      path,
      'Association requires both cardinalities',
    );
  return issue(
    relationship.from !== undefined || relationship.to !== undefined,
    'endpoint',
    path,
    'Cardinalities are only valid for associations',
  );
}
export function validateRelationships(collection: Collection) {
  return collection.relationships.flatMap((relationship) => [
    ...endpointErrors(
      relationship.source,
      collection,
      `relationships.${relationship.id}.source`,
      sourceKinds[relationship.kind],
    ),
    ...endpointErrors(
      relationship.target,
      collection,
      `relationships.${relationship.id}.target`,
      targetKinds[relationship.kind],
    ),
    ...cardinalities(relationship, `relationships.${relationship.id}`),
  ]);
}
