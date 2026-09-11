import type { Operation, Fields } from '../../contract/records/syntax.js';
import type { Property } from '../../contract/records/vocabulary.js';
import type { RawRecord } from '../lowering/fields.js';
import { lowerValue } from '../lowering/properties.js';
import { checkValue } from '../parsing/value-types.js';
import { reject } from '../validation/outcomes.js';
/** Unknown and required-property edits fail before any owner operation is staged. */
export function changedProperties(
  record: RawRecord,
  operation: Operation,
  properties: Readonly<Record<string, Property>>,
): RawRecord {
  if (operation.action === 'unset')
    return operation.properties.reduce(
      (next, name) => removeProperty(next, name, operation, properties),
      record,
    );
  return Object.entries(operation.fields).reduce(
    (next, [name, value]) => assignProperty(next, name, value, operation, properties),
    record,
  );
}
/** Narrow parser-accepted block fields to the current block's actual construct contract. */
function owningProperty(
  name: string,
  operation: Operation,
  properties: Readonly<Record<string, Property>>,
): Property {
  const property = Object.hasOwn(properties, name) ? properties[name] : undefined;
  if (property === undefined)
    reject(
      'unknown-property',
      operation.span,
      Object.keys(properties).join(' / '),
      'Property is not owned by this target',
      name,
    );
  return property;
}
/** Preserve all omitted properties; explicit assignments use the same property type checks as creation. */
function assignProperty(
  record: RawRecord,
  name: string,
  value: Fields[string],
  operation: Operation,
  properties: Readonly<Record<string, Property>>,
): RawRecord {
  const property = owningProperty(name, operation, properties);
  const checked = checkValue(value, property, name);
  return { ...record, [property.field]: lowerValue(checked.value, property.type) };
}
/** Optional properties reset to their documented default; required fields cannot disappear. */
function removeProperty(
  record: RawRecord,
  name: string,
  operation: Operation,
  properties: Readonly<Record<string, Property>>,
): RawRecord {
  const property = owningProperty(name, operation, properties);
  if (property.required)
    reject(
      'invalid-value',
      operation.span,
      'Optional property',
      'Required property cannot be unset',
      name,
    );
  const { [property.field]: omitted, ...remaining } = record;
  void omitted;
  if (property.fallback === undefined) return remaining;
  return { ...remaining, [property.field]: lowerValue(property.fallback, property.type) };
}
