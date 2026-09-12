import { LanguageFault, type DiagnosticCode, type Result } from '../../contract/errors.js';
import type { Span } from '../../contract/records/syntax.js';
export const origin: Span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};
/** Stop private compilation with structured correction information; Language facade owns recovery. */
export function reject(
  code: DiagnosticCode,
  span: Span,
  expected: string,
  message: string,
  target = '',
): never {
  throw new LanguageFault([
    {
      code,
      span,
      expected,
      message,
      target,
      recovery: 'Retain the source, correct the named input, then check again before applying.',
    },
  ]);
}
/** Unwrap a checked private result; Language boundary retains all diagnostics on failure. */
export function accepted<T>(result: Result<T>): T {
  if (!result.ok) throw new LanguageFault(result.error.diagnostics);
  return result.value;
}
/** Freeze only detached compiler-owned records, never caller data; no cross-call state exists. */
function freezeOwned(value: unknown): void {
  if (value === null) return;
  if (typeof value !== 'object') return;
  Object.values(value).forEach(freezeOwned);
  Object.freeze(value);
}
/** Catch provider/input faults as typed outcomes. Language owns correction; Authoring owns commit recovery. */
export function protect<T>(operation: () => T): Result<T> {
  try {
    const value = operation();
    freezeOwned(value);
    return { ok: true, value };
  } catch (error) {
    return faultResult(error);
  }
}
/** Unexpected provider failures reveal no unchecked candidate or private exception text. */
function faultResult(error: unknown): Result<never> {
  if (error instanceof LanguageFault)
    return { ok: false, error: { code: 'validation-failed', diagnostics: error.diagnostics } };
  return {
    ok: false,
    error: {
      code: 'validation-failed',
      diagnostics: [
        {
          code: 'provider-failure',
          span: origin,
          target: '',
          expected: 'Readable immutable input and a successful owner result',
          message: 'Input or provider could not be read',
          recovery: 'Retain source; repair the provider or input and check again.',
        },
      ],
    },
  };
}
