/** Agent CLI public surface; source is readable DSL and every mutation crosses the service Authoring gate. */
export { executeCommand } from './api.js';
export { runCli } from './compose.js';
export type { Command, CliOptions } from './records/command.js';
export type {
  CliDependencies,
  Transport,
  RequestFiles,
  SemanticInputs,
  RequestDraft,
} from './ports/runtime.js';
export type { Result, Diagnostic } from './errors.js';
