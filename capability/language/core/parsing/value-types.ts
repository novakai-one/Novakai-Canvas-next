import type {
  SyntaxValue,
  Reference,
  TypeSyntax,
  LocatedValue,
} from '../../contract/records/syntax.js';
import type { ValueType, Property } from '../../contract/records/vocabulary.js';
import { reject } from '../validation/outcomes.js';
/** Readonly lists need an explicit guard because Array.isArray narrows only mutable arrays. */
export function isList(value: SyntaxValue): value is readonly SyntaxValue[] {
  return Array.isArray(value);
}
/** References remain records, never strings with inferred namespace semantics. */
export function isReference(value: SyntaxValue): value is Reference {
  if (typeof value !== 'object') return false;
  return !isList(value) && value.kind === 'reference';
}
/** Type-use records are the v2 counterpart to references, discriminated by their own kind tag. */
function isTypeUse(value: SyntaxValue): value is TypeSyntax {
  if (typeof value !== 'object') return false;
  return !isList(value) && value.kind === 'type';
}
/** Plain IDs exclude subtargets, scoped addresses and layout namespaces. */
function isIdentity(value: SyntaxValue): boolean {
  if (!isReference(value)) return false;
  return Object.keys(value).length === 2;
}
/** Endpoints support one descendant, never slash or layout namespace selectors. */
function isEndpoint(value: SyntaxValue): boolean {
  if (!isReference(value)) return false;
  return value.namespace === undefined && value.section === undefined;
}
/** Lists apply the same scalar predicate to every member, including empty lists. */
function listOf(value: SyntaxValue, predicate: (value: SyntaxValue) => boolean): boolean {
  return isList(value) && value.every(predicate);
}
const checks: Readonly<Record<ValueType, (value: SyntaxValue) => boolean>> = {
  string: (value) => typeof value === 'string',
  word: (value) => typeof value === 'string',
  integer: (value) => typeof value === 'number',
  boolean: (value) => typeof value === 'boolean',
  id: isIdentity,
  endpoint: isEndpoint,
  address: isReference,
  strings: (value) => listOf(value, (item) => typeof item === 'string'),
  ids: (value) => listOf(value, isIdentity),
  endpoints: (value) => listOf(value, isEndpoint),
  references: (value) => listOf(value, isIdentity),
  targets: (value) => listOf(value, isReference),
  'reference-value': (value) => isEndpoint(value) || listOf(value, isEndpoint),
  'type-expression': (value) => typeof value === 'string' || isIdentity(value),
  'signature-parameters': (value) => listOf(value, signatureParameter),
  link: (value) => typeof value === 'string' || isIdentity(value),
  'type-use': isTypeUse,
  'typed-parameters': (value) => listOf(value, typedParameter),
};
/** Each typed parameter is a two-item [name, type] tuple, never the legacy string-or-id shape. */
function typedParameter(item: SyntaxValue): boolean {
  if (!isList(item) || item.length !== 2) return false;
  const name = item[0];
  const type = item[1];
  return typeof name === 'string' && type !== undefined && isTypeUse(type);
}
function signatureParameter(item: SyntaxValue): boolean {
  if (typeof item === 'string') return true;
  return validSignatureTuple(item);
}

function validSignatureTuple(item: SyntaxValue): boolean {
  if (!isList(item) || item.length !== 2) return false;
  const name = item[0];
  const type = item[1];
  return (
    typeof name === 'string' && type !== undefined && (typeof type === 'string' || isIdentity(type))
  );
}
/** Cardinality one is lexed as an integer but has an explicit word enum in the grammar. */
function normalizeEnum(value: SyntaxValue, property: Property): SyntaxValue {
  if (property.values === undefined) return value;
  return typeof value === 'number' ? String(value) : value;
}
/** Check declared property shape and enum without inventing domain validity; Language owns correction. */
export function checkValue(
  located: LocatedValue,
  property: Property,
  target: string,
): LocatedValue {
  const value = normalizeEnum(located.value, property);
  if (!checks[property.type](value))
    reject(
      'invalid-value',
      located.span,
      property.type,
      'Property value has the wrong type',
      target,
    );
  checkEnum(value, property, located, target);
  return { ...located, value };
}
/** Required enum values are inspectable in diagnostics rather than inferred from exception prose. */
function checkEnum(
  value: SyntaxValue,
  property: Property,
  located: LocatedValue,
  target: string,
): void {
  if (property.values === undefined) return;
  if (!property.values.includes(String(value)))
    reject(
      'invalid-value',
      located.span,
      property.values.join(' / '),
      'Unknown enum value',
      target,
    );
}
