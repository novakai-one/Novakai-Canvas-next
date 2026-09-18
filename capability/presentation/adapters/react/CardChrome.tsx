import type { ReactElement } from 'react';
import type { VisualNode } from '../../contract/records/visual.js';
import type { NodeChromeProps, NodeRenderClasses } from '../../contract/react-types.js';
/** Rounded forms use token radii; pills use their geometric half-height. */
function radius(node: VisualNode): number {
  if (node.frame !== 'auto') return node.radius;
  if (node.shape === 'pill') return node.height / 2;
  return node.radius;
}
/** Diamond bounds expand around the measured inscribed content rectangle. */
function frame(node: VisualNode, classes?: NodeRenderClasses): ReactElement | null {
  if (node.frame === 'none') return null;
  return visibleFrame(node, classes);
}
/** Explicit cards/panels use rounded regions; auto retains semantic shape notation. */
function visibleFrame(node: VisualNode, classes?: NodeRenderClasses): ReactElement {
  if (node.shape === 'diamond' && node.frame === 'auto')
    return (
      <polygon
        className={classes?.frame}
        vectorEffect="non-scaling-stroke"
        points={`${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}`}
        fill={node.paint.fill}
        stroke={node.paint.stroke}
        strokeWidth={node.strokeWidth}
      />
    );
  return (
    <rect
      className={classes?.frame}
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
function headerRule(node: VisualNode, classes?: NodeRenderClasses): ReactElement | null {
  if (node.frame !== 'auto') return null;
  return semanticHeaderRule(node, classes);
}
/** Compartment cards keep left-aligned compartments under a separator; panel containers keep left-aligned tab titles. */
const COMPARTMENT_SHAPES: readonly string[] = ['entity', 'module', 'interface', 'function'];
/** Only kind-appropriate auto frames receive a separator, after the measured heading region. */
function semanticHeaderRule(node: VisualNode, classes?: NodeRenderClasses): ReactElement | null {
  if (!COMPARTMENT_SHAPES.includes(node.shape)) return null;
  if (node.height <= node.headerHeight) return null;
  return (
    <line
      className={classes?.separator}
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
/** Browser-only header paint adds hierarchy without changing measured bounds or static output. */
function header(node: VisualNode, classes?: NodeRenderClasses): ReactElement | null {
  if (classes === undefined || node.frame !== 'auto') return null;
  if (!COMPARTMENT_SHAPES.includes(node.shape)) return null;
  const corner = Math.min(radius(node), node.headerHeight / 2);
  const path = `M${corner} 0 H${node.width - corner} Q${node.width} 0 ${node.width} ${corner} V${node.headerHeight} H0 V${corner} Q0 0 ${corner} 0 Z`;
  return <path className={classes.header} d={path} />;
}
/** The top-facing rim catches light without outlining the entire body a second time. */
function rim(node: VisualNode, classes?: NodeRenderClasses): ReactElement | null {
  if (classes === undefined || node.frame === 'none' || node.shape === 'diamond') return null;
  const inset = node.strokeWidth / 2;
  return (
    <path
      className={classes.rim}
      d={`M${inset} ${radius(node)} Q${inset} ${inset} ${radius(node)} ${inset} H${node.width - radius(node)} Q${node.width - inset} ${inset} ${node.width - inset} ${radius(node)}`}
      vectorEffect="non-scaling-stroke"
    />
  );
}
/** Shared browser roles skin the frame; absent roles preserve native/static markup and paint. */
export function CardChrome({ node, heading, classes }: NodeChromeProps): ReactElement {
  return (
    <>
      {frame(node, classes)}
      {header(node, classes)}
      {rim(node, classes)}
      {headerRule(node, classes)}
      {heading}
    </>
  );
}
