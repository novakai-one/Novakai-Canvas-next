/** Build v2 canonical RawRecord data from declare + collection; Model validates identities afterward. */
import type { Declaration, Document, LocatedValue } from '../../../contract/records/syntax.js';
import type { LowerRequest } from '../../../contract/records/requests.js';
import { field, id, text, textOr, reference, endpoint, type RawRecord } from '../fields.js';
import { lowerRecord } from '../content.js';
import { lowerLayout } from '../layout.js';
import { resolveTheme } from '../resources.js';
import { reject, accepted } from '../../validation/outcomes.js';
import { constructsV2 } from '../../vocabulary/constructs-v2.js';
import { buildSymbols } from './symbols.js';
import { lowerV2Node } from './objects.js';
import { lowerV2Wire } from './relationships.js';
import { lowerV2Definitions } from './definitions.js';
import { lowerV2Section } from './sections.js';
export function lowerDocumentDataV2(document: Document, request: LowerRequest): RawRecord {
  const declare = requireDeclare(document);
  const collection = document.declaration;
  checkReservedIds(declare);
  checkReservedIds(collection);
  const symbols = buildSymbols(declare);
  const { uses, ...metadata } = lowerRecord(collection, constructsV2);
  void uses;
  const wireDeclarations = recordsOf(declare, 'wire');
  const authoredWires = wireDeclarations.map((item) => lowerV2Wire(item, symbols));
  const fkWires = buildForeignKeyWires(declare);
  checkNoAssociationCollisions(wireDeclarations, authoredWires, fkWires);
  const sectionResults = recordsOf(collection, 'section').map((item) =>
    lowerV2Section(item, symbols),
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
    objects: recordsOf(declare, 'node').map((item) => lowerV2Node(item, symbols)),
    relationships: [
      ...authoredWires,
      ...fkWires,
      ...sectionResults.flatMap((result) => result.derived),
    ],
    definitions: lowerV2Definitions(declare),
    sections: sectionResults.map((result) => result.section),
    sources: [],
    assets: [],
  };
}
/** Only `type` declares ids via a list; every other declaring construct uses a single `id`. */
function declaredIdValues(node: Declaration): readonly LocatedValue[] {
  if (node.fields.id !== undefined) return [field(node.fields, 'id')];
  if (node.kind === 'type') return field(node.fields, 'ids').items ?? [];
  return [];
}
/** E203: the fk- prefix is reserved for derived association wires, never an authored id. */
function checkReservedIds(node: Declaration): void {
  declaredIdValues(node).forEach(checkNotReservedPrefix);
  node.children.forEach(checkReservedIds);
}
function checkNotReservedPrefix(item: LocatedValue): void {
  const authoredId = reference(item).id;
  if (!authoredId.startsWith('fk-')) return;
  reject(
    'unrepresentable',
    item.span,
    'A non-derived id',
    `E203 duplicate: @${authoredId} uses the reserved fk- prefix.`,
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
