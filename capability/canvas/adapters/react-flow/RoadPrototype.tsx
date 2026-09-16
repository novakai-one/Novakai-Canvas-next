import { useState, useEffect } from 'react';
import type { ReactElement, CSSProperties } from 'react';
import { ReactFlow, Background, Controls, ViewportPortal } from '@xyflow/react';
import type { Node, NodeProps, NodeTypes } from '@xyflow/react';
import type {
  RoadPrototypeScene,
  PrototypeRoad,
  PrototypeBlock,
  PrototypeBounds,
  PrototypeLane,
  PrototypeDivider,
  PrototypeTravel,
  PrototypeTravelResult,
  PrototypeJunction,
  PrototypeLaneConnection,
  PrototypePoint,
  PrototypeRoadCoverage,
  PrototypeNodePort,
  PrototypePortLocation,
} from '@novakai/canvas-layout';
import '@xyflow/react/dist/style.css';
import styles from './RoadPrototype.module.css';

type InspectTravel = (travel: PrototypeTravel) => PrototypeTravelResult;
type RoadNode = Node<
  {
    road: PrototypeRoad;
    lanes: readonly PrototypeLane[];
    dividers: readonly PrototypeDivider[];
    selected: string;
    select: (id: string) => void;
  },
  'road'
>;
type BlockNode = Node<
  {
    block: PrototypeBlock;
    kind: 'section' | 'node';
    ports: readonly PrototypeNodePort[];
    selected: string;
    select: (id: string) => void;
  },
  'block'
>;
type JunctionNode = Node<
  { junction: PrototypeJunction; selected: string; select: (id: string) => void },
  'junction'
>;
const arrows = { left: '←', right: '→', up: '↑', down: '↓' };
const accessLabels = { entry: 'IN', exit: 'OUT' };

/** Paint uses the same world rectangles checked by the travel validator. */
function relative(bounds: PrototypeBounds, origin: PrototypeBounds): CSSProperties {
  return {
    left: bounds.x - origin.x,
    top: bounds.y - origin.y,
    width: bounds.width,
    height: bounds.height,
  };
}

/** A road is a real positioned div; visibility only changes paint, never its geometry. */
function Road({ data }: NodeProps<RoadNode>): ReactElement {
  const road = data.road;
  return (
    <div
      className={styles.road}
      data-road-id={road.id}
      data-axis={road.axis}
      data-kind={road.kind}
      data-access={road.access?.role}
      title={`${road.id} · ${road.bounds.width} × ${road.bounds.height}`}
    >
      {data.lanes.map((lane) => (
        <button
          type="button"
          key={lane.id}
          className={`${styles.lane} nodrag nopan`}
          style={relative(lane.bounds, road.bounds)}
          data-lane-id={lane.id}
          data-region-id={lane.id}
          data-direction={lane.direction}
          aria-label={`Inspect ${lane.direction} lane on ${road.id}`}
          aria-pressed={data.selected === lane.id}
          onClick={() => data.select(lane.id)}
        >
          <span>
            {road.access && accessLabels[road.access.role]} {arrows[lane.direction]}
          </span>
        </button>
      ))}
      {data.dividers.map((divider) => (
        <span
          key={divider.id}
          className={styles.divider}
          data-divider-id={divider.id}
          style={relative(divider.bounds, road.bounds)}
          data-axis={road.axis}
        />
      ))}
    </div>
  );
}

/** Section and node rectangles share geometry plumbing; only nodes expose entry/exit markers. */
function Block({ data }: NodeProps<BlockNode>): ReactElement {
  if (data.kind === 'section')
    return (
      <div className={styles.section}>
        <strong>{data.block.label}</strong>
        <span>1 node</span>
      </div>
    );
  return (
    <div className={styles.node} data-node-id={data.block.id}>
      <strong>{data.block.label}</strong>
      <span>Owns 4 ports</span>
      {data.ports.map((port) => (
        <button
          key={port.id}
          type="button"
          className={`${styles.port} nodrag nopan`}
          style={{ left: port.offset.x, top: port.offset.y }}
          data-port-id={port.id}
          data-side={port.side}
          aria-label={`Inspect ${data.block.label} ${port.side} ${port.role} port`}
          aria-pressed={data.selected === port.id}
          onClick={() => data.select(port.id)}
        >
          <span>{accessLabels[port.role]}</span>
        </button>
      ))}
    </div>
  );
}

