import type { Dependencies } from '../../contract/types.js';
import type { ExpansionRequest, LoweredIntent } from '../../contract/records/requests.js';
import { parseSource } from '../parsing/document.js';
import { accepted, reject, protect } from '../validation/outcomes.js';
import type { Result } from '../../contract/errors.js';
import { lowerDocument } from './document.js';
/** Compile an independent recipe root without writes. Language returns correction diagnostics; Authoring owns commit/retry recovery. */
export function expandRecipe(input: ExpansionRequest, deps: Dependencies): Result<LoweredIntent> {
  return protect(() => expandedRecipe(input, deps));
}
/** Rebind the parsed root identity, never replace matching text in labels, URIs, code or local references. */
function expandedRecipe(input: ExpansionRequest, deps: Dependencies): LoweredIntent {
  const parsed = parseSource(input.source);
  if (parsed.kind !== 'canvas')
    return reject(
      'invalid-input',
      parsed.span,
      'Complete canvas1 source',
      'A patch cannot instantiate a recipe',
    );
  const declaration = {
    ...parsed.declaration,
    fields: {
      ...parsed.declaration.fields,
      id: { value: input.namespace, span: parsed.declaration.span },
    },
  };
  return accepted(
    lowerDocument(
      { ...parsed, collection: input.namespace, declaration },
      { source: input.source, mode: 'create', snapshot: null, resources: input.resources },
      deps,
    ),
  );
}
