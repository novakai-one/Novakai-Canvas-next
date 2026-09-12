import type { ResolvedTokenSet } from '../../contract/records/resolved.js';
import { resolvedScope } from '../../contract/records/scope-schema.js';
import { parsed } from '../validation/input.js';
import { canonical } from '../validation/canonical.js';
import { reject } from '../validation/outcomes.js';
import { emitVariables } from './emit.js';
/** Validate complete safe emitted data before DOM use; failed input retains the previous scope. */
export function validateResolved(input: unknown): ResolvedTokenSet {
  const resolved = parsed(resolvedScope, input, 'scope');
  if (Object.keys(resolved.values).length > 1000)
    return reject('limit', 'scope', '≤1000 tokens', 'Too many tokens');
  const css = emitVariables(resolved.values);
  if (canonical(css) !== canonical(resolved.css))
    return reject(
      'invalid-input',
      'scope.css',
      'CSS matching numeric values',
      'Scope CSS and values differ',
    );
  return resolved;
}
