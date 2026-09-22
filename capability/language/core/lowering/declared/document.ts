/** Build declared canonical RawRecord data from declare + collection; Model validates identities afterward. */
import type { Declaration, Document, LocatedValue } from '../../../contract/records/syntax.js';
import type { LowerRequest } from '../../../contract/records/requests.js';
import { field, id, text, textOr, reference, endpoint, type RawRecord } from '../fields.js';
import { lowerRecord } from '../content.js';
import { lowerLayout } from '../layout.js';
import { resolveTheme } from '../resources.js';
import { reject, accepted } from '../../validation/outcomes.js';
import { declaredConstructs } from '../../vocabulary/constructs-declared.js';
import { buildSymbols, type SymbolTable } from './symbols.js';
import { lowerDeclaredNode } from './objects.js';
import { lowerDeclaredWire } from './relationships.js';
import { lowerDeclaredDefinitions } from './definitions.js';
import { lowerDeclaredSection } from './sections.js';
import { lowerDeclaredChanges } from './changes.js';
import { checkModulesWireLabels } from './wire-policy.js';
import { checkUniqueIds, idValues } from './unique-ids.js';
export function lowerDeclaredDocument(document: Document, request: LowerRequest): RawRecord {
  const declare = requireDeclare(document);
  const collection = document.declaration;
  checkReservedIds(declare);
  checkReservedIds(collection);
  checkUniqueIds(declare, collection);
  const symbols = buildSymbols(declare);
  const { uses, ...metadata } = lowerRecord(collection, declaredConstructs);
  void uses;
  const wireDeclarations = recordsOf(declare, 'wire');
  const authoredWires = wireDeclarations.map((item) => lowerDeclaredWire(item, symbols));
  const fkWires = buildForeignKeyWires(declare);
  checkNoAssociationCollisions(wireDeclarations, authoredWires, fkWires);
  checkModulesWireLabels(collection, wireDeclarations);
  const sectionResults = recordsOf(collection, 'section').map((item) =>
    lowerDeclaredSection(item, symbols),
  );
  return {
    ...metadata,
    schemaVersion: 1,
    revision: request.snapshot?.revision ?? 0,
    theme: resolveTheme(
      textOr(collection.fields, 'theme', 'paper'),
      request.resources,
      collection.span,
    ),
    arrangement: accepted(lowerLayout(collection.fields, [], 'grid')),
    objects: recordsOf(declare, 'node').map((item) => lowerDeclaredNode(item, symbols)),
    relationships: [
      ...authoredWires,
      ...fkWires,
      ...sectionResults.flatMap((result) => result.derived),
    ],
    definitions: lowerDeclaredDefinitions(declare),
    sections: sectionResults.map((result) => result.section),
    sources: [],
    assets: [],
    ...changesField(lowerDeclaredChanges(declare, withDerivedWires(symbols, fkWires))),
  };
}
/** Change blocks may target derived fk- wires; their ids come from the built records, not re-formatted. */
function withDerivedWires(symbols: SymbolTable, derived: readonly RawRecord[]): SymbolTable {
  const derivedIds = derived.map((wire) => wire.id as string);
  return { ...symbols, wires: new Set([...symbols.wires, ...derivedIds]) };
}
/** Omitted when empty so documents without change blocks lower exactly as before. */
function changesField(changes: readonly RawRecord[]): RawRecord {
  if (changes.length === 0) return {};
  return { changes };
}
/** E203: fk- (derived associations) and parent- (derived containment) are never authored ids. */
const reservedPrefixes: readonly string[] = ['fk-', 'parent-'];
function checkReservedIds(node: Declaration): void {
  idValues(node).forEach(checkNotReservedPrefix);
  node.children.forEach(checkReservedIds);
}
function checkNotReservedPrefix(item: LocatedValue): void {
  const authoredId = reference(item).id;
  const prefix = reservedPrefixes.find((candidate) => authoredId.startsWith(candidate));
  if (prefix === undefined) return;
  reject(
    'unrepresentable',
    item.span,
    'A non-derived id',
    `E203 duplicate: @${authoredId} uses the reserved ${prefix} prefix.`,
  );
}
/** Keygroup-form foreign keys derive nothing; only scalar `field` members do. */
function buildForeignKeyWires(declare: Declaration): readonly RawRecord[] {
  return recordsOf(declare, 'node')
    .filter((node) => text(node.fields, 'kind') === 'entity')
    .flatMap(entityForeignKeyWires);
}
function entityForeignKeyWires(node: Declaration): readonly RawRecord[] {
  const entityId = id(node.fields);
  return node.children
    .filter((child) => child.kind === 'field')
    .flatMap((child) => foreignKeyWire(entityId, child));
}
/** Many referring rows point at one referenced key: from = the referring field, to = the key. */
function foreignKeyWire(entityId: string, child: Declaration): readonly RawRecord[] {
  if (!isForeignField(child)) return [];
  const fieldId = id(child.fields);
  const target = reference(field(child.fields, 'references'));
  return [
    {
      id: `fk-${entityId}-${fieldId}`,
      kind: 'association',
      source: { object: entityId, member: fieldId },
      target: endpoint(target),
      from: '0..many',
      to: '1',
    },
  ];
}
function isForeignField(child: Declaration): boolean {
  if (child.fields.key === undefined || child.fields.references === undefined) return false;
  return text(child.fields, 'key') === 'foreign';
}
/** E201: an authored association wire may not repeat a derived fk- wire's endpoint pair, in either direction. */
function checkNoAssociationCollisions(
  declarations: readonly Declaration[],
  wires: readonly RawRecord[],
  fkWires: readonly RawRecord[],
): void {
  declarations.forEach((declaration, index) =>
    checkAssociationCollision(declaration, wires[index] as RawRecord, fkWires),
  );
}
function checkAssociationCollision(
  declaration: Declaration,
  wire: RawRecord,
  fkWires: readonly RawRecord[],
): void {
  if (wire.kind !== 'association') return;
  const collision = fkWires.find((fk) => sameEndpoints(wire, fk));
  if (collision !== undefined) rejectDuplicateAssociation(declaration, collision);
}
function sameEndpoints(a: RawRecord, b: RawRecord): boolean {
  return matchesPair(a, b) || matchesPair({ source: a.target, target: a.source }, b);
}
function matchesPair(a: RawRecord, b: RawRecord): boolean {
  return sameEndpoint(a.source, b.source) && sameEndpoint(a.target, b.target);
}
function sameEndpoint(a: unknown, b: unknown): boolean {
  const left = a as { object?: string; member?: string };
  const right = b as { object?: string; member?: string };
  return left.object === right.object && left.member === right.member;
}
function rejectDuplicateAssociation(declaration: Declaration, collision: RawRecord): never {
  const authoredId = id(declaration.fields);
  reject(
    'unrepresentable',
    declaration.span,
    'One association',
    `E201 duplicate: @${authoredId} repeats the derived @${collision.id as string}.`,
  );
}
function requireDeclare(document: Document): Declaration {
  if (document.declare === undefined)
    reject(
      'invalid-input',
      document.span,
      'declare block',
      'A canvas 2 document requires its declare block',
    );
  return document.declare;
}
function recordsOf(item: Declaration, kind: Declaration['kind']): readonly Declaration[] {
  return item.children.filter((child) => child.kind === kind);
}
