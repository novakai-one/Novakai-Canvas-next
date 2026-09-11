import type { Diagnostic, DiagnosticCode, Result } from '../../contract/errors.js';

interface ShapeIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}
/** Consumer-shaped schema interface keeps the parsing library out of core imports. */
interface Parser<T> {
  safeParse(
    input: unknown,
  ): { success: true; data: T } | { success: false; error: { issues: readonly ShapeIssue[] } };
}
/** Typed failure, with no partial value. Public boundaries freeze the returned result. */
export function failure<T>(code: DiagnosticCode, path: string, message: string): Result<T> {
  return { ok: false, diagnostics: [{ code, path, message }] };
}
/** One successful pure stage; Authoring remains the commit/recovery owner. */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}
/** True means a violation throughout Library, matching the Model convention. */
export function diagnoseWhen(
  violated: boolean,
  code: DiagnosticCode,
  path: string,
  message: string,
): readonly Diagnostic[] {
  if (!violated) return [];
  return [{ code, path, message }];
}
/** Convert schema failures into stable path/code diagnostics instead of throwing. */
export function parse<T>(parser: Parser<T>, input: unknown): Result<T> {
  const parsed = parser.safeParse(input);
  if (parsed.success) return success(parsed.data);
  const diagnostics = parsed.error.issues.map((issue): Diagnostic => ({
    code: 'shape',
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
  return { ok: false, diagnostics };
}
/** Freeze only freshly parsed/constructed acyclic results, never caller-owned input. */
function freeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
/**
 * Final pure boundary: convert parser/read exceptions to typed shape failures and freeze
 * detached outcomes. Arbitrary JS proxies are unsupported and may execute traps before
 * rejection. Same plain input is replayable; Authoring owns correction and commit/recovery.
 */
export function protect<T>(action: () => Result<T>): Result<T> {
  try {
    return freeze(action());
  } catch {
    return freeze(failure('shape', '$', 'Input could not be read as supported data'));
  }
}
