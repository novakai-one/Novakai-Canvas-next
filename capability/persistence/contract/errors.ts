/** Typed recovery instructions apply even when a COMMIT acknowledgement is uncertain. */
export type ErrorCode =
  | 'invalid-input'
  | 'unsupported-version'
  | 'revision-conflict'
  | 'request-reused'
  | 'storage-unavailable'
  | 'corrupt-record'
  | 'missing-resource'
  | 'destination-not-empty';
export interface StorageError {
  readonly code: ErrorCode;
  readonly path: string;
  readonly message: string;
  readonly recovery: string;
}
/** Failure never contains a partial value; storage-unavailable may require receipt reconciliation. */
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: StorageError };
/** Shared typed failure vocabulary for adapters and core; callers own the named recovery. */
export function fail<T>(code: ErrorCode, path: string, message: string): Result<T> {
  const recovery = recoveryByCode[code];
  return { ok: false, error: { code, path, message, recovery } };
}
const recoveryByCode: Readonly<Record<ErrorCode, string>> = {
  'invalid-input': 'Correct the submitted input.',
  'unsupported-version': 'Use a compatible reader; do not reset the database.',
  'revision-conflict': 'Re-read and prepare a new request.',
  'request-reused': 'Use a new request ID for different intent.',
  'storage-unavailable':
    'Reopen and reconcile the request receipt; for restore inspect destination before retry or activation.',
  'corrupt-record': 'Retain the original location and restore a verified backup.',
  'missing-resource': 'Restage the original bytes and retry.',
  'destination-not-empty': 'Choose a new empty restore location.',
};
