/*
 * Whole-record patch operations (`add`, `replace`, `delete`) and `reset`, compiled into Model
 * change data. Language lowers the declaration the same way as in a document; Model owns what a
 * delete cascades into and clearing manual layout. Pure: nothing is written. Language owns
 * correcting the source; Authoring owns commit recovery.
 */
import type { Collection } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import type { ResolvedResources } from '../../contract/records/requests.js';
import { lowerNode, lowerRecord } from '../lowering/content.js';
import { lowerSection } from '../lowering/views.js';
import { lowerAsset } from '../lowering/resources.js';
import type { RawRecord } from '../lowering/fields.js';
import { accepted, reject } from '../validation/outcomes.js';
import { requirePlainAddress } from './targets.js';

/**
 * Compiles an `add`, `replace` or `delete` of a whole record addressed by a plain `@id`.
 *
 * - `add` / `replace`: the declaration is lowered (node, section and asset have their own
 *   lowering; anything else is lowered as a plain record) and becomes a `create` or `replace`
 *   in the target's namespace.
 * - `delete node @id [cascade=true]`: becomes `delete-object`; `cascade` defaults to `false`.
 * - `delete` of any other target: becomes a `remove` in its namespace.
 *
 * Pure: a retry with the same input returns the same change. Language owns correcting the
 * source; Authoring owns commit recovery.
 *
 * @param operation - The operation.
 * @param resources - The resolved resources, for asset lowering.
 * @returns The Model change.
 * @throws A `LanguageFault`: `invalid-value` for an address that is not a plain `@id`; `syntax`
 * for an `add` or `replace` without a declaration; and the faults of lowering the declaration.
 * Callers run it inside `protect`.
 */
export function structuralChange(operation: Operation, resources: ResolvedResources): RawRecord {
  requirePlainAddress(operation);
  if (operation.action === 'delete') return deleteRecord(operation);
  const value = declarationRecord(operation, resources);
  return {
    op: operation.action === 'add' ? 'create' : 'replace',
    target: namespaces[operation.target],
    value,
  };
}

/**
 * Compiles a `reset`. Model clears only the manual data; semantic constraints are kept.
 *
 * - `reset layout @section`: becomes `reset-layout` for the section (plain `@id` address).
 * - `reset route @section/@wire`: becomes `reset-route` for the section and relationship.
 *
 * Pure. Language owns correcting the source; Authoring owns commit recovery.
 *
 * @param operation - The `reset` operation.
 * @returns The Model change.
 * @throws A `LanguageFault` (`invalid-value`) for a layout reset without a plain `@id`, or a
 * route reset without a section. Callers run it inside `protect`.
 */
export function resetChange(operation: Operation): RawRecord {
  if (operation.target === 'layout') {
    requirePlainAddress(operation);
    return { op: 'reset-layout', section: operation.address.id };
  }
  if (operation.address.section === undefined)
    reject('invalid-value', operation.span, '@section/@wire', 'Route reset needs section address');
  return {
    op: 'reset-route',
    section: operation.address.section,
    relationship: operation.address.id,
  };
}

/**
 * Requires the snapshot of the collection a patch names; a patch never creates a collection.
 *
 * Pure. Language owns correcting the source; Authoring owns commit recovery.
 *
 * @param snapshot - The request's snapshot, or `null` when none was given.
 * @param operation - The patch, for its collection ID and span.
 * @returns The snapshot.
 * @throws A `LanguageFault` (`unknown-target`) when there is no snapshot or it is another
 * collection. Callers run it inside `protect`.
 */
export function requireSnapshot(
  snapshot: Collection | null,
  operation: { readonly collection: string; readonly span: Operation['span'] },
): Collection {
  if (snapshot === null)
    reject(
      'unknown-target',
      operation.span,
      'Existing collection snapshot',
      'Patch needs a snapshot',
    );
  if (snapshot.id !== operation.collection)
    reject(
      'unknown-target',
      operation.span,
      'Matching collection identity',
      'Patch targets a different collection',
    );
  return snapshot;
}

/** Deleting a node is the only explicit cascade; Model removes what depends on it. */
function deleteRecord(operation: Operation): RawRecord {
  if (operation.target === 'node')
    return {
      op: 'delete-object',
      id: operation.address.id,
      cascade: operation.fields.cascade?.value ?? false,
    };
  return { op: 'remove', target: namespaces[operation.target], id: operation.address.id };
}

/** The declaration lowered as in a document: node, section and asset have their own lowering. */
function declarationRecord(operation: Operation, resources: ResolvedResources): RawRecord {
  const item = operation.declaration;
  if (item === null)
    reject('syntax', operation.span, 'Complete declaration', 'Missing replacement declaration');
  switch (item.kind) {
    case 'node':
      return lowerNode(item);
    case 'section':
      return accepted(lowerSection(item));
    case 'asset':
      return lowerAsset(item, resources);
    default:
      return lowerRecord(item);
  }
}

/** The Model namespace each whole-record target is stored in. */
const namespaces: Readonly<Record<string, string>> = Object.freeze({
  node: 'objects',
  wire: 'relationships',
  section: 'sections',
  asset: 'assets',
  source: 'sources',
});
