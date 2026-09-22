/** One id namespace (A.1): node, type, wire, change and scenario ids never repeat inside declare. */
import type { Declaration, LocatedValue } from '../../../contract/records/syntax.js';
import { field, reference } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
interface DeclaredId {
  readonly id: string;
  readonly kind: string;
  readonly value: LocatedValue;
}
const idKinds: ReadonlySet<string> = new Set(['node', 'type', 'wire', 'change', 'scenario']);
export function checkUniqueIds(declare: Declaration): void {
  const seen = new Map<string, string>();
  declare.children
    .filter((child) => idKinds.has(child.kind))
    .flatMap(declaredIds)
    .forEach((item) => {
      claimId(seen, item);
    });
}
function declaredIds(child: Declaration): readonly DeclaredId[] {
  return idValues(child).map((value) => ({ id: reference(value).id, kind: child.kind, value }));
}
/** Only `type` declares ids via a list; the other kinds declare one `id`. */
function idValues(child: Declaration): readonly LocatedValue[] {
  if (child.kind === 'type') return field(child.fields, 'ids').items ?? [];
  return [field(child.fields, 'id')];
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
