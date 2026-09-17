import type { WireRegistry } from './nested-wire-registry.js';
import type {
  PrototypeBlock,
  PrototypeLayoutMeasure,
  PrototypePoint,
  PrototypePortLocation,
  RoadPrototypeScene,
} from '../contract/records/road-prototype.js';
import type { NestedWire, NestedWireResult } from '../contract/records/nested-wires.js';
import type { Terminal } from './nested-wire-access.js';
import { access, gateTerminal, nodeTerminal } from './nested-wire-access.js';
import type { Leg } from './nested-wire-law.js';
import { lawLeg } from './nested-wire-law.js';

const requests = [
  [1, 2],
  [1, 3],
  [2, 4],
  [5, 6],
  [6, 9],
  [8, 10],
  [11, 13],
  [17, 20],
  [4, 5],
  [10, 18],
  [16, 17],
  [12, 7],
  [5, 7],
  [11, 12],
  [1, 4],
  [9, 17],
  [16, 18],
  [12, 8],
] as const;
interface State {
  readonly offset: number;
  readonly terminal: Terminal;
  readonly legs: readonly Leg[];
  readonly gates: readonly string[];
}
interface Boundary {
  readonly section: PrototypeBlock;
  readonly exiting: boolean;
}
function ancestry(scene: RoadPrototypeScene, id: string | null): readonly PrototypeBlock[] {
  const section = scene.sections.find((s) => s.id === id);
  if (section === undefined) return [];
  return [section, ...ancestry(scene, section.parentSectionId ?? null)];
}
function boundaries(scene: RoadPrototypeScene, from: string, to: string): readonly Boundary[] {
  const source = ancestry(scene, scene.nodes.find((n) => n.id === from)?.sectionId ?? null);
  const target = ancestry(scene, scene.nodes.find((n) => n.id === to)?.sectionId ?? null);
  const common = new Set(source.filter((s) => target.some((t) => s.id === t.id)).map((s) => s.id));
  return [
    ...source.filter((s) => !common.has(s.id)).map((section) => ({ section, exiting: true })),
    ...target
      .filter((s) => !common.has(s.id))
      .toReversed()
      .map((section) => ({ section, exiting: false })),
  ];
}
function alignment(
  port: PrototypePortLocation,
  source: PrototypePoint,
  target: PrototypePoint,
): number {
  const dx = target.x - source.x,
    dy = target.y - source.y;
  const scores = { right: dx, bottom: dy, left: dx, top: dy };
  return scores[port.side];
}
function cross(
  scene: RoadPrototypeScene,
  registry: WireRegistry,
  state: State,
  boundary: Boundary,
  target: Terminal,
): State | null {
  const { section, exiting } = boundary;
  const owner = exiting ? section.id : (section.parentSectionId ?? null);
  const ports = scene.ports.filter(
    (p) => p.nodeId === section.id && p.role === (exiting ? 'exit' : 'entry'),
  );
  const ordered = ports.toSorted(
    (a, b) =>
      alignment(b, state.terminal.point, target.point) -
      alignment(a, state.terminal.point, target.point),
  );
  return firstGate(ordered, registry, state, boundary, owner);
}
function firstGate(
  ports: readonly PrototypePortLocation[],
  registry: WireRegistry,
  state: State,
  boundary: Boundary,
  owner: string | null,
): State | null {
  let selected: State | null = null;
  ports.some((port) => {
    selected = gateLeg(registry, state, boundary, port, owner);
    return selected !== null;
  });
  return selected;
}
function gateLeg(
  registry: WireRegistry,
  state: State,
  boundary: Boundary,
  port: PrototypePortLocation,
  owner: string | null,
): State | null {
  const approach = access(registry, port.portId, owner);
  const nextOwner = departureOwner(boundary);
  const departure = access(registry, port.portId, nextOwner);
  if (approach === undefined || departure === undefined) return null;
  const leg = lawLeg(state.terminal, gateTerminal(approach), registry, state.offset);
  if (leg === null) return null;
  return {
    offset: state.offset,
    terminal: gateTerminal(departure),
    legs: [...state.legs, leg],
    gates: [...state.gates, port.portId],
  };
}
function advance(
  scene: RoadPrototypeScene,
  registry: WireRegistry,
  state: State | null,
  boundary: Boundary,
  target: Terminal,
): State | null {
  if (state === null) return null;
  return cross(scene, registry, state, boundary, target);
}
function route(
  scene: RoadPrototypeScene,
  registry: WireRegistry,
  id: string,
  from: string,
  to: string,
  offset: number,
): NestedWire | null {
  const source = nodeTerminal(registry, from, 'exit'),
    target = nodeTerminal(registry, to, 'entry');
  if (source === undefined || target === undefined) return null;
  const state = boundaries(scene, from, to).reduce<State | null>(
    (s, b) => advance(scene, registry, s, b, target),
    { terminal: source, legs: [], gates: [], offset },
  );
  if (state === null) return null;
  return finish(registry, id, from, to, state, target);
}
function finish(
  registry: WireRegistry,
  id: string,
  from: string,
  to: string,
  state: State,
  target: Terminal,
): NestedWire | null {
  const leg = lawLeg(state.terminal, target, registry, state.offset);
  if (leg === null) return null;
  const legs = [...state.legs, leg];
  const segments = legs.flatMap((l) => l.segments);
  return {
    id,
    from,
    to,
    sourcePortId: legs[0]?.source.portId ?? leg.source.portId,
    targetPortId: leg.target.portId,
    gates: state.gates,
    segments,
  };
}
/** Atomic deterministic wire set. Failure keeps the frozen scene usable; callers own display/retry. */
export function routeNestedWires(
  scene: RoadPrototypeScene,
  registry: WireRegistry,
  measure: PrototypeLayoutMeasure,
): NestedWireResult {
  const wires = requests.map(([from, to], i) =>
    measure(`wire:w${String(i + 1).padStart(2, '0')}`, () =>
      route(
        scene,
        registry,
        `w${String(i + 1).padStart(2, '0')}`,
        `node-${from}`,
        `node-${to}`,
        (i - (requests.length - 1) / 2) * 3,
      ),
    ),
  );
  const failed = wires.findIndex((w) => w === null);
  if (failed >= 0)
    return {
      ok: false,
      error: {
        code: 'unroutable-leg',
        wireId: `w${String(failed + 1).padStart(2, '0')}`,
        ownerId: 'frozen-scene',
      },
    };
  return { ok: true, value: wires.flatMap((w) => (w === null ? [] : [w])) };
}

function departureOwner(boundary: Boundary): string | null {
  if (boundary.exiting) return boundary.section.parentSectionId ?? null;
  return boundary.section.id;
}
