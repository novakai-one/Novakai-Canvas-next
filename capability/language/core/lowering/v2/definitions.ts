/** One opaque Model definition per v2 type declaration or module/interface type member. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, type RawRecord } from '../fields.js';
export function lowerV2Definitions(declare: Declaration): readonly RawRecord[] {
  return declare.children.flatMap(lowerDeclarationDefinitions);
}
function lowerDeclarationDefinitions(child: Declaration): readonly RawRecord[] {
  if (child.kind === 'type') return lowerTypeDefinitions(child);
  if (child.kind === 'node') return lowerNodeDefinitions(child);
  return [];
}
function lowerTypeDefinitions(child: Declaration): readonly RawRecord[] {
  return list(child.fields, 'ids').map((value) => {
    const typeId = (value as Reference).id;
    return opaqueDefinition(typeId, typeId);
  });
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
