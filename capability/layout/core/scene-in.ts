/** Scene-in translation: an admitted modules section becomes a numbered engine spec.
 * The engine never decides node size; effective bounds always come from the measured projection.
 * Pure derivation with no engine or scheduling contact; callers own admission and fallback.
 */
import type { VisualNode, VisualSection, VisualWire } from '../contract/records/input.js';
import type {
  NestedNodeSpec,
  NestedSceneSpec,
  NestedSectionSpec,
} from '../contract/records/nested-scene-spec.js';
import type { EngineSceneMap, NestedEngineRequest } from '../contract/records/engine-scene.js';
import { reject } from './validation/outcomes.js';

/** Effective content size: an authored dimension only ever grows the measured minimum. */
export function nodeSize(node: VisualNode): { readonly width: number; readonly height: number } {
  return {
    width: Math.max(node.width, node.placement?.width ?? 0),
    height: Math.max(node.height, node.placement?.height ?? 0),
  };
}
/** A group appearance is a container box; the engine expresses it as a nested section, not a node. */
function container(node: VisualNode): boolean {
  return node.groupId !== null;
}
function visible(section: VisualSection, id: string): VisualNode | undefined {
  return section.nodes.find((node) => node.id === id);
}
/** Wire endpoints must address plain visible nodes; the engine has no container ports. */
function plainEndpoints(section: VisualSection, wire: VisualWire): boolean {
  const source = visible(section, wire.source.node);
  const target = visible(section, wire.target.node);
  return source !== undefined && target !== undefined && !container(source) && !container(target);
}
/** The engine routes between plain numbered nodes only; exact authored geometry stays with legacy. */
function expressible(section: VisualSection, wire: VisualWire): boolean {
  if (wire.route.locked && wire.route.manual !== undefined) return false;
  return plainEndpoints(section, wire);
}
/** Only unconstrained modules sections derive through the engine; every other section stays byte-identical legacy. */
export function admitNested(section: VisualSection): boolean {
  return (
    section.mode === 'modules' &&
    section.placement?.locked !== true &&
    section.nodes.length > 0 &&
    section.sequence.length === 0 &&
    section.nodes.every((node) => node.placement?.locked !== true) &&
    section.wires.every((wire) => expressible(section, wire))
  );
}

/** Section and node ordinals are dense and assigned in one deterministic source-order pass. */
interface Numbering {
  node: number;
  section: number;
  nodes: string[];
  containers: (string | null)[];
}
/** One scope of the containment tree: plain children become engine nodes, containers recurse as engine sections. */
function scopeSpec(
  section: VisualSection,
  parent: string | null,
  numbering: Numbering,
): NestedSectionSpec {
  const number = numbering.section++;
  const nodes = section.nodes
    .filter((node) => node.parent === parent && !container(node))
    .map((node): NestedNodeSpec => numberedNode(node, numbering));
  const children = section.nodes
    .filter((node) => node.parent === parent && container(node))
    .map((node): NestedSectionSpec => {
      const child = scopeSpec(section, node.id, numbering);
      numbering.containers[child.number - 1] = node.id;
      return child;
    });
  return { number, nodes, children };
}
/** Number assignment and identity recording stay in one place so the map is exact by construction. */
function numberedNode(node: VisualNode, numbering: Numbering): NestedNodeSpec {
  const number = numbering.node++;
  numbering.nodes[number - 1] = node.id;
  return { number, label: node.label, size: nodeSize(node) };
}
/** Wire requests carry engine node ordinals; admission already excluded container endpoints. */
function requestOf(
  order: ReadonlyMap<string, number>,
  wire: VisualWire,
): readonly [number, number] {
  const source = order.get(wire.source.node);
  const target = order.get(wire.target.node);
  if (source === undefined || target === undefined)
    return reject('invalid-input', wire.id, 'Wire endpoint is not a numbered engine node');
  return [source, target];
}

/** One app section becomes one root engine section; the returned map is the only identity authority. */
export function translateNested(section: VisualSection): {
  readonly request: NestedEngineRequest;
  readonly map: EngineSceneMap;
} {
  const numbering: Numbering = { node: 1, section: 1, nodes: [], containers: [] };
  const root = scopeSpec(section, null, numbering);
  numbering.containers[0] = null;
  const order: ReadonlyMap<string, number> = new Map(
    numbering.nodes.map((id, index) => [id, index + 1]),
  );
  const spec: NestedSceneSpec = {
    sections: [root],
    requests: section.wires.map((wire) => requestOf(order, wire)),
  };
  return {
    request: { spec },
    map: {
      nodes: numbering.nodes,
      containers: numbering.containers,
      wires: section.wires.map((wire) => wire.id),
    },
  };
}
