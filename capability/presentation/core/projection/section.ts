import type { Section, Endpoint, Relationship } from '../../contract/records/input.js';
import type {
  VisualSection,
  VisualNode,
  VisualEndpoint,
  VisualWire,
} from '../../contract/records/visual.js';
import type { ContentContext } from '../content/blocks.js';
import { identity, labelContent, projectNode, projectGroup } from './node.js';
import { wireNotation, wireLabel, sequenceMarker, sequenceLabel } from '../notation/wires.js';
import { reject } from '../validation/outcomes.js';
/** Canonical endpoints resolve through the visible representation, including represented groups. */
function endpoint(value: Endpoint, nodes: readonly VisualNode[]): VisualEndpoint {
  const node = nodes.find((item) => item.objectId === value.object);
  if (!node)
    return reject('invalid-input', value.object, 'Wire endpoint has no visible representation');
  return { node: node.id, member: value.member ?? null };
}
/** Missing relationship is a broken domain-reader contract and rejects the whole projection. */
function relationship(id: string, context: ContentContext): Relationship {
  const found = context.collection.relationships.find((item) => item.id === id);
  if (!found) return reject('invalid-input', id, 'Relationship is missing');
  return found;
}
/** Wires retain local manual-route controls as data; no router runs during measurement. */
function wire(
  route: Section['wires'][number],
  section: Section,
  nodes: readonly VisualNode[],
  context: ContentContext,
): VisualWire {
  const source = relationship(route.relationship, context);
  const notation = wireNotation(source);
  return {
    id: identity(section.id, 'object', `wire:${source.id}`),
    relationshipId: source.id,
    sectionId: section.id,
    kind: source.kind,
    source: endpoint(source.source, nodes),
    target: endpoint(source.target, nodes),
    label: labelContent(wireLabel(source), context, 'annotation'),
    sourceMarker: notation.source,
    targetMarker: notation.target,
    style: notation.style,
    route,
  };
}
/** Measure one section while preserving downstream layout and sequence intent intact. */
export function projectSection(section: Section, context: ContentContext): VisualSection {
  const nodes = [
    ...section.groups.map((group) => projectGroup(group, section, context)),
    ...section.appearances.map((view) => projectNode(view, section, context)),
  ];
  return {
    id: section.id,
    title: labelContent(section.title, context, 'sectionHeading'),
    mode: section.mode,
    order: section.order,
    layout: section.layout,
    placement: section.placement ?? null,
    nodes,
    wires: section.wires.map((item) => wire(item, section, nodes, context)),
    sequence: section.sequence.map((item) => ({
      item,
      label: labelContent(sequenceLabel(item), context, 'annotation'),
      marker: sequenceMarker(item),
    })),
    groups: section.groups,
    root: section.root ?? null,
  };
}
