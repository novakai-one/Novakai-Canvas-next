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

function exprNodes(expression: TypeExpression, path: string): readonly Diagnostic[] {
  const stack: [TypeExpression, string, number][] = [[expression, path, 0]];
  let nodes = 0;
  let issue: Diagnostic | undefined;
  while (stack.length > 0)
    issue =
      issue ??
      visitNodeFrame(stack, () => {
        nodes += 1;
        return nodes;
      });
  return issue === undefined ? [] : [issue];
}

function visitNodeFrame(
  stack: [TypeExpression, string, number][],
  nextNode: () => number,
): Diagnostic | undefined {
  const [current, currentPath, depth] = stack.pop() as [TypeExpression, string, number];
  const issue = expressionLimit(depth, nextNode(), currentPath);
  pushExpressionChildren(current, currentPath, depth, stack);
  if (issue !== undefined) stack.length = 0;
  return issue;
}

function expressionLimit(depth: number, nodes: number, path: string): Diagnostic | undefined {
  return depthLimit(depth, path) ?? nodeLimit(nodes, path);
}

function depthLimit(depth: number, path: string): Diagnostic | undefined {
  if (depth > MAX_DEPTH)
    return { code: 'limit', path, message: 'Definition expression nesting exceeds the limit' };
  return undefined;
}

function nodeLimit(nodes: number, path: string): Diagnostic | undefined {
  if (nodes > MAX_NODES)
    return { code: 'limit', path, message: 'Definition expression is too large' };
  return undefined;
}

function pushExpressionChildren(
  expression: TypeExpression,
  path: string,
  depth: number,
  stack: [TypeExpression, string, number][],
): void {
  if (expression.kind !== 'union') return;
  expression.items.forEach((item, index) =>
    stack.push([item, `${path}.items.${index}`, depth + 1]),
  );
}

function expressionReferences(
  expression: TypeExpression,
  path: string,
): readonly { id: DefinitionId; path: string }[] {
  const references: { id: DefinitionId; path: string }[] = [];
  const stack: [TypeExpression, string][] = [[expression, path]];
  while (stack.length > 0) {
    const frame = stack.pop() as [TypeExpression, string];
    visitReferences(frame, references, stack);
  }
  return references;
}

function visitReferences(
  frame: [TypeExpression, string],
  references: { id: DefinitionId; path: string }[],
  stack: [TypeExpression, string][],
): void {
  const [current, currentPath] = frame;
  addReference(current, currentPath, references);
  pushReferenceChildren(current, currentPath, stack);
}

function addReference(
  expression: TypeExpression,
  path: string,
  references: { id: DefinitionId; path: string }[],
): void {
  if (expression.kind === 'reference') references.push({ id: expression.id, path });
}

function pushReferenceChildren(
  expression: TypeExpression,
  path: string,
  stack: [TypeExpression, string][],
): void {
  if (expression.kind !== 'union') return;
  expression.items.forEach((item, index) => stack.push([item, `${path}.items.${index}`]));
}

function validateDefinitions(collection: Collection): readonly Diagnostic[] {
  const ids = new Set(collection.definitions.map((definition) => definition.id));
  return collection.definitions.flatMap((definition) => {
    const path = `definitions.${definition.id}.expression`;
    const bounds = exprNodes(definition.expression, path);
    const unknown = expressionReferences(definition.expression, path).flatMap((reference) =>
      referenceIssue(!ids.has(reference.id), reference.path),
    );
    return [...bounds, ...unknown];
  });
}

function cycleDefinitions(collection: Collection): ReadonlySet<DefinitionId> {
  const adjacency = new Map(
    collection.definitions.map((definition) => [
      definition.id,
      expressionReferences(definition.expression, `definitions.${definition.id}.expression`).map(
        (item) => item.id,
      ),
    ]),
  );
  const colors = new Map<DefinitionId, 0 | 1 | 2>();
  const cycles = new Set<DefinitionId>();
  collection.definitions.forEach((definition) =>
    visitGraphRoot(definition.id, adjacency, colors, cycles),
  );
  return cycles;
}

function visitGraphRoot(
  id: DefinitionId,
  adjacency: ReadonlyMap<DefinitionId, readonly DefinitionId[]>,
  colors: Map<DefinitionId, 0 | 1 | 2>,
  cycles: Set<DefinitionId>,
): void {
  if (colors.get(id) !== undefined) return;
  const stack: { id: DefinitionId; index: number }[] = [{ id, index: 0 }];
  colors.set(id, 1);
  while (stack.length > 0) visitGraphStep(stack, adjacency, colors, cycles);
}

