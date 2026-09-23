/** Declared asset/source admission; lane L2 fills. Until then, neither construct lowers. */
import type { Declaration } from '../../../contract/records/syntax.js';
import { id, type RawRecord } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
import type { SymbolTable } from './symbols.js';

// lane L2
export function lowerDeclaredResources(
  declare: Declaration,
  symbols: SymbolTable,
): { assets: RawRecord[]; sources: RawRecord[] } {
  void symbols;
  rejectUnsupported(declare, 'asset');
  rejectUnsupported(declare, 'source');
  return { assets: [], sources: [] };
}

/** Interim: parses but is not yet lowered. Reject loudly rather than silently drop. */
function rejectUnsupported(declare: Declaration, kind: 'asset' | 'source'): void {
  const first = declare.children.find((child) => child.kind === kind);
  if (first === undefined) return;
  reject(
    'unrepresentable',
    first.span,
    'a supported construct',
    `${kind} is not supported yet (line ${first.span.start.line}: @${id(first.fields)}).`,
  );
}
