/** Canvas failures retain the current scene; the host displays recovery and owns retry. */
export type ErrorCode =
  | 'invalid-input'
  | 'invalid-scene'
  | 'stale-scene'
  | 'unknown-target'
  | 'invalid-gesture'
  | 'mutation-unavailable'
  | 'provider-failure'
  | 'disposed'
  | 'listener-failure';
export interface Diagnostic {
  readonly code: ErrorCode;
  readonly path: string;
  readonly targets: readonly string[];
  readonly message: string;
  readonly recovery: string;
}
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: Diagnostic };
/** Private structured control flow; all public operations catch it into Result. */
export class CanvasFault extends Error {
  constructor(readonly detail: Diagnostic) {
    super(detail.message);
  }
}
