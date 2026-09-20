import type { Fields, SyntaxValue } from '../../contract/records/syntax.js';
import type { Property, ValueType } from '../../contract/records/vocabulary.js';
import { isList, isReference } from '../parsing/value-types.js';
import { endpoint, type RawRecord } from './fields.js';
/** References lower according to owning property meaning, never by guessing strings. */
export function lowerValue(value: SyntaxValue, type: ValueType): unknown {
  if (type === 'signature-parameters') return lowerSignatureParameters(value);
  return lowerComposite(value, type);
}

function lowerComposite(value: SyntaxValue, type: ValueType): unknown {
  if (isList(value)) return value.map((item) => lowerValue(item, scalarType(type)));
  if (isReference(value)) return lowerReference(value, type);
  return value;
}

function lowerSignatureParameters(value: SyntaxValue): readonly unknown[] {
  if (!isList(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item;
    if (!isList(item) || item.length !== 2) return item;
    const name = item[0];
    return { name, type: lowerValue(item[1] as SyntaxValue, 'type-expression') };
  });
}
/** List element kinds retain endpoint-versus-identity distinction. */
function scalarType(type: ValueType): ValueType {
  return type === 'endpoints' ? 'endpoint' : 'id';
}
/** Namespace layout targets and endpoint records have separate canonical shapes. */
function lowerReference(
  value: Extract<SyntaxValue, { kind: 'reference' }>,
  type: ValueType,
): unknown {
  if (type === 'endpoint') return endpoint(value);
  if (type === 'type-expression') return { kind: 'definition', id: value.id };
  return value.id;
}
/** Map only supplied fields; callers explicitly decide when declaration defaults are needed. */
export function mapProperties(
  fields: Fields,
  properties: Readonly<Record<string, Property>>,
): RawRecord {
  return Object.fromEntries(
    Object.entries(properties).flatMap(([name, property]) => mappedEntry(fields, name, property)),
  );
}
/** A single property fact supplies parser type, target field and default for canonical lowering. */
function mappedEntry(
  fields: Fields,
  name: string,
  property: Property,
): readonly (readonly [string, unknown])[] {
  const located = fields[name];
  if (located === undefined) return [];
  return [[property.field, lowerValue(located.value, property.type)]];
}

/** New declarations apply documented defaults; patch mapping deliberately does not. */
export function mapDeclaredProperties(
  fields: Fields,
  properties: Readonly<Record<string, Property>>,
): RawRecord {
  const defaults = Object.fromEntries(
    Object.values(properties)
      .filter((property) => property.fallback !== undefined)
      .map((property) => [property.field, property.fallback]),
  );
  return { ...defaults, ...mapProperties(fields, properties) };
}
