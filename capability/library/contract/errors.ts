/** Machine-readable failures; consumers never parse explanation strings. */
export type DiagnosticCode =
  | 'shape'
  | 'limit'
  | 'duplicate'
  | 'reference'
  | 'cycle'
  | 'identity'
  | 'not-found'
  | 'already-exists'
  | 'folder-not-empty'
  | 'stale-cursor';
/** One failure at an input/catalog path. */
export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly path: string;
  readonly message: string;
}
/** Validation rejects with at least one actionable diagnostic; no partial value is exposed. */
export interface ValidationError {
  readonly code: 'validation-failed';
  readonly diagnostics: readonly [Diagnostic, ...Diagnostic[]];
}
/** Locally owned envelope; E belongs to this capability, never a shared Result kernel. */
export type Result<T, E = ValidationError> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
