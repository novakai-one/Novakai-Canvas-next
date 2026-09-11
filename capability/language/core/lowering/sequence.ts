import type { Declaration } from '../../contract/records/syntax.js';
import { id, text, optional, type RawRecord } from './fields.js';
import { lowerRecord } from './content.js';
import { reject } from '../validation/outcomes.js';
interface Scope {
  readonly parent?: string;
  readonly branch?: string;
}
/** Flatten nested ordered syntax while preserving each parent/branch's sibling order. */
export function lowerSequence(
  children: readonly Declaration[],
  scope: Scope = {},
): readonly RawRecord[] {
  return children.filter(isSequence).flatMap((item, order) => lowerItem(item, order, scope));
}
/** Events and fragments alone participate in message order; shows are participant membership. */
function isSequence(item: Declaration): boolean {
  return item.kind === 'event' || item.kind === 'fragment';
}
/** Message kinds and fragment operators are separate from the canonical item discriminator. */
function lowerItem(item: Declaration, order: number, scope: Scope): readonly RawRecord[] {
  const base = { ...lowerRecord(item), ...scope, order, kind: item.kind };
  if (item.kind === 'event') return [base];
  return lowerFragment(item, base);
}
/** Alternative branches have stable explicit IDs; label-only branches receive deterministic IDs. */
function branchId(fragment: string, branch: Declaration, index: number): string {
  if (branch.fields.id !== undefined) return id(branch.fields);
  return `${fragment}-branch-${index + 1}`;
}
/** Alt and unbranched fragments have different legal child forms; neither silently discards input. */
function lowerFragment(item: Declaration, base: RawRecord): readonly RawRecord[] {
  if (text(item.fields, 'operator') === 'alt') return lowerAlternatives(item, base);
  if (item.children.some((child) => child.kind === 'branch'))
    reject('syntax', item.span, 'event or fragment', 'Only alt contains branches');
  return [{ ...base, branches: [] }, ...lowerSequence(item.children, { parent: id(item.fields) })];
}
/** Branch list order is meaningful; generated and explicit IDs share Model's sequence namespace. */
function lowerAlternatives(item: Declaration, base: RawRecord): readonly RawRecord[] {
  if (item.children.some((child) => child.kind !== 'branch'))
    reject('syntax', item.span, 'branch', 'Alt contains only named branches');
  const parent = id(item.fields);
  const branches = item.children.map((branch, index) => ({
    id: branchId(parent, branch, index),
    label: text(branch.fields, 'label'),
  }));
  const nested = item.children.flatMap((branch, index) =>
    lowerSequence(branch.children, { parent, ...optional('branch', branches[index]?.id) }),
  );
  return [{ ...base, branches }, ...nested];
}
