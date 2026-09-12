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
  /** A release failure accompanies the primary failure; hosts repair both. */
  readonly cleanup?: Diagnostic;
}
/** Locally owned success/failure envelope; E retains the owning capability's structured failure. */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
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
