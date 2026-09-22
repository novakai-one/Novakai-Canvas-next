/** v2 wires check A.5 endpoint legality, then lower cleanly through the shared record mapper. */
import type { Declaration } from '../../../contract/records/syntax.js';
import { lowerRecord } from '../content.js';
import { field, reference, type RawRecord } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
import { constructsV2 } from '../../vocabulary/constructs-v2.js';
import { checkWireEndpoints } from './wire-policy.js';
import type { SymbolTable } from './symbols.js';
export function lowerV2Wire(item: Declaration, symbols: SymbolTable): RawRecord {
  checkWireEndpoints(item, symbols);
  checkMemberLabel(item);
  checkCodeLabel(item, symbols);
  return lowerRecord(item, constructsV2);
}
/** Code nodes never carry an authored wire label; the diagram names them by their members. */
const codeKinds: readonly string[] = ['module', 'package', 'interface', 'function', 'folder'];
function codeEndpoint(item: Declaration, symbols: SymbolTable): string | undefined {
  return (['target', 'source'] as const)
    .map((side) => reference(field(item.fields, side)).id)
    .find((id) => codeKinds.includes(symbols.nodes.get(id)?.kind ?? ''));
}
/** E110: an authored label on a wire touching a module, package, interface, function or folder is rejected. */
function checkCodeLabel(item: Declaration, symbols: SymbolTable): void {
  if (!hasAuthoredLabel(item)) return;
  const node = codeEndpoint(item, symbols);
  if (node === undefined) return;
  reject(
    'unrepresentable',
    item.span,
    'No label on a code wire',
    `E110 label: @${node} (${symbols.nodes.get(node)?.kind}) takes no wire label. Drop it.`,
  );
}
function wireMember(item: Declaration, side: 'source' | 'target'): string | undefined {
  return reference(field(item.fields, side)).member;
}
function hasAuthoredLabel(item: Declaration): boolean {
  return item.fields.label !== undefined;
}
function firstMember(target: string | undefined, source: string | undefined): string | undefined {
  if (target !== undefined) return target;
  return source;
}
function wireMemberBlame(item: Declaration): string | undefined {
  return firstMember(wireMember(item, 'target'), wireMember(item, 'source'));
}
function rejectMemberLabel(item: Declaration, member: string): never {
  reject(
    'unrepresentable',
    item.span,
    'No label on a member wire',
    `E110 label: derived from @${member}. Drop it.`,
  );
}
/** E110: a member wire's label always derives from the target member; an authored label is rejected. */
function checkMemberLabel(item: Declaration): void {
  if (!hasAuthoredLabel(item)) return;
  const member = wireMemberBlame(item);
  if (member === undefined) return;
  rejectMemberLabel(item, member);
}
