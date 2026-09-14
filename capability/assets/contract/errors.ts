export type ErrorCode =
  | 'invalid-input'
  | 'unsupported-media'
  | 'unsafe-media'
  | 'missing-asset'
  | 'corrupt-asset'
  | 'lease-expired'
  | 'storage-unavailable';
/** Storage uncertainty requires authoritative re-read; a rejected media input requires correction. */
export interface AssetError {
  readonly code: ErrorCode;
  readonly path: string;
  readonly message: string;
  readonly recovery: string;
}
/** Locally owned success/failure envelope; E retains the owning capability's structured failure. */
export type Result<T, E = AssetError> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
/** Shared typed error construction; Authoring owns submission retry, Assets owns staged-file cleanup. */
export function fail<T>(code: ErrorCode, path: string, message: string): Result<T> {
  return { ok: false, error: { code, path, message, recovery: recovery[code] } };
}
const recovery: Readonly<Record<ErrorCode, string>> = {
  'invalid-input': 'Correct the submitted metadata or identity.',
  'unsupported-media': 'Use a supported local image, SVG or font format.',
  'unsafe-media': 'Correct the original media; no unsafe content was admitted.',
  'missing-asset': 'Restage the original bytes and acquire them before committing a binding.',
  'corrupt-asset':
    'Retain evidence and restore verified original bytes; do not substitute content.',
  'lease-expired': 'Acquire or reserve again, then repeat verification before commit.',
  'storage-unavailable': 'Re-read blob and lease state before retry; Assets owns orphan cleanup.',
};

/** Native adapter detail carries a structured fault into AssetStorage's typed rollback boundary. */
export class StorageFault extends Error {
  /** Adapter callers never recover by parsing this message; the store maps code/path directly. */
  constructor(
    readonly code: ErrorCode,
    readonly path: string,
    message: string,
  ) {
    super(message);
  }
}
