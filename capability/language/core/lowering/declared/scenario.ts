/** A sequence section shows one scenario; its calls and alts lower onto today's event/fragment records. */
import type { Declaration, Reference } from '../../../contract/records/syntax.js';
import { id, list, optional, text, type RawRecord } from '../fields.js';
import { reject } from '../../validation/outcomes.js';
import { checkCall, idList } from './scenario-calls.js';
import type { SymbolTable } from './symbols.js';
export interface ScenarioView {
  readonly scenario: RawRecord;
  readonly appearances: readonly RawRecord[];
  readonly sequence: readonly RawRecord[];
}
interface Walk {
  readonly scenario: string;
  readonly symbols: SymbolTable;
  readonly participants: string[];
  readonly items: RawRecord[];
  calls: number;
  fragments: number;
}
interface Scope {
  readonly parent?: string;
  readonly branch?: string;
}
/** A call is a one-item step; adjacent sibling alts form one step of alternatives. */
type Step = readonly Declaration[];
export function lowerScenarioSection(item: Declaration, symbols: SymbolTable): ScenarioView {
  const scenario = requireOneScenario(item, symbols);
  const scenarioId = id(scenario.fields);
  const walk: Walk = {
    scenario: scenarioId,
    symbols,
    participants: [],
    items: [],
    calls: 0,
    fragments: 0,
  };
  lowerSteps(walk, scenario.children, {});
  return {
    scenario: { id: scenarioId, title: text(scenario.fields, 'title') },
    appearances: walk.participants.map((object) => ({ object })),
    sequence: walk.items,
  };
}
function showIds(child: Declaration): readonly string[] {
  return list(child.fields, 'ids').map((value) => (value as Reference).id);
}
/** E307: exactly one flat show naming a declared scenario, and no connect. */
function requireOneScenario(item: Declaration, symbols: SymbolTable): Declaration {
  const shows = item.children.filter((child) => child.kind === 'show');
  const ids = shows.flatMap(showIds);
  const nested = shows.some((child) => child.children.length > 0);
  const connected = item.children.some((child) => child.kind === 'connect');
  const scenario = symbols.scenarios.get(ids[0] ?? '');
  if (ids.length !== 1 || nested || connected || scenario === undefined)
    rejectScenarioCount(item, symbols);
  return scenario;
}
function rejectScenarioCount(item: Declaration, symbols: SymbolTable): never {
  const declared = idList([...symbols.scenarios.keys()]);
  reject(
    'unrepresentable',
    item.span,
    'One scenario',
    `E307 sequence: show exactly one scenario. Declared: ${declared}.`,
  );
}
function joinsAlternatives(last: Step, step: Declaration): boolean {
  return step.kind === 'alt' && last[0]?.kind === 'alt';
}
function addStep(groups: readonly Step[], step: Declaration): readonly Step[] {
  const last = groups.at(-1);
  if (last !== undefined && joinsAlternatives(last, step))
    return [...groups.slice(0, -1), [...last, step]];
  return [...groups, [step]];
}
function groupSteps(steps: readonly Declaration[]): readonly Step[] {
  return steps.reduce<readonly Step[]>(addStep, []);
}
/** Sibling order is local to parent and branch; a `returns` call uses two slots. */
function lowerSteps(walk: Walk, steps: readonly Declaration[], scope: Scope): void {
  groupSteps(steps).reduce((order, step) => order + lowerStep(walk, step, scope, order), 0);
}
function lowerStep(walk: Walk, step: Step, scope: Scope, order: number): number {
  const first = step[0] as Declaration;
  if (first.kind === 'call') return lowerCall(walk, first, scope, order);
  if (step.length === 1) return lowerOpt(walk, first, scope, order);
  return lowerAlternatives(walk, step, scope, order);
}
function addParticipant(walk: Walk, object: string): void {
  if (!walk.participants.includes(object)) walk.participants.push(object);
}
/** Both arrows of a call carry the called signature's id as their label. */
function lowerCall(walk: Walk, item: Declaration, scope: Scope, order: number): number {
  const { source, target, signature } = checkCall(walk.scenario, walk.symbols, item);
  walk.calls += 1;
  const callId = `${walk.scenario}-call-${walk.calls}`;
  addParticipant(walk, source);
  addParticipant(walk, target);
  const call = { source, target, label: signature, message: 'call' };
  const operation = { object: target, member: signature };
  walk.items.push({ id: callId, ...scope, order, kind: 'event', ...call, operation });
  if (item.fields.returns === undefined) return 1;
  const back = { source: target, target: source, label: signature, message: 'return' };
  walk.items.push({ id: `${callId}-return`, ...scope, order: order + 1, kind: 'event', ...back });
  return 2;
}
function nextFragment(walk: Walk): string {
  walk.fragments += 1;
  return `${walk.scenario}-fragment-${walk.fragments}`;
}
/** A lone alt has no alternative; it lowers to opt with the alt's label. */
function lowerOpt(walk: Walk, alt: Declaration, scope: Scope, order: number): number {
  const fragment = nextFragment(walk);
  const label = text(alt.fields, 'label');
  walk.items.push({ id: fragment, ...scope, order, kind: 'fragment', operator: 'opt', label });
  lowerSteps(walk, alt.children, { parent: fragment });
  return 1;
}
/** Two or more adjacent alts are one alt fragment; each alt is a branch named by its label. */
function lowerAlternatives(walk: Walk, alts: Step, scope: Scope, order: number): number {
  const fragment = nextFragment(walk);
  const branches = alts.map((alt, index) => ({
    id: `${fragment}-branch-${index + 1}`,
    label: text(alt.fields, 'label'),
  }));
  const label = branches.map((branch) => branch.label).join(' / ');
  walk.items.push({
    id: fragment,
    ...scope,
    order,
    kind: 'fragment',
    operator: 'alt',
    label,
    branches,
  });
  alts.forEach((alt, index) =>
    lowerSteps(walk, alt.children, {
      parent: fragment,
      ...optional('branch', branches[index]?.id),
    }),
  );
  return 1;
}
