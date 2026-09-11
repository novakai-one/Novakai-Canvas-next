import type { Result } from './errors.js';
import type { ParsedSource } from './records/syntax.js';
import type { Description } from './records/vocabulary.js';
import type { LowerRequest, LoweredIntent, PrintRequest, Readout } from './records/requests.js';
import type { ModelReader, ModelPlanner, ModelStage } from './ports/model.js';
export interface Dependencies {
  readonly reader: ModelReader;
  readonly planner: ModelPlanner;
  readonly stage: ModelStage;
}
/** Pure readable authoring; Authoring owns all mutation, concurrency and recovery. */
export interface Language {
  describe(version?: number): Result<Description>;
  parse(source: string): Result<ParsedSource>;
  lower(request: LowerRequest): Result<LoweredIntent>;
  print(request: PrintRequest): Result<Readout>;
}
