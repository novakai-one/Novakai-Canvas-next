import type { ReactElement, ComponentType } from 'react';
import type {
  NodeContentProps,
  NodeSlots,
  MarkerProps,
  MeasuredContentProps,
} from '../../contract/react-types.js';
import type { FontSet } from '../../contract/records/style.js';
import type { VisualNode } from '../../contract/records/visual.js';
import type { MarkerFactory } from '../../contract/records/marker.js';
/** Embedded font rules contain only validated digest/base64/MIME values, never authored CSS. */
function fontRules(fonts: FontSet): string {
  return fonts
    .map(
      (font) =>
        `@font-face{font-family:canvas-${font.digest};src:url(data:${font.mediaType};base64,${font.base64});font-weight:400;font-style:normal;}`,
    )
    .join('');
}
/** Rounded forms use token radii; pills use their geometric half-height. */
function radius(node: VisualNode): number {
  if (node.shape === 'pill') return node.height / 2;
  return node.radius;
}
/** Diamond bounds expand around the measured inscribed content rectangle. */
function frame(node: VisualNode): ReactElement {
  if (node.shape === 'diamond')
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
  if (!['entity', 'module', 'interface', 'function'].includes(node.shape)) return null;
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
/** Bind stable slots once; no component type is created during a React render. */
export function createContentRenderer(
  fonts: FontSet,
  slots: NodeSlots,
): ComponentType<NodeContentProps> {
  const css = fontRules(fonts);
  const Blocks = slots.ContentBlocks;
  /** Render validated measured node props; the host reports React failures and retains its current scene. */
  function NodeContent({ node, embedFonts = true }: NodeContentProps): ReactElement {
    return (
      <svg
        display="block"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
        width={node.width}
        height={node.height}
        viewBox={`0 0 ${node.width} ${node.height}`}
        role="img"
        aria-label={node.content.outline.join('; ')}
        data-shape={node.shape}
        data-node-id={node.id}
      >
        <title>{node.label}</title>
        {embedFonts && <style>{css}</style>}
        {frame(node)}
        {headerRule(node)}
        <Blocks primitives={node.content.primitives} />
      </svg>
    );
  }
  return NodeContent;
}
/** Marker geometry is injected from the owned notation policy; hosts only orient the returned local shape. */
export function createMarkerRenderer(draw: MarkerFactory): ComponentType<MarkerProps> {
  /** Render shared local notation; the host owns orientation and rendering-error recovery. */
  function Marker({ kind, paint }: MarkerProps): ReactElement {
    const drawing = draw(kind);
    const fill = drawing.filled ? paint.stroke : 'none';
    return (
      <svg
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="16"
        viewBox="-26 -8 28 16"
        role="img"
        aria-label={kind}
        data-marker={kind}
      >
        {drawing.paths.map((path, index) => (
          <path key={index} d={path} stroke={paint.stroke} fill={fill} />
        ))}
        {drawing.circles.map((circle, index) => (
          <circle
            key={index}
            cx={circle.x}
            cy={circle.y}
            r={circle.radius}
            fill={paint.fill}
            stroke={paint.stroke}
          />
        ))}
      </svg>
    );
  }
  return Marker;
}

/** Bind the existing primitive/font path for wire labels, titles and sequence annotations; host owns render recovery. */
export function createMeasuredRenderer(
  fonts: FontSet,
  slots: NodeSlots,
): ComponentType<MeasuredContentProps> {
  const css = fontRules(fonts);
  const Blocks = slots.ContentBlocks;
  /** Render admitted measured content at its exact bounds; no wrapping, frame or typography policy is introduced. */
  function MeasuredContent({ content, embedFonts = true }: MeasuredContentProps): ReactElement {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={content.width}
        height={content.height}
        viewBox={`0 0 ${content.width} ${content.height}`}
        role="img"
        aria-label={content.outline.join('; ')}
      >
        {embedFonts && <style>{css}</style>}
        <Blocks primitives={content.primitives} />
      </svg>
    );
  }
  return MeasuredContent;
}

/** Export can embed the same owned font rules once per scene rather than once per node/label. */
export function createFontDefinitions(fonts: FontSet): ComponentType {
  const css = fontRules(fonts);
  /** Static font definitions contain only admitted digest/MIME/base64 data; host owns renderer recovery. */
  function FontDefinitions(): ReactElement {
    return <style>{css}</style>;
  }
  return FontDefinitions;
}
