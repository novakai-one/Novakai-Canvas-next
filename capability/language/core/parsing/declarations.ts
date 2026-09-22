import type {
  Declaration,
  Construct,
  Fields,
  LocatedValue,
  Token,
} from '../../contract/records/syntax.js';
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
import { readValue, readReferenceList, readLiteralUnion } from './values.js';
import { readTypeUse } from './types.js';
import { checkValue } from './value-types.js';
import { repeat } from './repetition.js';
import { readIdentity } from './references.js';
/** Dispatch only a shipped construct accepted by the current owning body. */
export function readDeclaration(
  cursor: Cursor,
  allowed: readonly Construct[],
  table: readonly ConstructDefinition[] = constructs,
): Parsed<Declaration> {
  const compactType = hasCompactType(table) ? compactTypeDeclaration(cursor, allowed) : undefined;
  if (compactType !== undefined) return compactType;
  const definition = declarationDefinition(cursor, allowed, table);
  return readDefined(cursor, definition, table);
}

/** Only a grammar whose type form carries a label position has the compact `= expression` form. */
function hasCompactType(table: readonly ConstructDefinition[]): boolean {
  const type = table.find((item) => item.kind === 'type');
  return type?.positions.some((position) => position.name === 'label') === true;
}

function declarationDefinition(
  cursor: Cursor,
  allowed: readonly Construct[],
  table: readonly ConstructDefinition[],
): ConstructDefinition {
  const definition = table.find((item) => item.kind === peek(cursor).text);
  if (definition === undefined)
    reject('syntax', peek(cursor).span, allowed.join(' / '), 'Unknown declaration');
  if (!allowed.includes(definition.kind))
    reject(
      'syntax',
      peek(cursor).span,
      allowed.join(' / '),
      'Declaration is not allowed in this body',
    );
  return definition;
}

function compactTypeDeclaration(
  cursor: Cursor,
  allowed: readonly Construct[],
): Parsed<Declaration> | undefined {
  if (peek(cursor).text !== 'type' || peek(cursor, 3).text !== '=') return undefined;
  requireAllowedType(cursor, allowed);
  return readType(cursor);
}

function requireAllowedType(cursor: Cursor, allowed: readonly Construct[]): void {
  if (!allowed.includes('type'))
    reject(
      'syntax',
      peek(cursor).span,
      allowed.join(' / '),
      'Declaration is not allowed in this body',
    );
}

/** Read the compact shared-definition form: type @id "Label" = "A" | "B". */
function readType(cursor: Cursor): Parsed<Declaration> {
  const start = cursor;
  const identity = readIdentity(advance(cursor, 1));
  const labelValue = readValue(identity.next);
  if (typeof labelValue.value.value !== 'string')
    reject('syntax', labelValue.value.span, 'Quoted label', 'Definition label must be text');
  const expressionStart = consume(labelValue.next, '=');
  const expressionTokens = readTypeTokens(expressionStart);
  const next = expressionTokens.next;
  const expression: LocatedValue = {
    value: expressionTokens.value.text,
    span: consumedSpan(expressionStart, next),
    tokens: expressionTokens.value.tokens,
  };
  return {
    value: {
      kind: 'type',
      fields: {
        id: {
          value: { kind: 'reference', id: identity.value },
          span: peek(advance(cursor, 1)).span,
        },
        label: labelValue.value,
        expression,
      },
      children: [],
      span: consumedSpan(start, next),
    },
    next,
  };
}

interface TypeTokens {
  readonly text: string;
  readonly tokens: readonly Token[];
}

function readTypeTokens(cursor: Cursor): Parsed<TypeTokens> {
  const tokens: string[] = [];
  const sourceTokens: Token[] = [];
  let current = cursor;
  let depth = 0;
  while (!endsTypeDeclaration(peek(current), depth)) {
    const token = peek(current);
    tokens.push(token.text);
    sourceTokens.push(token);
    depth = nextTypeDepth(token.text, depth);
    current = advance(current);
  }
  requireCompleteType(tokens, depth, peek(current).span);
  return { value: { text: joinTypeTokens(tokens), tokens: sourceTokens }, next: current };
}

function nextTypeDepth(token: string, depth: number): number {
  if (token === '(') return depth + 1;
  if (token === ')') return depth - 1;
  return depth;
}

function requireCompleteType(tokens: readonly string[], depth: number, span: Token['span']): void {
  if (tokens.length === 0 || depth !== 0)
    reject('syntax', span, 'Type expression', 'Expected a complete type expression');
}

