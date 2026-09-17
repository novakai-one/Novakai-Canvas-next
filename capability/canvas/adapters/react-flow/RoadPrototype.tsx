import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ReactElement, CSSProperties } from 'react';
import { ReactFlow, Background, Controls, ViewportPortal, useReactFlow } from '@xyflow/react';
import type { Node, NodeProps, NodeTypes } from '@xyflow/react';
import type {
  RoadPrototypeScene,
  NestedWire,
  PrototypeRoadProof,
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

type ScheduleSpotlight = (paint: () => void) => () => void;
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
    selectionClass?: string;
    selectionActive?: boolean;
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
const noProofs: readonly PrototypeRoadProof[] = [];
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

/** Paint labels over finished rectangles; port hit-box geometry remains available but hidden. */
function Block({ data }: NodeProps<BlockNode>): ReactElement {
  if (data.kind === 'section')
    return (
      <div
        className={styles.section}
        data-section-id={data.block.id}
        data-parent-section={data.block.parentSectionId}
      >
        <strong>{data.block.label}</strong>
      </div>
    );
  return (
    <div className={`${styles.node} ${data.selectionClass ?? ''}`} data-node-id={data.block.id}>
      <strong>{data.block.label}</strong>
      {data.ports.map((port) => (
        <button
          key={port.id}
          type="button"
          className={`${styles.port} ${data.selectionActive ? styles.dim : ''} nodrag nopan`}
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
const nodeTypes: NodeTypes = { road: Road, block: Block, junction: Junction, gate: Gate };

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

/** Mounted only with roads visible; selection rerenders reuse the scene's audit. */
function RoadCoverage({
  scene,
  auditCoverage,
}: {
  readonly scene: RoadPrototypeScene;
  readonly auditCoverage: (scene: RoadPrototypeScene) => PrototypeRoadCoverage;
}): ReactElement {
  const coverage = useMemo(() => auditCoverage(scene), [scene, auditCoverage]);
  return <span data-coverage="road-area">{coverageLabel(coverage)}</span>;
}

/** Inspect frozen roads and committed wire data; reload safely rebuilds the deterministic scene. */
export function RoadPrototype({
  scene,
  inspectTravel,
  auditCoverage,
  scheduleSpotlight,
  onReady,
  proofs = noProofs,
  initialProof = -1,
}: {
  readonly proofs?: readonly PrototypeRoadProof[];
  readonly initialProof?: number;
  readonly scene: RoadPrototypeScene;
  readonly inspectTravel: InspectTravel;
  readonly auditCoverage: (scene: RoadPrototypeScene) => PrototypeRoadCoverage;
  readonly scheduleSpotlight: ScheduleSpotlight;
  readonly onReady: () => void;
}): ReactElement {
  const [visible, setVisible] = useState(false);
  const [proofIndex, setProofIndex] = useState(initialProof);
  const proof = proofs[proofIndex];
  const [focus, setFocus] = useState('');
  const wires = useMemo(() => (scene.wiring?.ok ? scene.wiring.value : []), [scene]);
  const filenames = useMemo(
    () =>
      new Map(
        scene.nodes.filter((node) => node.label.includes('.')).map((node) => [node.id, node.label]),
      ),
    [scene],
  );
  const [primary, setPrimary] = useState('');
  const secondary = useMemo(() => selectionNeighbours(wires, primary), [wires, primary]);
  const [hovered, hover] = useSpotlight(scheduleSpotlight);
  const spotlight = useMemo(() => selectionNeighbours(wires, hovered), [wires, hovered]);
  const togglePrimary = useCallback((id: string) => {
    setPrimary((previous) => (previous === id ? '' : id));
  }, []);
  const focusedWire = wires.find((w) => w.id === focus);
  function chooseProof(index: number): void {
    setProofIndex(index);
    select('');
    setFocus('');
  }
  const [selected, select] = useState(() => initialRegion(scene, proofs));
  const [movementId, selectMovement] = useState('');
  const lane = scene.lanes.find((item) => item.id === selected);
  const junction = scene.junctions.find((item) => item.id === selected);
  const link = choice(scene, selected, movementId);
  const selectRegion = useCallback(
    (id: string): void => {
      select(id);
      setProofIndex(proofs.findIndex((p) => p.junctionId === id || p.portId === id));
      setFocus('');
      selectMovement('');
    },
    [proofs],
  );
  const baseNodes = useMemo(
    () => [
      ...scene.sections.map((item) =>
        blockNode(item, 'section', sectionLayer(item), selected, selectRegion),
      ),
      ...scene.roads.map((road) => roadNode(road, scene, selected, selectRegion)),
      ...scene.junctions.map((item) => junctionNode(item, selected, selectRegion)),
      ...scene.nodes.map((item) => blockNode(item, 'node', 2, selected, selectRegion)),
      ...scene.ports
        .filter((p) => p.nodeId.startsWith('section-'))
        .map((p) => gateNode(p, selectRegion)),
    ],
    [scene, selected, selectRegion],
  );
  const nodes = useMemo(
    () => baseNodes.map((node) => selectionNode(node, primary, secondary, hovered, spotlight)),
    [baseNodes, primary, secondary, hovered, spotlight],
  );
  const cameraFocus = useMemo(
    () => wireFocus(focusedWire) ?? scene.sections.find((s) => s.id === focus),
    [focusedWire, scene, focus],
  );
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p>ROAD LAYOUT · DIRECTIONAL LANES</p>
          <h1>
            {scene.nodes.length} nodes · {scene.sections.length} sections
            {wires.length > 0 && ` · ${wires.length} wires`}
          </h1>
        </div>
        {scene.sections.length > 0 && (
          <div className={styles.probes}>
            <button onClick={() => chooseProof(-1)}>Overview</button>
            {scene.sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setProofIndex(-1);
                  setFocus(s.id);
                }}
              >
                {s.label}
              </button>
            ))}
            {wires.length > 0 && (
              <select
                aria-label="Wire focus"
                value={focusedWire?.id ?? ''}
                onChange={(e) => {
                  setProofIndex(-1);
                  select('');
                  setFocus(e.target.value);
                }}
              >
                <option value="">All {wires.length} wires</option>
                {wires.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id} · {filenames.get(w.from) ?? w.from} → {filenames.get(w.to) ?? w.to}
                  </option>
                ))}
              </select>
            )}
            {proofs.length > 0 && (
              <>
                <button
                  aria-label="Previous proof"
                  onClick={() => chooseProof((proofIndex - 1 + proofs.length) % proofs.length)}
                >
                  ←
                </button>
                <select
                  aria-label="Road proof"
                  value={proofIndex}
                  onChange={(e) => chooseProof(Number(e.target.value))}
                >
                  <option value={-1}>Choose a crossing or bend</option>
                  {proofs.map((p, i) => (
                    <option key={p.id} value={i}>
                      {i + 1}/{proofs.length} · {p.title}
                    </option>
                  ))}
                </select>
                <button
                  aria-label="Next proof"
                  onClick={() => chooseProof((proofIndex + 1) % proofs.length)}
                >
                  →
                </button>
              </>
            )}
          </div>
        )}
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
          fitView={initialProof < 0}
          onInit={(camera) => focusProof(camera, proofs[initialProof], undefined)}
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={(_event, node) => {
            if (node.id.startsWith('node-')) togglePrimary(node.id);
          }}
          onNodeMouseEnter={(_event, node) => {
            if (node.id.startsWith('node-')) hover(node.id);
          }}
          onNodeMouseLeave={() => hover('')}
          onPaneClick={() => setPrimary('')}
        >
          <ReadySignal onReady={onReady} />
          <ProofCamera proof={proof} focus={cameraFocus} />
          <NestedWirePaths
            wires={wires}
            primary={primary}
            secondary={secondary}
            hovered={hovered}
            spotlight={spotlight}
            hover={hover}
            select={togglePrimary}
          />
          <Background gap={24} size={1} />
          <Controls showInteractive={false} />
          {proof && <ProofPaths proof={proof} />}
          {proofs.length === 0 && junction !== undefined && link !== undefined && (
            <RoutePreview scene={scene} link={link} />
          )}
        </ReactFlow>
      </div>
      {proof ? (
        <AtlasInspector proof={proof} scene={scene} inspect={inspectTravel} />
      ) : (
        <ProofHint enabled={proofs.length > 0 && selected === ''}>
          <Inspection
            port={scene.ports.find((port) => port.portId === selected)}
            scene={scene}
            lane={lane}
            junction={junction}
            link={link}
            select={selectMovement}
            inspect={inspectTravel}
          />
        </ProofHint>
      )}
      <footer className={styles.footer}>
        {visible && <RoadCoverage scene={scene} auditCoverage={auditCoverage} />}
        <span>
          {scene.lanes.length + scene.junctions.length} inspectable areas · {proofs.length} two-wire
          demonstrations
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

