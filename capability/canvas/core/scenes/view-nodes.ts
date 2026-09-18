import type { SessionState } from '../../contract/records/state.js';
import type { ViewNode, ViewSection } from '../../contract/records/view.js';
import type { PlacedNode, PlacedSection } from '../../contract/records/scene.js';
import { targetInfo, targetKey } from './address.js';
import { previewBox, previewOrigin, hiddenByReading } from './preview.js';
/** Selection membership is scoped to a visible appearance, not canonical content identity. */
function selected(state: SessionState, key: string): boolean {
  return state.selection.some((target) => targetKey(target) === key);
}
/** The React Flow parent frame has a visual top-left distinct from the semantic placement origin. */
function parentBox(state: SessionState, node: PlacedNode, section: PlacedSection): ViewNode['box'] {
  const parent =
    node.parent === null
      ? { kind: 'section' as const, id: section.id }
      : { kind: 'node' as const, section: section.id, id: node.parent };
  return previewBox(state, targetInfo(state.index, parent));
}
/** Nodes are parent-relative only at the React Flow boundary; measured content remains untouched. */
export function viewNode(state: SessionState, node: PlacedNode, section: PlacedSection): ViewNode {
  const target = { kind: 'node' as const, section: section.id, id: node.id };
  const info = targetInfo(state.index, target);
  const bounds = previewBox(state, info);
  const parent = parentBox(state, node, section);
  return {
    id: info.key,
    target,
    parentId: info.parentKey ?? '',
    position: { x: bounds.x - parent.x, y: bounds.y - parent.y },
    box: bounds,
    placed: node,
    selected: selected(state, info.key),
    hidden: hiddenByReading(state, info),
    draft: bounds !== info.box,
  };
}
/** Whole-section movement translates its origin once and lets child parent-relative coordinates stay fixed. */
export function viewSection(state: SessionState, section: PlacedSection): ViewSection {
  const target = { kind: 'section' as const, id: section.id };
  const info = targetInfo(state.index, target);
  const bounds = previewBox(state, info);
  const origin = previewOrigin(state, section.id);
  return {
    id: info.key,
    target,
    position: { x: bounds.x, y: bounds.y },
    box: bounds,
    section: origin === undefined ? section : { ...section, box: bounds, origin },
    selected: selected(state, info.key),
    collapsed: state.reading?.collapsed.includes(info.key) ?? false,
  };
}