/** The entire turn rectangle is an inspectable hit target, including its unmarked corners. */
function Junction({ data }: NodeProps<JunctionNode>): ReactElement {
  const j = data.junction;
  return (
    <button
      type="button"
      className={`${styles.junction} nodrag nopan`}
      data-junction-id={j.id}
      data-region-id={j.id}
      data-kind={j.kind}
      aria-label={`Inspect ${j.label} ${j.kind}`}
      aria-pressed={data.selected === j.id}
      onClick={() => data.select(j.id)}
    >
      <span>{j.label}</span>
    </button>
  );
}
const nodeTypes: NodeTypes = { road: Road, block: Block, junction: Junction };

function junctionNode(
  junction: PrototypeJunction,
  selected: string,
  select: (id: string) => void,
): JunctionNode {
  return {
    id: junction.id,
    type: 'junction',
    position: junction.bounds,
    width: junction.bounds.width,
    height: junction.bounds.height,
    data: { junction, selected, select },
    style: { width: junction.bounds.width, height: junction.bounds.height },
    zIndex: 2,
    draggable: false,
    selectable: false,
  };
}

/** The renderer consumes finished geometry; it cannot reposition semantic objects. */
function blockNode(
  block: PrototypeBlock & { readonly ports?: readonly PrototypeNodePort[] },
  kind: 'section' | 'node',
  zIndex: number,
  selected: string,
  select: (id: string) => void,
): BlockNode {
  return {
    id: block.id,
    type: 'block',
    position: block.bounds,
    width: block.bounds.width,
    height: block.bounds.height,
    data: { block, kind, ports: block.ports ?? [], selected, select },
    style: { width: block.bounds.width, height: block.bounds.height },
    zIndex,
    draggable: false,
    selectable: false,
  };
}

/** Road data remains separate from React Flow view records, ready for later routing against bounds. */
function roadNode(
  road: PrototypeRoad,
  scene: RoadPrototypeScene,
  selected: string,
  select: (id: string) => void,
): RoadNode {
  return {
    id: road.id,
    type: 'road',
    position: road.bounds,
    width: road.bounds.width,
    height: road.bounds.height,
    data: {
      road,
      lanes: scene.lanes.filter((lane) => lane.roadId === road.id),
      dividers: scene.dividers.filter((divider) => divider.roadId === road.id),
      selected,
      select,
    },
    style: { width: road.bounds.width, height: road.bounds.height },
    zIndex: 1,
    draggable: false,
    selectable: false,
  };
}

type Probe = 'forward' | 'reverse' | 'outside';
const explanations = {
  'unknown-lane': 'Rejected: this lane does not exist.',
  'outside-lane': 'Rejected: travel leaves the lane.',
  'wrong-direction': 'Rejected: travel opposes the lane direction.',
  'unknown-connection': 'Rejected: no permitted connection.',
  'invalid-junction-path': 'Rejected: travel leaves its permitted junction path.',
};
function movement(lane: PrototypeLane, probe: Probe): PrototypeTravel {
  const normal = { kind: 'lane' as const, laneId: lane.id, from: lane.entry, to: lane.exit };
  if (probe === 'reverse') return { ...normal, from: lane.exit, to: lane.entry };
  if (probe === 'outside') return { ...normal, to: { x: lane.bounds.x - 1, y: lane.bounds.y - 1 } };
  return normal;
}
function verdict(result: PrototypeTravelResult, direction: PrototypeLane['direction']): string {
  if (!result.ok) return explanations[result.error.code];
  return `Allowed: ${direction}, inside the lane.`;
}

