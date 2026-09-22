/** Declaration-order symbol table resolves v2 @refs to entity ids or definition ids before Model sees them. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, text, textOr } from '../fields.js';
export interface MemberFact {
  readonly id: string;
  readonly kind: 'field' | 'signature' | 'member' | 'keygroup';
}
export interface NodeFacts {
  readonly kind: string;
  readonly members: readonly MemberFact[];
}
export interface SymbolTable {
  readonly definitions: ReadonlyMap<string, string>;
  readonly entities: ReadonlySet<string>;
  readonly options: readonly string[];
  readonly labels: ReadonlyMap<string, string>;
  readonly nodes: ReadonlyMap<string, NodeFacts>;
  readonly wires: ReadonlySet<string>;
  /** Scenarios in declare order; sequence sections show exactly one of them. */
  readonly scenarios: ReadonlyMap<string, Declaration>;
}
export function buildSymbols(declare: Declaration): SymbolTable {
  const wires = new Set(
    declare.children.filter((child) => child.kind === 'wire').map((child) => id(child.fields)),
  );
  const definitions = new Map<string, string>();
  const entities = new Set<string>();
  const options: string[] = [];
  const labels = new Map<string, string>();
  const nodes = new Map<string, NodeFacts>();
  declare.children.forEach((child) =>
    addSymbols(child, definitions, entities, options, labels, nodes),
  );
  const scenarios = new Map(
    declare.children
      .filter((child) => child.kind === 'scenario')
      .map((child) => [id(child.fields), child] as const),
  );
  return { definitions, entities, options, labels, nodes, wires, scenarios };
}
function addSymbols(
  child: Declaration,
  definitions: Map<string, string>,
  entities: Set<string>,
  options: string[],
  labels: Map<string, string>,
  nodes: Map<string, NodeFacts>,
): void {
  if (child.kind === 'type') addTypeSymbols(child, definitions, options);
  if (child.kind === 'node') addNodeSymbols(child, definitions, entities, options, labels, nodes);
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
  nodes: Map<string, NodeFacts>,
): void {
  const nodeId = id(child.fields);
  if (text(child.fields, 'kind') === 'entity') entities.add(nodeId);
  labels.set(nodeId, textOr(child.fields, 'label', nodeId));
  child.children
    .filter((grand) => grand.kind === 'type')
    .forEach((grand) => {
      addMemberSymbols(grand, nodeId, definitions, options);
    });
  nodes.set(nodeId, buildNodeFacts(child));
}
/** Wire endpoint predicates (A.5) key member legality off the owning node's authored kind. */
function buildNodeFacts(child: Declaration): NodeFacts {
  return { kind: text(child.fields, 'kind'), members: child.children.flatMap(memberFactsOf) };
}
const memberFactKinds: Readonly<Record<string, MemberFact['kind']>> = {
  field: 'field',
  signature: 'signature',
  keygroup: 'keygroup',
};
function memberFactsOf(grand: Declaration): readonly MemberFact[] {
  if (grand.kind === 'type') return typeMemberFacts(grand);
  const kind = memberFactKinds[grand.kind];
  if (kind === undefined) return [];
  return [{ id: id(grand.fields), kind }];
}
function typeMemberFacts(grand: Declaration): readonly MemberFact[] {
  return list(grand.fields, 'ids').map((value) => ({
    id: (value as Reference).id,
    kind: 'member' as const,
  }));
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
