import type { LocatedValue, Token, TypeSyntax } from '../../contract/records/syntax.js';
import { reject, accepted } from '../validation/outcomes.js';
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
import { decodeString } from '../lexing/strings.js';
import { repeat } from './repetition.js';
const primitiveWords = ['string', 'number', 'boolean'] as const;
type PrimitiveWord = (typeof primitiveWords)[number];
/** A type-use is a type id (with optional generic arguments) or a bare primitive word. */
export function readTypeUse(cursor: Cursor): Parsed<LocatedValue> {
  const token = peek(cursor);
  if (token.kind === 'id') return readTypeReference(cursor);
  if (token.kind === 'word') return readWordType(cursor);
  return rejectNonType(token);
}
/** A bare word only ever names one of the three declared primitives. */
function readWordType(cursor: Cursor): Parsed<LocatedValue> {
  const token = peek(cursor);
  if (!isPrimitiveWord(token.text)) return rejectNonType(token);
  return readPrimitiveType(cursor);
}
/** Only the three declared primitive words stand for a type; every other word is a syntax error. */
function isPrimitiveWord(text: string): text is PrimitiveWord {
  return (primitiveWords as readonly string[]).includes(text);
}
/** Quoted text can never stand in for a schema type; strings remain data, not types. */
function rejectNonType(token: Token): never {
  if (token.kind === 'string')
    reject(
      'invalid-value',
      token.span,
      'type id, entity id, or string|number|boolean',
      'E111 type: use a type id, an entity id, or string|number|boolean.',
    );
  reject('syntax', token.span, 'type', 'Expected a type');
}
function readPrimitiveType(cursor: Cursor): Parsed<LocatedValue> {
  const token = peek(cursor);
  const primitive = token.text as PrimitiveWord;
  return { value: { value: { kind: 'type', primitive }, span: token.span, token }, next: advance(cursor) };
}
/** A type id optionally carries its own generic argument list, each argument typed the same way. */
function readTypeReference(cursor: Cursor): Parsed<LocatedValue> {
  const token = peek(cursor);
  const ref = token.text.slice(1);
  const afterId = advance(cursor);
  if (peek(afterId).text === '<') return readTypeArguments(cursor, ref, afterId);
  return { value: { value: { kind: 'type', ref }, span: token.span, token }, next: afterId };
}
function readTypeArguments(cursor: Cursor, ref: string, bracket: Cursor): Parsed<LocatedValue> {
  const start = enter(advance(bracket));
  requireTypeArgument(start);
  const collected = collectTypeArguments(start);
  const end = leave(consume(collected.next, '>'));
  return {
    value: {
      value: { kind: 'type', ref, arguments: collected.value.map(asTypeSyntax) },
      span: consumedSpan(cursor, end),
      token: peek(cursor),
    },
    next: end,
  };
}
/** An open bracket immediately followed by its close is grammar noise; omit generics instead. */
function requireTypeArgument(cursor: Cursor): void {
  if (peek(cursor).text === '>')
    reject('syntax', peek(cursor).span, 'One or more type arguments', 'Expected a type argument');
}
function collectTypeArguments(cursor: Cursor): Parsed<readonly LocatedValue[]> {
  const first = readTypeUse(cursor);
  const rest = accepted(repeat(first.next, (item) => peek(item).text === ',', readFollowingType));
  return { value: [first.value, ...rest.value], next: rest.next };
}
function readFollowingType(cursor: Cursor): Parsed<LocatedValue> {
  return readTypeUse(consume(cursor, ','));
}
/** Every collected argument was itself built by readTypeUse, so its value is always a TypeSyntax. */
function asTypeSyntax(item: LocatedValue): TypeSyntax {
  return item.value as TypeSyntax;
}
/** `[ "name": T, ... ]`; an empty bracket pair is grammar noise the block form always forbids. */
export function readTypedParameters(cursor: Cursor): Parsed<LocatedValue> {
  const start = enter(advance(cursor));
  requireNonEmptyParameters(cursor, start);
  const collected = collectTypedParameters(start);
  const end = leave(consume(collected.next, ']'));
  return {
    value: {
      value: collected.value.map((item) => item.value),
      span: consumedSpan(cursor, end),
      items: collected.value,
    },
    next: end,
  };
}
function requireNonEmptyParameters(cursor: Cursor, start: Cursor): void {
  if (peek(start).text === ']')
    reject('syntax', peek(cursor).span, 'Non-empty block', 'E005 empty: omit the block.');
}
function collectTypedParameters(cursor: Cursor): Parsed<readonly LocatedValue[]> {
  const first = readTypedParameter(cursor);
  const rest = accepted(
    repeat(first.next, (item) => peek(item).text === ',', readFollowingParameter),
  );
  return { value: [first.value, ...rest.value], next: rest.next };
}
function readFollowingParameter(cursor: Cursor): Parsed<LocatedValue> {
  return readTypedParameter(consume(cursor, ','));
}
/** One `"name": T` pair, kept as a two-item located list matching the legacy tuple shape. */
function readTypedParameter(cursor: Cursor): Parsed<LocatedValue> {
  const name = readParameterName(cursor);
  const type = readTypeUse(consume(name.next, ':'));
  return {
    value: {
      value: [name.value.value, type.value.value],
      span: consumedSpan(cursor, type.next),
      items: [name.value, type.value],
    },
    next: type.next,
  };
}
function readParameterName(cursor: Cursor): Parsed<LocatedValue> {
  const token = peek(cursor);
  if (token.kind !== 'string')
    reject('syntax', token.span, 'Quoted parameter name', 'Expected a quoted parameter name');
  return {
    value: { value: decodeString(token.text, token.span), span: token.span, token },
    next: advance(cursor),
  };
}
