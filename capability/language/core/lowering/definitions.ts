import type { Declaration } from '../../contract/records/syntax.js';
import { field, id, text } from './fields.js';
import { reject } from '../validation/outcomes.js';
import type { RawRecord } from './fields.js';

type Atom = { readonly kind: 'reference'; readonly id: string } | { readonly kind: 'literal'; readonly value: string | number | boolean } | { readonly kind: 'primitive'; readonly name: string };

/** Lower the bounded declaration expression without splitting quoted literals or nested unions. */
export function lowerDefinition(declaration: Declaration): RawRecord {
  const source = text(declaration.fields, 'expression');
  const expression = parseExpression(source, field(declaration.fields, 'expression').span);
  return { id: id(declaration.fields), label: text(declaration.fields, 'label'), expression };
}

function parseExpression(source: string, span: Declaration['span']): RawRecord {
  const tokens = expressionTokens(source, span);
  const parsed = readUnion(tokens, 0, span);
  if (parsed.next !== tokens.length) reject('invalid-value', span, 'Complete type expression', 'Unexpected expression token');
  return parsed.value;
}

function expressionTokens(source: string, span: Declaration['span']): readonly string[] {
  const tokens: string[] = [];
  let index = 0;
  while (index < source.length) {
    const item = nextExpressionToken(source, index, span);
    index = item.next;
    appendToken(tokens, item.token);
  }
  return requireExpressionTokens(tokens, span);
}

function appendToken(tokens: string[], token: string): void {
  if (token !== '') tokens.push(token);
}

function requireExpressionTokens(tokens: readonly string[], span: Declaration['span']): readonly string[] {
  if (tokens.length === 0) reject('invalid-value', span, 'Type expression', 'Definition expression is empty');
  return tokens;
}

function nextExpressionToken(source: string, index: number, span: Declaration['span']): { readonly token: string; readonly next: number } {
  const char = source[index] ?? '';
  if (/\s/.test(char)) return { token: '', next: index + 1 };
  return readSymbolOrToken(source, index, span);
}

function readSymbolOrToken(source: string, index: number, span: Declaration['span']): { readonly token: string; readonly next: number } {
  const char = source[index] ?? '';
  if ('|()'.includes(char)) return { token: char, next: index + 1 };
  return char === '"' ? readQuotedToken(source, index, span) : readBareToken(source, index, span);
}

function readQuotedToken(source: string, start: number, span: Declaration['span']): { readonly token: string; readonly next: number } {
  const end = requireClosingQuote(source, start, span);
  return { token: source.slice(start, end + 1), next: end + 1 };
}

function requireClosingQuote(source: string, start: number, span: Declaration['span']): number {
  const match = source.slice(start).match(/^"(?:[^"\\]|\\.)*"/);
  if (match === null) reject('invalid-value', span, 'Closing quote', 'Unterminated type literal');
  return start + match[0].length - 1;
}

function readBareToken(source: string, index: number, span: Declaration['span']): { readonly token: string; readonly next: number } {
  const match = source.slice(index).match(/^@?[A-Za-z][A-Za-z0-9_-]*|-?(?:0|[1-9]\d*)(?:\.\d+)?/);
  if (match === null) reject('invalid-value', span, 'Type expression atom', 'Invalid type expression token');
  const token = match[0];
  return { token, next: index + token.length };
}

function readUnion(tokens: readonly string[], start: number, span: Declaration['span']): { readonly value: RawRecord; readonly next: number } {
  const first = readAtom(tokens, start, span);
  const items: RawRecord[] = [first.value];
  let next = first.next;
  while (tokens[next] === '|') {
    const item = readAtom(tokens, next + 1, span);
    items.push(item.value);
    next = item.next;
  }
  return { value: items.length === 1 ? (items[0] ?? { kind: 'union', items }) : { kind: 'union', items }, next };
}

function readAtom(tokens: readonly string[], start: number, span: Declaration['span']): { readonly value: RawRecord; readonly next: number } {
  if (tokens[start] === '(') {
    return readParenthesized(tokens, start, span);
  }
  const token = tokens[start];
  requireAtomToken(token, span);
  return { value: { ...atom(token, span) }, next: start + 1 };
}

function readParenthesized(tokens: readonly string[], start: number, span: Declaration['span']): { readonly value: RawRecord; readonly next: number } {
  const nested = readUnion(tokens, start + 1, span);
  if (tokens[nested.next] !== ')') reject('invalid-value', span, 'Closing parenthesis', 'Unclosed nested type expression');
  return { value: nested.value, next: nested.next + 1 };
}

function requireAtomToken(token: string | undefined, span: Declaration['span']): asserts token is string {
  if (token === undefined || token === '|' || token === ')') reject('invalid-value', span, 'Type expression atom', 'Expected a type expression atom');
}

function atom(token: string, span: Declaration['span']): Atom {
  const matcher = atomMatchers.find((candidate) => candidate.matches(token));
  if (matcher !== undefined) return matcher.read(token, span);
  reject('invalid-value', span, 'Supported type expression', 'Unknown type expression atom', token);
}

const atomMatchers: readonly { readonly matches: (token: string) => boolean; readonly read: (token: string, span: Declaration['span']) => Atom }[] = [
  { matches: (token) => token.startsWith('@'), read: (token) => ({ kind: 'reference', id: token.slice(1) }) },
  { matches: (token) => token.startsWith('"'), read: literalString },
  { matches: (token) => token === 'true' || token === 'false', read: (token) => ({ kind: 'literal', value: token === 'true' }) },
  { matches: (token) => /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(token), read: (token) => ({ kind: 'literal', value: Number(token) }) },
  { matches: (token) => ['string', 'number', 'boolean', 'unknown', 'void'].includes(token), read: (token) => ({ kind: 'primitive', name: token }) },
];

function literalString(token: string, span: Declaration['span']): Atom {
  try { return { kind: 'literal', value: JSON.parse(token) as string }; }
  catch { reject('invalid-value', span, 'Quoted literal', 'Invalid type literal'); }
}

/** Walk every nested expression reference once for scoped output and other language projections. */
export function expressionReferenceIds(expression: RawRecord): readonly string[] {
  const refs: string[] = [];
  const stack: unknown[] = [expression];
  while (stack.length > 0) {
    const current = stack.pop();
    visitRawExpression(current, refs, stack);
  }
  return refs;
}

function visitRawExpression(current: unknown, refs: string[], stack: unknown[]): void {
  if (current === null || typeof current !== 'object') return;
  const value = current as { readonly kind?: string; readonly id?: string; readonly items?: readonly unknown[] };
  addRawReference(value, refs);
  addRawChildren(value, stack);
}

function addRawReference(value: { readonly kind?: string; readonly id?: string }, refs: string[]): void {
  if (value.kind === 'reference' && value.id !== undefined) refs.push(value.id);
}

function addRawChildren(value: { readonly kind?: string; readonly items?: readonly unknown[] }, stack: unknown[]): void {
  if (value.kind === 'union' && value.items !== undefined) stack.push(...value.items);
}