type GateNode = Node<{ port: PrototypePortLocation; select: (id: string) => void }, 'gate'>;
function Gate({ data }: NodeProps<GateNode>): ReactElement {
  return (
    <button
      className={`${styles.gate} nodrag nopan`}
      data-port-id={data.port.portId}
      onClick={() => data.select(data.port.portId)}
      aria-label={`Inspect ${data.port.portId}`}
      title={data.port.portId}
    >
      {data.port.role === 'entry' ? 'IN' : 'OUT'}
    </button>
  );
}
function gateNode(port: PrototypePortLocation, select: (id: string) => void): GateNode {
  return {
    id: port.portId,
    type: 'gate',
    position: { x: port.point.x - 16, y: port.point.y - 12 },
    width: 32,
    height: 24,
    style: { width: 32, height: 24 },
    data: { port, select },
    zIndex: 6,
    draggable: false,
    selectable: false,
  };
}
function proofBounds(proof: PrototypeRoadProof): PrototypeBounds {
  const points = [...proof.primary.points, ...proof.through.points];
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  return {
    x: Math.min(...xs) - 140,
    y: Math.min(...ys) - 140,
    width: Math.max(...xs) - Math.min(...xs) + 280,
    height: Math.max(...ys) - Math.min(...ys) + 280,
  };
}
function ProofCamera({
  proof,
  focus,
}: {
  readonly proof: PrototypeRoadProof | undefined;
  readonly focus: PrototypeBlock | undefined;
}): null {
  const { fitBounds, fitView } = useReactFlow();
  useEffect(() => {
    focusProof({ fitBounds, fitView }, proof, focus);
  }, [proof, focus, fitBounds, fitView]);
  return null;
}
function ProofPaths({ proof }: { readonly proof: PrototypeRoadProof }): ReactElement {
  return (
    <ViewportPortal>
      <svg
        className={styles.routePreview}
        aria-label="Two legal wire paths"
        data-proof-id={proof.id}
      >
        <defs>
          <marker
            id="proof-a"
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
            id="proof-b"
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
        <polyline
          data-preview="through"
          points={pointsAttribute(proof.through.points)}
          className={styles.throughPath}
          markerEnd="url(#proof-b)"
        />
        <polyline points={pointsAttribute(proof.primary.points)} className={styles.wireHalo} />
        <polyline
          data-preview="primary"
          points={pointsAttribute(proof.primary.points)}
          className={styles.primaryPath}
          markerEnd="url(#proof-a)"
        />

        {[proof.primary, proof.through].map((path, i) => (
          <g key={i}>
            {[path.points[0], path.points.at(-1)].map((p, j) => (
              <SafeEndpoint key={j} point={p} wire={i} end={j} />
            ))}
          </g>
        ))}
      </svg>
    </ViewportPortal>
  );
}
function proofAllowed(
  proof: PrototypeRoadProof,
  scene: RoadPrototypeScene,
  inspect: InspectTravel,
): boolean {
  return [...proof.primary.connectionIds, ...proof.through.connectionIds].every((id) => {
    const c = scene.connections.find((c) => c.id === id);
    return (
      c !== undefined && inspect({ kind: 'connection', connectionId: id, points: c.points }).ok
    );
  });
}
function AtlasInspector({
  proof,
  scene,
  inspect,
}: {
  readonly proof: PrototypeRoadProof;
  readonly scene: RoadPrototypeScene;
  readonly inspect: InspectTravel;
}): ReactElement {
  return (
    <aside
      className={styles.proof}
      data-inspected-id={proof.junctionId}
      aria-label="Two-wire proof"
    >
      <div>
        <strong>{proof.title}</strong>
        <span>A solid: demonstration wire · B dashed: legal nearby traffic</span>
      </div>
      <output data-allowed={proofAllowed(proof, scene, inspect)}>
        {proofAllowed(proof, scene, inspect) ? 'Both paths legal' : 'Validation failed'}
      </output>
      <span>
        {proof.crossings.length} crossings (white gap = no join) · no shared segments · endpoints
        inside safe lanes or at ports
      </span>
    </aside>
  );
}

