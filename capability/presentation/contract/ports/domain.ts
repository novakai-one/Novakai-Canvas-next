import type { InputCollection } from '../records/input.js';
import type { Result } from '../errors.js';
/** Host maps Model's public validation result; Presentation never duplicates semantic invariants. */
export interface DomainReader {
  read(input: unknown): Result<InputCollection>;
}
