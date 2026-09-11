import { fail } from '../../contract/errors.js';
import type { ErrorCode, Result } from '../../contract/errors.js';
interface Parser<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
      };
}
/** Success is detached by schema parsing; public boundary freezes results, never input or providers. */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}
/** Read checked data with stable error classification; no message parsing or unchecked casts. */
export function parse<T>(
  schema: Parser<T>,
  input: unknown,
  code: ErrorCode = 'invalid-input',
): Result<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return success(parsed.data);
  const issue = parsed.error.issues[0];
  return fail(code, issue?.path.map(String).join('.') ?? '$', issue?.message ?? 'Invalid data');
}
/** Typed storage/request boundary. Assets owns cleanup; Authoring or maintenance caller retries. */
export function protect<T>(
  action: () => Result<T>,
  code: ErrorCode = 'storage-unavailable',
): Result<T> {
  try {
    return freeze(action());
  } catch {
    return freeze(fail(code, '$', 'Asset operation failed; re-read before retry'));
  }
}
/** Async codec/lease boundary settles provider exceptions into declared recovery outcomes. */
export async function protectAsync<T>(
  action: () => Promise<Result<T>>,
  code: ErrorCode = 'storage-unavailable',
): Promise<Result<T>> {
  try {
    return freeze(await action());
  } catch {
    return freeze(fail(code, '$', 'Asset processing failed safely'));
  }
}
/** Public bytes are base64 strings, so detached output can be deeply frozen without typed-array traps. */
export function freeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
