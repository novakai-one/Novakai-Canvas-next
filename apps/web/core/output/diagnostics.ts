import type { Diagnostic } from '../../contract/errors.js';
import type {
  FailureSource,
  OperationSource,
  ValidationSource,
  RecordSource,
} from '../../contract/records/failure-source.js';
/** Display-only formatting. The original Result remains structured for recovery and machine consumers. */
export function formatFailure(error: Diagnostic): readonly string[] {
  return [`${error.code}: ${error.message}`, ...sourceLines(error.source), error.recovery];
}
/** Show the actionable owner cause; the full error chain remains available as technical details. */
export function failureSummary(error: Diagnostic): string {
  return plainMessage(sourceSummary(error.source) ?? error.message);
}
/** Plain-English text for machine failure codes that owners serialize into a message. */
const codeMessages: Readonly<Record<string, string>> = {
  'unroutable-leg': "Couldn't route a wire for that position. Nothing was changed.",
  'infeasible-embedding': "Couldn't fit the wires around that position. Nothing was changed.",
};
const unknownCodeMessage = "Couldn't lay out that change. Nothing was changed.";
/** Raw JSON never reaches a person; readable messages pass through unchanged. */
export function plainMessage(message: string): string {
  const code = /\{\s*"code"\s*:\s*"([^"]+)"/.exec(message)?.[1];
  if (code !== undefined) return codeMessages[code] ?? unknownCodeMessage;
  return message.trim().startsWith('{') ? unknownCodeMessage : message;
}
function sourceSummary(source: FailureSource | undefined): string | undefined {
  if (source === undefined) return undefined;
  if ('diagnostics' in source) return source.diagnostics[0].message;
  return sourceSummary(source.source) ?? source.message;
}
/** Absence means a local failure; validation and operational sources remain distinct. */
function sourceLines(source: FailureSource | undefined): readonly string[] {
  if (source === undefined) return [];
  if ('diagnostics' in source) return source.diagnostics.flatMap(diagnosticLines);
  return operationLines(source);
}
/** Nested owner failures preserve order and cleanup guidance in the final display. */
function operationLines(source: OperationSource): readonly string[] {
  return [
    `${source.code} ${source.path}: ${source.message}`,
    source.recovery,
    ...sourceLines(source.source),
    ...sourceLines(source.cleanup),
  ];
}
/** Source spans and record paths are explicit addresses; no parser reads the resulting text. */
function diagnosticLines(issue: ValidationSource['diagnostics'][number]): readonly string[] {
  if ('path' in issue) return [`${issue.code} ${issue.path}: ${issue.message}`];
  const location = `${issue.span.start.line}:${issue.span.start.column}`;
  return [
    `${issue.code} ${location} ${issue.target}: ${issue.message}`,
    `Expected: ${issue.expected}`,
    issue.recovery,
    ...ownerLines(issue.source),
  ];
}
/** Language enrichment can point back to a precise Model code/path without sacrificing the source span. */
function ownerLines(issue: RecordSource | undefined): readonly string[] {
  if (issue === undefined) return [];
  return [`${issue.code} ${issue.path}: ${issue.message}`];
}
