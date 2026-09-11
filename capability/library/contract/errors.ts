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
/** Rejected operations expose no partial candidate. Authoring owns correction and commit/recovery. */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };
