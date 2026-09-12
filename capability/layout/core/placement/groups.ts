import type { VisualNode, VisualSection, LayoutIntent } from '../../contract/records/input.js';
import type { PlacementValue, PlacementProblem } from '../../contract/records/problem.js';
import type { Point } from '../../contract/records/geometry.js';
import type { SupplementalMeasurements, SeedContext } from '../../contract/types.js';
import { routingGap } from './spacing.js';
import { placeScope } from './policy.js';
import { union } from '../geometry/bounds.js';
import { reject } from '../validation/outcomes.js';
interface Branch {
  readonly root: PlacementValue;
  readonly descendants: readonly PlacementValue[];
}
/** A group is measured from its own children before its parent scope is arranged. */
async function branch(
  node: VisualNode,
  section: VisualSection,
  context: SeedContext,
  measurements: SupplementalMeasurements,
): Promise<Branch> {
  const descendants = await seedScope(node.id, section, context, measurements);
  if (descendants.length === 0)
    return {
      root: { id: node.id, box: { x: 0, y: 0, width: node.width, height: node.height } },
      descendants,
    };
  return container(node, descendants, context.options.padding);
}
/** Header and padding belong to the outer group; descendant points remain section-frame translations. */
function container(
  node: VisualNode,
  descendants: readonly PlacementValue[],
  padding: number,
): Branch {
  const bounds = union(descendants.map((item) => item.box));
  const offset = { x: padding - bounds.x, y: node.headerHeight + padding - bounds.y };
  return {
    root: {
      id: node.id,
      box: {
        x: 0,
        y: 0,
        width: Math.max(node.width, bounds.width + padding * 2),
        height: Math.max(node.height, bounds.height + node.headerHeight + padding * 2),
      },
    },
    descendants: descendants.map((item) => translate(item, offset)),
  };
}
/** Translation never changes dimensions or interprets IDs as coordinate paths. */
export function translate(item: PlacementValue, offset: Point): PlacementValue {
  return { ...item, box: { ...item.box, x: item.box.x + offset.x, y: item.box.y + offset.y } };
}
/** Nested group layout is explicitly independent of the enclosing section's chosen algorithm. */
function intent(parent: string | null, section: VisualSection): LayoutIntent {
  if (parent === null) return section.layout;
  const node = section.nodes.find((item) => item.id === parent);
  const group = section.groups.find((item) => item.id === node?.groupId);
  if (!group) return reject('invalid-input', parent, 'Visible group has no layout intent');
  return group.layout;
}
/** Contract a wire to its immediate visible branch, so child-internal edges do not distort an outer scope. */
function owner(id: string, roots: readonly string[], section: VisualSection): string | null {
  if (roots.includes(id)) return id;
  const node = section.nodes.find((item) => item.id === id);
  return parentOwner(node?.parent ?? null, roots, section);
}
/** A root outside this scope contributes no placement edge. */
function parentOwner(
  parent: string | null,
  roots: readonly string[],
  section: VisualSection,
): string | null {
  if (parent === null) return null;
  return owner(parent, roots, section);
}
/** Only edges joining distinct immediate branches enter the scope's placement graph. */
function edges(roots: readonly string[], section: VisualSection): PlacementProblem['edges'] {
  return section.wires.flatMap((wire) =>
    scopeEdge(
      wire.id,
      owner(wire.source.node, roots, section),
      owner(wire.target.node, roots, section),
    ),
  );
}
/** Missing/outside endpoints and intra-branch edges are intentionally omitted from this seed-only graph. */
function scopeEdge(
  id: string,
  source: string | null,
  target: string | null,
): PlacementProblem['edges'] {
  if (source === null || target === null || source === target) return [];
  return [{ id, source, target }];
}
/** Reattach child-local descendants after the native engine chooses the branch's outer position. */
function flatten(value: PlacementValue, branches: readonly Branch[]): readonly PlacementValue[] {
  const found = branches.find((item) => item.root.id === value.id);
  if (!found) return reject('engine-failed', value.id, 'Placement returned an unknown branch');
  return [value, ...found.descendants.map((item) => translate(item, value.box))];
}
/** Bottom-up scoped arrangement honours every group's algorithm without letting adapters own domain policy. */
export async function seedScope(
  parent: string | null,
  section: VisualSection,
  context: SeedContext,
  measurements: SupplementalMeasurements,
): Promise<readonly PlacementValue[]> {
  const children = section.nodes.filter((node) => node.parent === parent);
  if (children.length === 0) return [];
  const branches = await Promise.all(
    children.map((node) => branch(node, section, context, measurements)),
  );
  const roots = branches.map((item) => item.root.id);
  const nodes = branches.map((item) => ({
    id: item.root.id,
    parent: null,
    width: item.root.box.width,
    height: item.root.box.height,
    header: 0,
  }));
  const placed = await placeScope(
    {
      nodes,
      edges: edges(roots, section),
      layout: intent(parent, section),
      minimumGap: routingGap(section, edges(roots, section), measurements, context.options),
    },
    context,
  );
  return placed.flatMap((item) => flatten(item, branches));
}
