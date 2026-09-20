import { memo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { NodeResizeControl, Position } from '@xyflow/react';
import type { SectionFrameProps, RenderSlots } from '../../contract/react-types.js';
import styles from './SectionFrame.module.css';
import boundary from './GroupBoundary.module.css';

function SectionResizeControls({
  view,
  actions,
  visible,
}: {
  readonly view: SectionFrameProps['data']['view'];
  readonly actions: SectionFrameProps['data']['actions'];
  readonly visible: boolean;
}): ReactElement | null {
  if (!visible) return null;
  return (
    <>
      <NodeResizeControl
        position={Position.Right}
        resizeDirection="horizontal"
        style={{ pointerEvents: 'auto' }}
        minWidth={view.box.width}
        minHeight={view.box.height}
        onResizeStart={() => actions.beginResize(view.target)}
        onResize={(_event, box) => actions.resize(view.target, box)}
        onResizeEnd={actions.finishGeometry}
      />
      <NodeResizeControl
        position={Position.Bottom}
        resizeDirection="vertical"
        style={{ pointerEvents: 'auto' }}
        minWidth={view.box.width}
        minHeight={view.box.height}
        onResizeStart={() => actions.beginResize(view.target)}
        onResize={(_event, box) => actions.resize(view.target, box)}
        onResizeEnd={actions.finishGeometry}
      />
    </>
  );
}
/** Section frame and title remain one actual React Flow node; children have parent-relative placement. */
export function createSectionFrame(
  slots: Pick<RenderSlots, 'MeasuredContent'>,
): ComponentType<SectionFrameProps> {
  const Content = slots.MeasuredContent;
  /** Title positions use the supplied section origin rather than guessing padding; host owns render recovery. */
  function SectionFrame({ data, selected }: SectionFrameProps): ReactElement {
    const { view, actions, editable } = data;
    const { section } = view;
    const left = section.origin.x + section.title.box.x - section.box.x;
    const top = section.origin.y + section.title.box.y - section.box.y;
    return (
      <div
        className={styles.frame}
        data-selected={view.selected}
        style={{
          width: view.box.width,
          height: view.box.height,
        }}
      >
        <svg className={boundary.hit} aria-hidden="true">
          <rect width="100%" height="100%" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className={`section-drag-handle ${styles.title}`} style={{ left, top }}>
          <Content embedFonts={false} content={section.title.content} />
        </div>
        <SectionResizeControls view={view} actions={actions} visible={selected && editable} />
      </div>
    );
  }
  return memo(SectionFrame);
}
