/*
 * Library test assertions over the public `Result`. They read results only and never change them.
 */
import { assert } from 'vitest';
import type { Result, DiagnosticCode } from '../contract/index.js';

/**
 * Asserts a result succeeded and returns its value.
 *
 * The result is turned into JSON before the assertion runs, even on success, so it throws for a
 * value JSON cannot hold (a bigint, a cycle, or a `toJSON` that throws).
 *
 * @param result - The result to check.
 * @returns The success value.
 * @throws Vitest's assertion error, carrying the result as JSON, when the result failed.
 * @throws `TypeError` (or the `toJSON` error) when the result cannot be turned into JSON.
 */
export function valueOf<T>(result: Result<T>): T {
  assert(result.ok, JSON.stringify(result));
  return result.value;
}

/**
 * True when the result failed with a diagnostic of `code` at exactly `path`. Other diagnostics in
 * the same failure are allowed.
 *
 * @param result - The result to check.
 * @param code - The expected diagnostic code.
 * @param path - The expected diagnostic path, compared exactly.
 * @returns Whether a matching diagnostic exists; `false` for a success.
 * @throws Never.
 */
export function hasFailure<T>(result: Result<T>, code: DiagnosticCode, path: string): boolean {
  if (result.ok) {
    return false;
  }
  return result.error.diagnostics.some(
    /** Whether this diagnostic has the code and path. */ (diagnostic) =>
      diagnostic.code === code && diagnostic.path === path,
  );
}

/**
 * Every diagnostic of a failed result as `code path` lines, in the order Library reported them.
 *
 * @param result - The result to read.
 * @returns The lines; empty for a success.
 * @throws Never.
 */
export function diagnosticsOf<T>(result: Result<T>): readonly string[] {
  if (result.ok) {
    return [];
  }
  return result.error.diagnostics.map(
    /** The diagnostic as one line. */ (diagnostic) => `${diagnostic.code} ${diagnostic.path}`,
  );
}

/**
 * True when the value and every object or array it holds are frozen. Primitives count as frozen.
 *
 * @param value - The value to walk.
 * @returns Whether nothing in the value can be changed.
 * @throws `RangeError` for a structure deeper than the call stack allows (results are shallow).
 */
export function isDeepFrozen(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return true;
  }
  return Object.isFrozen(value) && Object.values(value).every(isDeepFrozen);
}
