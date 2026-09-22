import type { Token } from '../../contract/records/syntax.js';
import type { Result } from '../../contract/errors.js';
import { protect, reject, origin } from '../validation/outcomes.js';
import { lineStarts, sourceSpan } from './locations.js';
const lexeme =
  /\s+|#[^\n]*|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|@[A-Za-z][A-Za-z0-9_-]*|(?:0|1)\.\.(?:1|many)|-?\d+|[A-Za-z][A-Za-z0-9_-]*|->|[{}\[\],=.:/]|[\s\S]/g;
const quoteKinds: Readonly<Record<string, Token['kind']>> = { '"': 'string', "'": 'literal' };
/** Token kinds come from complete lexemes; invalid punctuation never becomes an implicit word. */
function classify(text: string): Token['kind'] {
  const quoted = quoteKinds[text.charAt(0)];
  if (quoted !== undefined) return quoted;
  if (text.startsWith('@')) return 'id';
  return classifyBare(text);
}
/** Cardinalities are words; integer properties are checked by their owning property definition. */
function classifyBare(text: string): Token['kind'] {
  if (/^-?\d+$/.test(text)) return 'integer';
  if (/^[A-Za-z0-9]/.test(text)) return 'word';
  return 'symbol';
}
/** Comments and whitespace are trivia only outside strings. */
function isTrivia(text: string): boolean {
  return /^\s|^#/.test(text);
}
/** Bounded iterative lexing; local allocation only. Language owns correction and typed failure recovery. */
export function tokenize(source: string): Result<readonly Token[]> {
  return protect(() => collectTokens(source));
}
/** Consume all source with an invalid-character fallback; never skip malformed source gaps. */
function collectTokens(source: string): readonly Token[] {
  const starts = lineStarts(source);
  const tokens: Token[] = [];
  for (const match of source.matchAll(lexeme)) appendToken(tokens, match, starts);
  tokens.push({ kind: 'eof', text: '', span: sourceSpan(starts, source.length, source.length) });
  return tokens;
}
/** Token allocation stops at the public bound, before constructing an oversized token array. */
function appendToken(tokens: Token[], match: RegExpExecArray, starts: readonly number[]): void {
  if (isTrivia(match[0])) return;
  requireCompleteLexeme(match, starts);
  if (tokens.length >= 250000)
    reject('limit', origin, 'At most 250000 tokens', 'Token limit exceeded');
  tokens.push({
    kind: classify(match[0]),
    text: match[0],
    span: sourceSpan(starts, match.index, match.index + match[0].length),
  });
}

/** A fallback opening quote is not a string or literal token; only the complete quoted production may be decoded. */
function requireCompleteLexeme(match: RegExpExecArray, starts: readonly number[]): void {
  if (match[0] === '"')
    reject(
      'syntax',
      sourceSpan(starts, match.index, match.index + 1),
      'Closing unescaped quote',
      'Unterminated quoted string',
    );
  if (match[0] === "'")
    reject(
      'syntax',
      sourceSpan(starts, match.index, match.index + 1),
      'Closing unescaped quote',
      'Unterminated literal',
    );
}
