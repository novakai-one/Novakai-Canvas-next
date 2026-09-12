import { failure } from '../../contract/errors.js';
import type { Result, ErrorCode } from '../../contract/errors.js';
interface Parser<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
      };
}
/** Pure success constructor; boundary code detaches transferable bytes. */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}
/** Translate schema errors without deriving behavior from provider message text. */
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
/** Unexpected provider exceptions cannot escape an export or transfer operation. Host owns recovery. */
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
