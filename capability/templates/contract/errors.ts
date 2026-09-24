import type { FailureSource } from './records/failure-source.js';

/**
 * Every failure code Templates returns. Callers branch on the code, never on the message.
 *
 * - `invalid-input`: the input or a provider's output does not match its schema or rules.
 * - `unsupported-version`: reserved; no current producer.
 * - `missing-preset`: a selection or pin names a preset that is not in the catalog.
 * - `digest-mismatch`: content does not match its digest, a pin's digest differs, or a recipe's
 *   inspected payload differs from the admitted one.
 * - `version-exists`: the version already exists with different content.
 * - `duplicate-preset`: the catalog lists one kind/id/version twice.
 * - `dependency-cycle`: preset dependencies (theme bases, recipe theme pins) form a loop.
 * - `provider-failed`: an injected provider failed, or an unexpected error was thrown.
 */
export type ErrorCode =
  | 'invalid-input'
  | 'unsupported-version'
  | 'missing-preset'
  | 'digest-mismatch'
  | 'version-exists'
  | 'duplicate-preset'
  | 'dependency-cycle'
  | 'provider-failed';

/** One failure: its code, where it happened, what went wrong and how to recover. */
export interface Diagnostic {
  readonly code: ErrorCode;
  /** Where the failure is: an input field, a preset key `kind/id/version`, a preset ID, or `$`. */
  readonly path: string;
  /** A human-readable explanation. Its wording is not part of the contract. */
  readonly message: string;
  /** Always the same instruction: correct the input or provider and prepare again. */
  readonly recovery: string;
  /** The owning capability's original failure, when one caused this failure. */
  readonly source?: FailureSource | undefined;
}

/**
 * Templates' own success-or-failure envelope. `E` defaults to {@link Diagnostic}; it is declared
 * here so Templates does not depend on another capability's result type.
 */
export type Result<T, E = Diagnostic> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

/**
 * Builds a typed failure with the fixed recovery instruction ("Correct the input or provider,
 * then prepare again; Authoring owns commit and retry."). Plans are pure and can be prepared
 * again; Authoring owns correction, the conditional commit and retry receipts.
 *
 * @param code - The failure code.
 * @param path - Where the failure happened.
 * @param message - What went wrong.
 * @param source - The owning capability's original failure, if any. When omitted, the error has
 * no `source` key at all.
 * @returns `{ ok: false, error: { code, path, message, recovery[, source] } }`.
 */
export function fail<T>(
  code: ErrorCode,
  path: string,
  message: string,
  source?: FailureSource,
): Result<T> {
  const rejected: Extract<Result<T>, { readonly ok: false }> = {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery:
        'Correct the input or provider, then prepare again; Authoring owns commit and retry.',
    },
  };
  if (source === undefined) {
    return rejected;
  }
  return { ok: false, error: { ...rejected.error, source } };
}

/**
 * Thrown inside Templates when input data breaks a bound (nesting, size, non-plain data). The
 * public boundary (`protect`) turns it into a failure with the same code, path and message; it
 * never reaches callers as an exception.
 */
export class InputFault extends Error {
  /**
   * @param code - The failure code the boundary reports.
   * @param path - Where the problem is.
   * @param message - What went wrong.
   */
  constructor(
    readonly code: ErrorCode,
    readonly path: string,
    message: string,
  ) {
    super(message);
  }
}
