/*
 * Validating one complete Library snapshot: its shape, then the rules across records. Writes
 * nothing; the caller corrects the input, and Authoring owns admission, commit and recovery.
 */
import { snapshotSchema, type LibrarySnapshot } from '../../contract/records/snapshot.js';
import type { Result } from '../../contract/errors.js';
import { parse, protect, success, rejected } from './outcomes.js';
import { validateRecords } from './rules.js';

/**
 * Validates one complete Library snapshot.
 *
 * Steps: parse the snapshot's shape (defaults filled in; every schema issue reported), then check
 * the rules across records (see `validateRecords`): unique IDs, existing references, no folder
 * cycles, and exactly one catalog entry per collection. All rule violations are reported together.
 *
 * Writes nothing and reads no clock. A throw while reading the input becomes a `shape` failure.
 * The same plain input always gives the same result; Authoring owns correction, admission, commit
 * and recovery.
 *
 * @param input - The untrusted snapshot.
 * @returns The parsed snapshot, a detached frozen copy; or a failure with every diagnostic.
 * @throws Never.
 */
export function validateSnapshot(input: unknown): Result<LibrarySnapshot> {
  return protect(/** Validates the snapshot. */ () => validateInput(input));
}

/** Parses the snapshot, then checks the rules across records on the parsed copy. */
function validateInput(input: unknown): Result<LibrarySnapshot> {
  const parsed = parse(snapshotSchema(), input);
  if (!parsed.ok) {
    return parsed;
  }
  const diagnostics = validateRecords(parsed.value);
  if (diagnostics.length > 0) {
    return rejected(diagnostics);
  }
  return success(parsed.value);
}
