import { AuthoringFault, failure, diagnosticSchema } from '../../contract/errors.js';
import type { ErrorCode, Result } from '../../contract/errors.js';
/** Raise a typed private rejection; Authoring facade returns it without exposing a partial candidate. */
export function reject(code: ErrorCode, path: string, message: string): never {
  return accepted(failure<never>(code, path, message, [path]));
}
/** Unwrap only inside a guarded Authoring operation; domain identity survives collaborator rejection. */
export function accepted<T>(result: Result<T>): T {
  if (!result.ok) throw new AuthoringFault(copyDiagnostic(result.error));
  return result.value;
}
/** Deep freeze copied data. Infrastructure leases/services never enter this function. */
export function freeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
/** Unknown provider faults receive request correlation without stack/message disclosure; Authoring owns retry. */
export function boundaryFailure<T>(error: unknown, traceId: string): Result<T> {
  if (error instanceof AuthoringFault) return { ok: false, error: error.diagnostic };
  return {
    ok: false,
    error: {
      code: 'storage-unavailable',
      path: 'provider',
      targets: [],
      message: 'An authoring collaborator failed unexpectedly',
      recovery: 'Retain the draft and reconcile the same request receipt before retry.',
      traceId,
    },
  };
}
/** Catch all asynchronous paths at the public boundary; Authoring reconciles uncertain commits internally. */
export async function protect<T>(operation: () => Promise<T>, traceId: string): Promise<Result<T>> {
  try {
    return freeze({ ok: true, value: await operation() });
  } catch (error) {
    return freeze(boundaryFailure(error, traceId));
  }
}

/** Own provider diagnostics before freezing them; malformed provider errors become a typed corruption rejection. */
function copyDiagnostic(input: unknown): import('../../contract/errors.js').Diagnostic {
  const parsed = diagnosticSchema.safeParse(input);
  if (!parsed.success)
    return accepted(
      failure<never>('corrupt-record', 'diagnostic', 'Provider returned an invalid diagnostic'),
    );
  return parsed.data;
}
