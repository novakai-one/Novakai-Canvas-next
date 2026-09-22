/** v2 object members dispatch by construct kind; each producer builds its own RawRecord shape. */
import type {
  Declaration,
  LocatedValue,
  Reference,
  Span,
} from '../../../contract/records/syntax.js';
import { field, id, text, textOr, list, type RawRecord } from '../fields.js';
import { lowerRecord } from '../content.js';
import { reject } from '../../validation/outcomes.js';
import { constructsV2 } from '../../vocabulary/constructs-v2.js';
import { lowerTypeUse } from './types.js';
import type { SymbolTable } from './symbols.js';
export function lowerV2Node(item: Declaration, symbols: SymbolTable): RawRecord {
  return {
    ...lowerRecord(item, constructsV2),
    label: textOr(item.fields, 'label', id(item.fields)),
    content: lowerMembers(item, symbols),
  };
}
function lowerMembers(node: Declaration, symbols: SymbolTable): readonly RawRecord[] {
  return node.children.flatMap((child) => lowerMemberBlocks(node, child, symbols));
}
/** A `type` grandchild becomes one addressable member block per id (A.5 module.type import target). */
function lowerMemberBlocks(
  node: Declaration,
  child: Declaration,
  symbols: SymbolTable,
): readonly RawRecord[] {
  if (child.kind === 'type') return lowerTypeMemberBlocks(node, child);
  return [lowerMember(node, child, symbols)];
}
function lowerTypeMemberBlocks(node: Declaration, child: Declaration): readonly RawRecord[] {
  const nodeId = id(node.fields);
  return list(child.fields, 'ids').map((value) =>
    typeMemberBlock(node, child, nodeId, (value as Reference).id),
  );
}
function typeMemberBlock(
  node: Declaration,
  child: Declaration,
  nodeId: string,
  typeId: string,
): RawRecord {
  checkModuleMemberAllowed(node, child.span, 'type member');
  return {
    kind: 'member',
    id: typeId,
    label: typeId,
    type: { kind: 'definition', id: `${nodeId}-${typeId}` },
  };
}
function lowerMember(node: Declaration, child: Declaration, symbols: SymbolTable): RawRecord {
  const lowerers: Readonly<Record<string, () => RawRecord>> = {
    field: () => lowerFieldMember(node, child, symbols),
    signature: () => lowerSignatureMember(node, child, symbols),
    keygroup: () => lowerKeygroupMember(node, child),
  };
  const lower = lowerers[child.kind];
  if (lower === undefined)
    reject('invalid-input', child.span, 'field, signature, or keygroup', 'Unknown node member');
  return lower();
}
/** key and references come through lowerRecord; nullable is left to the Model default. */
function lowerFieldMember(node: Declaration, child: Declaration, symbols: SymbolTable): RawRecord {
  checkFieldAllowed(node, child);
  return {
    ...lowerRecord(child, constructsV2),
    kind: 'field',
    label: id(child.fields),
    type: lowerTypeUse(field(child.fields, 'type'), symbols),
  };
}
function lowerSignatureMember(
  node: Declaration,
  child: Declaration,
  symbols: SymbolTable,
): RawRecord {
  checkModuleMemberAllowed(node, child.span, 'signature');
  return {
    kind: 'signature',
    id: id(child.fields),
    label: id(child.fields),
    parameters: lowerParameters(child, symbols),
    returns: lowerTypeUse(field(child.fields, 'returns'), symbols),
  };
}
/** E109: field/keygroup members are entity-only; signature/type members are module-or-interface-only. */
function isModuleLike(nodeKind: string): boolean {
  if (nodeKind === 'module') return true;
  return nodeKind === 'interface';
}
const membersByKind: Readonly<Record<string, readonly string[]>> = {
  entity: ['field', 'keygroup'],
  module: ['signature'],
  interface: ['signature'],
};
function memberList(nodeKind: string): string {
  const members = membersByKind[nodeKind];
  if (members === undefined || members.length === 0) return 'none';
  return members.join(', ');
}
function checkEntityMemberAllowed(node: Declaration, span: Span, memberWord: string): void {
  const nodeKind = text(node.fields, 'kind');
  if (nodeKind === 'entity') return;
  rejectMemberKind(span, memberWord, id(node.fields), nodeKind, 'entity');
}
function checkFieldAllowed(node: Declaration, child: Declaration): void {
  checkEntityMemberAllowed(node, child.span, 'field');
}
function checkKeygroupAllowed(node: Declaration, child: Declaration): void {
  checkEntityMemberAllowed(node, child.span, 'keygroup');
}
function checkModuleMemberAllowed(node: Declaration, span: Span, memberWord: string): void {
  const nodeKind = text(node.fields, 'kind');
  if (isModuleLike(nodeKind)) return;
  rejectMemberKind(span, memberWord, id(node.fields), nodeKind, 'module or interface');
}
function rejectMemberKind(
  span: Span,
  memberWord: string,
  nodeId: string,
  nodeKind: string,
  allowedNoun: string,
): never {
  reject(
    'unrepresentable',
    span,
    allowedNoun,
    `E109 member: ${memberWord} only in ${allowedNoun}. @${nodeId} is ${nodeKind}; ${nodeKind} members: ${memberList(nodeKind)}.`,
  );
}
function lowerParameters(child: Declaration, symbols: SymbolTable): readonly RawRecord[] {
  const parameters = child.fields.parameters;
  if (parameters === undefined) return [];
  return (parameters.items ?? []).map((item) => lowerParameter(item, symbols));
}
function lowerParameter(item: LocatedValue, symbols: SymbolTable): RawRecord {
  const tuple = item.items ?? [];
  return { name: tuple[0]?.value, type: lowerTypeUse(tuple[1] as LocatedValue, symbols) };
}
/** The v2 property is `kind=`; the Model field is `key`, so this rename cannot come from lowerRecord. */
function lowerKeygroupMember(node: Declaration, child: Declaration): RawRecord {
  checkKeygroupAllowed(node, child);
  return {
    kind: 'keygroup',
    id: id(child.fields),
    key: text(child.fields, 'kind'),
    fields: list(child.fields, 'fields').map((value) => (value as Reference).id),
  };
}
