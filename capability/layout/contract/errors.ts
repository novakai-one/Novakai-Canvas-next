import type { FailureSource } from './records/failure-source.js';
/** Layout failures never authorize partial geometry or semantic writes. */
export type ErrorCode =
  | 'candidate-infeasible'
  | 'invalid-input'
  | 'constraint-conflict'
  | 'engine-failed'
  | 'cancelled'
  | 'limit';
export interface Diagnostic {
  readonly code: ErrorCode;
  readonly path: string;
  readonly targets: readonly string[];
  readonly message: string;
  readonly recovery: string;
  readonly source?: FailureSource | undefined;
}
/** Locally owned success/failure envelope; E retains the owning capability's structured failure. */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
/** Authoring retains the committed collection/draft; host retries or exposes named constraint correction. */
export function failure<T>(
  code: ErrorCode,
  path: string,
  message: string,
  targets: readonly string[] = [],
  source?: FailureSource,
): Result<T> {
  const rejected: Extract<Result<T>, { readonly ok: false }> = {
    ok: false,
    error: {
      code,
      path,
      targets,
      message,
      recovery:
        'Retain the current scene and draft; correct named constraints/resources or retry the current job.',
    },
  };
  if (source === undefined) return rejected;
  return { ok: false, error: { ...rejected.error, source } };
}
/** Private structured rejection is caught by public arrange/route/inspect; no exception-message branching. */
export class LayoutFault extends Error {
  /** Preserve diagnostic identity through synchronous geometry helpers. */ constructor(
    readonly diagnostic: Diagnostic,
  ) {
    super(diagnostic.message);
  }
}
