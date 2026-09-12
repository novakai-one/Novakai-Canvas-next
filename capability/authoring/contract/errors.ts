import { failureSource } from './records/failure-source.js';
import type { FailureSource } from './records/failure-source.js';
import { z } from 'zod';
/** One failure vocabulary for all authors; no response grants permission to discard a draft. */
export const diagnosticSchema = z.strictObject({
  code: z.enum([
    'invalid-input',
    'unsupported-version',
    'unknown-reference',
    'invariant-violation',
    'constraint-conflict',
    'revision-conflict',
    'request-reused',
    'missing-asset',
    'permission-denied',
    'storage-unavailable',
    'corrupt-record',
    'cancelled',
  ]),
  path: z.string(),
  targets: z.array(z.string()),
  message: z.string(),
  recovery: z.string(),
  traceId: z.string().nullable(),
  source: failureSource.optional(),
});
export type Diagnostic = z.infer<typeof diagnosticSchema>;
export type ErrorCode = Diagnostic['code'];
/** Locally owned success/failure envelope; E retains the owning capability's structured failure. */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };
/** Authoring reconciles receipts before retry; callers retain drafts and correct named inputs. */
export function failure<T>(
  code: ErrorCode,
  path: string,
  message: string,
  targets: readonly string[] = [],
  source?: FailureSource,
): Result<T> {
  const rejected: Extract<Result<T>, { readonly ok: false }> = {
    ok: false,
    error: {
      code,
      path,
      message,
      targets: [...targets],
      recovery:
        'Retain the draft. Reconcile this request receipt before retry; re-read versions before submitting changed intent under a new request ID.',
      traceId: null,
    },
  };
  if (source === undefined) return rejected;
  return { ok: false, error: { ...rejected.error, source } };
}
/** Private typed rejection; every facade operation catches it into Result. */
export class AuthoringFault extends Error {
  /** Preserve a diagnostic across private value-returning helpers; Authoring boundary owns recovery. */
  constructor(readonly diagnostic: Diagnostic) {
    super(diagnostic.message);
  }
}
