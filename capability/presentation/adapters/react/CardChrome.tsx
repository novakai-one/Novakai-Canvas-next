import type { ReactElement } from 'react';
import type { VisualNode } from '../../contract/records/visual.js';
import type { NodeChromeProps } from '../../contract/react-types.js';
/** Rounded forms use token radii; pills use their geometric half-height. */
function radius(node: VisualNode): number {
  if (node.frame !== 'auto') return node.radius;
  if (node.shape === 'pill') return node.height / 2;
  return node.radius;
}
/** Diamond bounds expand around the measured inscribed content rectangle. */
function frame(node: VisualNode): ReactElement | null {
  if (node.frame === 'none') return null;
  return visibleFrame(node);
}
/** Explicit cards/panels use rounded regions; auto retains semantic shape notation. */
function visibleFrame(node: VisualNode): ReactElement {
  if (node.shape === 'diamond' && node.frame === 'auto')
    return (
      <polygon
        vectorEffect="non-scaling-stroke"
        points={`${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}`}
        fill={node.paint.fill}
        stroke={node.paint.stroke}
        strokeWidth={node.strokeWidth}
      />
    );
  return (
    <rect
      vectorEffect="non-scaling-stroke"
      width={node.width}
      height={node.height}
      rx={radius(node)}
      fill={node.paint.fill}
      stroke={node.paint.stroke}
      strokeWidth={node.strokeWidth}
    />
  );
}
/** Engineering notation has a distinct title compartment; ordinary process cards retain their simpler frame. */
function headerRule(node: VisualNode): ReactElement | null {
  if (node.frame !== 'auto') return null;
  return semanticHeaderRule(node);
}
/** Compartment cards keep left-aligned compartments under a separator; panel containers keep left-aligned tab titles. */
const COMPARTMENT_SHAPES: readonly string[] = ['entity', 'module', 'interface', 'function'];
/** Only kind-appropriate auto frames receive a separator, after the measured heading region. */
function semanticHeaderRule(node: VisualNode): ReactElement | null {
  if (!COMPARTMENT_SHAPES.includes(node.shape)) return null;
  if (node.height <= node.headerHeight) return null;
  return (
    <line
      x1={0}
      x2={node.width}
      y1={node.headerHeight}
      y2={node.headerHeight}
      stroke={node.paint.stroke}
      strokeWidth={node.strokeWidth}
      vectorEffect="non-scaling-stroke"
    />
  );
}
/** Original frame and separator preserve exact SVG element order and attributes. */
export function CardChrome({ node }: Pick<NodeChromeProps, 'node'>): ReactElement {
  return (
    <>
      {frame(node)}
      {headerRule(node)}
    </>
  );
}
