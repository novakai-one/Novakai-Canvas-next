/*
 * Lowering attribute values to the plain data Model reads. How a reference lowers depends on the
 * property's value type: an endpoint becomes `{ object, member? }`, a type reference becomes
 * `{ kind: 'definition', id }`, any other reference becomes its ID. Text is never guessed to be a
 * reference. No side effects. Language owns correcting the source; Authoring owns commit
 * recovery.
 */
import type { Fields, SyntaxValue } from '../../contract/records/syntax.js';
import type { Property, ValueType } from '../../contract/records/vocabulary.js';
import { isList, isReference } from '../parsing/value-types.js';
import { endpoint, type RawRecord } from './fields.js';

/**
 * Lowers one value for a property of the given type. Each list item lowers with the item type
 * `endpoint` for an `endpoints` list and `id` for any other list; signature parameters lower to
 * names and `{ name, type }` pairs. Values that are not references or lists are kept.
 *
 * @param value - A parsed value.
 * @param type - The owning property's value type.
 * @returns The lowered value.
 * @throws Never.
 */
export function lowerValue(value: SyntaxValue, type: ValueType): unknown {
  if (type === 'signature-parameters') return lowerSignatureParameters(value);
  return lowerComposite(value, type);
}

/**
 * Lowers the written attributes only, under their Model field names, in the property table's
 * order. No defaults are added (patches use this).
 *
 * @param fields - The parsed fields.
 * @param properties - The property table, by attribute name.
 * @returns The lowered fields.
 * @throws Never.
 */
export function mapProperties(
  fields: Fields,
  properties: Readonly<Record<string, Property>>,
): RawRecord {
  return Object.fromEntries(
    Object.entries(properties).flatMap(
      /** The lowered entry for this property, if written. */ ([name, property]) =>
        mappedEntry(fields, name, property),
    ),
  );
}

/**
 * Lowers a new declaration's attributes: every property with a `fallback` starts at it, then
 * the written attributes replace those defaults.
 *
 * @param fields - The parsed fields.
 * @param properties - The property table, by attribute name.
 * @returns The defaults followed by the lowered written fields.
 * @throws Never.
 */
export function mapDeclaredProperties(
  fields: Fields,
  properties: Readonly<Record<string, Property>>,
): RawRecord {
  const defaults = Object.fromEntries(
    Object.values(properties)
      .filter(
        /** Whether the property has a default. */ (property) => property.fallback !== undefined,
      )
      .map(
        /** The property's field and default. */ (property) => [property.field, property.fallback],
      ),
  );
  return { ...defaults, ...mapProperties(fields, properties) };
}

/** Parameters: text stays text; a `[name, type]` pair becomes `{ name, type }`; others are kept. */
function lowerSignatureParameters(value: SyntaxValue): readonly unknown[] {
  if (!isList(value)) return [];
  return value.map(lowerSignatureParameter);
}

/** One parameter; the pair's type lowers as a type expression. */
function lowerSignatureParameter(item: SyntaxValue): unknown {
  if (typeof item === 'string') return item;
  if (!isList(item) || item.length !== 2) return item;
  const name = item[0];
  return { name, type: lowerValue(item[1] as SyntaxValue, 'type-expression') };
}

/** A list lowers item by item; a reference by the property's type; anything else is kept. */
function lowerComposite(value: SyntaxValue, type: ValueType): unknown {
  if (isList(value))
    return value.map(/** Lowers one item. */ (item) => lowerValue(item, scalarType(type)));
  if (isReference(value)) return lowerReference(value, type);
  return value;
}

/** The type of a list's items: `endpoint` for an `endpoints` list, otherwise `id`. */
function scalarType(type: ValueType): ValueType {
  if (type === 'endpoints') return 'endpoint';
  return 'id';
}

/** An endpoint record, a definition reference for a type, or else the plain ID. */
function lowerReference(
  value: Extract<SyntaxValue, { kind: 'reference' }>,
  type: ValueType,
): unknown {
  if (type === 'endpoint') return endpoint(value);
  if (type === 'type-expression') return { kind: 'definition', id: value.id };
  return value.id;
}

/** The lowered `[field, value]` entry for one property, or none when it is not written. */
function mappedEntry(
  fields: Fields,
  name: string,
  property: Property,
): readonly (readonly [string, unknown])[] {
  const located = fields[name];
  if (located === undefined) return [];
  return [[property.field, lowerValue(located.value, property.type)]];
}
