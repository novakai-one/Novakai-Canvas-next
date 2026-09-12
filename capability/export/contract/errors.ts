/** Export failures are retryable reads; hosts own storage repair and import admission. */
export type ErrorCode =
  | 'invalid-input'
  | 'snapshot-mismatch'
  | 'missing-section'
  | 'limit-exceeded'
  | 'cancelled'
  | 'encoding-failed'
  | 'cleanup-failed'
  | 'invalid-bundle'
  | 'resource-rejected'
  | 'invalid-import';
export interface Diagnostic {
  readonly code: ErrorCode;
  readonly path: string;
  readonly message: string;
  readonly recovery: string;
}
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly error: Diagnostic;
      readonly diagnostics?: readonly Diagnostic[];
    };
/** A failed read exposes no partial artifact; callers retain the original input. */
export function failure(code: ErrorCode, path: string, message: string): Result<never> {
  return {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery: 'Correct the input or repair the provider, then retry the read.',
    },
  };
}
