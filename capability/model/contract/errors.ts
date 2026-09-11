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
export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly path: string;
  readonly message: string;
}
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };
