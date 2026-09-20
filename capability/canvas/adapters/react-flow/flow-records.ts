import type {
  GraphSelector,
  ViewSnapshot,
  ViewActions,
  SurfaceProps,
  FlowNode,
  FlowEdge,
} from '../../contract/react-types.js';
import type { Result } from '../../contract/errors.js';
import type { ViewNode } from '../../contract/records/view.js';
/** Group interiors belong to the camera; only their explicit boundary hit surface receives input. */
function nodeSurfaceStyle(view: ViewNode): NonNullable<FlowNode['style']> {
  return {
    width: view.box.width,
    height: view.box.height,
    pointerEvents: view.placed.measured.groupId === null ? 'auto' : 'none',
  };
}
/** Convert admitted node/section views to controlled React Flow records; generated JSON never leaves this adapter. */
function flowNodes(
  snapshot: ViewSnapshot,
  actions: ViewActions,
  paint: SurfaceProps['paint'],
): FlowNode[] {
  const sections: FlowNode[] = snapshot.view.sections.map((view) => ({
    id: view.id,
    type: 'section',
    position: view.position,
    width: view.box.width,
    height: view.box.height,
    measured: { width: view.box.width, height: view.box.height },
    style: { width: view.box.width, height: view.box.height, pointerEvents: 'none' },
    data: { view, paint },
    selected: view.selected,
    dragHandle: '.section-drag-handle',
    draggable: snapshot.view.editable && snapshot.view.tool === 'select',
    selectable: true,
    zIndex: -1,
  }));
  const nodes: FlowNode[] = snapshot.view.nodes.map((view) => ({
    id: view.id,
    type: 'scene',
    parentId: view.parentId,
    position: view.position,
    width: view.box.width,
    height: view.box.height,
    measured: { width: view.box.width, height: view.box.height },
    style: nodeSurfaceStyle(view),
    data: { view, actions, editable: snapshot.view.editable && view.tree === undefined },
    selected: view.selected,
    hidden: view.hidden,
    draggable: [
      snapshot.view.editable,
      snapshot.view.tool === 'select',
      view.tree === undefined,
    ].every(Boolean),
    selectable: true,
    connectable:
      snapshot.view.editable && snapshot.view.tool === 'connect' && view.tree === undefined,
    zIndex: 1,
  }));
  return [...sections, ...parentOrder(nodes)];
}
/** React Flow requires parents before their children; admitted acyclic references guarantee progress. */
function parentOrder(nodes: readonly FlowNode[]): FlowNode[] {
  const pending = new Map(nodes.map((node) => [node.id, node]));
  const result: FlowNode[] = [];
  while (pending.size > 0) {
    const ready = [...pending.values()].filter((node) => !pending.has(node.parentId ?? ''));
    ready.forEach((node) => {
      result.push(node);
      pending.delete(node.id);
    });
  }
  return result;
}
/** Edges preserve supplied labels/markers/routes and their scene scope; no routing algorithm runs here. */
function flowEdges(
  snapshot: ViewSnapshot,
  actions: ViewActions,
  paint: SurfaceProps['paint'],
): FlowEdge[] {
  return snapshot.view.wires.map((view) => ({
    id: view.id,
    type: 'scene',
    source: view.sourceId,
    target: view.targetId,
    data: {
      view,
      actions,
      editable: snapshot.view.editable,
      paint,
      nudge: snapshot.state.profile.nudge,
      zoom: view.showLabel ? snapshot.view.camera.zoom : 1,
    },
    selected: view.selected,
    hidden: view.hidden,
    focusable: true,
    ariaLabel: view.wire.measuredLabel.outline.join(' '),
  }));
}
/** Failed projections render no invented graph; the diagnostic is reported through the host callback. */
function graphRecords(
  result: Result<ViewSnapshot>,
  actions: ViewActions,
  paint: SurfaceProps['paint'],
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  if (!result.ok) return { nodes: [], edges: [] };
  return {
    nodes: flowNodes(result.value, actions, paint),
    edges: flowEdges(result.value, actions, paint),
  };
}
/** Cache actual React Flow records, not just inner data. Repeated projections are semantically safe; host remounts the surface after a reported rendering failure, rebuilding this disposable cache. */
export function createGraphSelector(): GraphSelector {
  let previousNodes = new Map<string, FlowNode>();
  let previousEdges = new Map<string, FlowEdge>();
  return (result, actions, paint): ReturnType<typeof graphRecords> => {
    const next = graphRecords(result, actions, paint);
    const nodes = next.nodes.map((node) => stableFlowNode(node, previousNodes.get(node.id)));
    const edges = next.edges.map((edge) => stableFlowEdge(edge, previousEdges.get(edge.id)));
    previousNodes = new Map(nodes.map((node) => [node.id, node]));
    previousEdges = new Map(edges.map((edge) => [edge.id, edge]));
    return { nodes, edges };
  };
}
/** A semantic view/reference or interaction permission change invalidates only that React Flow node record. */
function stableFlowNode(next: FlowNode, previous: FlowNode | undefined): FlowNode {
  if (!previous) return next;
  const equal = [
    next.data.view === previous.data.view,
    next.data.editable === previous.data.editable,
    next.draggable === previous.draggable,
    next.connectable === previous.connectable,
    next.data.paint === previous.data.paint,
    next.data.actions === previous.data.actions,
  ].every(Boolean);
  return equal ? previous : next;
}
/** Pinned paint, route and action identity determine edge changes; camera movement does not rebuild edge data. */
function stableFlowEdge(next: FlowEdge, previous: FlowEdge | undefined): FlowEdge {
  if (!previous) return next;
  const equal = [
    next.data?.view === previous.data?.view,
    next.data?.actions === previous.data?.actions,
    next.data?.editable === previous.data?.editable,
    next.data?.paint === previous.data?.paint,
    next.data?.nudge === previous.data?.nudge,
    next.data?.zoom === previous.data?.zoom,
  ].every(Boolean);
  return equal ? previous : next;
}
