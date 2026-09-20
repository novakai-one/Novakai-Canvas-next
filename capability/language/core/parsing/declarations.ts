import type { Declaration, Construct, Fields, LocatedValue } from '../../contract/records/syntax.js';
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
import { readIdentity } from './references.js';
/** Dispatch only a shipped construct accepted by the current owning body. */
export function readDeclaration(
  cursor: Cursor,
  allowed: readonly Construct[],
): Parsed<Declaration> {
  const compactType = compactTypeDeclaration(cursor, allowed);
  if (compactType !== undefined) return compactType;
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

function compactTypeDeclaration(cursor: Cursor, allowed: readonly Construct[]): Parsed<Declaration> | undefined {
  if (peek(cursor).text !== 'type' || peek(cursor, 3).text !== '=') return undefined;
  if (!allowed.includes('type')) reject('syntax', peek(cursor).span, allowed.join(' / '), 'Declaration is not allowed in this body');
  return readType(cursor);
}

/** Read the compact shared-definition form: type @id "Label" = "A" | "B". */
function readType(cursor: Cursor): Parsed<Declaration> {
  const start = cursor;
  const identity = readIdentity(advance(cursor, 1));
  const labelValue = readValue(identity.next);
  if (typeof labelValue.value.value !== 'string')
    reject('syntax', labelValue.value.span, 'Quoted label', 'Definition label must be text');
  const expressionStart = consume(labelValue.next, '=');
  const atoms: string[] = [];
  let next = expressionStart;
  while (true) {
    const token = peek(next);
    requireTypeAtom(token);
    atoms.push(token.text);
    next = advance(next);
    if (peek(next).text !== '|') break;
    next = advance(next);
  }
  const expression: LocatedValue = {
    value: atoms.join(' | '),
    span: consumedSpan(expressionStart, next),
  };
  return {
    value: {
      kind: 'type',
      fields: {
        id: { value: { kind: 'reference', id: identity.value }, span: peek(advance(cursor, 1)).span },
        label: labelValue.value,
        expression,
      },
      children: [],
      span: consumedSpan(start, next),
    },
    next,
  };
}

function requireTypeAtom(token: ReturnType<typeof peek>): void {
  if (!['string', 'word', 'id', 'integer'].includes(token.kind)) reject('syntax', token.span, 'Type expression', 'Expected a type expression atom');
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
