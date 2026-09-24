import { createNodeIdentity } from '../adapters/node-identity.js';
import { createAuthoring } from './api.js';
import type { Authoring, Dependencies } from './types.js';

/**
 * Creates Authoring for the Node service, using Node's SHA-256 hasher and system clock.
 *
 * Only hashing and time are supplied here. Every domain, storage, geometry and resource
 * collaborator must still be passed in explicitly.
 *
 * @param owners - Every Authoring collaborator except `hash` and `clock`.
 * @returns The Authoring facade.
 */
export function composeAuthoring(owners: Omit<Dependencies, 'hash' | 'clock'>): Authoring {
  const identity = createNodeIdentity();
  return createAuthoring({ ...owners, ...identity });
}
