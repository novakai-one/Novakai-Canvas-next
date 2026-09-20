import { collectionSchema, type Collection } from '../../contract/records/collection.js';
import type { Result, Diagnostic } from '../../contract/errors.js';
import { inspectInput } from './input.js';
import { validateIdentity } from './identity.js';
import { validateReferences } from './references.js';
import { validateContent } from '../objects/content.js';
import { validateComposition } from '../objects/composition.js';
import { validateKeys } from '../objects/keys.js';
import { validateRelationships } from '../relationships/endpoints.js';
import { validateSections } from '../sections/views.js';
import { validateLayouts } from '../sections/layout.js';
import { freeze } from './freeze.js';
import { failure, success, rejected } from './issues.js';
import { shapeErrors } from './shape-diagnostics.js';
import { validateDefinitionGraph } from '../definitions.js';

type CollectionRule = (collection: Collection) => readonly Diagnostic[];
const collectionRules: readonly CollectionRule[] = [
  validateIdentity,
  validateContent,
  validateComposition,
  validateReferences,
  validateKeys,
  validateRelationships,
  validateSections,
  validateLayouts,
  validateDefinitionGraph,
];

/** Parse and detach first. Domain rules must never receive structurally invalid data. */
function parseAndValidate(input: unknown): Result<Collection> {
  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) return rejected(shapeErrors(parsed.error.issues));
  const diagnostics = collectionRules.flatMap((rule) => rule(parsed.data));
  if (diagnostics.length > 0) return rejected(diagnostics);
  return success(parsed.data);
}

/** The supported failure contract maps input-read exceptions to a shape diagnostic. */
function safelyValidateShape(input: unknown): Result<Collection> {
  try {
    return parseAndValidate(input);
  } catch {
    // Deliberately no partial value or thrown parser error at the public Model boundary.
    return failure('shape', '$', 'Input could not be read as plain data');
  }
}

/**
 * Inspects JSON safety, parses a detached collection, then accumulates domain failures.
 * Success and failure are deeply frozen; no caller data is changed. Input inspection and
 * safelyValidateShape translate read exceptions to diagnostics. The same plain input is
 * safe to replay. Authoring owns admission, revision increments, commit and crash recovery.
 */
export function validateCollection(input: unknown): Result<Collection> {
  const inspected = inspectInput(input);
  if (!inspected.ok) return freeze(inspected);
  const validated = safelyValidateShape(input);
  return freeze(validated);
}
