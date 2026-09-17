import type { NestedSceneSpec } from '../contract/records/nested-scene-spec.js';
import { defaultNestedSceneSpec } from './nested-scene-spec.js';
import { wireRegistry } from './nested-wire-registry.js';
import { roadRegistry, constructedContacts, frameEnds } from './prototype-road-registry.js';
import { routeNestedWires } from './nested-wire-routing.js';
import { allocateNestedLanes } from './nested-wire-lanes.js';
import { capacityRoads } from './nested-road-capacity.js';
import { projectNestedWires } from './nested-lane-projection.js';
import type {
  PrototypeLayoutOptions,
  RoadPrototypeScene,
} from '../contract/records/road-prototype.js';
import {
  sizeNestedSections,
  positionNestedSections,
  nestedSpacing,
  nestedLaneWidth,
} from './prototype-nested-placement.js';
import {
  nestedMainRoads,
  nestedDriveways,
  nestedSectionPorts,
  nestedCrossings,
} from './prototype-nested-roads.js';
import { readPrototypeNodePorts } from './prototype-road-nodes.js';
import { roadNetwork } from './prototype-road-network.js';

/** Reservation topology → law demand → final geometry → network → lane projection, each once.
 * The caller owns reconstruction; no committed scene or shared state is mutated on failure.
 */
export function createNestedRoadScene(
  options: Pick<PrototypeLayoutOptions, 'measure' | 'sectionInPortsLeft'> & {
    readonly copies?: 1 | 2;
    readonly spec?: NestedSceneSpec;
  } = {},
): RoadPrototypeScene {
  const measure = options.measure ?? ((_stage, run) => run());
  const spec = options.spec ?? defaultNestedSceneSpec;
  const capacity = measure('capacity', () => sizeNestedSections(spec.sections));
  const placement = measure('nodes', () =>
    positionNestedSections(capacity, options.copies, options.sectionInPortsLeft),
  );
  const sections = placement.map((p) => p.section),
    nodes = placement.flatMap((p) => p.nodes);
  const ports = measure('ports', () => [
    ...nodes.flatMap(readPrototypeNodePorts),
    ...placement.flatMap(nestedSectionPorts),
  ]);
  const topology = measure('topology', () => {
    const main = nestedMainRoads(placement),
      drives = placement.flatMap(nestedDriveways);
    const roads = [...main, ...drives];
    const contacts = constructedContacts(
      roadRegistry(roads),
      [...frameEnds(main), ...nestedCrossings(placement)],
      drives,
      nestedSpacing.road / 2,
    );
    return { roads, contacts };
  });
  const reserved: RoadPrototypeScene = {
    sections,
    nodes,
    ports,
    roads: topology.roads,
    roadWidth: nestedLaneWidth(0),
    drivewayWidth: nestedLaneWidth(0),
    lanes: [],
    junctions: [],
    dividers: [],
    connections: [],
    crossingExamples: [],
  };
  const registry = wireRegistry(reserved, topology.contacts, measure);
  const plan = routeNestedWires(reserved, registry, measure, spec.requests);
  if (!plan.ok) return { ...reserved, wiring: plan };
  const allocation = measure('lane-allocation', () =>
    allocateNestedLanes(plan.value, registry.roads),
  );
  const final = capacityRoads(topology.roads, allocation.demand, topology.contacts, measure, ports);
  const network = measure('network', () => roadNetwork(final.roads, final.contacts));
  const wires = measure('lane-projection', () =>
    projectNestedWires(plan.value, allocation.byWire, final.byId),
  );
  return {
    ...reserved,
    roads: final.roads,
    ...network,
    wireLanes: allocation.lanes,
    wiring: { ok: true, value: wires },
  };
}
