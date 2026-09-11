import type { Diagnostic, DiagnosticCode, Result } from '../../contract/errors.js';
export function issue(
  invalid: boolean,
  code: DiagnosticCode,
  path: string,
  message: string,
): readonly Diagnostic[] {
  if (!invalid) return [];
  return [{ code, path, message }];
}
export function failure<T>(code: DiagnosticCode, path: string, message: string): Result<T> {
  return { ok: false, diagnostics: [{ code, path, message }] };
}
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}
export function duplicates<T>(
  items: readonly T[],
  key: (item: T) => string,
  path: string,
): readonly Diagnostic[] {
  return items.flatMap((item, index) =>
    issue(
      items.findIndex((other) => key(other) === key(item)) !== index,
      'duplicate',
      `${path}.${key(item)}`,
      'Identity must be unique in this scope',
    ),
  );
}
export function required(exists: boolean, path: string): readonly Diagnostic[] {
  return issue(!exists, 'reference', path, 'Reference must resolve in this collection and scope');
}
export function present<T>(value: T | undefined): value is T {
  return value !== undefined;
}
