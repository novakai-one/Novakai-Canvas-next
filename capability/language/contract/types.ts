/*
 * The Language service interface and the Model roles it is built from. Language reads, compiles
 * and prints; Authoring owns every write, revision, retry and recovery.
 */
import type { Result } from './errors.js';
import type { ParsedSource } from './records/syntax.js';
import type { Description } from './records/vocabulary.js';
import type {
  LowerRequest,
  LoweredIntent,
  PrintRequest,
  Readout,
  ExpansionRequest,
} from './records/requests.js';
import type { ModelReader, ModelPlanner, ModelStage } from './ports/model.js';

/** The Model operations Language is built on, one role each. */
export interface Dependencies {
  /** Validates a raw collection record. */
  readonly reader: ModelReader;

  /** Checks a complete list of changes against a snapshot (the final validity proof). */
  readonly planner: ModelPlanner;

  /** Applies changes to a snapshot step by step, including unchecked intermediate states. */
  readonly stage: ModelStage;
}

/**
 * The Language service. Every operation is pure: it writes nothing, keeps no state between calls
 * and gives the same result when retried with the same input. Every operation returns a
 * `validation-failed` result instead of throwing.
 */
export interface Language {
  /** The grammar, defaults, patch forms and examples for `version` (default 1). */
  describe(version?: number): Result<Description>;

  /** The parsed source, its resource requests and source mappings; nothing is read or fetched. */
  parse(source: string): Result<ParsedSource>;

  /** The source compiled against the request's snapshot into a checked collection and changes. */
  lower(request: LowerRequest): Result<LoweredIntent>;

  /** A recipe source compiled as a new collection under the request's namespace. */
  expand(request: ExpansionRequest): Result<LoweredIntent>;

  /** The collection printed as full source, or as a scoped view that cannot be applied. */
  print(request: PrintRequest): Result<Readout>;
}
