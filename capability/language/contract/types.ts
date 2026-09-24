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
 * The Language service. No operation writes anything or keeps state between calls, so an
 * operation retried with the same input gives the same result, as long as Model's policy tables
 * and the injected Model roles also behave the same. Every operation returns a
 * `validation-failed` result instead of throwing. Language owns correcting the source; Authoring
 * owns every commit, revision, retry and recovery.
 */
export interface Language {
  /**
   * Describes the language: its constructs, operations, patch targets and forms, defaults,
   * examples, diagnostic codes and Model's acceptance policies.
   *
   * @param version - The language version; defaults to 1, the only version.
   * @returns The description, or `unsupported-version` for any other version.
   * @throws Never.
   */
  describe(version?: number): Result<Description>;

  /**
   * Parses `canvas 1` or `patch 1` source. Nothing is read from files or the network.
   *
   * @param source - The source text.
   * @returns The parsed document or patch with its resource requests and source mappings, or
   * the diagnostics (for example `syntax`, `limit`, or `display-only` for a scoped view).
   * @throws Never.
   */
  parse(source: string): Result<ParsedSource>;

  /**
   * Compiles source against the request's snapshot into a checked collection and changes.
   *
   * @param request - The source, mode, snapshot and resolved resources.
   * @returns The checked intent, or the diagnostics. A throw from a Model role becomes a
   * `provider-failure` diagnostic.
   * @throws Never.
   */
  lower(request: LowerRequest): Result<LoweredIntent>;

  /**
   * Compiles recipe source as a new collection whose ID is the request's namespace.
   *
   * @param request - The recipe source, namespace and resolved resources.
   * @returns The checked intent, or the diagnostics. A throw from a Model role becomes a
   * `provider-failure` diagnostic.
   * @throws Never.
   */
  expand(request: ExpansionRequest): Result<LoweredIntent>;

  /**
   * Prints a collection as full source, or as a scoped view that cannot be applied.
   *
   * @param request - The collection (validated by Model first), scope and optional heading.
   * @returns The readout, or the diagnostics. A throw from the Model reader becomes a
   * `provider-failure` diagnostic.
   * @throws Never.
   */
  print(request: PrintRequest): Result<Readout>;
}