function SafeEndpoint({
  point: p,
  wire,
  end,
}: {
  readonly point: PrototypePoint | undefined;
  readonly wire: number;
  readonly end: number;
}): ReactElement | null {
  if (!p) return null;
  const labels = ['start', 'safe'],
    names = ['A', 'B'],
    dy = [-12, 20];
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={6} className={styles.safeMark} />
      <text x={p.x + 10} y={p.y + (dy[end] ?? 0)} className={styles.safeLabel}>
        {names[wire]} {labels[end]}
      </text>
    </g>
  );
}

function ProofHint({
  enabled,
  children,
}: {
  readonly enabled: boolean;
  readonly children: ReactElement;
}): ReactElement {
  if (!enabled) return children;
  return (
    <aside className={styles.proof}>
      Select a road opening or bend to see two legal wires. Top/left: IN. Bottom/right: OUT. Section
      boundaries can only be crossed at their four gates.
    </aside>
  );
}

function focusProof(
  camera: {
    fitBounds: (
      bounds: PrototypeBounds,
      options: { padding: number; duration: number },
    ) => Promise<boolean>;
    fitView: (options: { padding: number; duration: number }) => Promise<boolean>;
  },
  proof: PrototypeRoadProof | undefined,
  focus: PrototypeBlock | undefined,
): void {
  if (proof) {
    void camera.fitBounds(proofBounds(proof), { padding: 0.08, duration: 0 });
    return;
  }
  if (focus) {
    void camera.fitBounds(focus.bounds, { padding: 0.12, duration: 0 });
    return;
  }
  void camera.fitView({ padding: 0.07, duration: 0 });
}