function endsTypeDeclaration(token: Token, depth: number): boolean {
  if (depth > 0) return false;
  return (
    token.text === '}' ||
    (token.kind === 'word' &&
      [
        'type',
        'asset',
        'source',
        'node',
        'wire',
        'section',
        'rank',
        'align',
        'before',
        'below',
      ].includes(token.text))
  );
}

function joinTypeTokens(tokens: readonly string[]): string {
  return tokens.reduce(joinTypeToken, '');
}

function joinTypeToken(source: string, token: string): string {
  if (token === '.' || exponentContinuation(source, token)) return `${source}${token}`;
  return needsTypeSpace(source) ? `${source} ${token}` : `${source}${token}`;
}

function exponentContinuation(source: string, token: string): boolean {
  return exponentMatchers.some((matcher) => matcher(source, token));
}

const exponentMatchers: readonly ((source: string, token: string) => boolean)[] = [
  (source, token) => (token === 'e' || token === 'E') && /\d$/u.test(source),
  (source, token) => /^e[+-]?\d+$/u.test(token) && /\d$/u.test(source),
  (source, token) => (token === '+' || token === '-') && /[eE]$/u.test(source),
  (source, token) => /^[+-]?\d+$/u.test(token) && /[eE][+-]?$/u.test(source),
];

function needsTypeSpace(source: string): boolean {
  return source.length > 0 && !source.endsWith('.');
}
/** Positions, attributes and children are separate grammar stages with named intermediate results. */
function readDefined(
  cursor: Cursor,
  definition: ConstructDefinition,
  table: readonly ConstructDefinition[],
): Parsed<Declaration> {
  const positional = definition.positions.reduce(readPosition, {
    value: {},
    next: advance(cursor),
  });
  const attributes = readAttributes(positional.next, definition.properties);
  const children = readChildren(attributes.next, definition, table);
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
  if (optionalPositionMissing(current.next, rule)) return current;
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
const positionalReaders: Readonly<
  Record<string, (cursor: Cursor) => ReturnType<typeof readValue>>
> = {
  references: readReferenceList,
  targets: readReferenceList,
  endpoints: readReferenceList,
  'type-use': readTypeUse,
  'literal-union': readLiteralUnion,
};
/** Most position types share the scalar/list reader; a few forms need their own grammar. */
function positionalValue(cursor: Cursor, type: PositionRule['type']): ReturnType<typeof readValue> {
  const reader = positionalReaders[type];
  if (reader === undefined) return readValue(cursor);
  return reader(cursor);
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
  definition: ConstructDefinition,
  table: readonly ConstructDefinition[],
): Parsed<readonly Declaration[]> {
  const allowed = definition.children;
  if (allowed === null) return { value: [], next: cursor };
  if (skipsOptionalBody(cursor, definition)) return { value: [], next: cursor };
  return readBracedChildren(cursor, definition, allowed, table);
}

/** An optional body is omitted entirely when no brace opens it. */
function skipsOptionalBody(cursor: Cursor, definition: ConstructDefinition): boolean {
  return definition.body === 'optional' && peek(cursor).text !== '{';
}

/** A declared body, required or optional, is never authored empty; omit the block instead. */
function readBracedChildren(
  cursor: Cursor,
  definition: ConstructDefinition,
  allowed: readonly Construct[],
  table: readonly ConstructDefinition[],
): Parsed<readonly Declaration[]> {
  const braceSpan = peek(cursor).span;
  const body = enter(consume(cursor, '{'));
  requireNonEmptyBody(body, definition, braceSpan);
  const children = accepted(
    repeat(
      body,
      (item) => peek(item).text !== '}',
      (item) => readDeclaration(item, allowed, table),
    ),
  );
  return { value: children.value, next: leave(consume(children.next, '}')) };
}

function requireNonEmptyBody(
  body: Cursor,
  definition: ConstructDefinition,
  braceSpan: Token['span'],
): void {
  if (definition.body === undefined) return;
  if (peek(body).text === '}')
    reject('syntax', braceSpan, 'Non-empty block', 'E005 empty: omit the block.');
}

/** Only branch IDs and v2 optional labels have optional positional syntax. */
function optionalPositionMissing(cursor: Cursor, rule: PositionRule): boolean {
  if (rule.optional !== true) return false;
  return optionalTypeMissing(cursor, rule.type);
}

const optionalMissingChecks: Readonly<Record<string, (cursor: Cursor) => boolean>> = {
  id: (cursor) => peek(cursor).kind !== 'id',
  string: (cursor) => peek(cursor).kind !== 'string',
  'literal-union': (cursor) => peek(cursor).text !== '=',
};
function optionalTypeMissing(cursor: Cursor, type: PositionRule['type']): boolean {
  const check = optionalMissingChecks[type];
  if (check === undefined) return false;
  return check(cursor);
}
