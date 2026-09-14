import type { Diagnostic, DiagnosticCode, Result } from '../../contract/errors.js';

/** Emit a diagnostic when the named violation is true; false means no failure. */
export function diagnoseWhen(
  violated: boolean,
  code: DiagnosticCode,
  path: string,
  message: string,
): readonly Diagnostic[] {
  if (!violated) return [];
  return [{ code, path, message }];
}

/** Uses the same true-means-failure convention as diagnoseWhen for unresolved addresses. */
export function referenceIssue(missing: boolean, path: string): readonly Diagnostic[] {
  return diagnoseWhen(
    missing,
    'reference',
    path,
    'Reference must resolve in this collection and scope',
  );
}

/** Return a typed rejection with no partial value. The calling Model boundary freezes it. */
export function failure<T>(code: DiagnosticCode, path: string, message: string): Result<T> {
  return {
    ok: false,
    error: { code: 'validation-failed', diagnostics: [{ code, path, message }] },
  };
}

/** Return a completed pure step; plan/validate own freezing and Authoring owns commit/recovery. */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

/** Empty rejected evidence is a provider contract failure. The owner returns a typed shape error; Authoring owns correction. */
export function rejected<T>(diagnostics: readonly Diagnostic[]): Result<T> {
  const [first, ...remaining] = diagnostics;
  if (first === undefined)
    return failure('shape', '$', 'Validation provider rejected input without diagnostic evidence');
  return { ok: false, error: { code: 'validation-failed', diagnostics: [first, ...remaining] } };
}
