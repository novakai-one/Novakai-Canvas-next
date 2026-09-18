import { retainedSupportRecords, driveOrigin } from './nested-support-input.js';
import { prepareNestedEmbedding } from './nested-embedding.js';
import {
  readNestedAdjustmentEvidence,
  readNestedProjectionSupports,
} from './nested-lane-projection.js';
import { roadContactAreas } from './prototype-road-network.js';
import { SupportRejection } from './nested-support-graph.js';
import type { NestedSceneSpec } from '../contract/records/nested-scene-spec.js';
import { defaultNestedSceneSpec } from './nested-scene-spec.js';
import { wireRegistry } from './nested-wire-registry.js';
import { roadRegistry, constructedContacts, frameEnds } from './prototype-road-registry.js';
import { routeNestedWires, resolveNestedRequests } from './nested-wire-routing.js';
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
  const initial = measure('nodes', () =>
    positionNestedSections(capacity, options.copies, options.sectionInPortsLeft),
  );
  const requests = resolveNestedRequests(
    initial.flatMap((p) => p.nodes),
    spec.requests,
  );
  const placement = activePorts(initial, requests);
  const sections = placement.map((p) => p.section),
    nodes = placement.flatMap((p) => p.nodes);
  const ports = measure('ports', () => [
    ...nodes.flatMap(readPrototypeNodePorts),
    ...placement.flatMap(nestedSectionPorts),
  ]);
  const topology = measure('topology', () => {
    const origins = new Map<string, readonly string[]>();
    const main = nestedMainRoads(placement, (road, keys) => origins.set(road.id, keys)),
      drives = placement.flatMap(nestedDriveways);
    drives.forEach((road) => origins.set(road.id, [driveOrigin(road)]));
    const roads = [...main, ...drives];
    const contacts = constructedContacts(
      roadRegistry(roads),
      [...frameEnds(main), ...nestedCrossings(placement)],
      drives,
      nestedSpacing.road / 2,
    );
    return { roads, contacts, origins };
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
  const plan = routeNestedWires(reserved, registry, measure, requests);
  if (!plan.ok) return { ...reserved, wiring: plan };
  const allocation = measure('lane-allocation', () =>
    allocateNestedLanes(plan.value, registry.roads),
  );
  const final = capacityRoads(topology.roads, allocation.demand, topology.contacts, measure, ports);
  try {
    const supports = readNestedProjectionSupports(plan.value, allocation.byWire, final.byId);
    const supportScene: RoadPrototypeScene = {
      ...reserved,
      roads: final.roads,
      wireLanes: allocation.lanes,
      wiring: {
        ok: true,
        value: readNestedAdjustmentEvidence(supports, final.byId, () =>
          roadContactAreas(final.roads, final.contacts),
        ),
      },
    };
    const input = retainedSupportRecords(
      supportScene,
      placement,
      topology.roads,
      topology.contacts,
      topology.origins,
      plan.value,
      allocation,
      final.byId,
      supports,
    );
    return finish(input, supportScene, measure);
  } catch (error) {
    return failedEmbedding({ ...reserved, roads: final.roads, wireLanes: allocation.lanes }, error);
  }
}
function finish(
  input: Parameters<typeof prepareNestedEmbedding>[0],
  reserved: RoadPrototypeScene,
  measure: NonNullable<PrototypeLayoutOptions['measure']>,
): RoadPrototypeScene {
  try {
    return embeddedScene(input, reserved, measure);
  } catch (error) {
    return failedEmbedding(reserved, error);
  }
}
function embeddedScene(
  input: Parameters<typeof prepareNestedEmbedding>[0],
  reserved: RoadPrototypeScene,
  measure: NonNullable<PrototypeLayoutOptions['measure']>,
): RoadPrototypeScene {
  const prepared = prepareNestedEmbedding(input, reserved);
  const network = measure('network', () => roadNetwork(prepared.roads, prepared.contacts));
  const wires = measure('lane-projection', () =>
    projectNestedWires(
      prepared.wires,
      prepared.byWire,
      prepared.byId,
      network.junctions,
      prepared.scene.ports,
    ),
  );
  return {
    ...prepared.scene,
    roads: prepared.roads,
    ...network,
    wireLanes: prepared.lanes,
    wiring: { ok: true, value: wires },
  };
}

function rejectedScene(scene: RoadPrototypeScene, error: SupportRejection): RoadPrototypeScene {
  const unwired = { ...scene };
  delete unwired.wiring;
  return { ...unwired, embeddingFailure: error.evidence };
}

function failedEmbedding(scene: RoadPrototypeScene, error: unknown): RoadPrototypeScene {
  if (error instanceof SupportRejection) return rejectedScene(scene, error);
  throw error;
}

/** Only authored attachments own driveways; unused app handles do not create duplicate roads. */
function activePorts(
  placements: ReturnType<typeof positionNestedSections>,
  requests: NestedSceneSpec['requests'],
): ReturnType<typeof positionNestedSections> {
  const selected = new Set(requests.flatMap((request) => request.slice(2)));
  const automatic = new Set(
    requests.flatMap(([from, to, source, target]) => [
      ...(source === undefined ? [`node-${from}:exit`] : []),
      ...(target === undefined ? [`node-${to}:entry`] : []),
    ]),
  );
  return placements.map((placement) => ({
    ...placement,
    nodes: placement.nodes.map((node) => ({
      ...node,
      ports: node.ports.filter(
        (port) => selected.has(port.id) || automatic.has(`${node.id}:${port.role}`),
      ),
    })),
  }));
}
