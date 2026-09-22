/** v2 sections lower show/connect children into flat appearance/wire lists; nested show ships in a later slice. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, text, textOr, type RawRecord } from '../fields.js';
import { lowerLayout, modeLayout } from '../layout.js';
import { reject, accepted } from '../../validation/outcomes.js';
export function lowerV2Section(item: Declaration): RawRecord {
  const mode = textOr(item.fields, 'mode', 'flow');
  return {
    id: id(item.fields),
    title: text(item.fields, 'title'),
    mode,
    layout: accepted(lowerLayout(item.fields, [], modeLayout(mode))),
    appearances: lowerAppearances(item),
    wires: lowerWires(item),
    sequence: [],
  };
}
function lowerAppearances(item: Declaration): readonly RawRecord[] {
  return item.children.filter((child) => child.kind === 'show').flatMap(lowerShow);
}
/** Nested show is rejected in this slice; slice 5 replaces only this arm. */
function lowerShow(child: Declaration): readonly RawRecord[] {
  if (child.children.length > 0)
    reject('unrepresentable', child.span, 'A flat show', 'Nested show is lowered in a later slice');
  return list(child.fields, 'ids').map((value) => ({ object: (value as Reference).id }));
}
function lowerWires(item: Declaration): readonly RawRecord[] {
  return item.children.filter((child) => child.kind === 'connect').flatMap(lowerConnect);
}
function lowerConnect(child: Declaration): readonly RawRecord[] {
  return list(child.fields, 'ids').map((value) => ({ relationship: (value as Reference).id }));
}
