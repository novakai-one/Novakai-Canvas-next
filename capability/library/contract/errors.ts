/**
 * What kind of problem a diagnostic reports. Consumers branch on this code, never on the message.
 *
 * - `shape`: the input does not match its schema, or could not be read.
 * - `limit`: a size limit was exceeded (for example, the cursor budget).
 * - `duplicate`: an ID appears twice where it must be unique.
 * - `reference`: an ID refers to something that does not exist.
 * - `cycle`: folder parents form a loop.
 * - `identity`: reserved for identity conflicts.
 * - `not-found`: an operation or query names something that does not exist.
 * - `already-exists`: a create names an ID that already exists.
 * - `folder-not-empty`: a folder with contents was removed without `rehome`.
 * - `stale-cursor`: a cursor is malformed, out of range, or from another query or snapshot.
 */
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

/** One problem found in the input. */
export interface Diagnostic {
  readonly code: DiagnosticCode;
  /** Dotted path to the problem, for example `catalog.folders.<id>.parent`, or `$` for the input. */
  readonly path: string;
  /** A human-readable explanation. Its wording is not part of the contract. */
  readonly message: string;
}

/** A rejection with at least one diagnostic. No partial value is returned with it. */
export interface ValidationError {
  readonly code: 'validation-failed';
  readonly diagnostics: readonly [Diagnostic, ...Diagnostic[]];
}

/**
 * Library's own success-or-failure envelope. `E` defaults to {@link ValidationError}; it is
 * declared here so Library does not depend on another capability's result type.
 */
export type Result<T, E = ValidationError> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
