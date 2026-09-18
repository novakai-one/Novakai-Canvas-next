/** Minimum directory-entry view; adapters must return entries without following symlinks. */
export interface ExtractionEntry {
  readonly name: string;
  readonly parentPath: string;
  readonly isDirectory: () => boolean;
  readonly isSymbolicLink: () => boolean;
}
/** Synchronous, read-only filesystem access; every method is consumed by extraction. */
export interface ExtractionFilesystem {
  readonly readFile: (path: string) => string;
  readonly readdir: (path: string) => readonly ExtractionEntry[];
  readonly realpath: (path: string) => string;
}
/** Failures preserve original evidence; unresolved imports retain baseline external-record semantics. */
export interface ExtractionFailure {
  readonly code:
    | 'unreadable-file'
    | 'unreadable-directory'
    | 'unresolvable-path'
    | 'symlink-escape'
    | 'extraction-failed';
  readonly path: string;
  readonly source?: unknown;
}
/** Extraction has no write effects; callers correct the failure and retry. */
export type ExtractionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ExtractionFailure };
/** Semantic section shape; extraction does not depend on the layout implementation. */
export interface ExtractedSection {
  readonly number: number;
  readonly nodes: readonly { readonly number: number; readonly label: string }[];
  readonly children: readonly ExtractedSection[];
}
