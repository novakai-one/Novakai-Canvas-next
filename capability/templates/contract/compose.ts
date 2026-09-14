import { createIdentity } from '../adapters/identity.js';
import { createTemplates } from './api.js';
import type { RecipePort, ThemePort } from './ports/codecs.js';
import type { Templates } from './types.js';
/** Bind deterministic hashing only; syntax and token owners are mandatory host-supplied roles. No IO occurs. */
export function composeTemplates<T>(codecs: {
  readonly recipe: RecipePort<T>;
  readonly theme: ThemePort;
}): Templates<T> {
  return createTemplates({ ...codecs, identity: createIdentity() });
}
