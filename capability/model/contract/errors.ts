/** Machine-readable failure categories. Consumers branch on code, never parse message text. */
export type DiagnosticCode =
  | 'shape'
  | 'limit'
  | 'duplicate'
  | 'reference'
  | 'content'
  | 'endpoint'
  | 'key'
  | 'group'
  | 'layout'
  | 'mode'
  | 'tree'
  | 'sequence'
  | 'identity'
  | 'not-found'
  | 'already-exists'
  | 'delete-referenced';
/** One failure at a collection or operation path; message is explanatory text for the reader. */
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
