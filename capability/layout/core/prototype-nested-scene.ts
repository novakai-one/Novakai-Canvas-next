import { wireRegistry } from './nested-wire-registry.js';
import { roadRegistry, constructedContacts, frameEnds } from './prototype-road-registry.js';
import { routeNestedWires } from './nested-wire-routing.js';
import type {
  PrototypeLayoutOptions,
  RoadPrototypeScene,
} from '../contract/records/road-prototype.js';
import {
  sizeNestedSections,
  positionNestedSections,
  nestedSpacing,
} from './prototype-nested-placement.js';
import {
  nestedMainRoads,
  nestedDriveways,
  nestedSectionPorts,
  nestedCrossings,
} from './prototype-nested-roads.js';
import { readPrototypeNodePorts } from './prototype-road-nodes.js';
import { roadNetwork } from './prototype-road-network.js';

/** Four-section creation milestone: semantic counts → capacity → placement → owner ports → roads. */
export function createNestedRoadScene(
  options: Pick<PrototypeLayoutOptions, 'measure'> & { readonly copies?: 1 | 2 } = {},
): RoadPrototypeScene {
  const measure = options.measure ?? ((_stage, run) => run());
  const capacity = measure('capacity', sizeNestedSections);
  const placement = measure('nodes', () => positionNestedSections(capacity, options.copies));
  const sections = placement.map((p) => p.section);
  const nodes = placement.flatMap((p) => p.nodes);
  const ports = measure('ports', () => [
    ...nodes.flatMap(readPrototypeNodePorts),
    ...placement.flatMap(nestedSectionPorts),
  ]);
  const main = measure('main-roads', () => nestedMainRoads(placement));
  const drives = measure('driveways', () => placement.flatMap(nestedDriveways));
  const roads = [...main, ...drives];
  const compiled = measure('network', () => {
    const registry = roadRegistry(roads);
    const contacts = constructedContacts(
      registry,
      [...frameEnds(main), ...nestedCrossings(placement)],
      drives,
      nestedSpacing.road / 2,
    );
    return { contacts, network: roadNetwork(roads, contacts) };
  });
  const scene = {
    sections,
    nodes,
    ports,
    roads,
    roadWidth: nestedSpacing.road,
    drivewayWidth: nestedSpacing.driveway,
    ...compiled.network,
  };
  return {
    ...scene,
    wiring: routeNestedWires(scene, wireRegistry(scene, compiled.contacts, measure), measure),
  };
}
