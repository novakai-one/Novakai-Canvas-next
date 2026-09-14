import type {
  Fields,
  LocatedValue,
  Reference,
  SyntaxValue,
} from '../../contract/records/syntax.js';
import { isList, isReference } from '../parsing/value-types.js';
import { reject, origin } from '../validation/outcomes.js';
export type RawRecord = Readonly<Record<string, unknown>>;
/** Compiler DTOs stay untrusted until Model validation; no schema brands are fabricated. */
export function field(fields: Fields, name: string): LocatedValue {
  const value = fields[name];
  if (value === undefined) reject('invalid-value', origin, name, 'Required syntax value is absent');
  return value;
}
/** Read an explicitly typed string, never coerce arrays or object addresses. */
export function text(fields: Fields, name: string): string {
  const item = field(fields, name);
  if (typeof item.value !== 'string')
    reject('invalid-value', item.span, 'String', 'Expected textual value', name);
  return item.value;
}
/** Optional semantic defaults live at the owning mapping, not in generic truthiness checks. */
export function textOr(fields: Fields, name: string, fallback: string): string {
  if (fields[name] === undefined) return fallback;
  return text(fields, name);
}
/** A reference is always explicit typed syntax. Language owns correction before owner validation. */
export function reference(value: LocatedValue): Reference {
  if (!isReference(value.value))
    reject('invalid-value', value.span, 'Reference', 'Expected a reference');
  return value.value;
}
/** Stable identities derive from reference syntax and receive owner brands only at Model's boundary. */
export function id(fields: Fields, name = 'id'): string {
  return reference(field(fields, name)).id;
}
/** Preserve list order without treating a missing field as an empty list. */
export function list(fields: Fields, name: string): readonly SyntaxValue[] {
  const value = field(fields, name);
  if (!isList(value.value)) reject('invalid-value', value.span, 'List', 'Expected a list');
  return value.value;
}
/** Exact optional fields are omitted rather than stored as undefined. */
export function optional(name: string, value: unknown): RawRecord {
  if (value === undefined) return {};
  return { [name]: value };
}
/** Endpoint DTOs preserve object/member distinction; Model owns legal endpoint-kind validation. */
export function endpoint(value: Reference): RawRecord {
  return { object: value.id, ...optional('member', value.member) };
}
