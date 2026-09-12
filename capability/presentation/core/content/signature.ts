import type { ContentBlock } from '../../contract/records/input.js';
import type { ContentContext } from '../../contract/records/content-context.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import { measureText, offset } from './text.js';
import { requireValue } from '../validation/outcomes.js';
type Signature = Extract<ContentBlock, { kind: 'signature' }>;
type Member = Extract<ContentBlock, { kind: 'member' }>;
interface Lines {
  readonly complete: readonly string[];
  readonly current: string;
}
/** Exact atomic advances never split punctuation or identifiers; public projection owns provider failure. */
function width(text: string, context: ContentContext): number {
  const metric = context.style.typography.mono;
  return requireValue(context.metrics.measure(text, metric.font, metric.size)).width;
}
/** Commas bind to their preceding parameter and the result binds to the closing parameter. */
function groups(block: Signature): readonly string[] {
  const parameters = block.parameters.map((parameter, index) => parameter + suffix(index, block));
  if (parameters.length === 0) return [`${block.label}(): ${block.returns}`];
  const [first, ...rest] = parameters;
  return [`${block.label}(${first}`, ...rest];
}
/** Last parameter retains closing punctuation and result as one lexical unit. */
function suffix(index: number, block: Signature): string {
  if (index === block.parameters.length - 1) return `): ${block.returns}`;
  return ',';
}
/** A full line moves intact on overflow; an oversized atomic group grows the measured node. */
function append(lines: Lines, group: string, context: ContentContext): Lines {
  if (lines.current === '') return { ...lines, current: group };
  return fit(lines, group, context);
}
/** Space-separated groups preserve canonical signature spelling across line boundaries. */
function fit(lines: Lines, group: string, context: ContentContext): Lines {
  const candidate = `${lines.current} ${group}`;
  if (width(candidate, context) <= context.width) return { ...lines, current: candidate };
  return { complete: [...lines.complete, lines.current], current: group };
}
/** Structured runs keep a stable address and canonical outline independent of visual wrapping. */
function measured(
  groups: readonly string[],
  label: string,
  id: string,
  context: ContentContext,
): MeasuredContent {
  const lines = groups.reduce<Lines>((state, group) => append(state, group, context), {
    complete: [],
    current: '',
  });
  const text = [...lines.complete, lines.current].join('\n');
  const available = Math.max(context.width, ...groups.map((group) => width(group, context)));
  const content = measureText(
    { text, width: available, ...context.style.typography.mono, fill: context.style.text },
    context.metrics,
  );
  const height =
    Math.max(context.style.contentSizing.rowMinimum, content.height) + context.style.gap * 2;
  return {
    ...offset(content, 0, context.style.gap),
    height,
    anchors: [{ member: id, x: 0, y: height / 2, direction: 'inout', collapsed: false, label }],
    outline: [label],
  };
}
/** Callable labels remain complete in anchors/readouts; rejection is translated by public project. */
export function measureSignature(block: Signature, context: ContentContext): MeasuredContent {
  const label = `${block.label}(${block.parameters.join(', ')}): ${block.returns}`;
  return measured(groups(block), label, block.id, context);
}
/** Member visibility, label and type form one readable atomic declaration. */
export function measureMember(block: Member, context: ContentContext): MeasuredContent {
  const label = `${block.visibility} ${block.label}: ${block.type}`;
  return measured([label], label, block.id, context);
}
