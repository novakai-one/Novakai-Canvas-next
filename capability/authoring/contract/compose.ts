import { createNodeIdentity } from '../adapters/node-identity.js';
import { createAuthoring } from './api.js';
import type { Authoring, Dependencies } from './types.js';
/** Node service binds native identity only; required domain/storage/geometry/resource owners remain explicit. */
export function composeAuthoring(owners: Omit<Dependencies, 'hash' | 'clock'>): Authoring {
  const identity = createNodeIdentity();
  return createAuthoring({ ...owners, ...identity });
}
