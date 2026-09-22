/** v2 change blocks lower to collection-level records; objects never carry change status. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, optional, text, type RawRecord } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
import type { SymbolTable } from './symbols.js';
export function lowerV2Changes(declare: Declaration, symbols: SymbolTable): readonly RawRecord[] {
  return declare.children
    .filter((child) => child.kind === 'change')
    .map((child) => lowerChange(child, symbols));
}
function lowerChange(item: Declaration, symbols: SymbolTable): RawRecord {
  return {
    id: id(item.fields),
    title: text(item.fields, 'title'),
    entries: item.children.flatMap((op) => opEntries(op, symbols)),
  };
}
/** Each op contributes its refs in source order, with the op keyword as the status. */
function opEntries(op: Declaration, symbols: SymbolTable): readonly RawRecord[] {
  return list(op.fields, 'refs').map((value) => ({
    status: op.kind,
    target: changeTarget(value as Reference, op, symbols),
  }));
}
/** A bare declared wire id is a relationship; everything else addresses an object, unresolved ones left to Model. */
function changeTarget(ref: Reference, op: Declaration, symbols: SymbolTable): RawRecord {
  if (symbols.scenarios.has(ref.id)) rejectScenarioTarget(op, ref.id);
  if (isWireRef(ref, symbols)) return { kind: 'relationship', relationship: ref.id };
  return { kind: 'object', object: ref.id, ...optional('member', ref.member) };
}
function isWireRef(ref: Reference, symbols: SymbolTable): boolean {
  return symbols.wires.has(ref.id) && ref.member === undefined;
}
/** Scenarios are views of calls, not diagram objects, so no change entry can mark one. */
function rejectScenarioTarget(op: Declaration, scenarioId: string): never {
  reject(
    'unknown-target',
    op.span,
    'A node, member or wire',
    `E101 resolve: @${scenarioId} is a scenario; change entries target nodes, members or wires.`,
  );
}
