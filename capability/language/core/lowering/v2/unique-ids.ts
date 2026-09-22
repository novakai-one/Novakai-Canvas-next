/** One id namespace (A.1): declare, section, node, type, wire, change and scenario ids never repeat. */
import type { Declaration, LocatedValue } from '../../../contract/records/syntax.js';
import { field, reference } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
interface DeclaredId {
  readonly id: string;
  readonly kind: string;
  readonly value: LocatedValue;
}
const idKinds: ReadonlySet<string> = new Set([
  'declare',
  'collection',
  'section',
  'node',
  'type',
  'wire',
  'change',
  'scenario',
]);
/**
 * The collection id is compared with the declare id only: a collection may share its id with a
 * node (after.canvas: collection @ordering, node @ordering), since collection ids name workspace
 * documents, not diagram objects.
 */
export function checkUniqueIds(declare: Declaration, collection: Declaration): void {
  claimAll([declare, ...declare.children, ...collection.children]);
  claimAll([declare, collection]);
}
function claimAll(declarations: readonly Declaration[]): void {
  const seen = new Map<string, string>();
  declarations
    .filter((child) => idKinds.has(child.kind))
    .flatMap(declaredIds)
    .forEach((item) => {
      claimId(seen, item);
    });
}
function declaredIds(child: Declaration): readonly DeclaredId[] {
  return idValues(child).map((value) => ({ id: reference(value).id, kind: child.kind, value }));
}
/** Only `type` declares ids via a list; every other declaring construct uses a single `id`. */
export function idValues(node: Declaration): readonly LocatedValue[] {
  if (node.fields.id !== undefined) return [field(node.fields, 'id')];
  if (node.kind === 'type') return field(node.fields, 'ids').items ?? [];
  return [];
}
function claimId(seen: Map<string, string>, item: DeclaredId): void {
  const first = seen.get(item.id);
  if (first !== undefined) rejectRepeatedId(item, first);
  seen.set(item.id, item.kind);
}
function rejectRepeatedId(item: DeclaredId, first: string): never {
  reject(
    'unrepresentable',
    item.value.span,
    'Unique ids',
    `E204 duplicate: @${item.id} is declared twice (${first}, ${item.kind}). Ids are unique.`,
  );
}