function visitGraphStep(
  stack: { id: DefinitionId; index: number }[],
  adjacency: ReadonlyMap<DefinitionId, readonly DefinitionId[]>,
  colors: Map<DefinitionId, 0 | 1 | 2>,
  cycles: Set<DefinitionId>,
): void {
  const frame = stack[stack.length - 1];
  if (frame === undefined) return;
  const target = (adjacency.get(frame.id) ?? [])[frame.index];
  if (target === undefined) return finishGraphFrame(stack, colors, frame);
  frame.index += 1;
  visitGraphTarget(target, stack, adjacency, colors, cycles);
}

function finishGraphFrame(
  stack: { id: DefinitionId; index: number }[],
  colors: Map<DefinitionId, 0 | 1 | 2>,
  frame: { id: DefinitionId; index: number },
): void {
  colors.set(frame.id, 2);
  stack.pop();
}

function visitGraphTarget(
  target: DefinitionId,
  stack: { id: DefinitionId; index: number }[],
  adjacency: ReadonlyMap<DefinitionId, readonly DefinitionId[]>,
  colors: Map<DefinitionId, 0 | 1 | 2>,
  cycles: Set<DefinitionId>,
): void {
  if (adjacency.get(target) === undefined) return;
  const color = targetColor(colors, target);
  visitGraphColor(color, target, stack, colors, cycles);
}

function visitGraphColor(
  color: 0 | 1 | 2,
  target: DefinitionId,
  stack: { id: DefinitionId; index: number }[],
  colors: Map<DefinitionId, 0 | 1 | 2>,
  cycles: Set<DefinitionId>,
): void {
  if (color === 1) markCycle(stack, target, cycles);
  if (color === 0) descendGraph(target, stack, colors);
}

function targetColor(
  colors: ReadonlyMap<DefinitionId, 0 | 1 | 2>,
  target: DefinitionId,
): 0 | 1 | 2 {
  const color = colors.get(target);
  return color === undefined ? 0 : color;
}

function markCycle(
  stack: readonly { id: DefinitionId; index: number }[],
  target: DefinitionId,
  cycles: Set<DefinitionId>,
): void {
  const start = stack.findIndex((frame) => frame.id === target);
  stack.slice(start < 0 ? 0 : start).forEach((frame) => cycles.add(frame.id));
  cycles.add(target);
}

function descendGraph(
  target: DefinitionId,
  stack: { id: DefinitionId; index: number }[],
  colors: Map<DefinitionId, 0 | 1 | 2>,
): void {
  colors.set(target, 1);
  stack.push({ id: target, index: 0 });
}

function validateCycles(collection: Collection): readonly Diagnostic[] {
  const cycles = cycleDefinitions(collection);
  return collection.definitions.flatMap((definition) =>
    diagnoseWhen(
      cycles.has(definition.id),
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
      return referenceIssue(
        !ids.has(block.type.id),
        `objects.${object.id}.content.${block.id}.type`,
      );
    }),
  );
}

