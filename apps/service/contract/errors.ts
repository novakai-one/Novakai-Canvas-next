/** Host failures name correction/recovery without exposing database or provider exception strings. */
export type ErrorCode =
  'invalid-input' | 'unauthorized' | 'not-found' | 'unavailable' | 'conflict' | 'cancelled';
export interface Diagnostic {
  readonly code: ErrorCode;
  readonly path: string;
  readonly message: string;
  readonly recovery: string;
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
/** Service callers retain their drafts and reconcile uncertain request receipts before any changed submission. */
export function failure<T>(code: ErrorCode, path: string, message: string): Result<T> {
  return {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery:
        'Retain the draft and request ID. Restore the named dependency or correct input; reconcile the receipt before retrying.',
    },
  };
}
