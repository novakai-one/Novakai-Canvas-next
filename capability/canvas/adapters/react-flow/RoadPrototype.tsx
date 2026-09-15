import { useState } from 'react';
import type { ReactElement, CSSProperties } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
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
type BlockNode = Node<{ block: PrototypeBlock; kind: 'section' | 'node' }, 'block'>;
const arrows = { left: '←', right: '→', up: '↑', down: '↓' };

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
      title={`${road.id} · ${road.bounds.width} × ${road.bounds.height}`}
    >
      {data.lanes.map((lane) => (
        <button
          type="button"
          key={lane.id}
          className={`${styles.lane} nodrag nopan`}
          style={relative(lane.bounds, road.bounds)}
          data-lane-id={lane.id}
          data-direction={lane.direction}
          aria-label={`Inspect ${lane.direction} lane on ${road.id}`}
          aria-pressed={data.selected === lane.id}
          onClick={() => data.select(lane.id)}
        >
          {arrows[lane.direction]}
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
      <span className={styles.entry}>IN ↓</span>
      <strong>{data.block.label}</strong>
      <span>Top entry · bottom exit</span>
      <span className={styles.exit}>OUT ↓</span>
    </div>
  );
}

const nodeTypes: NodeTypes = { road: Road, block: Block };

/** The renderer consumes finished geometry; it cannot reposition semantic objects. */
function blockNode(block: PrototypeBlock, kind: 'section' | 'node', zIndex: number): BlockNode {
  return {
    id: block.id,
    type: 'block',
    position: block.bounds,
    data: { block, kind },
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
}: {
  readonly lane: PrototypeLane;
  readonly inspect: InspectTravel;
}): ReactElement {
  const [probe, setProbe] = useState<Probe>('forward');
  const result = inspect(movement(lane, probe));
  return (
    <aside className={styles.proof} aria-label="Lane travel inspector">
      <div>
        <strong>Inspect a lane</strong>
        <span>
          Click any road arrow · selected: {arrows[lane.direction]} {lane.direction}
        </span>
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

/** Visual proof only. No wire or dragging behavior is claimed; reload safely rebuilds the fixed scene. */
export function RoadPrototype({
  scene,
  inspectTravel,
}: {
  readonly scene: RoadPrototypeScene;
  readonly inspectTravel: InspectTravel;
}): ReactElement {
  const [visible, setVisible] = useState(true);
  const [selected, select] = useState(scene.lanes[0]?.id ?? '');
  const lane = scene.lanes.find((item) => item.id === selected);
  const nodes = [
    ...scene.sections.map((item) => blockNode(item, 'section', 0)),
    ...scene.roads.map((road) => roadNode(road, scene, selected, select)),
    ...scene.nodes.map((item) => blockNode(item, 'node', 2)),
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
          <Background gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {lane !== undefined && <LaneProof key={lane.id} lane={lane} inspect={inspectTravel} />}
      <footer className={styles.footer}>
        <span>Lines separate opposing lanes · Open junctions allow turns</span>
        <span>
          {scene.lanes.length} lanes · {scene.junctions.length} junctions · 0 wires
        </span>
      </footer>
    </main>
  );
}
