/** E311/E304: a scenario call runs from a participant or module to one signature of a module. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { field, id, reference } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
import type { NodeFacts, SymbolTable } from './symbols.js';
export interface CheckedCall {
  readonly source: string;
  readonly target: string;
  readonly signature: string;
}
interface CallCtx {
  readonly scenario: string;
  readonly symbols: SymbolTable;
  readonly item: Declaration;
}
const callerKinds: readonly string[] = ['participant', 'module'];
/** Undeclared ids pass through; Model's reference check reports them. */
export function checkCall(scenario: string, symbols: SymbolTable, item: Declaration): CheckedCall {
  const ctx: CallCtx = { scenario, symbols, item };
  const source = id(item.fields, 'source');
  const target = reference(field(item.fields, 'target'));
  checkCaller(ctx, source);
  return { source, target: target.id, signature: checkCallee(ctx, target) };
}
export function idList(ids: readonly string[]): string {
  if (ids.length === 0) return 'none';
  return ids.map((item) => `@${item}`).join(', ');
}
function nodesOfKinds(symbols: SymbolTable, kinds: readonly string[]): readonly string[] {
  return [...symbols.nodes.entries()]
    .filter(([, facts]) => kinds.includes(facts.kind))
    .map(([nodeId]) => nodeId);
}
function checkCaller(ctx: CallCtx, source: string): void {
  const facts = ctx.symbols.nodes.get(source);
  if (facts === undefined || callerKinds.includes(facts.kind)) return;
  const callers = idList(nodesOfKinds(ctx.symbols, callerKinds));
  reject(
    'unrepresentable',
    ctx.item.span,
    'A participant or module caller',
    `E311 scenario: @${source} (${facts.kind}) cannot call. Callers: ${callers}.`,
  );
}
function signaturesOf(facts: NodeFacts): readonly string[] {
  return facts.members.filter((member) => member.kind === 'signature').map((member) => member.id);
}
/** Returns the called signature id, which labels the derived arrows (A.7). */
function checkCallee(ctx: CallCtx, target: Reference): string {
  const facts = ctx.symbols.nodes.get(target.id);
  if (facts === undefined) return unresolvedCallee(target);
  return checkModuleCallee(ctx, target, facts);
}
function unresolvedCallee(target: Reference): string {
  return target.member ?? target.id;
}
function checkModuleCallee(ctx: CallCtx, target: Reference, facts: NodeFacts): string {
  if (facts.kind !== 'module') rejectCalleeKind(ctx, target, facts);
  const signature = signaturesOf(facts).find((candidate) => candidate === target.member);
  if (signature === undefined) rejectCallee(ctx, target, facts);
  return signature;
}
function calledText(target: Reference): string {
  if (target.member === undefined) return `@${target.id}`;
  return `@${target.id}.@${target.member}`;
}
function rejectCallee(ctx: CallCtx, target: Reference, facts: NodeFacts): never {
  const declared = idList(signaturesOf(facts));
  reject(
    'unrepresentable',
    ctx.item.span,
    'A signature of the called module',
    `E304 scenario: @${ctx.scenario} calls ${calledText(target)}; @${target.id} declares: ${declared}.`,
  );
}
function rejectCalleeKind(ctx: CallCtx, target: Reference, facts: NodeFacts): never {
  const modules = idList(nodesOfKinds(ctx.symbols, ['module']));
  reject(
    'unrepresentable',
    ctx.item.span,
    'A module signature',
    `E304 scenario: @${ctx.scenario} calls ${calledText(target)}; @${target.id} is ${facts.kind}. Modules: ${modules}.`,
  );
}
