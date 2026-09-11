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
/** Success value or diagnostics with no partial candidate. Replaying pure Model operations is safe. */
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[] };
