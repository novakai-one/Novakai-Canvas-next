import type { ComponentType, ReactElement } from 'react';
import { dimension } from '../../contract/brands.js';
import type { VisualNode } from '../../contract/records/visual.js';
import type { ChromeOutline } from '../../contract/records/chrome.js';
import type { NodeChromeProps } from '../../contract/react-types.js';
/** Geometry is injected by composition; adapters never reach into core or sibling adapters. */
export function createFolderTabChrome(
  outline: (
    width: VisualNode['width'],
    height: VisualNode['height'],
    tabWidth: VisualNode['width'],
    tabHeight: VisualNode['height'],
  ) => ChromeOutline,
): ComponentType<NodeChromeProps> {
  /** Render only the module shell; measured content, ports and badges remain shared. */
  function FolderTabChrome({ node, style, heading }: NodeChromeProps): ReactElement {
    const tabWidth = dimension.parse(style.chromeMetrics.tabWidth);
    const tabHeight = dimension.parse(style.chromeMetrics.tabHeight);
    return (
      <>
        <path
          d={outline(node.width, node.height, tabWidth, tabHeight)}
          fill={node.paint.fill}
          stroke={node.paint.stroke}
          strokeWidth={node.strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={outline(node.width, node.headerHeight, tabWidth, tabHeight)}
          fill={style.headerTint}
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
