/** CLI errors tell the agent what to correct without requiring JSON or parsing an exception message. */
export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly recovery: string;
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
/** Failed input has no write effects. Uncertain transport requires receipt reconciliation under the retained request ID. */
export function failure<T>(
  code: string,
  message: string,
  recovery = 'Correct the named input and retry.',
): Result<T> {
  return { ok: false, error: { code, message, recovery } };
}
