import type { Expression, Dependencies, TokenDefinition } from '../../contract/records/tokens.js';
/** Every recipe edge is explicit; graph construction performs no resolution or mutation. */
export function expressionReferences(expression: Expression): readonly string[] {
  return readers[expression.op](expression);
}
/** Exhaustive handlers keep each operator's traversal visible. */
const readers: Readonly<Record<Expression['op'], (expression: Expression) => readonly string[]>> = {
  literal: () => [],
  reference: referenceTargets,
  multiply: multiplyTargets,
  alpha: alphaTargets,
  sum: aggregateTargets,
  max: aggregateTargets,
};
/** Narrow a reference node; the discriminant is checked before reading its payload. */
function referenceTargets(expression: Expression): readonly string[] {
  if (expression.op !== 'reference') return [];
  return [expression.target];
}
/** Scalar and dimension dependencies both affect the emitted value. */
function multiplyTargets(expression: Expression): readonly string[] {
  if (expression.op !== 'multiply') return [];
  return [...expressionReferences(expression.value), ...expressionReferences(expression.scalar)];
}
/** Alpha and source color both affect contrast and identity. */
function alphaTargets(expression: Expression): readonly string[] {
  if (expression.op !== 'alpha') return [];
  return [...expressionReferences(expression.color), ...expressionReferences(expression.scalar)];
}
/** Aggregate nodes share one ordered child list. */
function aggregateTargets(expression: Expression): readonly string[] {
  if (!('values' in expression)) return [];
  return expression.values.flatMap(expressionReferences);
}
/** Dependencies are deduplicated in source order; missing/cyclic edges fail in the resolver. */
export function dependencyGraph(definitions: readonly TokenDefinition[]): Dependencies {
  return Object.fromEntries(
    definitions.map((definition) => [
      definition.id,
      [...new Set(expressionReferences(definition.expression))],
    ]),
  );
}
