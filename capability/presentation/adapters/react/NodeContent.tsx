import type { ReactElement, ComponentType } from 'react';
import type {
  NodeContentProps,
  NodeSlots,
  MarkerProps,
  MeasuredContentProps,
  FontDefinitionsProps,
  NodeChrome,
  NodeChromeRegistry,
  NodeChromeProps,
} from '../../contract/react-types.js';
import { CARD_CHROME, type ChromeName } from '../../contract/records/chrome.js';
import { COMPARTMENT_SHAPES } from '../../contract/records/visual.js';
import type { FontSet } from '../../contract/records/style.js';
import type { VisualNode, Primitive, Shape } from '../../contract/records/visual.js';
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
const LEFT_ALIGNED_SHAPES: readonly Shape[] = [...COMPARTMENT_SHAPES, 'container'];
/** Layout may stretch a node beyond its measured content; non-compartment shapes center that slack. */
function contentSlack(node: VisualNode): number {
  if (LEFT_ALIGNED_SHAPES.includes(node.shape)) return 0;
  return Math.max(0, (node.width - node.content.width) / 2);
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
    const chrome = resolveChrome(slots.chromes, node.chromeStyle?.chrome ?? CARD_CHROME);
    const content = compartments(node, chrome.separateHeading);
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
        data-frame={node.frame}
        data-node-id={node.id}
      >
        <title>{node.label}</title>
        {embedFonts && <style>{css}</style>}
        <Frame node={node} heading={<Blocks primitives={content.heading} />} />
        <g transform={`translate(${contentSlack(node)} 0)`}>
          <Blocks primitives={content.body} />
        </g>
      </svg>
    );
  }
  /** Legacy cards need no chrome tokens; selected frames receive projection's required style. */
  function Frame({ node, heading }: Pick<NodeChromeProps, 'node' | 'heading'>): ReactElement {
    const style = node.chromeStyle;
    if (style === undefined) {
      const Card = slots.chromes.card.Component;
      return <Card node={node} heading={heading} />;
    }
    const Chrome = resolveChrome(slots.chromes, style.chrome).Component;
    return <Chrome node={node} style={style} heading={heading} />;
  }
  return NodeContent;
}
/** Only own registered names select a chrome; inherited and absent keys retain the card frame. */
function resolveChrome(
  chromes: NodeChromeRegistry,
  name: ChromeName,
): NodeChrome | NodeChromeRegistry['card'] {
  if (!Object.hasOwn(chromes, name)) return chromes.card;
  return chromes[name] ?? chromes.card;
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
export function createFontDefinitions(boundFonts: FontSet): ComponentType<FontDefinitionsProps> {
  /** Current document fonts replace installation defaults without rebinding any sibling renderer. */
  function FontDefinitions({ fonts = boundFonts }: FontDefinitionsProps): ReactElement {
    return <style>{fontRules(fonts)}</style>;
  }
  return FontDefinitions;
}

/** Chrome can position shared measured heading text; body primitives and ports never enter its slot. */
function compartments(
  node: VisualNode,
  separate: boolean | undefined,
): { readonly heading: readonly Primitive[]; readonly body: readonly Primitive[] } {
  if (!separate) return { heading: [], body: node.content.primitives };
  const heading = (item: Primitive): boolean => item.kind === 'text' && item.y <= node.headerHeight;
  return {
    heading: node.content.primitives.filter(heading),
    body: node.content.primitives.filter((item) => !heading(item)),
  };
}
