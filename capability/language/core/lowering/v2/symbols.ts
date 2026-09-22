/** Declaration-order symbol table resolves v2 @refs to entity ids or definition ids before Model sees them. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, text } from '../fields.js';
export interface SymbolTable {
  readonly definitions: ReadonlyMap<string, string>;
  readonly entities: ReadonlySet<string>;
  readonly options: readonly string[];
}
export function buildSymbols(declare: Declaration): SymbolTable {
  const definitions = new Map<string, string>();
  const entities = new Set<string>();
  const options: string[] = [];
  declare.children.forEach((child) => addSymbols(child, definitions, entities, options));
  return { definitions, entities, options };
}
function addSymbols(
  child: Declaration,
  definitions: Map<string, string>,
  entities: Set<string>,
  options: string[],
): void {
  if (child.kind === 'type') addTypeSymbols(child, definitions, options);
  if (child.kind === 'node') addNodeSymbols(child, definitions, entities);
}
/** Bare type declarations map to themselves and feed the unknown-type suggestion list. */
function addTypeSymbols(
  child: Declaration,
  definitions: Map<string, string>,
  options: string[],
): void {
  list(child.fields, 'ids').forEach((value) =>
    addTypeSymbol(definitions, options, (value as Reference).id),
  );
}
function addTypeSymbol(definitions: Map<string, string>, options: string[], typeId: string): void {
  if (definitions.has(typeId)) return;
  definitions.set(typeId, typeId);
  options.push(typeId);
}
/** Entity nodes register their own id; module/interface type members register namespaced ids. */
function addNodeSymbols(
  child: Declaration,
  definitions: Map<string, string>,
  entities: Set<string>,
): void {
  const nodeId = id(child.fields);
  if (text(child.fields, 'kind') === 'entity') entities.add(nodeId);
  child.children
    .filter((grand) => grand.kind === 'type')
    .forEach((grand) => {
      addMemberSymbols(grand, nodeId, definitions);
    });
}
function addMemberSymbols(
  grand: Declaration,
  nodeId: string,
  definitions: Map<string, string>,
): void {
  list(grand.fields, 'ids').forEach((value) => {
    const typeId = (value as Reference).id;
    addDefinition(definitions, `${nodeId}-${typeId}`);
  });
}
function addDefinition(definitions: Map<string, string>, key: string): void {
  if (!definitions.has(key)) definitions.set(key, key);
}
