import type { FailureSource } from './records/failure-source.js';
export type ErrorCode =
  | 'invalid-input'
  | 'missing-resource'
  | 'missing-glyph'
  | 'unknown-kind'
  | 'provider-failed'
  | 'limit';
export interface Diagnostic {
  readonly code: ErrorCode;
  readonly path: string;
  readonly message: string;
  readonly recovery: string;
  readonly source?: FailureSource | undefined;
}
/** Locally owned success/failure envelope; E retains the owning capability's structured failure. */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
/** Presentation never commits; Authoring retains the prior state and caller corrects the resource or input. */
export function fail<T>(
  code: ErrorCode,
  path: string,
  message: string,
  source?: FailureSource,
): Result<T> {
  const rejected: Extract<Result<T>, { readonly ok: false }> = {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery:
        'Correct the input or restore the pinned resource; Authoring retains the prior committed state.',
    },
  };
  if (source === undefined) return rejected;
  return { ok: false, error: { ...rejected.error, source } };
}
/** Internal measured-content failure is converted by the named project/render protection boundary. */
export class ProjectionFault extends Error {
  /** Structured diagnostic survives private synchronous helpers without exception-message parsing. */
  constructor(readonly diagnostic: Diagnostic) {
    super(diagnostic.message);
  }
}
