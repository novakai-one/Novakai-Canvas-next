import type { Fields, LocatedValue } from '../../contract/records/syntax.js';
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
  return { value: [name, checkValue(raw.value, property, name)], next: raw.next };
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
