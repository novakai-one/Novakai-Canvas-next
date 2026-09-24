/*
 * Language's public entry: `createLanguage` and the types its callers use. Nothing else in the
 * capability is imported from outside. Language only reads and compiles, and owns correcting
 * the source; Authoring owns every write, retry and recovery.
 */
export { createLanguage } from './api.js';
export type { Language, Dependencies } from './types.js';
export type { Result, ValidationError, Diagnostic, DiagnosticCode } from './errors.js';
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
