import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { ViewportPortal } from '@xyflow/react';
import type { RoutingRoadsProps } from '../../contract/react-types.js';
import type { ViewSection } from '../../contract/records/view.js';
import styles from './RoutingRoads.module.css';
type Geometry = NonNullable<ViewSection['section']['routing']>;
const arrows = { left: '←', right: '→', up: '↑', down: '↓' };
/** Exact engine rectangles; lanes are children only for paint, never new layout inputs. */
function Road({
  road,
  lanes,
}: {
  readonly road: Geometry['roads'][number];
  readonly lanes: Geometry['lanes'];
}): ReactElement {
  return (
    <div
      className={styles.road}
      data-road-id={road.id}
      data-kind={road.kind}
      data-access={road.accessRole}
      style={{
        left: road.bounds.x,
        top: road.bounds.y,
        width: road.bounds.width,
        height: road.bounds.height,
      }}
    >
      {lanes.map((lane) => (
        <span
          key={lane.id}
          className={styles.lane}
          data-lane-id={lane.id}
          data-direction={lane.direction}
          style={{
            left: lane.bounds.x - road.bounds.x,
            top: lane.bounds.y - road.bounds.y,
            width: lane.bounds.width,
            height: lane.bounds.height,
          }}
        >
          {arrows[lane.direction]}
        </span>
      ))}
    </div>
  );
}
function RoadSection({ view }: { readonly view: ViewSection }): ReactElement {
  const geometry = view.section.routing;
  const lanes = useMemo(() => groupLanes(geometry?.lanes ?? []), [geometry]);
  return (
    <div
      className={styles.section}
      data-routing-section={view.section.id}
      style={{
        left: view.position.x - view.section.box.x + view.section.origin.x,
        top: view.position.y - view.section.box.y + view.section.origin.y,
      }}
    >
      {geometry?.roads.map((road) => (
        <Road key={road.id} road={road} lanes={lanes.get(road.id) ?? []} />
      ))}
    </div>
  );
}
/** Passive viewport content cannot capture selection, pan or drag. Visibility never triggers layout. */
export function RoutingRoads({ sections }: RoutingRoadsProps): ReactElement {
  return (
    <ViewportPortal>
      <div className={styles.layer} data-routing-roads aria-hidden="true">
        {sections
          .filter((section) => !section.collapsed)
          .map((view) => (
            <RoadSection key={view.id} view={view} />
          ))}
      </div>
    </ViewportPortal>
  );
}

function groupLanes(lanes: Geometry['lanes']): Map<string, Geometry['lanes']> {
  const grouped = new Map<string, Geometry['lanes']>();
  lanes.forEach((lane) => grouped.set(lane.roadId, [...(grouped.get(lane.roadId) ?? []), lane]));
  return grouped;
}
