import type { ReactElement, ComponentType } from 'react';
import type { ReactBindings, MarkerPlacement, Point } from '../../contract/render-types.js';
/** Orient shared notation from the endpoint tangent. No crow-foot geometry is duplicated here. */
export function createMarkerDrawing(
  bindings: Pick<ReactBindings, 'Marker'>,
): ComponentType<MarkerPlacement> {
  const Marker = bindings.Marker;
  /** Empty/degenerate tangents render no marker; valid scenes supply endpoint segments. */
  function EndpointMarker(props: MarkerPlacement): ReactElement | null {
    const points = oriented(props);
    const endpoint = points.at(-1);
    const previous = points.at(-2);
    if (!endpoint || !previous) return null;
    const angle = (Math.atan2(endpoint.y - previous.y, endpoint.x - previous.x) * 180) / Math.PI;
    return (
      <g transform={`translate(${endpoint.x} ${endpoint.y}) rotate(${angle}) translate(-26 -8)`}>
        <Marker kind={props.kind} paint={props.paint} />
      </g>
    );
  }
  return EndpointMarker;
}
/** Source markers face away from the first segment; target markers face along the last segment. */
function oriented(props: MarkerPlacement): readonly Point[] {
  if (props.at === 'source') return [...props.points].reverse();
  return props.points;
}
