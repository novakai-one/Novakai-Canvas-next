/** A.5 wire endpoint predicates: legal object/member kinds per v2 relationship kind, table-driven. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { field, id, list, reference, textOr } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
import { nodeKindsV2 } from '../../vocabulary/defaults.js';
import type { MemberFact, NodeFacts, SymbolTable } from './symbols.js';
type Side = 'source' | 'target';
interface WireCtx {
  readonly item: Declaration;
  readonly wireKind: string;
  readonly symbols: SymbolTable;
}
export interface EndpointRule {
  readonly kinds: readonly string[];
  readonly members?: readonly MemberFact['kind'][];
  readonly memberRequired?: boolean;
  readonly exempt?: readonly string[];
}
const anyMemberKind: readonly MemberFact['kind'][] = ['field', 'signature', 'member', 'keygroup'];
export const sourceRules: Readonly<Record<string, EndpointRule>> = {
  imports: { kinds: ['module'] },
  calls: { kinds: ['module', 'participant'] },
  implements: { kinds: ['module', 'function'] },
  association: { kinds: ['entity'], members: ['field'], memberRequired: true },
  transition: { kinds: ['state', 'start'] },
  flow: { kinds: ['step', 'decision', 'fork', 'join', 'start'] },
  reference: { kinds: nodeKindsV2, members: anyMemberKind },
};
export const targetRules: Readonly<Record<string, EndpointRule>> = {
  imports: {
    kinds: ['module', 'package'],
    members: ['signature', 'member'],
    memberRequired: true,
    exempt: ['package'],
  },
  calls: { kinds: ['module'], members: ['signature'], memberRequired: true },
  implements: { kinds: ['interface'] },
  association: { kinds: ['entity'], members: ['field'] },
  transition: { kinds: ['state', 'end'] },
  flow: { kinds: ['step', 'decision', 'fork', 'join', 'end'] },
  reference: { kinds: nodeKindsV2, members: anyMemberKind },
};
/** A wire with no authored kind is a flow wire. */
export function wireKindOf(item: Declaration): string {
  return textOr(item.fields, 'kind', 'flow');
}
export function checkWireEndpoints(item: Declaration, symbols: SymbolTable): void {
  const wireKind = wireKindOf(item);
  const [sourceRule, targetRule] = requireRules(item, wireKind);
  const ctx: WireCtx = { item, wireKind, symbols };
  checkEndpoint(ctx, 'source', reference(field(item.fields, 'source')), sourceRule);
  checkEndpoint(ctx, 'target', reference(field(item.fields, 'target')), targetRule);
}
/** E110: a wire connected in a modules section carries no authored label, whatever its endpoints. */
export function checkModulesWireLabels(
  collection: Declaration,
  wires: readonly Declaration[],
): void {
  collection.children
    .filter(isModulesSection)
    .forEach((section) => checkConnectedLabels(section, wires));
}
function isModulesSection(child: Declaration): boolean {
  return child.kind === 'section' && textOr(child.fields, 'mode', 'flow') === 'modules';
}
function connectedIds(section: Declaration): readonly string[] {
  return section.children
    .filter((child) => child.kind === 'connect')
    .flatMap((child) => list(child.fields, 'ids').map((value) => (value as Reference).id));
}
function checkConnectedLabels(section: Declaration, wires: readonly Declaration[]): void {
  const connected = connectedIds(section);
  wires
    .filter((wire) => connected.includes(id(wire.fields)))
    .filter((wire) => wire.fields.label !== undefined)
    .forEach((wire) => rejectModulesLabel(wire, section));
}
function rejectModulesLabel(wire: Declaration, section: Declaration): never {
  reject(
    'unrepresentable',
    wire.span,
    'No label on a modules wire',
    `E110 label: @${id(wire.fields)} is connected in @${id(section.fields)} (modules) and takes no wire label. Drop it.`,
  );
}
function requireRules(item: Declaration, wireKind: string): readonly [EndpointRule, EndpointRule] {
  const source = sourceRules[wireKind];
  const target = targetRules[wireKind];
  if (source === undefined) rejectUnknownKind(item, wireKind);
  if (target === undefined) rejectUnknownKind(item, wireKind);
  return [source, target];
}
function checkEndpoint(ctx: WireCtx, side: Side, ref: Reference, rule: EndpointRule): void {
  const facts = ctx.symbols.nodes.get(ref.id);
  if (facts === undefined) return;
  checkEndpointKind(ctx, side, rule, facts);
  checkEndpointMember(ctx, side, ref, rule, facts);
}
function nodeKindLegal(rule: EndpointRule, facts: NodeFacts): boolean {
  return rule.kinds.includes(facts.kind);
}
function checkEndpointKind(ctx: WireCtx, side: Side, rule: EndpointRule, facts: NodeFacts): void {
  if (nodeKindLegal(rule, facts)) return;
  rejectKind(ctx, side, rule);
}
function checkEndpointMember(
  ctx: WireCtx,
  side: Side,
  ref: Reference,
  rule: EndpointRule,
  facts: NodeFacts,
): void {
  if (ref.member === undefined) return checkMemberRequired(ctx, side, rule, ref, facts);
  checkMemberKind(ctx, side, ref, rule, facts);
}
function checkMemberRequired(
  ctx: WireCtx,
  side: Side,
  rule: EndpointRule,
  ref: Reference,
  facts: NodeFacts,
): void {
  if (rule.memberRequired !== true) return;
  if (memberExempt(rule, facts)) return;
  rejectMemberRule(ctx, side, rule, ref.id, facts);
}
function memberFact(facts: NodeFacts, memberId: string): MemberFact | undefined {
  return facts.members.find((member) => member.id === memberId);
}
function checkMemberKind(
  ctx: WireCtx,
  side: Side,
  ref: Reference,
  rule: EndpointRule,
  facts: NodeFacts,
): void {
  const fact = memberFact(facts, ref.member as string);
  if (fact === undefined) return rejectUnknownMember(ctx, ref.id, facts);
  if (!memberKindLegal(rule, fact)) rejectMemberRule(ctx, side, rule, ref.id, facts);
}
function legalMemberKinds(rule: EndpointRule): readonly MemberFact['kind'][] {
  if (rule.members === undefined) return [];
  return rule.members;
}
function memberKindLegal(rule: EndpointRule, fact: MemberFact): boolean {
  return legalMemberKinds(rule).includes(fact.kind);
}
function legalExempt(rule: EndpointRule): readonly string[] {
  if (rule.exempt === undefined) return [];
  return rule.exempt;
}
function memberExempt(rule: EndpointRule, facts: NodeFacts): boolean {
  return legalExempt(rule).includes(facts.kind);
}
function memberList(facts: NodeFacts): string {
  if (facts.members.length === 0) return 'no members';
  return facts.members.map((member) => `@${member.id}`).join(', ');
}
function kindsPhrase(kinds: readonly string[]): string {
  return kinds.map((kind) => `${kind}s`).join(' or ');
}
const memberKindWords: Readonly<Record<MemberFact['kind'], string>> = {
  field: 'field',
  signature: 'signature',
  member: 'type member',
  keygroup: 'key group',
};
function memberWord(kind: MemberFact['kind']): string {
  return memberKindWords[kind];
}
function memberPhrase(kinds: readonly MemberFact['kind'][]): string {
  return kinds.map(memberWord).join(' or ');
}
function memberVerb(side: Side): string {
  if (side === 'source') return 'originate from';
  return 'target';
}
function memberClause(rule: EndpointRule, side: Side): string {
  const kinds = legalMemberKinds(rule);
  if (kinds.length === 0) return 'must not carry a member';
  return `must ${memberVerb(side)} a ${memberPhrase(kinds)}`;
}
function candidateText(ids: readonly string[]): string {
  if (ids.length === 0) return 'none';
  return ids.join(', ');
}
function legalCandidates(symbols: SymbolTable, kinds: readonly string[]): string {
  const ids = [...symbols.nodes.entries()]
    .filter(([, facts]) => kinds.includes(facts.kind))
    .map(([nodeId]) => `@${nodeId}`);
  return candidateText(ids);
}
function rejectUnknownKind(item: Declaration, wireKind: string): never {
  const legal = Object.keys(sourceRules).join(', ');
  reject(
    'unrepresentable',
    item.span,
    legal,
    `E103 kind: ${wireKind} is not a canvas 2 wire kind. Use: ${legal}.`,
  );
}
function rejectKind(ctx: WireCtx, side: Side, rule: EndpointRule): never {
  const phrase = kindsPhrase(rule.kinds);
  const candidates = legalCandidates(ctx.symbols, rule.kinds);
  reject(
    'unrepresentable',
    ctx.item.span,
    phrase,
    `E103 kind: ${ctx.wireKind} ${side}s are ${phrase}. ${phrase[0]?.toUpperCase()}${phrase.slice(1)}: ${candidates}.`,
  );
}
function rejectMemberRule(
  ctx: WireCtx,
  side: Side,
  rule: EndpointRule,
  objectId: string,
  facts: NodeFacts,
): never {
  const clause = memberClause(rule, side);
  reject(
    'unrepresentable',
    ctx.item.span,
    clause,
    `E103 kind: ${ctx.wireKind} ${clause}. @${objectId} exposes: ${memberList(facts)}.`,
  );
}
function rejectUnknownMember(ctx: WireCtx, objectId: string, facts: NodeFacts): never {
  reject(
    'unknown-target',
    ctx.item.span,
    'A declared member',
    `E102 resolve: @${objectId} exposes: ${memberList(facts)}.`,
  );
}
