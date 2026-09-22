import type { LocatedValue, SyntaxValue } from '../../contract/records/syntax.js';
import { reject, accepted } from '../validation/outcomes.js';
import { decodeString } from '../lexing/strings.js';
import {
  peek,
  advance,
  consume,
  enter,
  leave,
  consumedSpan,
  type Cursor,
  type Parsed,
} from './cursor.js';
import { readReference } from './references.js';
import { repeat } from './repetition.js';
/** Decode one scalar or bounded list; owning property checks its allowed type afterward. */
export function readValue(cursor: Cursor): Parsed<LocatedValue> {
  const token = peek(cursor);
  if (token.kind === 'id') return readReference(cursor);
  if (token.text === '[') return readList(cursor);
  return readScalarOrNamespace(cursor);
}
/** Namespaced layout references are distinguishable from ordinary enum words by the colon. */
function readScalarOrNamespace(cursor: Cursor): Parsed<LocatedValue> {
  if (peek(cursor, 1).text === ':') return readReference(cursor);
  return {
    value: { value: scalar(cursor), span: peek(cursor).span, token: peek(cursor) },
    next: advance(cursor),
  };
}
/** Text remains inert; integer parsing never admits Infinity or imprecise identifiers. */
function scalar(cursor: Cursor): SyntaxValue {
  const token = peek(cursor);
  if (token.kind === 'string') return decodeString(token.text, token.span);
  if (token.kind === 'integer') return readInteger(cursor);
  return readWord(cursor);
}
/** Unknown punctuation cannot masquerade as a bare attribute value. */
function readWord(cursor: Cursor): string | boolean {
  const token = peek(cursor);
  if (token.kind !== 'word')
    reject('syntax', token.span, 'String, enum, integer, boolean or reference', 'Expected a value');
  return wordValue(token.text);
}
/** Model integer fields use safe integers; source precision is never silently rounded. */
function readInteger(cursor: Cursor): number {
  const number = Number(peek(cursor).text);
  if (!Number.isSafeInteger(number))
    reject(
      'invalid-value',
      peek(cursor).span,
      'Safe integer',
      'Integer cannot be represented exactly',
    );
  return number;
}
/** Read the first item separately so trailing commas remain invalid. */
function readList(cursor: Cursor): Parsed<LocatedValue> {
  const start = enter(advance(cursor));
  if (peek(start).text === ']') return finishList(cursor, advance(start), []);
  const first = readValue(start);
  const rest = accepted(repeat(first.next, (item) => peek(item).text === ',', readFollowingItem));
  const locatedItems = [first.value, ...rest.value];
  const items = locatedItems.map((item) => item.value);
  return finishList(cursor, consume(rest.next, ']'), items, locatedItems);
}
/** Every comma must be followed by a value. */
function readFollowingItem(cursor: Cursor): Parsed<LocatedValue> {
  return readValue(consume(cursor, ','));
}
/** Close a list and retain its complete source range. */
function finishList(
  start: Cursor,
  end: Cursor,
  items: readonly SyntaxValue[],
  locatedItems: readonly LocatedValue[] = [],
): Parsed<LocatedValue> {
  return {
    value: { value: items, span: consumedSpan(start, end), items: locatedItems },
    next: leave(end),
  };
}
/** Whitespace-delimited references support show/connect and relative constraint declarations. */
export function readReferenceList(cursor: Cursor): Parsed<LocatedValue> {
  const parsed = accepted(repeat(cursor, startsReference, readReference));
  if (parsed.value.length === 0)
    reject('syntax', peek(cursor).span, 'One or more references', 'Reference list is empty');
  return {
    value: {
      value: parsed.value.map((item) => item.value),
      span: consumedSpan(cursor, parsed.next),
      items: parsed.value,
    },
    next: parsed.next,
  };
}
/** Namespace references require a colon; next declarations never become list items. */
function startsReference(cursor: Cursor): boolean {
  if (peek(cursor).kind === 'id') return true;
  return peek(cursor, 1).text === ':';
}

/** Boolean keywords are reserved scalar values, not truthy strings. */
function wordValue(text: string): string | boolean {
  if (text === 'true') return true;
  return text === 'false' ? false : text;
}