/** Interactive proof invokes the injected Layout validator; no result is fabricated in React. */
function LaneProof({
  lane,
  inspect,
  road,
}: {
  readonly lane: PrototypeLane;
  readonly inspect: InspectTravel;
  readonly road: PrototypeRoad | undefined;
}): ReactElement {
  const [probe, setProbe] = useState<Probe>('forward');
  const result = inspect(movement(lane, probe));
  return (
    <aside className={styles.proof} aria-label="Lane travel inspector" data-inspected-id={lane.id}>
      <div>
        <strong>
          {laneName(road)} · {arrows[lane.direction]} {lane.direction}
        </strong>
        <span>{laneDetail(road)}</span>
        <small>{boundsLabel(lane.bounds)}</small>
      </div>
      <div className={styles.probes}>
        <button
          type="button"
          aria-pressed={probe === 'forward'}
          onClick={() => setProbe('forward')}
        >
          With arrow
        </button>
        <button
          type="button"
          aria-pressed={probe === 'reverse'}
          onClick={() => setProbe('reverse')}
        >
          Against arrow
        </button>
        <button
          type="button"
          aria-pressed={probe === 'outside'}
          onClick={() => setProbe('outside')}
        >
          Outside lane
        </button>
      </div>
      <output role="status" data-allowed={result.ok}>
        {verdict(result, lane.direction)}
      </output>
    </aside>
  );
}

function laneName(road: PrototypeRoad | undefined): string {
  if (road?.access == null) return 'Through lane';
  return `${road.access.role.toUpperCase()} · ${road.access.nodeId}`;
}
function laneDetail(road: PrototypeRoad | undefined): string {
  if (road?.access == null) return 'One-way travel within this lane. Click any lane or junction.';
  const roles = {
    entry: `Road → ${road.access.side} input`,
    exit: `${road.access.side} output → road`,
  };
  return `${roles[road.access.role]} · attaches to ${road.access.portId}`;
}
function boundsLabel(bounds: PrototypeBounds): string {
  return `x ${bounds.x} · y ${bounds.y} · ${bounds.width} × ${bounds.height}`;
}

function connectionName(link: PrototypeLaneConnection, scene: RoadPrototypeScene): string {
  const from = scene.lanes.find((l) => l.id === link.fromLaneId),
    to = scene.lanes.find((l) => l.id === link.toLaneId);
  return `${from?.direction} → ${to?.direction}`;
}
function choice(
  scene: RoadPrototypeScene,
  junctionId: string,
  selected: string,
): PrototypeLaneConnection | undefined {
  const example = scene.crossingExamples.find((e) => e.junctionId === junctionId);
  return (
    scene.connections.find((link) => link.id === selected) ??
    scene.connections.find((link) => link.id === example?.primaryConnectionId) ??
    scene.connections.find(
      (link) => link.junctionId === junctionId && isQuarterTurn(link, scene),
    ) ??
    scene.connections.find((link) => link.junctionId === junctionId)
  );
}
function isQuarterTurn(link: PrototypeLaneConnection, scene: RoadPrototypeScene): boolean {
  const horizontal = (id: string): boolean =>
    ['left', 'right'].includes(scene.lanes.find((lane) => lane.id === id)?.direction ?? '');
  return horizontal(link.fromLaneId) !== horizontal(link.toLaneId);
}
function paired(
  scene: RoadPrototypeScene,
  link: PrototypeLaneConnection | undefined,
): PrototypeLaneConnection | undefined {
  const example = scene.crossingExamples.find((item) => item.primaryConnectionId === link?.id);
  return scene.connections.find((item) => item.id === example?.throughConnectionId);
}
function connectionRequest(link: PrototypeLaneConnection, reverse: boolean): PrototypeTravel {
  return {
    kind: 'connection',
    connectionId: link.id,
    points: reverse ? link.points.toReversed() : link.points,
  };
}
function junctionVerdict(result: PrototypeTravelResult): string {
  if (!result.ok) return explanations[result.error.code];
  return 'Allowed: connected lanes, correct directions, path stays inside junction.';
}

/** Every turn is inspected using the same public movement validator as straight lanes. */
function JunctionProof({
  junction,
  scene,
  link,
  select,
  inspect,
}: {
  readonly junction: PrototypeJunction;
  readonly scene: RoadPrototypeScene;
  readonly link: PrototypeLaneConnection;
  readonly select: (id: string) => void;
  readonly inspect: InspectTravel;
}): ReactElement {
  const [reverse, setReverse] = useState(false);
  const result = inspect(connectionRequest(link, reverse));
  const other = paired(scene, link);
  return (
    <aside
      className={`${styles.proof} ${styles.junctionProof}`}
      aria-label="Junction travel inspector"
      data-inspected-id={junction.id}
    >
      <div>
        <strong>
          {junction.label} · {junction.kind.toUpperCase()}
        </strong>
        <span>{boundsLabel(junction.bounds)}</span>
        <small>
          {scene.connections.filter((item) => item.junctionId === junction.id).length} permitted
          movements · {junction.roadIds.length} roads
        </small>
      </div>
      <div className={styles.probes}>
        <label>
          Movement{' '}
          <select
            aria-label="Junction movement"
            value={link.id}
            onChange={(e) => select(e.target.value)}
          >
            {scene.connections
              .filter((item) => item.junctionId === junction.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {connectionName(item, scene)}
                </option>
              ))}
          </select>
        </label>
        <button type="button" aria-pressed={reverse} onClick={() => setReverse(!reverse)}>
          Reverse movement
        </button>
      </div>
      <output role="status" data-allowed={result.ok}>
        {junctionVerdict(result)}
      </output>
      <CrossingExplanation scene={scene} link={link} other={other} inspect={inspect} />
    </aside>
  );
}

