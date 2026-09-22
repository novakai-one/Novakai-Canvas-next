/** Declaration-order symbol table resolves v2 @refs to entity ids or definition ids before Model sees them. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, text, textOr } from '../fields.js';
export interface SymbolTable {
  readonly definitions: ReadonlyMap<string, string>;
  readonly entities: ReadonlySet<string>;
  readonly options: readonly string[];
  readonly labels: ReadonlyMap<string, string>;
}
export function buildSymbols(declare: Declaration): SymbolTable {
  const definitions = new Map<string, string>();
  const entities = new Set<string>();
  const options: string[] = [];
  const labels = new Map<string, string>();
  declare.children.forEach((child) => addSymbols(child, definitions, entities, options, labels));
  return { definitions, entities, options, labels };
}
function addSymbols(
  child: Declaration,
  definitions: Map<string, string>,
  entities: Set<string>,
  options: string[],
  labels: Map<string, string>,
): void {
  if (child.kind === 'type') addTypeSymbols(child, definitions, options);
  if (child.kind === 'node') addNodeSymbols(child, definitions, entities, options, labels);
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
/** Entity nodes register their own id; every node also gets a label for container titles (A.7). */
function addNodeSymbols(
  child: Declaration,
  definitions: Map<string, string>,
  entities: Set<string>,
  options: string[],
  labels: Map<string, string>,
): void {
  const nodeId = id(child.fields);
  if (text(child.fields, 'kind') === 'entity') entities.add(nodeId);
  labels.set(nodeId, textOr(child.fields, 'label', nodeId));
  child.children
    .filter((grand) => grand.kind === 'type')
    .forEach((grand) => {
      addMemberSymbols(grand, nodeId, definitions, options);
    });
}
/** Module/interface type members are keyed by the bare type id so file-wide bare refs resolve (A7). */
function addMemberSymbols(
  grand: Declaration,
  nodeId: string,
  definitions: Map<string, string>,
  options: string[],
): void {
  list(grand.fields, 'ids').forEach((value) => {
    const typeId = (value as Reference).id;
    addMemberSymbol(definitions, options, nodeId, typeId);
  });
}
function addMemberSymbol(
  definitions: Map<string, string>,
  options: string[],
  nodeId: string,
  typeId: string,
): void {
  if (definitions.has(typeId)) return;
  definitions.set(typeId, `${nodeId}-${typeId}`);
  options.push(typeId);
}
