import type { Dependencies } from '../../contract/types.js';
import type { ExpansionRequest, LoweredIntent } from '../../contract/records/requests.js';
import { parseSource } from '../parsing/document.js';
import { accepted, reject, protect } from '../validation/outcomes.js';
import type { Result } from '../../contract/errors.js';
import { lowerDocument } from './document.js';
type DefinitionId = LoweredIntent['collection']['definitions'][number]['id'];
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
  const lowered = accepted(
    lowerDocument(
      { ...parsed, collection: input.namespace, declaration },
      { source: input.source, mode: 'create', snapshot: null, resources: input.resources },
      deps,
    ),
  );
  return namespaceDefinitions(lowered, input.namespace);
}

/** Recipe-local definitions receive a deterministic namespace and every ref follows once. */
function namespaceDefinitions(intent: LoweredIntent, namespace: string): LoweredIntent {
  const definitions = intent.collection.definitions.map((definition) => ({
    ...definition,
    id: asDefinitionId(`${namespace}__${definition.id}`),
    expression: rewriteExpression(definition.expression, namespace),
  }));
  const objects = intent.collection.objects.map((object) => ({
    ...object,
    content: object.content.map((block) =>
      block.kind === 'field' && typeof block.type !== 'string'
        ? { ...block, type: { ...block.type, id: asDefinitionId(`${namespace}__${block.type.id}`) } }
        : block,
    ),
  }));
  const collection = { ...intent.collection, definitions, objects } as unknown as LoweredIntent['collection'];
  return { ...intent, collection, changes: [{ op: 'replace-document', value: collection }] };
}

function rewriteExpression(
  expression: LoweredIntent['collection']['definitions'][number]['expression'],
  namespace: string,
): LoweredIntent['collection']['definitions'][number]['expression'] {
  if (expression.kind === 'reference') return { ...expression, id: asDefinitionId(`${namespace}__${expression.id}`) };
  if (expression.kind !== 'union') return expression;
  return { ...expression, items: expression.items.map((item) => rewriteExpression(item, namespace)) };
}

function asDefinitionId(value: string): DefinitionId { return value as DefinitionId; }
