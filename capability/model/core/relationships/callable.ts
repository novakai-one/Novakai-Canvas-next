import type { Collection } from '../../contract/records/collection.js';
import type { Endpoint } from '../../contract/records/content.js';
import type { DiagramObject } from '../../contract/records/object.js';
import { descendants, type ObjectDescendant } from '../objects/content.js';

/** Canonical callable target resolved once for relationship and sequence validation. */
export interface CallableEndpoint {
  readonly owner: DiagramObject;
  readonly member?: ObjectDescendant;
}

/** Whole functions and owner-local signatures are the only canonical callable addresses. */
export function resolveCallableEndpoint(
  collection: Collection,
  endpoint: Endpoint,
): CallableEndpoint | undefined {
  const owner = collection.objects.find((object) => object.id === endpoint.object);
  if (owner === undefined) return undefined;
  return endpoint.member === undefined
    ? resolveWholeCallable(owner)
    : resolveMemberCallable(owner, endpoint.member);
}

function resolveWholeCallable(owner: DiagramObject): CallableEndpoint | undefined {
  return owner.kind === 'function' ? { owner } : undefined;
}

function resolveMemberCallable(
  owner: DiagramObject,
  memberId: string,
): CallableEndpoint | undefined {
  if (!['module', 'interface', 'function'].includes(owner.kind)) return undefined;
  const member = descendants(owner).find((candidate) => candidate.id === memberId);
  return member?.kind === 'signature' ? { owner, member } : undefined;
}
