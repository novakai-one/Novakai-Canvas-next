import type { Collection, DiagramObject, Section } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import { reject } from '../validation/outcomes.js';
/** Find a stable record in the current staged state, never in the original pre-patch snapshot. */
export function findRecord<T extends { readonly id: string }>(
  records: readonly T[],
  id: string,
  operation: Operation,
): T {
  const record = records.find((item) => item.id === id);
  if (record === undefined)
    reject(
      'unknown-target',
      operation.span,
      'Existing target ID',
      'Patch target does not exist',
      id,
    );
  return record;
}
/** Node targets reject endpoint and layout selectors; callers cannot smuggle a different address kind. */
export function requirePlainAddress(operation: Operation): void {
  if (Object.keys(operation.address).length !== 2)
    reject('invalid-value', operation.span, '@id', 'Target needs a plain identity');
}
/** Block targets identify an owning object and one top-level content block. */
export function blockOwner(collection: Collection, operation: Operation): DiagramObject {
  requireBlockAddress(operation);
  return findRecord(collection.objects, operation.address.id, operation);
}
/** Insertion names an object only; edits/removal/move name one descendant explicitly. */
function requireBlockAddress(operation: Operation): void {
  const expected = blockAddressParts(operation);
  if (Object.keys(operation.address).length !== expected)
    reject(
      'invalid-value',
      operation.span,
      '@object.@block, or @object for add',
      'Invalid block address',
    );
  if (hasForeignSelector(operation))
    reject(
      'invalid-value',
      operation.span,
      'Object-local block address',
      'Invalid block namespace',
    );
}
/** Appearance and route targets always name their owning section. */
export function viewOwner(collection: Collection, operation: Operation): Section {
  const section = operation.address.section;
  if (section === undefined)
    reject('invalid-value', operation.span, '@section/@item', 'Missing section address');
  if (Object.keys(operation.address).length !== 3)
    reject('invalid-value', operation.span, '@section/@item', 'Unexpected address selector');
  return findRecord(collection.sections, section, operation);
}
/** Missing member is diagnosed before looking up a block; no empty-string identity is substituted. */
export function blockId(operation: Operation): string {
  const member = operation.address.member;
  if (member === undefined)
    reject('invalid-value', operation.span, '@object.@block', 'Missing block identity');
  return member;
}

/** Descendant addresses exclude view/layout namespace selectors. */
function hasForeignSelector(operation: Operation): boolean {
  return operation.address.section !== undefined || operation.address.namespace !== undefined;
}

/** Insertion addresses the object; other block operations include its descendant identity. */
function blockAddressParts(operation: Operation): number {
  return operation.action === 'add' ? 2 : 3;
}
