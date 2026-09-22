/** v2 object members dispatch by construct kind; each producer builds its own RawRecord shape. */
import type { Declaration, LocatedValue, Reference } from '../../../contract/records/syntax.js';
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
function lowerMembers(item: Declaration, symbols: SymbolTable): readonly RawRecord[] {
  return item.children
    .filter((child) => child.kind !== 'type')
    .map((child) => lowerMember(child, symbols));
}
function lowerMember(child: Declaration, symbols: SymbolTable): RawRecord {
  const lowerers: Readonly<Record<string, () => RawRecord>> = {
    field: () => lowerFieldMember(child, symbols),
    signature: () => lowerSignatureMember(child, symbols),
    keygroup: () => lowerKeygroupMember(child),
  };
  const lower = lowerers[child.kind];
  if (lower === undefined)
    reject('invalid-input', child.span, 'field, signature, or keygroup', 'Unknown node member');
  return lower();
}
/** key and references come through lowerRecord; nullable is left to the Model default. */
function lowerFieldMember(child: Declaration, symbols: SymbolTable): RawRecord {
  return {
    ...lowerRecord(child, constructsV2),
    kind: 'field',
    label: id(child.fields),
    type: lowerTypeUse(field(child.fields, 'type'), symbols),
  };
}
function lowerSignatureMember(child: Declaration, symbols: SymbolTable): RawRecord {
  return {
    kind: 'signature',
    id: id(child.fields),
    label: id(child.fields),
    parameters: lowerParameters(child, symbols),
    returns: lowerTypeUse(field(child.fields, 'returns'), symbols),
  };
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
function lowerKeygroupMember(child: Declaration): RawRecord {
  return {
    kind: 'keygroup',
    id: id(child.fields),
    key: text(child.fields, 'kind'),
    fields: list(child.fields, 'fields').map((value) => (value as Reference).id),
  };
}
