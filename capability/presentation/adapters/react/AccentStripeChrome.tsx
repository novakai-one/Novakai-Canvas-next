import type { ReactElement } from 'react';
import type { NodeChromeProps } from '../../contract/react-types.js';
/** A token-colored spine and restrained elevation distinguish the light module chrome. */
export function AccentStripeChrome({ node, style }: NodeChromeProps): ReactElement | null {
  if (!style?.chromeMetrics) return null;
  const shadow = style.elevation;
  const filter = `chrome-shadow-${node.id}`;
  return (
    <>
      {shadow && (
        <defs>
          <filter
            id={filter}
            filterUnits="userSpaceOnUse"
            x={-shadow.extent}
            y={-shadow.extent}
            width={node.width + shadow.extent * 2}
            height={node.height + shadow.extent * 2}
          >
            <feDropShadow
              dx={shadow.offsetX}
              dy={shadow.offsetY}
              stdDeviation={shadow.blur}
              floodColor={shadow.color}
            />
          </filter>
        </defs>
      )}
      <rect
        width={node.width}
        height={node.height}
        rx={node.radius}
        fill={node.paint.fill}
        stroke={node.paint.stroke}
        strokeWidth={node.strokeWidth}
        filter={shadow ? `url(#${filter})` : undefined}
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={node.strokeWidth}
        y={node.strokeWidth}
        width={node.width - node.strokeWidth * 2}
        height={node.headerHeight - node.strokeWidth}
        rx={node.radius}
        fill={style.headers?.[node.role] ?? node.paint.fill}
      />
      <path
        d={`M${style.chromeMetrics.accentWidth / 2} ${node.radius} V${node.height - node.radius}`}
        stroke={node.paint.stroke}
        strokeWidth={style.chromeMetrics.accentWidth}
        strokeLinecap="round"
      />
      <line
        x1={0}
        x2={node.width}
        y1={node.headerHeight}
        y2={node.headerHeight}
        stroke={node.paint.stroke}
        strokeWidth={node.strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}
