import type { Collection } from '../../contract/records/collection.js';
import { collectionSchema } from '../../contract/records/collection.js';
import type { Result, Diagnostic } from '../../contract/errors.js';
import { inspectInput } from './input.js';
import { validateIdentity } from './identity.js';
import { validateReferences } from './references.js';
import { validateContent } from '../objects/content.js';
import { validateKeys } from '../objects/keys.js';
import { validateRelationships } from '../relationships/endpoints.js';
import { validateSections } from '../sections/views.js';
import { validateLayouts } from '../sections/layout.js';
import { freeze } from './freeze.js';
import { failure, success } from './issues.js';
const rules = [
  validateIdentity,
  validateContent,
  validateReferences,
  validateKeys,
  validateRelationships,
  validateSections,
  validateLayouts,
];
export function shapeErrors(
  issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): readonly Diagnostic[] {
  return issues.map((issue) => ({
    code: 'shape',
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}
function validateShape(input: unknown): Result<Collection> {
  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, diagnostics: shapeErrors(parsed.error.issues) };
  const diagnostics = rules.flatMap((rule) => rule(parsed.data));
  if (diagnostics.length > 0) return { ok: false, diagnostics };
  return success(parsed.data);
}
/** Same input gives same result. Authoring owns admission, commit and crash recovery. */
export function validateCollection(input: unknown): Result<Collection> {
  const inspected = inspectInput(input);
  if (!inspected.ok) return freeze(inspected);
  return freeze(safeShape(input));
}

function safeShape(input: unknown): Result<Collection> {
  try {
    return validateShape(input);
  } catch {
    return failure('shape', '$', 'Input could not be read as plain data');
  }
}
