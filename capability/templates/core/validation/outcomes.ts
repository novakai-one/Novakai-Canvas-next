import { fail, InputFault } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
interface Parser<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] };
      };
}
/** Successful policy stage; final boundary owns detachment and freezing. */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}
/** Strict schemas report a stable path rather than leaking parser exception internals. */
export function parse<T>(schema: Parser<T>, input: unknown): Result<T> {
  const result = schema.safeParse(input);
  if (result.success) return success(result.data);
  const issue = result.error.issues[0];
  return fail(
    'invalid-input',
    issue?.path.map(String).join('.') ?? '$',
    issue?.message ?? 'Invalid input',
  );
}
/** Only plain finite JSON data is supported; reject executable/prototyped/deep input before cloning. */
function inspect(value: unknown, depth: number): void {
  if (depth > 48) throw new InputFault('invalid-input', '$', 'Input nesting exceeds48');
  inspectValue(value, depth);
}
/** Split scalar validation from container traversal so failure paths remain readable. */
function inspectValue(value: unknown, depth: number): void {
  if (value === null) return;
  if (typeof value === 'object') {
    inspectContainer(value, depth);
    return;
  }
  requireScalar(value);
}
/** JSON scalars exclude undefined, symbols, bigint, NaN and functions. */
function isScalar(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' || typeof value === 'boolean';
}
/** Arrays and plain records are the only containers; no Date/class instances or execution hooks. */
function inspectContainer(value: object, depth: number): void {
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null)
    throw new InputFault('invalid-input', '$', 'Expected plain container');
  Object.values(value).forEach((child) => inspect(child, depth + 1));
}
/** Validate before stringify/clone; generic codec intent retains its checked static type without assertions. */
export function clone<T>(value: T): T {
  inspect(value, 0);
  const encoded = JSON.stringify(value);
  if (new TextEncoder().encode(encoded).byteLength > 8 * 1024 * 1024)
    throw new InputFault('invalid-input', '$', 'Operation exceeds8MiB');
  return structuredClone(value);
}
/** Freeze only detached successful data; providers and original caller objects retain ownership. */
function freeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
/** Synchronous public boundary; no failed operation exposes partial output. Authoring owns correction/retry. */
export function protect<T>(action: () => Result<T>): Result<T> {
  try {
    return freeze(clone(action()));
  } catch (error) {
    return caught(error);
  }
}
/** Known bounded-data failures retain code/path; unexpected provider faults never escape untyped. */
function caught<T>(error: unknown): Result<T> {
  if (error instanceof InputFault) return fail(error.code, error.path, error.message);
  return fail('provider-failed', '$', 'Preset provider failed; no plan was produced');
}
/** Pure canonical value transform keeps array order and sorts only record keys. */
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  return orderedObject(value);
}
/** Object.fromEntries avoids mutation and prototype assignment while constructing hash input. */
function orderedRecord(value: object): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : Number(a > b)))
      .map(([key, item]) => [key, ordered(item)]),
  );
}
/** Hashes canonical content only after bounded JSON validation; failure belongs to protect. */
export function canonical(value: unknown): string {
  return JSON.stringify(ordered(clone(value)));
}
/** Return the first explicit domain failure after independent checks, never a fabricated success value. */
export function firstFailure(results: readonly Result<unknown>[]): Result<void> {
  const failed = results.find((result) => !result.ok);
  if (failed && !failed.ok) return failed;
  return success(undefined);
}
/** Invalid scalar data is rejected before stringify can silently remove or coerce it. */
function requireScalar(value: unknown): void {
  if (!isScalar(value))
    throw new InputFault('invalid-input', '$', 'Expected finite plain JSON data');
}

/** Non-array records sort keys; scalar values retain their exact JSON spelling. */
function orderedObject(value: unknown): unknown {
  if (value === null) return value;
  if (typeof value === 'object') return orderedRecord(value);
  return value;
}
