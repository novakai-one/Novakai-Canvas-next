import type { DefinitionId } from '../contract/brands.js';
import type { Diagnostic, Result } from '../contract/errors.js';
import type { Collection } from '../contract/records/collection.js';
import type { TypeExpression } from '../contract/records/definition.js';
import type { Field } from '../contract/records/content.js';
import { failure, success } from './invariants/issues.js';
import { diagnoseWhen, referenceIssue } from './invariants/issues.js';

const MAX_NODES = 256;
const MAX_DEPTH = 32;

/** A stable semantic address for a direct field or definition-expression use. */
export interface DefinitionUsage {
  readonly kind: 'field' | 'definition';
  readonly definition: DefinitionId;
  readonly path: string;
  readonly object?: string;
  readonly field?: string;
}

function exprNodes(expression: TypeExpression, path: string, depth: number, seen: Set<string>): readonly Diagnostic[] {
  if (depth > MAX_DEPTH) return [{ code: 'limit', path, message: 'Definition expression nesting exceeds the limit' }];
  if (seen.size > MAX_NODES) return [{ code: 'limit', path, message: 'Definition expression is too large' }];
  if (expression.kind !== 'union') return [];
  const next = new Set(seen);
  next.add(path);
  return expression.items.flatMap((item, index) => exprNodes(item, `${path}.items.${index}`, depth + 1, next));
}

function expressionReferences(expression: TypeExpression, path: string): readonly { id: DefinitionId; path: string }[] {
  if (expression.kind === 'reference') return [{ id: expression.id, path }];
  if (expression.kind !== 'union') return [];
  return expression.items.flatMap((item, index) => expressionReferences(item, `${path}.items.${index}`));
}

function validateDefinitions(collection: Collection): readonly Diagnostic[] {
  const ids = new Set(collection.definitions.map((definition) => definition.id));
  return collection.definitions.flatMap((definition) => {
    const path = `definitions.${definition.id}.expression`;
    const bounds = exprNodes(definition.expression, path, 0, new Set());
    const unknown = expressionReferences(definition.expression, path).flatMap((reference) =>
      referenceIssue(!ids.has(reference.id), reference.path),
    );
    return [...bounds, ...unknown];
  });
}

function hasCycle(collection: Collection, start: DefinitionId, current: DefinitionId, visiting: Set<DefinitionId>): boolean {
  if (visiting.has(current)) return current === start;
  const definition = collection.definitions.find((item) => item.id === current);
  if (definition === undefined) return false;
  const next = new Set(visiting);
  next.add(current);
  return expressionReferences(definition.expression, `definitions.${current}.expression`).some((reference) =>
    hasCycle(collection, start, reference.id, next),
  );
}

function validateCycles(collection: Collection): readonly Diagnostic[] {
  return collection.definitions.flatMap((definition) =>
    diagnoseWhen(
      hasCycle(collection, definition.id, definition.id, new Set()),
      'reference',
      `definitions.${definition.id}.expression`,
      'Definition references form a cycle',
    ),
  );
}

/** Model rule for the bounded definition graph, including unknown refs and self/mutual cycles. */
export function validateDefinitionGraph(collection: Collection): readonly Diagnostic[] {
  const definitionIssues = validateDefinitions(collection);
  return [...definitionIssues, ...validateCycles(collection), ...validateFieldTypes(collection)];
}

function validateFieldTypes(collection: Collection): readonly Diagnostic[] {
  const ids = new Set(collection.definitions.map((definition) => definition.id));
  return collection.objects.flatMap((object) =>
    object.content.flatMap((block) => {
      if (block.kind !== 'field' || typeof block.type === 'string') return [];
      return referenceIssue(!ids.has(block.type.id), `objects.${object.id}.content.${block.id}.type`);
    }),
  );
}

function displayLiteral(value: string | number | boolean): string {
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function displayExpression(expression: TypeExpression, collection: Collection, seen: Set<DefinitionId>, budget: { remaining: number }): string {
  if (budget.remaining-- <= 0) return '…';
  if (expression.kind === 'primitive') return expression.name;
  if (expression.kind === 'literal') return displayLiteral(expression.value);
  if (expression.kind === 'union') return expression.items.map((item) => displayExpression(item, collection, seen, budget)).join(' | ');
  if (seen.has(expression.id)) return `@${expression.id}`;
  const target = collection.definitions.find((definition) => definition.id === expression.id);
  if (target === undefined) return `@${expression.id}`;
  const next = new Set(seen);
  next.add(expression.id);
  return displayExpression(target.expression, collection, next, budget);
}

/** Resolve one definition ref to deterministic display text, expanding shared aliases with a bound. */
export function definitionDisplay(collection: Collection, id: DefinitionId): string {
  const definition = collection.definitions.find((item) => item.id === id);
  return definition === undefined ? `@${id}` : displayExpression(definition.expression, collection, new Set([id]), { remaining: MAX_NODES });
}

/** Resolve a field's old string or shared reference without ever stringifying an object. */
export function fieldTypeDisplay(collection: Collection, field: Field): string {
  return typeof field.type === 'string' ? field.type : definitionDisplay(collection, field.type.id);
}

/** Direct usages are unique, stable and include definition-to-definition paths. */
export function definitionUsages(collection: Collection, id: DefinitionId): Result<readonly DefinitionUsage[]> {
  if (!collection.definitions.some((definition) => definition.id === id))
    return failure('not-found', `definitions.${id}`, 'Definition ID must exist');
  const fieldUses: DefinitionUsage[] = collection.objects.flatMap((object) =>
    object.content.flatMap((block) =>
      block.kind === 'field' && typeof block.type !== 'string' && block.type.id === id
        ? [{ kind: 'field', definition: id, path: `objects.${object.id}.content.${block.id}.type`, object: object.id, field: block.id }]
        : [],
    ),
  );
  const definitionUses: DefinitionUsage[] = collection.definitions.flatMap((definition) =>
    expressionReferences(definition.expression, `definitions.${definition.id}.expression`)
      .filter((reference) => reference.id === id)
      .map((reference) => ({ kind: 'definition', definition: id, path: reference.path })),
  );
  return success([...fieldUses, ...definitionUses].toSorted((a, b) => a.path.localeCompare(b.path)));
}
