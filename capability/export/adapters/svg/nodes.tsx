import type { ReactElement } from 'react';
import type {
  ReactBindings,
  PlacedNode,
  MeasuredContent,
  Point,
} from '../../contract/render-types.js';
/** Stable shared content slots retain exact measurements; only outer placement belongs to Export. */
export function createNodeDrawing(
  bindings: Pick<ReactBindings, 'NodeContent' | 'MeasuredContent'>,
): {
  node: (node: PlacedNode) => ReactElement;
  label: (content: MeasuredContent, point: Point) => ReactElement;
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
  /** Labels are section-local, independently measured by Presentation. */
  function label(content: MeasuredContent, point: Point): ReactElement {
    return (
      <g transform={`translate(${point.x} ${point.y})`}>
        <Measured content={content} embedFonts={false} />
      </g>
    );
  }
  return { node, label };
}