function sectionLayer(section: PrototypeBlock): number {
  return section.parentSectionId ? 0 : -1;
}

function initialRegion(scene: RoadPrototypeScene, proofs: readonly PrototypeRoadProof[]): string {
  if (proofs.length > 0) return '';
  if (scene.sections.some((section) => section.parentSectionId)) return '';
  return scene.crossingExamples[0]?.junctionId ?? '';
}

function wirePoints(wire: NestedWire): readonly PrototypePoint[] {
  return [wire.segments[0]?.from ?? { x: 0, y: 0 }, ...wire.segments.map((s) => s.to)];
}
function wireFocus(wire: NestedWire | undefined): PrototypeBlock | undefined {
  if (wire === undefined) return undefined;
  const points = wirePoints(wire),
    xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  return {
    id: wire.id,
    label: wire.id,
    bounds: {
      x: Math.min(...xs) - 160,
      y: Math.min(...ys) - 120,
      width: Math.max(...xs) - Math.min(...xs) + 320,
      height: Math.max(...ys) - Math.min(...ys) + 240,
    },
  };
}
function NestedWirePaths({
  wires,
  primary,
  secondary,
  hovered,
  spotlight,
  hover,
  select,
}: {
  readonly wires: readonly NestedWire[];
  readonly primary: string;
  readonly secondary: ReadonlySet<string>;
  readonly hovered: string;
  readonly spotlight: ReadonlySet<string>;
  readonly hover: (id: string) => void;
  readonly select: (id: string) => void;
}): ReactElement {
  const midpoints = useMemo(() => wires.map(wireMidpoint), [wires]);
  const converging = useMemo(() => convergingWireIds(wires), [wires]);
  return (
    <ViewportPortal>
      <svg className={styles.nestedWires} aria-label="Twelve law-routed wires">
        {wires.map((wire, i) => (
          <g
            key={wire.id}
            data-wire-id={wire.id}
            aria-label={`${wire.id}: ${wire.from} → ${wire.to}`}
            data-tone={i % 3}
            data-converging={converging.has(wire.id)}
            className={paintClass(wire.id, primary, secondary, hovered, spotlight)}
          >
            <defs>
              <marker
                id={`arrow-${wire.id}`}
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M0 0 L10 5 L0 10z" />
              </marker>
            </defs>
            <polyline className={styles.nestedHalo} points={pointsAttribute(wirePoints(wire))} />
            <polyline
              className={styles.nestedPath}
              points={pointsAttribute(wirePoints(wire))}
              markerEnd={`url(#arrow-${wire.id})`}
            />
            <polyline
              className={`${styles.wireHit} nodrag nopan`}
              data-wire-hit={wire.id}
              points={pointsAttribute(wirePoints(wire))}
              onMouseEnter={() => hover(wire.id)}
              onMouseLeave={() => hover('')}
              onClick={(event) => {
                event.stopPropagation();
                select(wire.id);
              }}
            />
            {primary === wire.id && (
              <text
                className={styles.nestedLabel}
                data-wire-label={wire.id}
                x={midpoints[i]?.x}
                y={midpoints[i]?.y}
                textAnchor="middle"
              >
                {wire.label ?? wire.id}
              </text>
            )}
          </g>
        ))}
      </svg>
    </ViewportPortal>
  );
}

