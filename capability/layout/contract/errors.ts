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
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
/** Authoring retains the committed collection/draft; host retries or exposes named constraint correction. */
export function failure<T>(
  code: ErrorCode,
  path: string,
  message: string,
  targets: readonly string[] = [],
): Result<T> {
  return {
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
}
/** Private structured rejection is caught by public arrange/route/inspect; no exception-message branching. */
export class LayoutFault extends Error {
  /** Preserve diagnostic identity through synchronous geometry helpers. */ constructor(
    readonly diagnostic: Diagnostic,
  ) {
    super(diagnostic.message);
  }
}
