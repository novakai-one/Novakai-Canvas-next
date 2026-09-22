/** v2 sections lower show/connect children through the shared view walker and authored connect wires. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, text, textOr, optional, type RawRecord } from '../fields.js';
import { lowerLayout, modeLayout } from '../layout.js';
import { accepted } from '../../validation/outcomes.js';
import { lowerV2Views } from './views.js';
import type { SymbolTable } from './symbols.js';
export interface SectionResult {
  readonly section: RawRecord;
  readonly derived: readonly RawRecord[];
}
export function lowerV2Section(item: Declaration, symbols: SymbolTable): SectionResult {
  const mode = textOr(item.fields, 'mode', 'flow');
  const views = lowerV2Views(item, mode, symbols);
  const section: RawRecord = {
    id: id(item.fields),
    title: text(item.fields, 'title'),
    mode,
    layout: accepted(lowerLayout(item.fields, [], modeLayout(mode))),
    appearances: views.appearances,
    ...optional('groups', nonEmpty(views.groups)),
    wires: [...lowerConnectWires(item), ...views.wires],
    sequence: [],
    ...optional('root', views.root),
  };
  return { section, derived: views.derived };
}
function nonEmpty(items: readonly RawRecord[]): readonly RawRecord[] | undefined {
  return items.length === 0 ? undefined : items;
}
function lowerConnectWires(item: Declaration): readonly RawRecord[] {
  return item.children.filter((child) => child.kind === 'connect').flatMap(lowerConnect);
}
function lowerConnect(child: Declaration): readonly RawRecord[] {
  return list(child.fields, 'ids').map((value) => ({ relationship: (value as Reference).id }));
}
