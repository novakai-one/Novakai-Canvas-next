import type {
  PrototypeLayoutOptions,
  RoadPrototypeScene,
} from '../contract/records/road-prototype.js';
import {
  sizeNestedSections,
  positionNestedSections,
  nestedSpacing,
} from './prototype-nested-placement.js';
import { nestedMainRoads, nestedDriveways, nestedSectionPorts } from './prototype-nested-roads.js';
import { readPrototypeNodePorts } from './prototype-road-nodes.js';
import { roadNetwork } from './prototype-road-network.js';

/** Four-section creation milestone: semantic counts → capacity → placement → owner ports → roads. */
export function createNestedRoadScene(
  options: Pick<PrototypeLayoutOptions, 'measure'> = {},
): RoadPrototypeScene {
  const measure = options.measure ?? ((_stage, run) => run());
  const capacity = measure('capacity', sizeNestedSections);
  const placement = measure('nodes', () => positionNestedSections(capacity));
  const sections = placement.map((p) => p.section);
  const nodes = placement.flatMap((p) => p.nodes);
  const ports = measure('ports', () => [
    ...nodes.flatMap(readPrototypeNodePorts),
    ...placement.flatMap(nestedSectionPorts),
  ]);
  const main = measure('main-roads', () => nestedMainRoads(placement));
  const drives = measure('driveways', () => placement.flatMap(nestedDriveways));
  const roads = [...main, ...drives];
  const network = measure('network', () => roadNetwork(roads));
  return {
    sections,
    nodes,
    ports,
    roads,
    roadWidth: nestedSpacing.road,
    drivewayWidth: nestedSpacing.driveway,
    ...network,
  };
}
