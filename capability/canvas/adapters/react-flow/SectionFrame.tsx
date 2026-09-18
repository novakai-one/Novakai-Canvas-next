import { memo } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { SectionFrameProps, RenderSlots } from '../../contract/react-types.js';
import styles from './SectionFrame.module.css';
/** Section frame and title remain one actual React Flow node; children have parent-relative placement. */
export function createSectionFrame(
  slots: Pick<RenderSlots, 'MeasuredContent'>,
): ComponentType<SectionFrameProps> {
  const Content = slots.MeasuredContent;
  /** Title positions use the supplied section origin rather than guessing padding; host owns render recovery. */
  function SectionFrame({ data }: SectionFrameProps): ReactElement {
    const { view } = data;
    const { section } = view;
    const left = section.origin.x + section.title.box.x - section.box.x;
    const top = section.origin.y + section.title.box.y - section.box.y;
    return (
      <div
        className={styles.frame}
        style={{
          width: view.box.width,
          height: view.box.height,
          background: data.paint.fill,
          borderColor: data.paint.stroke,
        }}
      >
        <div
          className={`section-drag-handle ${styles.title}`}
          style={{ left, top }}
          title={section.title.content.outline.join(' ')}
        >
          <Content embedFonts={false} content={section.title.content} sectionTitle />
        </div>
      </div>
    );
  }
  return memo(SectionFrame);
}
