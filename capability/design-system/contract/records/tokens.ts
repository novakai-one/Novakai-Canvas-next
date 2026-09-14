import type { TokenId } from '../brands.js';
/** Resolved colors are quantized before comparison/hash, so all consumers see identical bytes. */
export type TokenValue =
  | { readonly type: 'color'; readonly value: string }
  | { readonly type: 'dimension'; readonly value: number; readonly unit: 'px' }
  | { readonly type: 'duration'; readonly value: number; readonly unit: 'ms' }
  | { readonly type: 'number'; readonly value: number }
  | { readonly type: 'fontFamily'; readonly value: readonly string[] };
export type TokenType = TokenValue['type'];
/** Recipes are typed data, never executable source or raw CSS. */
export type Expression =
  | { readonly op: 'literal'; readonly value: TokenValue }
  | { readonly op: 'reference'; readonly target: TokenId }
  | { readonly op: 'multiply'; readonly value: Expression; readonly scalar: Expression }
  | { readonly op: 'sum' | 'max'; readonly values: readonly Expression[] }
  | { readonly op: 'alpha'; readonly color: Expression; readonly scalar: Expression };
export interface TokenDefinition {
  readonly id: TokenId;
  readonly type: TokenType;
  readonly expression: Expression;
}
export type TokenValues = Readonly<Record<TokenId, TokenValue>>;
export type Dependencies = Readonly<Record<string, readonly string[]>>;
