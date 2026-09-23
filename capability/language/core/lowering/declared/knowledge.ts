/** Declared rule/examples/decision constructs; lane R fills. Until then, none of the three lowers. */
import type { Declaration } from '../../../contract/records/syntax.js';
import { id, type RawRecord } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
import type { SymbolTable } from './symbols.js';

// lane R
export function lowerDeclaredKnowledge(
  declare: Declaration,
  symbols: SymbolTable,
): { rules: RawRecord[]; examples: RawRecord[]; decisions: RawRecord[] } {
  void symbols;
  rejectUnsupported(declare, 'rule');
  rejectUnsupported(declare, 'examples');
  rejectUnsupported(declare, 'decision');
  return { rules: [], examples: [], decisions: [] };
}

/** Interim: parses but is not yet lowered. Reject loudly rather than silently drop. */
function rejectUnsupported(declare: Declaration, kind: 'rule' | 'examples' | 'decision'): void {
  const first = declare.children.find((child) => child.kind === kind);
  if (first === undefined) return;
  reject(
    'unrepresentable',
    first.span,
    'a supported construct',
    `${kind} is not supported yet (line ${first.span.start.line}: @${id(first.fields)}).`,
  );
}
