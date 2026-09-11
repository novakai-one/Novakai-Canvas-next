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
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
/** Pure plans are replayable; Authoring owns correction, compare-and-swap and persisted retry receipts. */
export function fail<T>(code: ErrorCode, path: string, message: string): Result<T> {
  return {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery:
        'Correct the input or provider, then prepare again; Authoring owns commit and retry.',
    },
  };
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
