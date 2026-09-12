/** Stable correction categories; hosts retain the last valid scope on every failure. */
export type ErrorCode =
  | 'invalid-input'
  | 'unknown-token'
  | 'cycle'
  | 'type-mismatch'
  | 'out-of-range'
  | 'contrast'
  | 'missing-font'
  | 'stale-pin'
  | 'limit'
  | 'unsafe-artifact'
  | 'io-failure'
  | 'provider-failure'
  | 'invalid-style';
export interface TokenError {
  readonly code: ErrorCode;
  readonly path: string;
  readonly targets: readonly string[];
  readonly expected: string;
  readonly message: string;
  readonly recovery: string;
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: TokenError };
/** Private structured short-circuit; public Design System operations convert this to Result. */
export class TokenFault extends Error {
  readonly detail: TokenError;
  /** Preserve structured failure information; the public operation owns correction recovery. */
  constructor(detail: TokenError) {
    super(detail.message);
    this.detail = detail;
  }
}
