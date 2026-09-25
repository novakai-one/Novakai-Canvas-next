/*
 * Finding the record a `set` or `unset` edits, the properties it accepts, and how its edited
 * copy becomes a Model change. Records are read from the staged collection, never from the
 * original snapshot. Pure: nothing is written. Language owns correcting the source; Authoring
 * owns commit recovery.
 */
import type { Collection } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import type { Property } from '../../contract/records/vocabulary.js';
import { patchProperties } from '../vocabulary/patch-properties.js';
import { constructs } from '../vocabulary/constructs.js';
import type { RawRecord } from '../lowering/fields.js';
import { reject } from '../validation/outcomes.js';
import { findRecord, requirePlainAddress, blockOwner, blockId, viewOwner } from './targets.js';
import { replaceBlock } from './blocks.js';

/** The record a property edit changes, what it accepts, and how its new copy is written. */
export interface PropertyTarget {
  /** The addressed record as staged. */
  readonly record: RawRecord;

  /** The properties the record accepts, by attribute name. */
  readonly properties: Readonly<Record<string, Property>>;

  /** Turns the edited copy of the record into one Model change. */
  readonly write: (record: RawRecord) => RawRecord;
}

/**
 * Finds the record a property edit addresses in the staged collection.
 *
 * - `collection`: the collection itself; written as `replace-document`.
 * - `node`, `wire`, `section`: the record with the `@id`; written as a `replace` of that record.
 * - `block`: the `@object.@block` content block; accepts its kind's properties plus its
 *   positional ones (except `id`), all required; written as a `replace` of the owning object.
 * - `appearance`, `route`: the `@section/@item` entry; written as a `replace` of the section.
 *
 * Pure: a retry with the same input returns the same target. Language owns correcting the
 * source; Authoring owns commit recovery.
 *
 * @param collection - The staged collection.
 * @param operation - The `set` or `unset` operation.
 * @returns The target.
 * @throws A `LanguageFault`: `invalid-value` for a target without property edits (`asset`,
 * `source`, `layout`), a wrong address or an unknown content kind; `unknown-target` for a missing
 * record, block, appearance or visible wire. Callers run it inside `protect`.
 */
export function propertyTarget(collection: Collection, operation: Operation): PropertyTarget {
  switch (operation.target) {
    case 'collection':
      return {
        record: collection,
        properties: patchProperties.collection,
        write: /** The whole collection replaced. */ (value) => ({
          op: 'replace-document',
          value,
        }),
      };
    case 'node':
      return canonicalTarget(collection.objects, 'objects', operation);
    case 'wire':
      return canonicalTarget(collection.relationships, 'relationships', operation);
    case 'section':
      return canonicalTarget(collection.sections, 'sections', operation);
    case 'block':
      return contentTarget(collection, operation);
    case 'appearance':
      return appearanceTarget(collection, operation);
    case 'route':
      return routeTarget(collection, operation);
    default:
      reject(
        'invalid-value',
        operation.span,
        'Editable target',
        'Target does not support property edits',
      );
  }
}

/** A plain `@id` record, written back as a whole-record `replace` in its namespace. */
function canonicalTarget(
  records: readonly (RawRecord & { readonly id: string })[],
  namespace: string,
  operation: Operation,
): PropertyTarget {
  requirePlainAddress(operation);
  return {
    record: findRecord(records, operation.address.id, operation),
    properties: patchProperties[operation.target],
    write: /** The record replaced in its namespace. */ (value) => ({
      op: 'replace',
      target: namespace,
      value,
    }),
  };
}

/** A content block accepts its own kind's properties plus its positional ones, except `id`. */
function contentTarget(collection: Collection, operation: Operation): PropertyTarget {
  const owner = blockOwner(collection, operation);
  const record = findRecord(owner.content, blockId(operation), operation);
  const definition = constructs.find(
    /** Whether this construct is the block's kind. */ (item) => item.kind === record.kind,
  );
  if (definition === undefined)
    reject(
      'invalid-value',
      operation.span,
      'Supported content kind',
      'Cannot edit unknown content',
    );
  const positional = definition.positions
    .filter(/** Whether the position is not the ID. */ (item) => item.name !== 'id')
    .map(
      /** The position as a required property of the same name. */ (item) => [
        item.name,
        { type: item.type, field: item.name, required: true },
      ],
    );
  const properties = { ...definition.properties, ...Object.fromEntries(positional) };
  return {
    record,
    properties,
    write: /** The owning object with the block replaced. */ (value) =>
      replaceBlock(collection, operation, value),
  };
}

/** An object's ordinary appearance in a section; one drawn as part of a group is refused. */
function appearanceTarget(collection: Collection, operation: Operation): PropertyTarget {
  const section = viewOwner(collection, operation);
  const record = section.appearances.find(
    /** Whether this is the object's appearance. */ (item) => item.object === operation.address.id,
  );
  if (record === undefined)
    reject(
      'unknown-target',
      operation.span,
      'Ordinary appearance',
      'Appearance is absent or represented by a group',
    );
  return {
    record,
    properties: patchProperties.appearance,
    write: /** The section with the appearance replaced. */ (value) => ({
      op: 'replace',
      target: 'sections',
      value: {
        ...section,
        appearances: section.appearances.map(
          /** The new appearance for this object; any other as it is. */ (item) =>
            item.object === record.object ? value : item,
        ),
      },
    }),
  };
}

/** A visible wire's route preferences in a section; manual points are not properties. */
function routeTarget(collection: Collection, operation: Operation): PropertyTarget {
  const section = viewOwner(collection, operation);
  const record = section.wires.find(
    /** Whether this is the relationship's wire. */ (item) =>
      item.relationship === operation.address.id,
  );
  if (record === undefined)
    reject('unknown-target', operation.span, 'Visible wire', 'Route target is absent');
  return {
    record,
    properties: patchProperties.route,
    write: /** The section with the wire replaced. */ (value) => ({
      op: 'replace',
      target: 'sections',
      value: {
        ...section,
        wires: section.wires.map(
          /** The new wire for this relationship; any other as it is. */ (item) =>
            item.relationship === record.relationship ? value : item,
        ),
      },
    }),
  };
}
