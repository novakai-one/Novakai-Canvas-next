import type { VisualSection } from '../../contract/records/input.js';
import type { PlacementValue } from '../../contract/records/problem.js';
import { treeGeometry } from '../tree.js';

/** Row order is semantic preorder; the full expansion is allocated before Canvas can collapse it. */
export function treeRows(
  section: VisualSection,
  branches: readonly PlacementValue[],
  gap: number,
  algorithm: string,
): readonly PlacementValue[] | undefined {
  if (section.mode !== 'tree' || algorithm !== 'tree') return undefined;
  const rows = treeGeometry(section)?.rows ?? [];
  const rank = new Map(rows.map((row, index) => [row.node, index]));
  const depths = new Map(rows.map((row) => [row.node, row.depth]));
  const indent = Math.max(0, ...section.nodes.map((node) => node.treeRow?.gutter ?? 0));
  const ordered = branches.toSorted(
    (a, b) => (rank.get(a.id) ?? rows.length) - (rank.get(b.id) ?? rows.length),
  );
  const minimum = Math.min(0, ...ordered.map((item) => depths.get(item.id) ?? 0));
  let y = 0;
  return ordered.map((item) => {
    const result = {
      ...item,
      box: { ...item.box, x: ((depths.get(item.id) ?? 0) - minimum) * indent, y },
    };
    y += item.box.height + gap;
    return result;
  });
}