/** Count distinct wires per owned pin-row side or gate mouth; never infer from coordinates. */
function wireMouths(wire: NestedWire): readonly string[] {
  return [...new Set([wire.sourcePortId, wire.targetPortId, ...wire.gates])];
}
/** Paint-only membership is rebuilt from frozen input; selection never changes the grouping. */
function convergingWireIds(wires: readonly NestedWire[]): ReadonlySet<string> {
  const counts = new Map<string, number>();
  wires.flatMap(wireMouths).forEach((mouth) => counts.set(mouth, (counts.get(mouth) ?? 0) + 1));
  return new Set(
    wires
      .filter((wire) => wireMouths(wire).some((mouth) => (counts.get(mouth) ?? 0) >= 3))
      .map((wire) => wire.id),
  );
}

/** Enter/leave share the host's dwell scheduler; replacement and unmount cancel pending paint. */
function useSpotlight(schedule: ScheduleSpotlight): readonly [string, (id: string) => void] {
  const [hovered, setHovered] = useState('');
  const cancel = useRef(() => {});
  const hover = useCallback(
    (id: string) => {
      cancel.current();
      cancel.current = schedule(() => setHovered(id));
    },
    [schedule],
  );
  useEffect(() => () => cancel.current(), [schedule]);
  return [hovered, hover];
}
/** Selection retains its exact M2 treatment; hover adds no primary class or labels. */
function paintClass(
  id: string,
  primary: string,
  secondary: ReadonlySet<string>,
  hovered: string,
  spotlight: ReadonlySet<string>,
): string {
  if (primary !== '') return selectionClass(id, primary, secondary);
  return spotlightClass(id, hovered, spotlight);
}
function spotlightClass(id: string, hovered: string, spotlight: ReadonlySet<string>): string {
  if (hovered === '') return '';
  return spotlightMember(id, hovered, spotlight)
    ? (styles.spotlit ?? '')
    : (styles.spotlightDim ?? '');
}
function spotlightMember(id: string, hovered: string, spotlight: ReadonlySet<string>): boolean {
  return id === hovered || spotlight.has(id);
}

/** Fresh one-hop view state: wire selections stop at their two endpoints. */
function selectionNeighbours(wires: readonly NestedWire[], primary: string): ReadonlySet<string> {
  const selectedWire = wires.find((wire) => wire.id === primary);
  if (selectedWire) return new Set([selectedWire.from, selectedWire.to]);
  const incident = wires.filter((wire) => [wire.from, wire.to].includes(primary));
  return new Set(
    incident.flatMap((wire) => [wire.id, wire.from, wire.to]).filter((id) => id !== primary),
  );
}
function selectionClass(id: string, primary: string, secondary: ReadonlySet<string>): string {
  if (primary === '') return '';
  if (id === primary) return styles.primary ?? '';
  return secondaryClass(id, secondary);
}
function secondaryClass(id: string, secondary: ReadonlySet<string>): string {
  return secondary.has(id) ? (styles.secondary ?? '') : (styles.dim ?? '');
}
/** Geometry and cached road/lane membership are retained; only paint records change. */
function selectionNode(
  node: Node,
  primary: string,
  secondary: ReadonlySet<string>,
  hovered: string,
  spotlight: ReadonlySet<string>,
): Node {
  if (node.type === 'block')
    return {
      ...node,
      data: {
        ...node.data,
        selectionClass: paintClass(node.id, primary, secondary, hovered, spotlight),
        selectionActive: primary !== '',
      },
    };
  return { ...node, className: primary === '' ? '' : (styles.dim ?? '') };
}
function segmentLength(segment: NestedWire['segments'][number]): number {
  return Math.abs(segment.to.x - segment.from.x) + Math.abs(segment.to.y - segment.from.y);
}
/** Arc-length midpoint, computed once per frozen wire; CSS lifts the label above the path. */
function wireMidpoint(wire: NestedWire): PrototypePoint {
  const lengths = wire.segments.map(segmentLength);
  let remaining = lengths.reduce((sum, length) => sum + length, 0) / 2;
  const segment = wire.segments.find((_segment, index) => {
    const length = lengths[index] ?? 0;
    if (remaining <= length) return true;
    remaining -= length;
    return false;
  });
  if (!segment) return { x: 0, y: 0 };
  const ratio = remaining / segmentLength(segment);
  return {
    x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
    y: segment.from.y + (segment.to.y - segment.from.y) * ratio,
  };
}
