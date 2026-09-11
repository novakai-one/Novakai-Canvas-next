import type { LayoutIntent, VisualNode } from '../../contract/records/input.js';
import type { LinearConstraint } from '../../contract/records/problem.js';
import { equation, term } from './compile.js';
import { reject } from '../validation/outcomes.js';
type Axis = 'x' | 'y';
interface Direction {
  readonly main: Axis;
  readonly cross: Axis;
  readonly sign: 1 | -1;
}
const directions: Readonly<Record<LayoutIntent['direction'], Direction>> = {
  right: { main: 'x', cross: 'y', sign: 1 },
  left: { main: 'x', cross: 'y', sign: -1 },
  down: { main: 'y', cross: 'x', sign: 1 },
  up: { main: 'y', cross: 'x', sign: -1 },
};
type Target = LayoutIntent['constraints'][number]['targets'][number];
/** Resolve canonical object/group references through the actual visible representation. */
function target(reference: Target, nodes: readonly VisualNode[]): string {
  const found = nodes.find((node) => matches(reference, node));
  if (!found)
    return reject('invalid-input', reference.id, 'Relative constraint target is not visible');
  return found.id;
}
/** A represented object and its group intentionally resolve to the same physical box. */
function matches(reference: Target, node: VisualNode): boolean {
  if (reference.kind === 'object') return node.objectId === reference.id;
  return node.groupId === reference.id;
}
/** Equal origin coordinate means a row/column exactly as declared by the DSL. */
function equal(id: string, a: string, b: string, axis: Axis): LinearConstraint {
  return equation(id, [term(a, axis), term(b, axis, -1)], 'eq', 0, [a, b]);
}
/** Ordering reserves the first box's extent and the requested gap, not just its origin. */
export function before(
  id: string,
  a: string,
  b: string,
  axis: Axis,
  gap: number,
): LinearConstraint {
  const extent = axis === 'x' ? 'width' : 'height';
  return equation(id, [term(a, axis), term(a, extent), term(b, axis, -1)], 'le', -gap, [a, b]);
}
/** Negative directions reverse the physical inequality while retaining declared reading order. */
function ordered(
  id: string,
  a: string,
  b: string,
  direction: Direction,
  gap: number,
): LinearConstraint {
  if (direction.sign === -1) return before(id, b, a, direction.main, gap);
  return before(id, a, b, direction.main, gap);
}
interface Pair {
  readonly id: string;
  readonly a: string;
  readonly b: string;
  readonly direction: Direction;
  readonly gap: number;
}
type Policy = (pair: Pair) => readonly LinearConstraint[];
/** Closed semantic policy registry keeps native solver code independent of authoring syntax. */
const policies: Readonly<Record<LayoutIntent['constraints'][number]['kind'], Policy>> = {
  rank: (p) => [
    equal(`${p.id}:rank`, p.a, p.b, p.direction.cross),
    ordered(`${p.id}:order`, p.a, p.b, p.direction, p.gap),
  ],
  before: (p) => [ordered(p.id, p.a, p.b, p.direction, p.gap)],
  below: (p) => [before(p.id, p.b, p.a, 'y', p.gap)],
  align: (p) => [
    equal(`${p.id}:align`, p.a, p.b, p.direction.main),
    before(`${p.id}:order`, p.a, p.b, p.direction.cross, p.gap),
  ],
};
/** Consecutive pairs define the full declared order with linear rather than quadratic equations. */
function pairs(
  ids: readonly string[],
  id: string,
  direction: Direction,
  gap: number,
): readonly Pair[] {
  return ids.slice(1).map((b, index) => pair(ids[index], b, `${id}:${index}`, direction, gap));
}
/** A missing predecessor is internal invalid data, never an invented root constraint. */
function pair(
  a: string | undefined,
  b: string,
  id: string,
  direction: Direction,
  gap: number,
): Pair {
  if (a === undefined) return reject('invalid-input', id, 'Constraint predecessor is missing');
  return { id, a, b, direction, gap };
}
/** Compile declared hard rank/before/below/align relationships with stable source IDs for diagnostics. */
export function relative(
  layout: LayoutIntent,
  nodes: readonly VisualNode[],
  gap: number,
  scope: string,
): readonly LinearConstraint[] {
  return compileRelative(layout, (reference) => target(reference, nodes), gap, scope);
}
/** Collection section constraints reuse the same equations through a section-only target resolver. */
export function relativeSections(
  layout: LayoutIntent,
  ids: readonly string[],
  gap: number,
): readonly LinearConstraint[] {
  return compileRelative(layout, (reference) => sectionTarget(reference, ids), gap, 'collection');
}
/** Section constraints cannot borrow object/group identities from inside one section. */
function sectionTarget(reference: Target, ids: readonly string[]): string {
  if (reference.kind !== 'section' || !ids.includes(reference.id))
    return reject(
      'invalid-input',
      reference.id,
      'Collection constraint requires a visible section',
    );
  return reference.id;
}
/** Target resolution is the only scope-dependent step; declared ordering policy stays in one registry. */
function compileRelative(
  layout: LayoutIntent,
  resolve: (target: Target) => string,
  gap: number,
  scope: string,
): readonly LinearConstraint[] {
  return layout.constraints.flatMap((constraint, index) => {
    const ids = constraint.targets.map(resolve);
    return pairs(ids, `${scope}:constraint:${index}`, directions[layout.direction], gap).flatMap(
      policies[constraint.kind],
    );
  });
}
