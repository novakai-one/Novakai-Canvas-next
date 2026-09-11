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
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
/** Presentation never commits; Authoring retains the prior state and caller corrects the resource or input. */
export function fail<T>(code: ErrorCode, path: string, message: string): Result<T> {
  return {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery:
        'Correct the input or restore the pinned resource; Authoring retains the prior committed state.',
    },
  };
}
/** Internal measured-content failure is converted by the named project/render protection boundary. */
export class ProjectionFault extends Error {
  /** Structured diagnostic survives private synchronous helpers without exception-message parsing. */
  constructor(readonly diagnostic: Diagnostic) {
    super(diagnostic.message);
  }
}