function CrossingExplanation({
  scene,
  link,
  other,
  inspect,
}: {
  readonly scene: RoadPrototypeScene;
  readonly link: PrototypeLaneConnection;
  readonly other: PrototypeLaneConnection | undefined;
  readonly inspect: InspectTravel;
}): ReactElement {
  const example = scene.crossingExamples.find((item) => item.primaryConnectionId === link.id);
  if (other === undefined || example === undefined)
    return (
      <p className={styles.legend}>
        <b>Blue</b> shows this permitted turn. Select an IN or OUT junction to inspect a
        perpendicular crossing.
      </p>
    );
  const accepted = inspect(connectionRequest(other, false)).ok;
  return (
    <p className={styles.legend} data-crossing-count={example.crossings.length}>
      <b>Blue: node {example.role}.</b> <em>Amber: perpendicular through traffic.</em>{' '}
      {example.crossings.length} marked crossing inside{' '}
      {scene.junctions.find((j) => j.id === example.junctionId)?.label}. Through movement:{' '}
      {accepted ? 'allowed' : 'rejected'}. Lines cross; they do not join or stack.
    </p>
  );
}

function routePoints(
  link: PrototypeLaneConnection,
  scene: RoadPrototypeScene,
): readonly PrototypePoint[] {
  const from = scene.lanes.find((l) => l.id === link.fromLaneId),
    to = scene.lanes.find((l) => l.id === link.toLaneId);
  if (from === undefined || to === undefined) return link.points;
  return [from.entry, ...link.points, to.exit];
}
function pointsAttribute(points: readonly PrototypePoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}
/** Diagnostic paths come from model connection records; they are not fabricated diagram wires. */
function RoutePreview({
  scene,
  link,
}: {
  readonly scene: RoadPrototypeScene;
  readonly link: PrototypeLaneConnection;
}): ReactElement {
  const other = paired(scene, link),
    example = scene.crossingExamples.find((e) => e.primaryConnectionId === link.id);
  return (
    <ViewportPortal>
      <svg className={styles.routePreview} aria-hidden="true">
        <defs>
          <marker
            id="road-primary-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10z" fill="var(--nv-action-accent)" />
          </marker>
          <marker
            id="road-through-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10z" fill="var(--nv-status-warning)" />
          </marker>
        </defs>
        {other !== undefined && (
          <polyline
            data-preview="through"
            points={pointsAttribute(routePoints(other, scene))}
            className={styles.throughPath}
            markerEnd="url(#road-through-arrow)"
          />
        )}
        <polyline
          data-preview="primary"
          points={pointsAttribute(routePoints(link, scene))}
          className={styles.primaryPath}
          markerEnd="url(#road-primary-arrow)"
        />
        {example?.crossings.map((p, index) => (
          <circle key={index} cx={p.x} cy={p.y} r="5" className={styles.crossingMark} />
        ))}
      </svg>
    </ViewportPortal>
  );
}

function coverageLabel(coverage: PrototypeRoadCoverage): string {
  if (
    [coverage.uncoveredArea, coverage.multiplyOwnedArea, coverage.outsideRoadArea].some(
      (area) => area !== 0,
    )
  )
    return 'Road coverage needs correction';
  return `100% road area accounted for · ${coverage.roadArea.toLocaleString('en-US')} px²`;
}

