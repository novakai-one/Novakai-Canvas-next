import type { Relationship, RelationshipKind, SequenceItem } from '../../contract/records/input.js';
import type { MarkerKind } from '../../contract/records/visual.js';
interface Notation {
  readonly source: MarkerKind;
  readonly target: MarkerKind;
  readonly style: 'solid' | 'dashed';
}
const markers: Readonly<Record<RelationshipKind, MarkerKind>> = {
  flow: 'arrow',
  association: 'none',
  imports: 'open-arrow',
  calls: 'arrow',
  implements: 'open-arrow',
  contains: 'none',
  parent: 'none',
  reference: 'open-arrow',
  transition: 'arrow',
};
const multiplicities: Readonly<Record<NonNullable<Relationship['from']>, MarkerKind>> = {
  '1': 'one',
  '0..1': 'zero-one',
  '1..many': 'one-many',
  '0..many': 'zero-many',
};
/** Optional multiplicity has a named no-marker meaning; Model checks its applicability. */
function multiplicity(value: Relationship['from']): MarkerKind {
  if (value === undefined) return 'none';
  return multiplicities[value];
}
/** Association endpoints retain independent cardinalities, never infer them from direction. */
export function wireNotation(wire: Relationship): Notation {
  if (wire.kind === 'association')
    return { source: multiplicity(wire.from), target: multiplicity(wire.to), style: wire.style };
  return { source: 'none', target: markers[wire.kind], style: wire.style };
}
/** Guard and effect remain visible engineering semantics alongside the required label. */
export function wireLabel(wire: Relationship): string {
  return [wire.label, guard(wire.guard), effect(wire.effect)].filter(Boolean).join(' ');
}
/** Missing guard contributes no invented condition. */
function guard(value: string | undefined): string {
  if (value === undefined) return '';
  return `[${value}]`;
}
/** Missing effect contributes no invented action. */
function effect(value: string | undefined): string {
  if (value === undefined) return '';
  return `/ ${value}`;
}
/** Sequence return/async messages use an open arrow; fragments have no arrow. */
export function sequenceMarker(item: SequenceItem): MarkerKind {
  if (item.kind === 'fragment') return 'none';
  const messages: Readonly<Record<'call' | 'return' | 'async', MarkerKind>> = {
    call: 'arrow',
    return: 'open-arrow',
    async: 'open-arrow',
  };
  return messages[item.message];
}

/** Fragment operators are visible notation; canonical sequence ordering remains untouched. */
export function sequenceLabel(item: SequenceItem): string {
  if (item.kind === 'event') return item.label;
  return `${item.operator} ${item.label}`;
}
