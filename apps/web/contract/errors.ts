/** Web failures preserve human drafts and expose an action; protocol uncertainty never becomes an optimistic Saved state. */
export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly recovery: string;
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
/** Input correction is local; service errors retain their owner-specific recovery text. */
export function failure<T>(
  code: string,
  message: string,
): Extract<Result<T>, { readonly ok: false }> {
  return {
    ok: false,
    error: {
      code,
      message,
      recovery:
        'Keep your draft. Correct the problem or reconnect, then reconcile any pending request.',
    },
  };
}
