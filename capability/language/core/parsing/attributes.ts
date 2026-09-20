import type { Fields, LocatedValue, Span } from '../../contract/records/syntax.js';
import type { Property } from '../../contract/records/vocabulary.js';
import { accepted, reject } from '../validation/outcomes.js';
import { peek, advance, consume, type Cursor, type Parsed } from './cursor.js';
import { readValue } from './values.js';
import { checkValue } from './value-types.js';
import { repeat } from './repetition.js';
type Attribute = readonly [string, LocatedValue];
/** Attributes end at the next complete declaration rather than at newline trivia. */
export function readAttributes(
  cursor: Cursor,
  properties: Readonly<Record<string, Property>>,
): Parsed<Fields> {
  const entries = accepted(
    repeat(cursor, startsAttribute, (item) => readAttribute(item, properties)),
  );
  const fields = entries.value.reduce(insertUnique, {});
  return { value: fields, next: entries.next };
}
/** Two-token lookahead distinguishes declaration words from property assignments. */
function startsAttribute(cursor: Cursor): boolean {
  if (peek(cursor).kind !== 'word') return false;
  return peek(cursor, 1).text === '=';
}
/** Unknown properties fail at their name; no arbitrary JSON path is accepted. */
function readAttribute(
  cursor: Cursor,
  properties: Readonly<Record<string, Property>>,
): Parsed<Attribute> {
  const name = peek(cursor).text;
  const property = Object.hasOwn(properties, name) ? properties[name] : undefined;
  if (property === undefined)
    reject(
      'unknown-property',
      peek(cursor).span,
      Object.keys(properties).join(' / '),
      'Unknown property',
      name,
    );
  const start = consume(advance(cursor), '=');
  const raw = readValue(start);
  requireIntegerValue(raw, property, name);
  requireQuotedValues(start, raw.next, property);
  requireSignatureParameters(raw.value, property);
  requireNonblankTypeExpression(raw.value, property);
  return { value: [name, checkValue(raw.value, property, name)], next: raw.next };
}

function requireSignatureParameters(raw: LocatedValue, property: Property): void {
  if (property.type !== 'signature-parameters') return;
  (raw.items ?? []).forEach(validateSignatureParameter);
}

function validateSignatureParameter(item: LocatedValue): void {
  if (typeof item.value === 'string') return validateLegacyParameter(item);
  if (!Array.isArray(item.value) || item.items?.length !== 2)
    reject('invalid-value', item.span, '[name, type]', 'Structured parameter needs two items');
  const [name, type] = item.items ?? [];
  validateParameterName(name, item.span);
  validateParameterType(type, item.span);
}

function validateLegacyParameter(item: LocatedValue): void {
  if (item.token?.kind !== 'string')
    reject('syntax', item.span, 'Quoted string', 'Legacy parameter must be quoted');
  if (String(item.value).trim().length === 0)
    reject('invalid-value', item.span, 'Nonblank parameter', 'Parameter text must be nonblank');
}

function validateParameterName(name: LocatedValue | undefined, fallback: Span): void {
  if (name?.token?.kind !== 'string')
    reject('syntax', name?.span ?? fallback, 'Quoted string', 'Parameter name must be quoted');
  if ((name?.value as string | undefined)?.trim().length === 0)
    reject(
      'invalid-value',
      name?.span ?? fallback,
      'Nonblank parameter name',
      'Parameter name must be nonblank',
    );
}

function validateParameterType(type: LocatedValue | undefined, fallback: Span): void {
  if (typeof type?.value === 'string') return validateStringParameterType(type);
  validateReferenceParameterType(type, fallback);
}

function validateStringParameterType(type: LocatedValue): void {
  if (type.token?.kind !== 'string')
    reject('syntax', type.span, 'Quoted string', 'Unlinked parameter type must be quoted');
  if (String(type.value).trim().length === 0)
    reject(
      'invalid-value',
      type.span,
      'Nonblank parameter type',
      'Parameter type must be nonblank',
    );
}

function validateReferenceParameterType(type: LocatedValue | undefined, fallback: Span): void {
  if (!isIdentityReference(type?.value))
    reject(
      'invalid-value',
      type?.span ?? fallback,
      'Definition reference',
      'Linked parameter type must be a plain definition reference',
    );
}

function requireNonblankTypeExpression(raw: LocatedValue, property: Property): void {
  if (property.type !== 'type-expression' || typeof raw.value !== 'string') return;
  if (raw.value.trim().length === 0)
    reject('invalid-value', raw.span, 'Nonblank type', 'Type must be nonblank');
}

function isIdentityReference(value: LocatedValue['value'] | undefined): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 2 &&
    'kind' in value &&
    value.kind === 'reference'
  );
}
/** Duplicate properties never silently use last-write-wins semantics. */
function insertUnique(fields: Fields, [name, value]: Attribute): Fields {
  if (Object.hasOwn(fields, name))
    reject('syntax', value.span, 'One assignment per property', 'Duplicate property', name);
  return { ...fields, [name]: value };
}

/** Text properties require quotes even when their text resembles a valid bare enum. */
function requireQuotedValues(start: Cursor, end: Cursor, property: Property): void {
  if (property.type === 'string') return requireStringToken(start);
  if (property.type !== 'strings') return;
  requireQuotedList(start, end);
}
/** Every string-list element is quoted; punctuation only separates elements. */
function requireQuotedList(start: Cursor, end: Cursor): void {
  const values = start.tokens
    .slice(start.index + 1, end.index - 1)
    .filter((token) => token.text !== ',');
  const invalid = values.find((token) => token.kind !== 'string');
  if (invalid !== undefined)
    reject('syntax', invalid.span, 'List of quoted strings', 'Text list values must be quoted');
}
/** Quoting prevents a following declaration word from being mistaken for text. */
function requireStringToken(cursor: Cursor): void {
  if (peek(cursor).kind !== 'string')
    reject('syntax', peek(cursor).span, 'Quoted string', 'Text property must be quoted');
}

/** An integer attribute must reject a decimal as one invalid value, not as a following patch command. */
function requireIntegerValue(raw: Parsed<LocatedValue>, property: Property, name: string): void {
  if (property.type !== 'integer') return;
  rejectFraction(raw, name);
}
/** Retain the full decimal span and owning property for source correction. */
function rejectFraction(raw: Parsed<LocatedValue>, name: string): void {
  if (peek(raw.next).text !== '.' || peek(raw.next, 1).kind !== 'integer') return;
  reject(
    'invalid-value',
    { start: raw.value.span.start, end: peek(raw.next, 1).span.end },
    'Integer',
    'Fractional values are not valid integers',
    name,
  );
}
