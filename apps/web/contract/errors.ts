import type { FailureSource } from './records/failure-source.js';
export type DiagnosticOwner = 'panel-preferences' | 'workspace';
/** Web failures preserve human drafts and expose an action; protocol uncertainty never becomes an optimistic Saved state. */
export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly recovery: string;
  readonly owner?: DiagnosticOwner;
  readonly source?: FailureSource | undefined;
}
/** Locally owned success/failure envelope; E retains the owning capability's structured failure. */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
/** Input correction is local; service errors retain their owner-specific recovery text. */
export function failure<T>(
  code: string,
  message: string,
  source?: FailureSource,
): Extract<Result<T>, { readonly ok: false }> {
  const rejected: Extract<Result<T>, { readonly ok: false }> = {
    ok: false,
    error: {
      code,
      message,
      recovery:
        'Keep your draft. Correct the problem or reconnect, then reconcile any pending request.',
    },
  };
  if (source === undefined) return rejected;
  return { ok: false, error: { ...rejected.error, source } };
}
