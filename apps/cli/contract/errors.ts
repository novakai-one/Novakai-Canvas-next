import type { FailureSource } from './records/failure-source.js';
/** CLI errors tell the agent what to correct without requiring JSON or parsing an exception message. */
export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly recovery: string;
  readonly source?: FailureSource | undefined;
}
/** Locally owned success/failure envelope; E retains the owning capability's structured failure. */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
/** Failed input has no write effects. Uncertain transport requires receipt reconciliation under the retained request ID. */
export function failure<T>(
  code: string,
  message: string,
  recovery = 'Correct the named input and retry.',
  source?: FailureSource,
): Result<T> {
  return { ok: false, error: { code, message, recovery, source } };
}
