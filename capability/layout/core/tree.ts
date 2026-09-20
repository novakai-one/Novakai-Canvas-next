import type { VisualSection } from '../contract/records/input.js';
import type { TreeGeometry } from '../contract/records/geometry.js';

/** Preserve the semantic tree contract; containment groups remain a separate layout concern. */
export function treeGeometry(source: VisualSection): TreeGeometry | undefined {
  if (source.mode !== 'tree') return undefined;
  const root = rootNode(source);
  const edges = source.wires
    .filter((wire) => wire.kind === 'parent')
    .map((wire) => ({ id: wire.id, source: wire.source.node, target: wire.target.node }));
  const rows: Array<{ node: string; parent: string | null; depth: number }> = [];
  const visit = (id: string, parent: string | null, depth: number): void => {
    rows.push({ node: id, parent, depth });
    edges.filter((edge) => edge.source === id).forEach((edge) => visit(edge.target, id, depth + 1));
  };
  if (root !== null) visit(root, null, 0);
  return {
    root,
    edges,
    rows,
  };
}

function rootNode(source: VisualSection): string | null {
  if (source.root === null) return null;
  return source.nodes.find((node) => node.objectId === source.root)?.id ?? null;
}
