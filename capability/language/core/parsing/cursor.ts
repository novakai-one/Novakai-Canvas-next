import type { Token, Span } from '../../contract/records/syntax.js';
import { reject, origin } from '../validation/outcomes.js';
export interface Cursor {
  readonly tokens: readonly Token[];
  readonly index: number;
  readonly depth: number;
}
export interface Parsed<T> {
  readonly value: T;
  readonly next: Cursor;
}
/** Read without advancing; unexpected exhaustion is always a structured syntax failure. */
export function peek(cursor: Cursor, ahead = 0): Token {
  const token = cursor.tokens[cursor.index + ahead];
  if (token === undefined)
    reject('syntax', origin, 'Complete statement', 'Unexpected end of source');
  return token;
}
/** Advance an immutable parser position, retaining nesting protection across readers. */
export function advance(cursor: Cursor, count = 1): Cursor {
  return { ...cursor, index: cursor.index + count };
}
/** Require literal punctuation or keyword before advancing; Language owns source correction. */
export function consume(cursor: Cursor, expected: string): Cursor {
  const token = peek(cursor);
  if (token.text !== expected) reject('syntax', token.span, expected, `Expected ${expected}`);
  return advance(cursor);
}
/** Enter a bounded syntactic body without letting declaration count grow the JavaScript stack. */
export function enter(cursor: Cursor): Cursor {
  if (cursor.depth >= 64)
    reject('limit', peek(cursor).span, 'Nesting at most 64', 'Nesting limit exceeded');
  return { ...cursor, depth: cursor.depth + 1 };
}
/** Restore caller nesting after a complete brace/list body. */
export function leave(cursor: Cursor): Cursor {
  return { ...cursor, depth: cursor.depth - 1 };
}
/** Span includes only consumed tokens; unconsumed next declaration is excluded. */
export function consumedSpan(start: Cursor, end: Cursor): Span {
  const final = start.tokens[Math.max(start.index, end.index - 1)];
  return { start: peek(start).span.start, end: final?.span.end ?? peek(start).span.end };
}
