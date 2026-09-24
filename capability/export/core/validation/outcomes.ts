/*
 * Result helpers for Export's core: build a success, turn a schema check into a Result, and
 * turn any throw into a typed failure.
 */
import { failure } from '../../contract/errors.js';
import type { Result, ErrorCode } from '../../contract/errors.js';

/** The part of a zod schema `parse` needs: `safeParse` with its success/issues result. */
interface Parser<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
      };
}

/**
 * Wraps a value as a success. The value is not copied; boundary code copies bytes it hands out.
 *
 * @param value - The successful value.
 * @returns `{ ok: true, value }`.
 */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Checks unknown input against a schema and reports the first issue as a typed failure.
 *
 * @param schema - The schema; its `safeParse` is read once, then called once.
 * @param input - The unknown input.
 * @param code - The failure code; defaults to `invalid-input`.
 * @returns The parsed data, or a failure. Its path is the first issue's path joined with dots
 * (an empty string for a top-level issue, `$` only if there are no issues); its message is the
 * first issue's message (`Invalid input` if there are none).
 */
export function parse<T>(
  schema: Parser<T>,
  input: unknown,
  code: ErrorCode = 'invalid-input',
): Result<T> {
  const result = schema.safeParse(input);
  if (result.success) return success(result.data);
  const first = result.error.issues.at(0);
  return failure(code, first?.path.map(String).join('.') ?? '$', first?.message ?? 'Invalid input');
}

/**
 * Runs an action and turns any throw or rejection into a typed failure, so provider exceptions
 * never escape an export or transfer operation. A returned failure is passed through
 * unchanged. The host owns repair and retry.
 *
 * @param action - The work to run.
 * @param code - The failure code for a throw; defaults to `encoding-failed`.
 * @returns The action's result, or a failure at path `$` saying no artifact was produced.
 */
export async function protect<T>(
  action: () => Promise<Result<T>>,
  code: ErrorCode = 'encoding-failed',
): Promise<Result<T>> {
  try {
    return await action();
  } catch {
    return failure(code, '$', 'Export provider failed; no artifact was produced');
  }
}
