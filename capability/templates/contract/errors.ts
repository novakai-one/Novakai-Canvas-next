import type { FailureSource } from './records/failure-source.js';
/** Stable failures callers can switch on without parsing prose. */
export type ErrorCode =
  | 'invalid-input'
  | 'unsupported-version'
  | 'missing-preset'
  | 'digest-mismatch'
  | 'version-exists'
  | 'duplicate-preset'
  | 'dependency-cycle'
  | 'provider-failed';
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
/** Pure plans are replayable; Authoring owns correction, compare-and-swap and persisted retry receipts. */
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
        'Correct the input or provider, then prepare again; Authoring owns commit and retry.',
    },
  };
  if (source === undefined) return rejected;
  return { ok: false, error: { ...rejected.error, source } };
}
/** Internal bounded-data exception is converted by the documented public protection boundary. */
export class InputFault extends Error {
  /** Only structured code/path reaches callers; no recovery by parsing exception messages. */
  constructor(
    readonly code: ErrorCode,
    readonly path: string,
    message: string,
  ) {
    super(message);
  }
}
