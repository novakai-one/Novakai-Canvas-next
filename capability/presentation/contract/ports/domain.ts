import type { InputCollection, ContentBlock } from '../records/input.js';
import type { Result } from '../errors.js';
/** Host maps Model's public validation result; Presentation never duplicates semantic invariants. */
export interface DomainReader {
  read(input: unknown): Result<InputCollection>;
  /** Model-owned projection used before field measurement; keeps Presentation free of domain grammar. */
  readonly resolveFieldType?: (collection: InputCollection, field: Extract<ContentBlock, { kind: 'field' }>) => string;
}
