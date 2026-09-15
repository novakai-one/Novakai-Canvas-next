import type {
  PrototypeBounds,
  PrototypeBlock,
  PrototypeRoad,
  RoadPrototypeScene,
} from '../contract/records/road-prototype.js';
import { roadNetwork } from './prototype-road-network.js';

const roadWidth = 48;
const drivewayWidth = 24;
const blockWidth = 400;
const blockHeight = 384;
const blockGap = 80;
const margin = 48;
const inset = 24;
const streetTop = 80;
const streetBottom = 312;
const nodeWidth = 192;
const nodeHeight = 96;
const nodeTop = 180;

/** Fixed two-column semantic fixture; coordinates are calculated here, never authored in the host. */
function section(label: string, index: number): PrototypeBlock {
  return {
    id: `section-${index + 1}`,
    label,
    bounds: {
      x: margin + index * (blockWidth + blockGap),
      y: margin,
      width: blockWidth,
      height: blockHeight,
    },
  };
}

/** Every local rectangle is translated through the same section origin. */
function placed(
  section: PrototypeBlock,
  x: number,
  y: number,
  width: number,
  height: number,
): PrototypeBounds {
  return { x: section.bounds.x + x, y: section.bounds.y + y, width, height };
}

/** Pure geometry is repeatable; the browser can reload safely and owns remount recovery. */
function streets(section: PrototypeBlock): readonly PrototypeRoad[] {
  const span = blockWidth - inset * 2;
  return [
    ...[streetTop, streetBottom].map((y, index): PrototypeRoad => ({
      id: `${section.id}-street-horizontal-${index}`,
      sectionId: section.id,
      kind: 'street',
      axis: 'horizontal',
      directions: ['left', 'right'],
      bounds: placed(section, inset, y, span, roadWidth),
    })),
    ...[inset, blockWidth - inset - roadWidth].map((x, index): PrototypeRoad => ({
      id: `${section.id}-street-vertical-${index}`,
      sectionId: section.id,
      kind: 'street',
      axis: 'vertical',
      directions: ['down', 'up'],
      bounds: placed(section, x, streetTop, roadWidth, streetBottom + roadWidth - streetTop),
    })),
  ];
}

/** Driveways touch the node's top/bottom and their street, with no unallocated gap. */
function driveways(section: PrototypeBlock): readonly PrototypeRoad[] {
  const topEnd = streetTop + roadWidth;
  const bottomStart = nodeTop + nodeHeight;
  return [
    { name: 'entry-top', y: topEnd, height: nodeTop - topEnd },
    { name: 'exit-bottom', y: bottomStart, height: streetBottom - bottomStart },
  ].map((item): PrototypeRoad => ({
    id: `${section.id}-${item.name}`,
    sectionId: section.id,
    kind: 'driveway',
    axis: 'vertical',
    directions: ['down'],
    bounds: placed(section, (blockWidth - drivewayWidth) / 2, item.y, drivewayWidth, item.height),
  }));
}

/** One node is centred in the road block; its size is independent of road paint. */
function node(section: PrototypeBlock, index: number): RoadPrototypeScene['nodes'][number] {
  return {
    id: `node-${index + 1}`,
    sectionId: section.id,
    label: `Node ${index + 1}`,
    bounds: placed(section, (blockWidth - nodeWidth) / 2, nodeTop, nodeWidth, nodeHeight),
  };
}

/** Milestone one only: two sections, one node each, independent positioned roads, no wires.
 * No clock, randomness, DOM measurement, solver or stored geometry. Reload regenerates the same scene.
 */
export function createRoadPrototypeScene(): RoadPrototypeScene {
  const sections = ['Section A', 'Section B'].map(section);
  const connector: PrototypeRoad = {
    id: 'road-between-sections',
    sectionId: null,
    kind: 'street',
    axis: 'horizontal',
    directions: ['left', 'right'],
    bounds: {
      x: margin + blockWidth - inset,
      y: margin + streetTop,
      width: blockGap + inset * 2,
      height: roadWidth,
    },
  };
  const roads = [connector, ...sections.flatMap((item) => [...streets(item), ...driveways(item)])];
  return {
    sections,
    nodes: sections.map(node),
    roads,
    roadWidth,
    drivewayWidth,
    ...roadNetwork(roads),
  };
}
