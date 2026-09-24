import type { Diagnostic, DiagnosticCode, Result } from '../../contract/errors.js';

/**
 * Builds a failure with one diagnostic and no partial value. Public entry points freeze it (see
 * {@link protect}).
 *
 * @param code - The diagnostic code.
 * @param path - Where the problem is.
 * @param message - What went wrong.
 * @returns `{ ok: false, error: { code: 'validation-failed', diagnostics: [{ code, path, message }] } }`.
 */
export function failure<T>(code: DiagnosticCode, path: string, message: string): Result<T> {
  return {
    ok: false,
    error: { code: 'validation-failed', diagnostics: [{ code, path, message }] },
  };
}

/**
 * Wraps a successful value.
 *
 * @param value - The value.
 * @returns `{ ok: true, value }`.
 */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * One diagnostic when a rule is violated, none otherwise. Throughout Library, `true` means the
 * rule is violated (the same convention as Model).
 *
 * @param violated - Whether the rule is violated.
 * @param code - The diagnostic code.
 * @param path - Where the problem is.
 * @param message - What went wrong.
 * @returns `[{ code, path, message }]` when violated; otherwise `[]`.
 */
export function diagnoseWhen(
  violated: boolean,
  code: DiagnosticCode,
  path: string,
  message: string,
): readonly Diagnostic[] {
  if (!violated) {
    return [];
  }
  return [{ code, path, message }];
}

/**
 * Parses input with a schema and turns every schema issue into a `shape` diagnostic, in the
 * schema's order: its path joined with `.` (the input root is `''`) and its message. The parse
 * never throws for bad data; a throw while reading the input is left to {@link protect}.
 *
 * @param parser - The schema. Only `safeParse` is used, so core does not import the schema library.
 * @param input - The untrusted input.
 * @returns The parsed value, or every issue as a diagnostic.
 */
export function parse<T>(parser: Parser<T>, input: unknown): Result<T> {
  const parsed = parser.safeParse(input);
  if (parsed.success) {
    return success(parsed.data);
  }
  const diagnostics = parsed.error.issues.map((issue): Diagnostic => ({
    code: 'shape',
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
  return rejected(diagnostics);
}

/**
 * The boundary of every public entry point: runs `action` and deep-freezes its result. A throw
 * (for example from a getter on the input) becomes a frozen `shape` failure at `$`, "Input could
 * not be read as supported data", so the entry point never throws.
 *
 * The result must be freshly built, acyclic data, never the caller's input. Proxies are not
 * supported: their traps may run before the input is rejected. The same plain input always gives
 * the same result; Authoring owns correction, commit and recovery.
 *
 * @param action - The operation to run.
 * @returns The frozen result.
 */
export function protect<T>(action: () => Result<T>): Result<T> {
  try {
    return freeze(action());
  } catch {
    return freeze(failure('shape', '$', 'Input could not be read as supported data'));
  }
}

/**
 * Builds a failure from a list of diagnostics. A list with none would be a provider fault, so it
 * becomes a `shape` failure at `$`, "Validation provider rejected input without diagnostic
 * evidence".
 *
 * @param diagnostics - The diagnostics, in order.
 * @returns A failure carrying all of them.
 */
export function rejected<T>(diagnostics: readonly Diagnostic[]): Result<T> {
  const [first, ...remaining] = diagnostics;
  if (first === undefined) {
    return failure('shape', '$', 'Validation provider rejected input without diagnostic evidence');
  }
  return { ok: false, error: { code: 'validation-failed', diagnostics: [first, ...remaining] } };
}

/** One schema issue: the path to the bad value and the schema's message. */
interface ShapeIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/** The part of a schema {@link parse} uses. Declared here so core does not import zod. */
interface Parser<T> {
  safeParse(
    input: unknown,
  ): { success: true; data: T } | { success: false; error: { issues: readonly ShapeIssue[] } };
}

/**
 * Deep-freezes a value: its enumerable own values first, then the value itself. Only for freshly
 * built, acyclic results; never for the caller's input.
 */
function freeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}
