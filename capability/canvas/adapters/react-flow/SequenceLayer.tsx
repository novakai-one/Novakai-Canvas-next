import type { ComponentType, ReactElement, KeyboardEvent } from 'react';
import { ViewportPortal } from '@xyflow/react';
import type { SequenceProps, RenderSlots } from '../../contract/react-types.js';
import type { Scene } from '../../contract/records/scene.js';
import type { ViewSection } from '../../contract/records/view.js';
import styles from './SequenceLayer.module.css';
type SequenceEvent = Scene['sections'][number]['sequence']['events'][number];
/** Supplied participant visibility determines reading-mode sequence visibility; no aggregate message is invented. */
function visibleParticipant(props: SequenceProps, section: string, id: string): boolean {
  const node = props.nodes.find(
    (node) => node.target.id === id && node.placed.sectionId === section,
  );
  return node?.hidden === false;
}
/** Reading collapse hides annotations incident to hidden participants, while canonical sequence data remains intact. */
function visibleEvent(props: SequenceProps, section: string, event: SequenceEvent): boolean {
  return [
    visibleParticipant(props, section, event.source),
    visibleParticipant(props, section, event.target),
  ].every(Boolean);
}
/** Sequence annotations reuse Layout geometry and Presentation labels; Canvas adds selection and keyboard intent only. */
export function createSequenceLayer(
  slots: Pick<RenderSlots, 'MeasuredContent' | 'Marker'>,
): ComponentType<SequenceProps> {
  const Content = slots.MeasuredContent;
  const Marker = slots.Marker;
  /** Measured sequence message keeps its native arrow kind and call/return style. */
  function message(event: SequenceEvent, section: ViewSection, props: SequenceProps): ReactElement {
    const target = { kind: 'sequence' as const, section: section.section.id, id: event.id };
    const first = event.points.at(-2);
    const last = event.points.at(-1);
    const angle = endpointAngle(first, last);
    return (
      <g
        key={event.id}
        role="button"
        tabIndex={0}
        aria-label={event.content.outline.join(' ')}
        onClick={() =>
          props.actions.dispatch({ kind: 'select', targets: [target], mode: 'replace' })
        }
        onKeyDown={(key) => messageKey(key, target, props)}
      >
        <polyline
          className={styles.message}
          data-message={event.message}
          points={event.points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
        />
        <g transform={`translate(${event.labelBox.x} ${event.labelBox.y})`}>
          <Content content={event.content} />
        </g>
        {last && (
          <g transform={`translate(${last.x} ${last.y}) rotate(${angle}) translate(-26 -8)`}>
            <Marker kind={event.marker} paint={props.paint} />
          </g>
        )}
      </g>
    );
  }
  /** Only explicit Enter/Space selects or edits a focused sequence item; ordinary browser keys pass through. */
  function messageKey(
    event: KeyboardEvent<SVGGElement>,
    target: { kind: 'sequence'; section: string; id: string },
    props: SequenceProps,
  ): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    props.actions.dispatch({ kind: 'inspect', target });
  }
  /** World-space decoration surrounds real React Flow participant nodes; it never replaces the node canvas. */
  function section(view: ViewSection, props: SequenceProps): ReactElement {
    const geometry = view.section.sequence;
    return (
      <g
        key={view.id}
        transform={`translate(${view.position.x - view.section.box.x + view.section.origin.x} ${view.position.y - view.section.box.y + view.section.origin.y})`}
        stroke={props.paint.stroke}
      >
        {geometry.lifelines
          .filter((line) => visibleParticipant(props, view.section.id, line.participant))
          .map((line) => (
            <line
              key={line.participant}
              className={styles.lifeline}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
            />
          ))}
        {geometry.activations
          .filter((item) => visibleParticipant(props, view.section.id, item.participant))
          .map((activation) => (
            <rect
              key={`${activation.participant}:${activation.fromEvent}`}
              {...activation.box}
              fill={props.paint.fill}
            />
          ))}
        {geometry.fragments.map((frame) => (
          <g key={frame.id}>
            <rect {...frame.box} fill="none" />
            <g transform={`translate(${frame.labelBox.x} ${frame.labelBox.y})`}>
              <Content content={frame.content} />
            </g>
            {frame.branches.map((branch) => (
              <g key={branch.id}>
                <line
                  x1={branch.box.x}
                  y1={branch.box.y}
                  x2={branch.box.x + branch.box.width}
                  y2={branch.box.y}
                />
                <g transform={`translate(${branch.labelBox.x} ${branch.labelBox.y})`}>
                  <Content content={branch.content} />
                </g>
              </g>
            ))}
          </g>
        ))}
        {geometry.events
          .filter((event) => visibleEvent(props, view.section.id, event))
          .map((event) => message(event, view, props))}
      </g>
    );
  }
  /** Collapsed section annotations are omitted only from the reading projection; stored geometry is unchanged. */
  function SequenceLayer(props: SequenceProps): ReactElement {
    return (
      <ViewportPortal>
        <svg className={styles.layer} width="1" height="1" aria-label="Sequence annotations">
          {props.sections.filter((view) => !view.collapsed).map((view) => section(view, props))}
        </svg>
      </ViewportPortal>
    );
  }
  return SequenceLayer;
}
/** Degenerate optional geometry cannot generate NaN transforms; admitted messages normally provide both tangent points. */
function endpointAngle(
  first: { x: number; y: number } | undefined,
  last: { x: number; y: number } | undefined,
): number {
  if (!first || !last) return 0;
  return (Math.atan2(last.y - first.y, last.x - first.x) * 180) / Math.PI;
}
