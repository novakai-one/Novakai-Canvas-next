import { snapshotSchema, type LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { Result } from '../../contract/errors.js';
import { parse, protect, success, rejected } from './outcomes.js';
import { validateRecords } from './rules.js';

/** Parse detached records before evaluating catalog membership and projection references. */
function validateInput(input: unknown): Result<LibrarySnapshot> {
  const parsed = parse(snapshotSchema, input);
  if (!parsed.ok) return parsed;
  const diagnostics = validateRecords(parsed.value);
  if (diagnostics.length > 0) return rejected(diagnostics);
  return success(parsed.value);
}
/**
 * Validate one complete discovery snapshot and return a detached frozen result. Input-read
 * exceptions become shape diagnostics through protect. No visits or documents are written;
 * plain-data replay is safe and Authoring owns correction, admission and commit/recovery.
 */
export function validateSnapshot(input: unknown): Result<LibrarySnapshot> {
  return protect(() => validateInput(input));
}
