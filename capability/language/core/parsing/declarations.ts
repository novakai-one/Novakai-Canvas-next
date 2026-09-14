import type { Declaration, Construct, Fields } from '../../contract/records/syntax.js';
import type { ConstructDefinition, PositionRule } from '../../contract/records/vocabulary.js';
import { constructs } from '../vocabulary/constructs.js';
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
import { readAttributes } from './attributes.js';
import { readValue, readReferenceList } from './values.js';
import { checkValue } from './value-types.js';
import { repeat } from './repetition.js';
/** Dispatch only a shipped construct accepted by the current owning body. */
export function readDeclaration(
  cursor: Cursor,
  allowed: readonly Construct[],
): Parsed<Declaration> {
  const definition = constructs.find((item) => item.kind === peek(cursor).text);
  if (definition === undefined)
    reject('syntax', peek(cursor).span, allowed.join(' / '), 'Unknown declaration');
  if (!allowed.includes(definition.kind))
    reject(
      'syntax',
      peek(cursor).span,
      allowed.join(' / '),
      'Declaration is not allowed in this body',
    );
  return readDefined(cursor, definition);
}
/** Positions, attributes and children are separate grammar stages with named intermediate results. */
function readDefined(cursor: Cursor, definition: ConstructDefinition): Parsed<Declaration> {
  const positional = definition.positions.reduce(readPosition, {
    value: {},
    next: advance(cursor),
  });
  const attributes = readAttributes(positional.next, definition.properties);
  const children = readChildren(attributes.next, definition.children);
  const fields = { ...positional.value, ...attributes.value };
  checkRequired(fields, definition, cursor);
  return {
    value: {
      kind: definition.kind,
      fields,
      children: children.value,
      span: consumedSpan(cursor, children.next),
    },
    next: children.next,
  };
}
/** Optional branch identities are omitted only when the next token is its quoted label. */
function readPosition(current: Parsed<Fields>, rule: PositionRule): Parsed<Fields> {
  if (rule.literal !== undefined) return { ...current, next: consume(current.next, rule.literal) };
  if (optionalIdentityMissing(current.next, rule)) return current;
  return readRequiredPosition(current, rule);
}
/** Reference-list positions consume whitespace-delimited IDs; attribute lists use square brackets. */
function readRequiredPosition(current: Parsed<Fields>, rule: PositionRule): Parsed<Fields> {
  const raw = positionalValue(current.next, rule.type);
  const checked = checkValue(raw.value, { ...rule, field: rule.name }, rule.name);
  requireQuotedPosition(current.next, rule);
  return { value: { ...current.value, [rule.name]: checked }, next: raw.next };
}
/** Required quoted text cannot be confused with a following declaration keyword. */
function requireQuotedPosition(cursor: Cursor, rule: PositionRule): void {
  if (rule.type !== 'string') return;
  if (peek(cursor).kind !== 'string')
    reject('syntax', peek(cursor).span, 'Quoted string', 'Positional text must be quoted');
}
/** Only the two positional list forms are unbracketed. */
function positionalValue(cursor: Cursor, type: PositionRule['type']): ReturnType<typeof readValue> {
  if (type === 'references' || type === 'targets') return readReferenceList(cursor);
  return readValue(cursor);
}
/** Required attributes have no hidden default; Model owns cross-record constraints afterward. */
function checkRequired(fields: Fields, definition: ConstructDefinition, cursor: Cursor): void {
  Object.entries(definition.properties).forEach(([name, property]) => {
    if (property.required && !Object.hasOwn(fields, name))
      reject('syntax', peek(cursor).span, name, 'Required property is missing');
  });
}
/** Nested braces carry allowed child vocabulary; flat declaration count uses iterative repetition. */
function readChildren(
  cursor: Cursor,
  allowed: readonly Construct[] | null,
): Parsed<readonly Declaration[]> {
  if (allowed === null) return { value: [], next: cursor };
  const body = enter(consume(cursor, '{'));
  const children = accepted(
    repeat(
      body,
      (item) => peek(item).text !== '}',
      (item) => readDeclaration(item, allowed),
    ),
  );
  return { value: children.value, next: leave(consume(children.next, '}')) };
}

/** Only branch IDs have optional positional syntax. */
function optionalIdentityMissing(cursor: Cursor, rule: PositionRule): boolean {
  return rule.optional === true && peek(cursor).kind !== 'id';
}
