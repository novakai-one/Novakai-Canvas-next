/** Language's only consumer entry. Authoring owns all writes; these operations are pure and retry-safe. */
export { createLanguage } from './api.js';
export type { Language, Dependencies } from './types.js';
export type { Result, Diagnostic, DiagnosticCode } from './errors.js';
export type {
  Document,
  Patch,
  ParsedSource,
  Declaration,
  Operation,
  Span,
  Reference,
  ResourceRequest,
  SourceMapping,
} from './records/syntax.js';
export type {
  ExpansionRequest,
  LowerRequest,
  LoweredIntent,
  ResolvedResources,
  PrintRequest,
  Readout,
  Scope,
  ManualTarget,
} from './records/requests.js';
export type { Description } from './records/vocabulary.js';
export type { ModelReader, ModelPlanner, ModelStage } from './ports/model.js';
