import type { Collection } from '../../contract/ports/model.js';
import type { Operation } from '../../contract/records/syntax.js';
import type { Property } from '../../contract/records/vocabulary.js';
import { patchProperties } from '../vocabulary/patch-properties.js';
import { constructs } from '../vocabulary/constructs.js';
import type { RawRecord } from '../lowering/fields.js';
import { reject } from '../validation/outcomes.js';
import { findRecord, requirePlainAddress, blockOwner, blockId, viewOwner } from './targets.js';
import { replaceBlock } from './blocks.js';
export interface PropertyTarget {
  readonly record: RawRecord;
  readonly properties: Readonly<Record<string, Property>>;
  readonly write: (record: RawRecord) => RawRecord;
}
/** Resolve one property owner against the current staged candidate. Language owns correction. */
export function propertyTarget(collection: Collection, operation: Operation): PropertyTarget {
  const readers: Readonly<Record<string, () => PropertyTarget>> = {
    collection: () => ({
      record: collection,
      properties: patchProperties.collection,
      write: (value) => ({ op: 'replace-document', value }),
    }),
    node: () => canonicalTarget(collection.objects, 'objects', operation),
    wire: () => canonicalTarget(collection.relationships, 'relationships', operation),
    section: () => canonicalTarget(collection.sections, 'sections', operation),
    block: () => contentTarget(collection, operation),
    appearance: () => appearanceTarget(collection, operation),
    route: () => routeTarget(collection, operation),
  };
  const read = readers[operation.target];
  if (read === undefined)
    reject(
      'invalid-value',
      operation.span,
      'Editable target',
      'Target does not support property edits',
    );
  return read();
}
/** Complete-record replacement is a Model operation, not a foreign mutation. */
function canonicalTarget(
  records: readonly (RawRecord & { readonly id: string })[],
  namespace: string,
  operation: Operation,
): PropertyTarget {
  requirePlainAddress(operation);
  return {
    record: findRecord(records, operation.address.id, operation),
    properties: patchProperties[operation.target],
    write: (value) => ({ op: 'replace', target: namespace, value }),
  };
}
/** Block-kind-specific property definitions narrow the parser's combined block vocabulary. */
function contentTarget(collection: Collection, operation: Operation): PropertyTarget {
  const owner = blockOwner(collection, operation);
  const record = findRecord(owner.content, blockId(operation), operation);
  const definition = constructs.find((item) => item.kind === record.kind);
  if (definition === undefined)
    reject(
      'invalid-value',
      operation.span,
      'Supported content kind',
      'Cannot edit unknown content',
    );
  const positional = definition.positions
    .filter((item) => item.name !== 'id')
    .map((item) => [item.name, { type: item.type, field: item.name, required: true }]);
  const properties = { ...definition.properties, ...Object.fromEntries(positional) };
  return { record, properties, write: (value) => replaceBlock(collection, operation, value) };
}
/** Appearance properties are independent of canonical object properties. */
function appearanceTarget(collection: Collection, operation: Operation): PropertyTarget {
  const section = viewOwner(collection, operation);
  const record = section.appearances.find((item) => item.object === operation.address.id);
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
    write: (value) => ({
      op: 'replace',
      target: 'sections',
      value: {
        ...section,
        appearances: section.appearances.map((item) =>
          item.object === record.object ? value : item,
        ),
      },
    }),
  };
}
/** Route preferences never expose manual points through the DSL property vocabulary. */
function routeTarget(collection: Collection, operation: Operation): PropertyTarget {
  const section = viewOwner(collection, operation);
  const record = section.wires.find((item) => item.relationship === operation.address.id);
  if (record === undefined)
    reject('unknown-target', operation.span, 'Visible wire', 'Route target is absent');
  return {
    record,
    properties: patchProperties.route,
    write: (value) => ({
      op: 'replace',
      target: 'sections',
      value: {
        ...section,
        wires: section.wires.map((item) =>
          item.relationship === record.relationship ? value : item,
        ),
      },
    }),
  };
}
