import type { ComponentType, ReactElement } from 'react';
import type { RenderSlots, WireLabelProps } from '../../contract/react-types.js';
import styles from './WireLabel.module.css';

/** Bind the existing measured renderer once; inverse zoom keeps selected labels at screen scale. */
export function createWireLabel(
  slots: Pick<RenderSlots, 'MeasuredContent'>,
): ComponentType<WireLabelProps> {
  const Content = slots.MeasuredContent;
  function WireLabel({ wire, zoom, anchor }: WireLabelProps): ReactElement | null {
    const content = wire.measuredLabel;
    if (content.outline.every((line) => line.trim().length === 0)) return null;
    const scale = 1 / zoom;
    const transform = `translate(${anchor.x} ${anchor.y}) scale(${scale}) translate(${-content.width / 2} ${-content.height / 2})`;
    return (
      <g className={styles.label} transform={transform}>
        <rect className={styles.backing} width={content.width} height={content.height} />
        <Content embedFonts={false} content={content} />
      </g>
    );
  }
  return WireLabel;
}
