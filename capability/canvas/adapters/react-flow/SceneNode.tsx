import { memo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { SceneNodeProps, RenderSlots } from '../../contract/react-types.js';
import type { Anchor } from '@novakai/canvas-presentation';
import styles from './SceneNode.module.css';
/** Measured member handles use exact row positions, with separate source/target handles for bidirectional members. */
function anchorHandles(anchor: Anchor, isConnectable: boolean): ReactElement {
  return (
    <span key={anchor.member}>
      {anchor.direction !== 'out' && (
        <Handle
          id={anchor.member}
          isConnectable={isConnectable}
          type="target"
          position={Position.Left}
          style={{ top: anchor.y }}
          aria-label={`Connect to ${anchor.label}`}
        />
      )}
      {anchor.direction !== 'in' && (
        <Handle
          id={anchor.member}
          isConnectable={isConnectable}
          type="source"
          position={Position.Right}
          style={{ top: anchor.y }}
          aria-label={`Connect from ${anchor.label}`}
        />
      )}
    </span>
  );
}
/** Bind shared measured content once; React Flow owns actual node interaction and Canvas owns typed intent translation. */
export function createSceneNode(
  slots: Pick<RenderSlots, 'NodeContent'>,
): ComponentType<SceneNodeProps> {
  const Content = slots.NodeContent;
  /** Render a real custom node with explicit minimum resize dimensions; host handles rendering failures. */
  function SceneNode({ data, selected, isConnectable }: SceneNodeProps): ReactElement {
    const { view, actions, editable } = data;
    const node = { ...view.placed.measured, width: view.box.width, height: view.box.height };
    return (
      <div className={styles.node} data-preview={view.draft} data-emphasis={view.emphasis}>
        <Content embedFonts={false} node={node} emphasis={view.emphasis} />
        <Handle
          isConnectable={isConnectable}
          type="target"
          position={Position.Left}
          aria-label="Connect to object"
        />
        <Handle
          isConnectable={isConnectable}
          type="source"
          position={Position.Right}
          aria-label="Connect from object"
        />
        {node.content.anchors.map((anchor) => anchorHandles(anchor, isConnectable))}
        <NodeResizer
          isVisible={selected && editable}
          minWidth={view.placed.measured.width}
          minHeight={view.placed.measured.height}
          onResizeStart={() => actions.beginResize(view.target)}
          onResize={(_event, box) => actions.resize(view.target, box)}
          onResizeEnd={actions.finishGeometry}
        />
      </div>
    );
  }
  return memo(SceneNode);
}
