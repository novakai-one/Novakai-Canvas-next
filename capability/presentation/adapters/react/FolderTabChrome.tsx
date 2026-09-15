import type { ComponentType, ReactElement } from 'react';
import type { ChromeOutline } from '../../contract/records/chrome.js';
import type { NodeChromeProps } from '../../contract/react-types.js';
/** Geometry is injected by composition; adapters never reach into core or sibling adapters. */
export function createFolderTabChrome(
  outline: (width: number, height: number, tabWidth: number, tabHeight: number) => ChromeOutline,
): ComponentType<NodeChromeProps> {
  /** Render only the module shell; measured content, ports and badges remain shared. */
  function FolderTabChrome({ node, style, heading }: NodeChromeProps): ReactElement | null {
    if (!style?.chromeMetrics) return null;
    const metrics = style.chromeMetrics;
    const header = style.headers?.[node.role] ?? node.paint.fill;
    return (
      <>
        <path
          d={outline(node.width, node.height, metrics.tabWidth, metrics.tabHeight)}
          fill={node.paint.fill}
          stroke={node.paint.stroke}
          strokeWidth={node.strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={outline(node.width, node.headerHeight, metrics.tabWidth, metrics.tabHeight)}
          fill={header}
          stroke={node.paint.stroke}
          strokeWidth={node.strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        {heading}
      </>
    );
  }
  return FolderTabChrome;
}