/** Visual proof only. No wire or dragging behavior is claimed; reload safely rebuilds the fixed scene. */
export function RoadPrototype({
  scene,
  inspectTravel,
  coverage,
  onReady,
}: {
  readonly scene: RoadPrototypeScene;
  readonly inspectTravel: InspectTravel;
  readonly coverage: PrototypeRoadCoverage;
  readonly onReady: () => void;
}): ReactElement {
  const [visible, setVisible] = useState(true);
  const [selected, select] = useState(scene.crossingExamples[0]?.junctionId ?? '');
  const [movementId, selectMovement] = useState('');
  const lane = scene.lanes.find((item) => item.id === selected);
  const junction = scene.junctions.find((item) => item.id === selected);
  const link = choice(scene, selected, movementId);
  function selectRegion(id: string): void {
    select(id);
    selectMovement('');
  }
  const nodes = [
    ...scene.sections.map((item) => blockNode(item, 'section', 0, selected, selectRegion)),
    ...scene.roads.map((road) => roadNode(road, scene, selected, selectRegion)),
    ...scene.junctions.map((item) => junctionNode(item, selected, selectRegion)),
    ...scene.nodes.map((item) => blockNode(item, 'node', 2, selected, selectRegion)),
  ];
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p>ROAD LAYOUT · MILESTONE 1</p>
          <h1>Two sections. Space for roads.</h1>
        </div>
        <label>
          <input
            type="checkbox"
            checked={visible}
            onChange={(event) => setVisible(event.target.checked)}
          />{' '}
          Show roads
        </label>
      </header>
      <div className={styles.canvas} data-roads-visible={visible}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.25}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <ReadySignal onReady={onReady} />
          <Background gap={24} size={1} />
          <Controls showInteractive={false} />
          {junction !== undefined && link !== undefined && (
            <RoutePreview scene={scene} link={link} />
          )}
        </ReactFlow>
      </div>
      <Inspection
        port={scene.ports.find((port) => port.portId === selected)}
        scene={scene}
        lane={lane}
        junction={junction}
        link={link}
        select={selectMovement}
        inspect={inspectTravel}
      />
      <footer className={styles.footer}>
        <span data-coverage="road-area">{coverageLabel(coverage)}</span>
        <span>
          {scene.lanes.length + scene.junctions.length} inspectable areas · 0 diagram wires
        </span>
      </footer>
    </main>
  );
}

function Inspection({
  port,
  scene,
  lane,
  junction,
  link,
  select,
  inspect,
}: {
  readonly scene: RoadPrototypeScene;
  readonly port: PrototypePortLocation | undefined;
  readonly lane: PrototypeLane | undefined;
  readonly junction: PrototypeJunction | undefined;
  readonly link: PrototypeLaneConnection | undefined;
  readonly select: (id: string) => void;
  readonly inspect: InspectTravel;
}): ReactElement | null {
  if (port !== undefined) return <PortProof port={port} />;
  if (lane !== undefined)
    return (
      <LaneProof
        key={lane.id}
        lane={lane}
        road={scene.roads.find((road) => road.id === lane.roadId)}
        inspect={inspect}
      />
    );
  return JunctionInspection({ scene, junction, link, select, inspect });
}
function JunctionInspection({
  scene,
  junction,
  link,
  select,
  inspect,
}: {
  readonly scene: RoadPrototypeScene;
  readonly junction: PrototypeJunction | undefined;
  readonly link: PrototypeLaneConnection | undefined;
  readonly select: (id: string) => void;
  readonly inspect: InspectTravel;
}): ReactElement | null {
  if (junction === undefined || link === undefined) return null;
  return (
    <JunctionProof
      key={junction.id}
      junction={junction}
      scene={scene}
      link={link}
      select={select}
      inspect={inspect}
    />
  );
}

/** Read-only node inspection; no road can change the port's offset. */
function PortProof({ port }: { readonly port: PrototypePortLocation }): ReactElement {
  return (
    <aside
      className={styles.proof}
      aria-label="Node port inspector"
      data-inspected-id={port.portId}
    >
      <div>
        <strong>
          {port.nodeId} · {port.side} {port.role}
        </strong>
        <span>{port.portId}</span>
      </div>
      <span>
        Node-owned port · x {port.point.x} · y {port.point.y}
      </span>
      <span>Driveway attaches here; the node owns this position.</span>
    </aside>
  );
}
/** After React commits, the host waits for fonts and two animation frames. Geometry is already explicit. */
function ReadySignal({ onReady }: { readonly onReady: () => void }): null {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}
