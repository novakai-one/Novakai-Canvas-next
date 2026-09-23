import type { Diagnostic } from '../../contract/errors.js';
import type { FailureSource, ValidationSource } from '../../contract/records/failure-source.js';
import type { Relationship } from '../../contract/records/owners.js';
import { failureSummary } from '../output/diagnostics.js';
/** What the inspector knows about the wire whose Apply failed. */
export interface WireProblemContext {
  readonly kind: Relationship['kind'];
  /** The wire's label names a function of its target module. */
  readonly moduleWire: boolean;
}
/** One owner issue, read by its code and record path; the owner's prose is never parsed. */
interface OwnerIssue {
  readonly code: string;
  readonly path: string;
}
type Rule = (issue: OwnerIssue, context: WireProblemContext) => string | null;
/** Every code in the failure chain, outermost first, with the deepest record path. */
function ownerIssues(error: Diagnostic): readonly OwnerIssue[] {
  return [{ code: error.code, path: '' }, ...sourceIssues(error.source)];
}
function sourceIssues(source: FailureSource | undefined): readonly OwnerIssue[] {
  if (source === undefined) return [];
  if ('diagnostics' in source) return source.diagnostics.map(recordIssue);
  return [{ code: source.code, path: source.path }, ...sourceIssues(source.source)];
}
/** A compiler issue carries the record-owner issue it came from, when there is one. */
function recordIssue(issue: ValidationSource['diagnostics'][number]): OwnerIssue {
  if ('path' in issue) return { code: issue.code, path: issue.path };
  return issue.source ?? { code: issue.code, path: issue.target };
}
const stale: Rule = (issue) =>
  issue.code === 'revision-conflict'
    ? 'Someone changed this collection. Discard the draft and redo it.'
    : null;
const blank: Rule = (issue, context) => {
  if (issue.code !== 'shape' || !issue.path.endsWith('.label')) return null;
  return context.moduleWire
    ? 'The wire label is empty. Pick a function in Wire label.'
    : 'The wire label is empty. Type a label.';
};
const calls: Rule = (issue, context) =>
  endpointAt(issue, /\.target(\.member)?$/) && context.kind === 'calls'
    ? "A 'calls' wire must point at one function. Pick one in Wire label."
    : null;
const member: Rule = (issue) =>
  endpointAt(issue, /\.member$/)
    ? 'A wire cannot attach to that part of the object. Choose another endpoint.'
    : null;
const objectKind: Rule = (issue) =>
  endpointAt(issue, /\.(source|target)$/)
    ? 'This relationship kind cannot connect these two kinds of object. Change the kind or an endpoint.'
    : null;
const cardinality: Rule = (issue, context) => {
  if (!endpointAt(issue, /^relationships\.[^.]+$/)) return null;
  return context.kind === 'association'
    ? 'Association wires need both cardinalities set.'
    : "Only association wires have cardinalities. Set both to 'Not specified'.";
};
function endpointAt(issue: OwnerIssue, path: RegExp): boolean {
  return issue.code === 'endpoint' && path.test(issue.path);
}
/** Earlier rules win: a stale base makes every later issue moot. */
const rules: readonly Rule[] = [stale, blank, calls, member, objectKind, cardinality];
/** One plain sentence for a failed wire Apply; unknown causes fall back to the owner's own message. */
export function plainWireProblem(error: Diagnostic, context: WireProblemContext): string {
  const issues = ownerIssues(error);
  const known = rules
    .flatMap((rule) => issues.map((issue) => rule(issue, context)))
    .find((text) => text !== null);
  return known ?? `The wire was not saved: ${failureSummary(error)}`;
}
