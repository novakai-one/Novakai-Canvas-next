/*
 * Finding what a patch operation addresses in the staged collection (never in the original
 * snapshot), and checking the address has the right parts: `@id` for a plain record,
 * `@object.@block` for a content block (`@object` for an insert), `@section/@item` for an
 * appearance or route. Pure: nothing is written. Language owns correcting the source; Authoring
 * owns commit recovery.
 */
import type { Collection, DiagramObject, Section } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import { reject } from '../validation/outcomes.js';

/**
 * Finds the record with an ID in the staged collection's list.
 *
 * Pure: a retry with the same input returns the same record. Language owns correcting the
 * source; Authoring owns commit recovery.
 *
 * @param records - One list of the staged collection.
 * @param id - The ID the operation names.
 * @param operation - The operation, for the diagnostic's span.
 * @returns The first record with that ID.
 * @throws A `LanguageFault` (`unknown-target`, target `id`) when no record has the ID. Callers
 * run it inside `protect`.
 */
export function findRecord<T extends { readonly id: string }>(
  records: readonly T[],
  id: string,
  operation: Operation,
): T {
  const record = records.find(/** Whether the record has the ID. */ (item) => item.id === id);
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

/**
 * Requires a plain `@id` address: exactly two own keys (`kind` and `id`), so a member, section
 * or namespace selector cannot stand in for a record.
 *
 * Pure. Language owns correcting the source; Authoring owns commit recovery.
 *
 * @param operation - The operation.
 * @throws A `LanguageFault` (`invalid-value`) when the address has any other number of keys.
 * Callers run it inside `protect`.
 */
export function requirePlainAddress(operation: Operation): void {
  if (Object.keys(operation.address).length !== 2)
    reject('invalid-value', operation.span, '@id', 'Target needs a plain identity');
}

/**
 * Finds the object that owns an addressed content block. An insert names only the object
 * (`@object`: `kind` and `id`); every other block operation names the block too
 * (`@object.@block`: plus `member`). A section or namespace selector is refused.
 *
 * Pure: a retry with the same input returns the same object. Language owns correcting the
 * source; Authoring owns commit recovery.
 *
 * @param collection - The staged collection.
 * @param operation - A block operation.
 * @returns The owning object.
 * @throws A `LanguageFault`: `invalid-value` for a wrong number of address parts or a section or
 * namespace selector; `unknown-target` for a missing object. Callers run it inside `protect`.
 */
export function blockOwner(collection: Collection, operation: Operation): DiagramObject {
  requireBlockAddress(operation);
  return findRecord(collection.objects, operation.address.id, operation);
}

/**
 * Finds the section that owns an addressed appearance or route (`@section/@item`: `kind`, `id`
 * and `section`, 3 keys).
 *
 * Pure: a retry with the same input returns the same section. Language owns correcting the
 * source; Authoring owns commit recovery.
 *
 * @param collection - The staged collection.
 * @param operation - An appearance, route or membership operation.
 * @returns The section.
 * @throws A `LanguageFault`: `invalid-value` when the section is missing from the address or the
 * address has other parts; `unknown-target` for a missing section. Callers run it inside
 * `protect`.
 */
export function viewOwner(collection: Collection, operation: Operation): Section {
  const section = operation.address.section;
  if (section === undefined)
    reject('invalid-value', operation.span, '@section/@item', 'Missing section address');
  if (Object.keys(operation.address).length !== 3)
    reject('invalid-value', operation.span, '@section/@item', 'Unexpected address selector');
  return findRecord(collection.sections, section, operation);
}

/**
 * The block ID of an `@object.@block` address. A missing block is refused; no empty ID is used
 * in its place.
 *
 * Pure. Language owns correcting the source; Authoring owns commit recovery.
 *
 * @param operation - A block operation.
 * @returns The block ID.
 * @throws A `LanguageFault` (`invalid-value`) when the address has no block. Callers run it
 * inside `protect`.
 */
export function blockId(operation: Operation): string {
  const member = operation.address.member;
  if (member === undefined)
    reject('invalid-value', operation.span, '@object.@block', 'Missing block identity');
  return member;
}

/** Checks the number of address parts, then refuses a section or namespace selector. */
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

/** Whether a block address has a section or namespace selector. */
function hasForeignSelector(operation: Operation): boolean {
  return operation.address.section !== undefined || operation.address.namespace !== undefined;
}

/** An insert has `kind` and `id` (2 keys); other block operations add `member` (3 keys). */
function blockAddressParts(operation: Operation): number {
  return operation.action === 'add' ? 2 : 3;
}
