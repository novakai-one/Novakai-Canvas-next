import { validateSequence } from './sequence-checks.js';
import type { Scene, PlacedSection, PlacedNode, RoutedWire } from '../../contract/records/scene.js';
import { box, point } from '../../contract/records/camera.js';
import { parse, reject } from '../validation/outcomes.js';
/** A namespace cannot contain duplicate IDs; parent and endpoint references would otherwise be ambiguous. */
function unique(ids: readonly string[], path: string): void {
  if (new Set(ids).size !== ids.length) reject('invalid-scene', path, 'Duplicate scene identity');
}
/** Bounded parent traversal proves acyclicity without recursive stack growth. */
function validateAncestors(node: PlacedNode, nodes: readonly PlacedNode[]): void {
  let parent = node.parent;
  const visited = new Set([node.id]);
  while (parent !== null) {
    parent = nextParent(parent, nodes, visited);
  }
}
/** Resolve one parent step; local visited set is confined to this admission operation. */
function nextParent(id: string, nodes: readonly PlacedNode[], visited: Set<string>): string | null {
  if (visited.has(id)) reject('invalid-scene', id, 'Cyclic parent chain');
  const parent = nodes.find((candidate) => candidate.id === id);
  if (!parent) reject('invalid-scene', id, 'Unknown parent node');
  visited.add(id);
  return parent.parent;
}
/** Layout owns feasibility; Canvas still rejects nonfinite rendering geometry and cross-section nodes. */
function validateNode(node: PlacedNode, section: PlacedSection): void {
  parse(box, node.box);
  if (node.sectionId !== section.id)
    reject('invalid-scene', node.id, 'Node belongs to another section');
  validateAncestors(node, section.nodes);
}
/** Member addresses must identify an actual measured anchor on the attached node. */
function validateMember(member: string | null, node: PlacedNode): void {
  if (member === null) return;
  if (!node.measured.content.anchors.some((anchor) => anchor.member === member))
    reject('invalid-scene', member, 'Unknown endpoint member');
}
/** Section-scoped endpoint resolution cannot accidentally join a node in another diagram. */
function validateEndpoint(endpoint: RoutedWire['source'], section: PlacedSection): void {
  const node = section.nodes.find((candidate) => candidate.id === endpoint.node);
  if (!node) reject('invalid-scene', endpoint.node, 'Unknown wire endpoint');
  parse(point, endpoint.point);
  validateMember(endpoint.member, node);
}
/** Route point counts are bounded independently of the rendering adapter. */
function validateWire(wire: RoutedWire, section: PlacedSection): void {
  if (wire.points.length < 2 || wire.points.length > 10000)
    reject('invalid-scene', wire.id, 'Route needs2..10000points');
  wire.points.forEach((value) => parse(point, value));
  parse(box, wire.labelBox);
  validateEndpoint(wire.source, section);
  validateEndpoint(wire.target, section);
}
/** Admission checks namespace/geometry only; supplied measured notation is validated by its owning port. */
function validateSection(section: PlacedSection): void {
  parse(point, section.origin);
  parse(box, section.box);
  parse(box, section.title.box);
  unique(
    section.nodes.map((node) => node.id),
    section.id,
  );
  unique(
    section.wires.map((wire) => wire.id),
    section.id,
  );
  unique(
    [...section.sequence.events, ...section.sequence.fragments].map((item) => item.id),
    section.id,
  );
  section.nodes.forEach((node) => validateNode(node, section));
  section.wires.forEach((wire) => validateWire(wire, section));
  validateSequence(section);
}
/** Reject malformed/oversized scene before creating indexes; public open/receive retains prior state on failure. */
export function validateScene(scene: Scene): void {
  if (scene.sections.length > 10)
    reject('invalid-scene', 'sections', 'At most10sections are supported');
  const nodes = scene.sections.reduce((total, section) => total + section.nodes.length, 0);
  const wires = scene.sections.reduce((total, section) => total + section.wires.length, 0);
  validateLimits(nodes, wires);
  parse(box, scene.bounds);
  unique(
    scene.sections.map((section) => section.id),
    'sections',
  );
  scene.sections.forEach(validateSection);
}
/** Global limits apply across all sections; splitting a graph never bypasses the admission bound. */
function validateLimits(nodes: number, wires: number): void {
  if (nodes > 1000) reject('invalid-scene', 'nodes', 'At most1000placed nodes are supported');
  if (wires > 1500) reject('invalid-scene', 'wires', 'At most1500wires are supported');
}
