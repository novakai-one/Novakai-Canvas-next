import type { Diagnostic } from '../../contract/errors.js';
import type { FailureSource, ValidationSource } from '../../contract/records/failure-source.js';
import type { Relationship } from '../../contract/records/owners.js';
/** What the inspector knows about the wire whose Apply failed. */
export interface WireProblemContext {
  readonly kind: Relationship['kind'];
  /** The Wire label field is a function picker for this wire. */
  readonly picker: boolean;
}
/** One owner issue, read by its code and record path; the owner's prose is never parsed. */
export interface OwnerIssue {
  readonly code: string;
  readonly path: string;
  readonly message?: string;
}
type Rule = (issue: OwnerIssue, context: WireProblemContext) => string | null;
/** Every code in the failure chain, outermost first, with the deepest record path. */
function ownerIssues(error: Diagnostic): readonly OwnerIssue[] {
  return [{ code: error.code, path: '', message: error.message }, ...sourceIssues(error.source)];
}
function sourceIssues(source: FailureSource | undefined): readonly OwnerIssue[] {
  if (source === undefined) return [];
  if ('diagnostics' in source) return source.diagnostics.map(recordIssue);
  const own = { code: source.code, path: source.path, message: source.message };
  return [own, ...sourceIssues(source.source)];
}
/** A compiler issue carries the record-owner issue it came from, when there is one. */
function recordIssue(issue: ValidationSource['diagnostics'][number]): OwnerIssue {
  if ('path' in issue) return { code: issue.code, path: issue.path, message: issue.message };
  return issue.source ?? { code: issue.code, path: issue.target, message: issue.message };
}
export const pickFunction = 'Pick a function in Wire label.';
export const nothingChanged = 'Nothing changed. The wire already looks like this.';
export const staleDraft =
  'This collection changed since the draft started. Discard the draft and redo it.';
const stale: Rule = (issue) => (issue.code === 'revision-conflict' ? staleDraft : null);
/** Model reports a change-list issue by change index: `<n>.value.label`. */
const changeLabel = /^\d+\.value\.label$/;
const blank: Rule = (issue, context) => {
  if (issue.code !== 'shape' || !changeLabel.test(issue.path)) return null;
  return context.picker
    ? 'The wire label is empty. Pick a function in Wire label.'
    : 'The wire label is empty. Type a label.';
};
const calls: Rule = (issue, context) => {
  if (!endpointAt(issue, /\.target(\.member)?$/) || context.kind !== 'calls') return null;
  return context.picker
    ? "A 'calls' wire must point at one function. Pick one in Wire label."
    : "A 'calls' wire must point at one function. Set Target endpoint to a function or one of its signatures.";
};
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
/** Both ends of a wire must be objects shown in the wire's section. */
const hidden: Rule = (issue) => {
  const end = /^sections\.[^.]+\.wires\.[^.]+\.(source|target)$/.exec(issue.path)?.[1];
  if (issue.code !== 'reference' || end === undefined) return null;
  return `The ${end} is not shown in this section. Choose a ${end} endpoint that appears here.`;
};
/** The wire's section mode forbids this relationship kind. */
const kindInMode: Rule = (issue, context) =>
  issue.code === 'mode' && /^sections\.[^.]+\.wires\.[^.]+$/.test(issue.path)
    ? `This section does not allow '${context.kind}' wires. Choose another relationship kind.`
    : null;
/** The layout could not route the wire; fixed attachment sides are the usual cause. */
const layout: Rule = (issue) =>
  issue.code === 'constraint-conflict'
    ? "The layout cannot route this wire. In Routing, press 'Reset to automatic route', then Apply. If both attachments are already Auto, choose another endpoint."
    : null;
function endpointAt(issue: OwnerIssue, path: RegExp): boolean {
  return issue.code === 'endpoint' && path.test(issue.path);
}
/** Earlier rules win: a stale base makes every later issue moot. */
const rules: readonly Rule[] = [
  stale,
  blank,
  calls,
  member,
  objectKind,
  cardinality,
  kindInMode,
  hidden,
  layout,
];
/** The first plain sentence any rule gives for these issues; null when no rule knows them. */
export function plainIssues(
  issues: readonly OwnerIssue[],
  context: WireProblemContext,
): string | null {
  return (
    rules
      .flatMap((rule) => issues.map((issue) => rule(issue, context)))
      .find((text) => text !== null) ?? null
  );
}
/** One plain sentence for a failed wire Apply; unknown causes fall back to the owner's own message. */
export function plainWireProblem(error: Diagnostic, context: WireProblemContext): string {
  const issues = ownerIssues(error);
  const prose = issues.map((issue) => issue.message).filter(isProse);
  return (
    plainIssues(issues, context) ?? ownerMessage('The wire was not saved', prose.at(-1), error.code)
  );
}
/** The owner's prose after a lead sentence; a machine record (JSON) is never shown as the reason. */
export function ownerMessage(lead: string, message: string | undefined, code: string): string {
  return isProse(message) ? `${lead}: ${message.trim()}` : `${lead} (${code}).`;
}
function isProse(message: string | undefined): message is string {
  const text = message?.trim() ?? '';
  return text !== '' && !/^[[{]/.test(text);
}
