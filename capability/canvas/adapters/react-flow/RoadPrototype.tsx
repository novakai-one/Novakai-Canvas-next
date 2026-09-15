import { useState } from 'react';
import type { ReactElement } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import type { Node, NodeProps, NodeTypes } from '@xyflow/react';
import type { RoadPrototypeScene, PrototypeRoad, PrototypeBlock } from '@novakai/canvas-layout';
import '@xyflow/react/dist/style.css';
import styles from './RoadPrototype.module.css';

type RoadNode = Node<{ road: PrototypeRoad }, 'road'>;
type BlockNode = Node<{ block: PrototypeBlock; kind: 'section' | 'node' }, 'block'>;
const arrows = { left: '←', right: '→', up: '↑', down: '↓' };

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
      {road.directions.map((direction) => (
        <span key={direction} className={styles.lane} data-direction={direction}>
          {arrows[direction]}
        </span>
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
function roadNode(road: PrototypeRoad): RoadNode {
  return {
    id: road.id,
    type: 'road',
    position: road.bounds,
    data: { road },
    style: { width: road.bounds.width, height: road.bounds.height },
    zIndex: 1,
    draggable: false,
    selectable: false,
  };
}

/** Visual proof only. No wire or dragging behavior is claimed; reload safely rebuilds the fixed scene. */
export function RoadPrototype({ scene }: { readonly scene: RoadPrototypeScene }): ReactElement {
  const [visible, setVisible] = useState(true);
  const nodes = [
    ...scene.sections.map((item) => blockNode(item, 'section', 0)),
    ...scene.roads.map(roadNode),
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
      <footer className={styles.footer}>
        <span>
          <b>{scene.roadWidth} px</b> two-way roads · <b>{scene.drivewayWidth} px</b> one-way
          driveways
        </span>
        <span>
          {scene.sections.length} sections · {scene.nodes.length} nodes · {scene.roads.length} road
          rectangles · 0 wires
        </span>
      </footer>
    </main>
  );
}