function displayLiteral(value: string | number | boolean): string {
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

interface DisplayBudget {
  remaining: number;
  truncated: boolean;
}

function displayExpression(
  expression: TypeExpression,
  collection: Collection,
  seen: Set<DefinitionId>,
  budget: DisplayBudget,
): string {
  if (budget.remaining <= 0) {
    budget.truncated = true;
    return '';
  }
  budget.remaining -= 1;
  return displayKind(expression, collection, seen, budget);
}

function displayKind(
  expression: TypeExpression,
  collection: Collection,
  seen: Set<DefinitionId>,
  budget: DisplayBudget,
): string {
  if (expression.kind === 'union') return displayUnion(expression.items, collection, seen, budget);
  return displayNonUnion(expression, collection, seen, budget);
}

function displayNonUnion(
  expression: Exclude<TypeExpression, { readonly kind: 'union' }>,
  collection: Collection,
  seen: Set<DefinitionId>,
  budget: DisplayBudget,
): string {
  return nonUnionPrinters[expression.kind](expression, collection, seen, budget);
}

const nonUnionPrinters = {
  primitive: (
    expression: NonUnionExpression,
    collection: Collection,
    seen: Set<DefinitionId>,
    budget: DisplayBudget,
  ): string => {
    void collection;
    void seen;
    void budget;
    return (expression as Extract<TypeExpression, { readonly kind: 'primitive' }>).name;
  },
  literal: (
    expression: NonUnionExpression,
    collection: Collection,
    seen: Set<DefinitionId>,
    budget: DisplayBudget,
  ): string => {
    void collection;
    void seen;
    void budget;
    return displayLiteral(
      (expression as Extract<TypeExpression, { readonly kind: 'literal' }>).value,
    );
  },
  reference: (
    expression: NonUnionExpression,
    collection: Collection,
    seen: Set<DefinitionId>,
    budget: DisplayBudget,
  ): string =>
    displayReference(
      (expression as Extract<TypeExpression, { readonly kind: 'reference' }>).id,
      collection,
      seen,
      budget,
    ),
};

type NonUnionExpression = Exclude<TypeExpression, { readonly kind: 'union' }>;

function displayUnion(
  items: readonly TypeExpression[],
  collection: Collection,
  seen: Set<DefinitionId>,
  budget: DisplayBudget,
): string {
  const parts: string[] = [];
  let index = 0;
  while (index < items.length && budget.remaining > 0) {
    parts.push(displayExpression(items[index] as TypeExpression, collection, seen, budget));
    index += 1;
  }
  markTruncated(budget, index, items.length);
  return parts.filter((part) => part.length > 0).join(' | ');
}

function markTruncated(budget: DisplayBudget, index: number, length: number): void {
  if (index < length && budget.remaining <= 0) budget.truncated = true;
}

function displayReference(
  id: DefinitionId,
  collection: Collection,
  seen: Set<DefinitionId>,
  budget: DisplayBudget,
): string {
  if (seen.has(id)) return `@${id}`;
  const target = collection.definitions.find((definition) => definition.id === id);
  if (target === undefined) return `@${id}`;
  const next = new Set(seen);
  next.add(id);
  return displayExpression(target.expression, collection, next, budget);
}

/** Resolve one definition ref to deterministic display text, expanding shared aliases with a bound. */
function resolvedDefinitionDisplay(collection: Collection, id: DefinitionId): string {
  const definition = collection.definitions.find((item) => item.id === id);
  if (definition === undefined) return `@${id}`;
  const budget = { remaining: MAX_NODES, truncated: false };
  const display = displayExpression(definition.expression, collection, new Set([id]), budget);
  return budget.truncated ? `${display} …` : display;
}

export function definitionDisplay(collection: Collection, id: DefinitionId): Result<string> {
  if (!collection.definitions.some((definition) => definition.id === id))
    return failure('not-found', `definitions.${id}`, 'Definition ID must exist');
  return success(resolvedDefinitionDisplay(collection, id));
}

/** Resolve a field's old string or shared reference without ever stringifying an object. */
export function fieldTypeDisplay(collection: Collection, field: Field): string {
  return typeof field.type === 'string'
    ? field.type
    : resolvedDefinitionDisplay(collection, field.type.id);
}

/** Direct usages are unique, stable and include definition-to-definition paths. */
export function definitionUsages(
  collection: Collection,
  id: DefinitionId,
): Result<readonly DefinitionUsage[]> {
  if (!collection.definitions.some((definition) => definition.id === id))
    return failure('not-found', `definitions.${id}`, 'Definition ID must exist');
  const fieldUses: DefinitionUsage[] = collection.objects.flatMap((object) =>
    object.content.flatMap((block) =>
      block.kind === 'field' && typeof block.type !== 'string' && block.type.id === id
        ? [
            {
              kind: 'field',
              definition: id,
              path: `objects.${object.id}.content.${block.id}.type`,
              object: object.id,
              field: block.id,
            },
          ]
        : [],
    ),
  );
  const definitionUses: DefinitionUsage[] = collection.definitions.flatMap((definition) =>
    expressionReferences(definition.expression, `definitions.${definition.id}.expression`)
      .filter((reference) => reference.id === id)
      .map((reference) => ({ kind: 'definition', definition: id, path: reference.path })),
  );
  return success(
    [...fieldUses, ...definitionUses].toSorted((a, b) => a.path.localeCompare(b.path)),
  );
}
