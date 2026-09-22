/** v2 change blocks lower to collection-level records; objects never carry change status. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, optional, text, type RawRecord } from '../fields.js';
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
    target: changeTarget(value as Reference, symbols),
  }));
}
/** A bare declared wire id is a relationship; everything else addresses an object, unresolved ones left to Model. */
function changeTarget(ref: Reference, symbols: SymbolTable): RawRecord {
  if (isWireRef(ref, symbols)) return { kind: 'relationship', relationship: ref.id };
  return { kind: 'object', object: ref.id, ...optional('member', ref.member) };
}
function isWireRef(ref: Reference, symbols: SymbolTable): boolean {
  return symbols.wires.has(ref.id) && ref.member === undefined;
}
