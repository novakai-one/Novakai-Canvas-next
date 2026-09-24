/*
 * How the compiler stops and how the public operations report it. Core code calls `reject` to
 * throw a private `LanguageFault` with one diagnostic, or `accepted` to rethrow a failed result's
 * diagnostics. `protect` wraps each public operation: it returns the deep-frozen value on
 * success, the fault's diagnostics as `validation-failed`, or one `provider-failure` diagnostic
 * for any other throw. Language owns correcting the source; Authoring owns commit recovery.
 */
import { LanguageFault, type DiagnosticCode, type Result } from '../../contract/errors.js';
import type { Span } from '../../contract/records/syntax.js';

/**
 * The empty span at the start of the source (line 1, column 1), for diagnostics with no better
 * place. It is one shared object and is not frozen; diagnostics that use it share it.
 */
export const origin: Span = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
};

/**
 * Stops compiling with one diagnostic. The recovery text is always "Retain the source, correct
 * the named input, then check again before applying."
 *
 * @param code - Why the input was rejected.
 * @param span - Where in the source.
 * @param expected - What was expected instead.
 * @param message - What went wrong.
 * @param target - The ID or path the problem is about; defaults to empty.
 * @returns Never returns.
 * @throws A `LanguageFault` holding the diagnostic, always. `protect` turns it into a result.
 */
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

/**
 * Unwraps a result from another compiler step.
 *
 * @param result - The result to unwrap.
 * @returns The value (not copied) when the result succeeded.
 * @throws A `LanguageFault` holding every diagnostic of a failed result.
 */
export function accepted<T>(result: Result<T>): T {
  if (!result.ok) throw new LanguageFault(result.error.diagnostics);
  return result.value;
}

/**
 * Runs one operation and turns every throw into a result. On success the value is deep-frozen
 * in place (it must be a record the compiler built, never caller data).
 *
 * @param operation - The work to run.
 * @returns `{ ok: true, value }` with the frozen value. A `LanguageFault` becomes
 * `validation-failed` with its diagnostics; any other throw, including one while freezing,
 * becomes `validation-failed` with a single `provider-failure` diagnostic that shows none of
 * the error's text.
 * @throws Never.
 */
export function protect<T>(operation: () => T): Result<T> {
  try {
    const value = operation();
    freezeOwned(value);
    return { ok: true, value };
  } catch (error) {
    return faultResult(error);
  }
}

/** Freezes the value and every object inside it, children first. Other values are left alone. */
function freezeOwned(value: unknown): void {
  if (value === null) return;
  if (typeof value !== 'object') return;
  Object.values(value).forEach(freezeOwned);
  Object.freeze(value);
}

/** The failed result for a caught throw: the fault's diagnostics, or one `provider-failure`. */
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
