/** One opaque or literal-union Model definition per declared type declaration; node type members stay opaque. */
import type { Declaration, LocatedValue, Reference } from '../../../contract/records/syntax.js';
import { field, id, list, type RawRecord } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
export function lowerDeclaredDefinitions(declare: Declaration): readonly RawRecord[] {
  return declare.children.flatMap(lowerDeclarationDefinitions);
}
function lowerDeclarationDefinitions(child: Declaration): readonly RawRecord[] {
  if (child.kind === 'type') return lowerTypeDefinitions(child);
  if (child.kind === 'node') return lowerNodeDefinitions(child);
  return [];
}
function lowerTypeDefinitions(child: Declaration): readonly RawRecord[] {
  const expression = child.fields.expression;
  if (expression === undefined) return lowerOpaqueDefinitions(child);
  return [lowerLiteralUnionDefinition(child, expression)];
}
function lowerOpaqueDefinitions(child: Declaration): readonly RawRecord[] {
  return list(child.fields, 'ids').map((value) => {
    const typeId = (value as Reference).id;
    return opaqueDefinition(typeId, typeId);
  });
}
/** E115: exactly one id owns a literal-union expression, so its members share one shape. */
function lowerLiteralUnionDefinition(child: Declaration, expression: LocatedValue): RawRecord {
  const typeId = requireSingleId(child);
  const literals = expression.items ?? [];
  checkDistinctLiterals(literals);
  return { id: typeId, label: typeId, expression: unionExpression(literals) };
}
function requireSingleId(child: Declaration): string {
  const idsField = field(child.fields, 'ids');
  const ids = list(child.fields, 'ids');
  if (ids.length === 1) return (ids[0] as Reference).id;
  return rejectManyIds(idsField, ids);
}
function rejectManyIds(idsField: LocatedValue, ids: readonly unknown[]): never {
  const found = ids.map((value) => `@${(value as Reference).id}`).join(', ');
  reject(
    'invalid-value',
    idsField.span,
    'One type id',
    `E115 union: a union type declares one id; found ${found}.`,
  );
}
/** E116: a repeated literal collapses two union members into one, which is never intended. */
function checkDistinctLiterals(literals: readonly LocatedValue[]): void {
  const seen = new Set<string>();
  literals.forEach((item) => checkLiteralUnseen(item, seen));
}
function checkLiteralUnseen(item: LocatedValue, seen: Set<string>): void {
  const value = item.value as string;
  if (seen.has(value)) rejectRepeatedLiteral(item, value);
  seen.add(value);
}
function rejectRepeatedLiteral(item: LocatedValue, value: string): never {
  reject('invalid-value', item.span, 'Distinct literals', `E116 literal: '${value}' is repeated.`);
}
function unionExpression(literals: readonly LocatedValue[]): RawRecord {
  if (literals.length === 1) return literalExpression(literals[0] as LocatedValue);
  return { kind: 'union', items: literals.map((item) => literalExpression(item)) };
}
function literalExpression(item: LocatedValue): RawRecord {
  return { kind: 'literal', value: item.value };
}
function lowerNodeDefinitions(child: Declaration): readonly RawRecord[] {
  const nodeId = id(child.fields);
  return child.children
    .filter((grand) => grand.kind === 'type')
    .flatMap((grand) => lowerMemberDefinitions(grand, nodeId));
}
function lowerMemberDefinitions(grand: Declaration, nodeId: string): readonly RawRecord[] {
  return list(grand.fields, 'ids').map((value) => {
    const typeId = (value as Reference).id;
    return opaqueDefinition(`${nodeId}-${typeId}`, typeId);
  });
}
function opaqueDefinition(definitionId: string, label: string): RawRecord {
  return { id: definitionId, label, expression: { kind: 'opaque' } };
}
