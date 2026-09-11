import type { LayoutIntent } from '../../contract/records/input.js';
import type {
  PlacementValue,
  PlacementNode,
  PlacementProblem,
} from '../../contract/records/problem.js';
import type { SeedContext, LayoutOptions } from '../../contract/types.js';
import { box } from '../../contract/records/geometry.js';
import { reject, requireValue } from '../validation/outcomes.js';
export interface Scope {
  readonly nodes: readonly PlacementNode[];
  readonly edges: PlacementProblem['edges'];
  readonly layout: LayoutIntent;
}
/** Fixed cells reserve the largest measured box, so heterogeneous grid contents cannot overlap. */
function grid(scope: Scope, options: LayoutOptions): readonly PlacementValue[] {
  const gap = options.gap[scope.layout.gap];
  const width = Math.max(1, ...scope.nodes.map((node) => node.width)) + gap;
  const height = Math.max(1, ...scope.nodes.map((node) => node.height)) + gap;
  const columns =
    scope.layout.algorithm === 'sequence' ? Math.max(1, scope.nodes.length) : options.gridColumns;
  return scope.nodes.map((node, index) => ({
    id: node.id,
    box: {
      ...position(index, columns, width, height, gridDirection(scope.layout)),
      width: node.width,
      height: node.height,
    },
  }));
}
/** Sequence headers are horizontal; down/up describe time, not a column of overlapping lifelines. */
function gridDirection(layout: LayoutIntent): LayoutIntent['direction'] {
  if (layout.algorithm !== 'sequence') return layout.direction;
  return layout.direction === 'left' ? 'left' : 'right';
}
/** Direction controls reading order; negative axes preserve negative logical coordinates. */
function position(
  index: number,
  columns: number,
  width: number,
  height: number,
  direction: LayoutIntent['direction'],
): { readonly x: number; readonly y: number } {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const policies = {
    right: { x: column * width, y: row * height },
    left: { x: -column * width, y: row * height },
    down: { x: row * width, y: column * height },
    up: { x: row * width, y: -column * height },
  };
  return policies[direction];
}
/** Placement engines provide seeds only; required constraints are applied afterward. */
async function native(scope: Scope, context: SeedContext): Promise<readonly PlacementValue[]> {
  const algorithm = scope.layout.algorithm === 'tree' ? 'tree' : 'layered';
  const result = await context.dependencies.placement.place({
    ...scope,
    algorithm,
    direction: scope.layout.direction,
    spacing: context.options.gap[scope.layout.gap],
    padding: context.options.padding,
  });
  return requireValue(result);
}
/** Native identity and geometry are checked before a seed can influence the solver. */
function checked(values: readonly PlacementValue[], scope: Scope): readonly PlacementValue[] {
  const expected = scope.nodes.map((node) => node.id).toSorted();
  const actual = values.map((node) => node.id).toSorted();
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    reject('engine-failed', 'placement', 'Native placement returned a different node set');
  values.forEach(checkBox);
  return values;
}
/** Reject nonfinite/empty native geometry instead of coercing it to a default position. */
function checkBox(value: PlacementValue): void {
  if (!box.safeParse(value.box).success)
    reject('engine-failed', value.id, 'Native placement returned invalid bounds');
}
/** Cancellation is observed on both sides of native work and also for synchronous grid placement. */
export async function placeScope(
  scope: Scope,
  context: SeedContext,
): Promise<readonly PlacementValue[]> {
  requireValue(await context.dependencies.jobs.checkpoint(context.job));
  const values = await choose(scope, context);
  requireValue(await context.dependencies.jobs.checkpoint(context.job));
  return checked(values, scope);
}
/** Closed layout policy selection keeps native dependencies out of geometry rules. */
async function choose(scope: Scope, context: SeedContext): Promise<readonly PlacementValue[]> {
  if (scope.layout.algorithm === 'grid' || scope.layout.algorithm === 'sequence')
    return grid(scope, context.options);
  return native(scope, context);
}
