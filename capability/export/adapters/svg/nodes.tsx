import type { ReactElement } from 'react';
import type {
  ReactBindings,
  DrawingSlots,
  PlacedNode,
  MeasuredContent,
  Point,
} from '../../contract/render-types.js';
/** Stable shared content slots retain exact measurements; only outer placement belongs to Export. */
export function createNodeDrawing(
  bindings: Pick<ReactBindings, 'NodeContent' | 'MeasuredContent'>,
): {
  node: (node: PlacedNode) => ReactElement;
  label: DrawingSlots['label'];
} {
  const Content = bindings.NodeContent;
  const Measured = bindings.MeasuredContent;
  /** Group frames grow to admitted Layout dimensions while their measured inner content remains unchanged. */
  function node(placed: PlacedNode): ReactElement {
    const visual = { ...placed.measured, width: placed.box.width, height: placed.box.height };
    return (
      <g key={placed.id} transform={`translate(${placed.box.x} ${placed.box.y})`}>
        <Content node={visual} embedFonts={false} />
      </g>
    );
  }
  /** Only section titles opt into shortening; wire and sequence text stays verbatim. */
  function label(content: MeasuredContent, point: Point, sectionTitle = false): ReactElement {
    return (
      <g transform={`translate(${point.x} ${point.y})`}>
        <Measured content={content} embedFonts={false} sectionTitle={sectionTitle} />
      </g>
    );
  }
  return { node, label };
}
