import { jsonValue } from '../../contract/records/storage.js';
import type { Json } from '../../contract/records/storage.js';
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
/** One successful stage; Authoring or the maintenance host owns operation recovery. */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}
/** Schema failures use the caller's request/storage classification; no exception message parsing. */
export function parse<T>(schema: Parser<T>, input: unknown, code: ErrorCode): Result<T> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return success(parsed.data);
  const issue = parsed.error.issues[0];
  return fail(code, issue?.path.map(String).join('.') ?? '$', issue?.message ?? 'Invalid data');
}
/** Bounded JSON read boundary; protect() owns malformed/cyclic/oversized-input recovery. */
export function boundedClone(input: unknown, limit = 64 * 1024 * 1024): Json {
  const checked = jsonValue.safeParse(input);
  if (!checked.success) throw new TypeError('Unsupported JSON value');
  const serialized = JSON.stringify(checked.data);
  if (new TextEncoder().encode(serialized).length > limit) throw new RangeError('JSON limit');
  return JSON.parse(serialized);
}
/** Only detached JSON results are frozen; ports and caller inputs are never traversed. */
export function freeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
/** Named request/storage error boundary; callers use typed recovery rather than untyped exceptions. */
export function protect<T>(action: () => Result<T>, code: ErrorCode = 'invalid-input'): Result<T> {
  try {
    return freeze(action());
  } catch {
    return freeze(fail(code, '$', 'Data or operation could not be read safely'));
  }
}
/** Provider exceptions never escape maintenance APIs; uncertainty requires destination inspection. */
export async function protectAsync<T>(action: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return freeze(await action());
  } catch {
    return freeze(
      fail(
        'storage-unavailable',
        '$',
        'Resource operation failed; inspect destination before retry',
      ),
    );
  }
}
