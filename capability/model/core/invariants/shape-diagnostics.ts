import type { Diagnostic } from '../../contract/errors.js';

/** Small schema failure shape shared by collection and operation parsers. */
interface ShapeIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/** Translate parser paths into Model diagnostics without exposing the schema library's errors. */
export function shapeErrors(issues: readonly ShapeIssue[]): readonly Diagnostic[] {
  return issues.map((issue): Diagnostic => ({
    code: 'shape',
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}
