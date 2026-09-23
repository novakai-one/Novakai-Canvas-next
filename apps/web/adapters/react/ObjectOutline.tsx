import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';
import type { EventOf, NodeTarget } from '@novakai/canvas-canvas';
import type { FeatureProps } from '../../contract/react-types.js';
import styles from './Navigation.module.css';
/** The slice of the workspace view that outline selection actually reads, taken directly from the
 * real contract (not hand-shaped) so a drifted field is a type error here, not a silent bug. */
export type OutlineView = Pick<FeatureProps['view'], 'active'>;
/** The outline shows canonical objects independently of how often they appear on canvas. */
export function ObjectOutline({ view }: FeatureProps): ReactElement {
  const session = view.active?.session ?? null;
  const state = useSyncExternalStore(
    session?.subscribe ?? emptySubscribe,
    session?.getSnapshot ?? emptySnapshot,
  );
  return (
    <ul className={styles.list}>
      {view.active?.document.collection.objects.map((object) => {
        const targets = objectNodes(view, object.id);
        const selected = targets.some((target) =>
          state?.selection.some(
            (item) => item.kind === 'node' && item.section === target.section && item.id === target.id,
          ),
        );
        return (
          <li key={object.id}>
            <button
              type="button"
              className={styles.row}
              disabled={targets.length === 0}
              aria-current={selected ? 'true' : undefined}
              onClick={() => selectAndLocate(view, object.id)}
            >
              <span>{object.label}</span>
              <small>{object.kind}</small>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
/**
 * Selecting jumps the camera to the object's node, matching Locate elsewhere: same zoom, new center.
 * An object placed in several diagrams has several appearances; repeat clicks cycle to the next one
 * after whichever appearance is currently selected. An object with no appearance is a no-op.
 */
export function selectAndLocate(view: OutlineView, objectId: string): void {
  const session = view.active?.session;
  const targets = objectNodes(view, objectId);
  if (session === undefined || targets.length === 0) return;
  const selection = session.getSnapshot().selection;
  const current = targets.findIndex((target) =>
    selection.some(
      (item) => item.kind === 'node' && item.section === target.section && item.id === target.id,
    ),
  );
  const next = targets[(current + 1) % targets.length];
  if (next === undefined) return;
  const select: EventOf<'select'> = { kind: 'select', targets: [next], mode: 'replace' };
  const locate: EventOf<'locate'> = { kind: 'locate', target: next };
  session.dispatch(select);
  session.dispatch(locate);
}
/** Canonical objects address scene nodes by measured identity; an object can have one appearance per diagram. */
function objectNodes(view: OutlineView, objectId: string): readonly NodeTarget[] {
  if (view.active === null) return [];
  return view.active.document.scene.sections
    .flatMap((section) => section.nodes.map((node) => ({ section: section.id, node })))
    .filter((item) => item.node.measured.objectId === objectId)
    .map((item): NodeTarget => ({ kind: 'node', section: item.section, id: item.node.id }));
}
/** Initial collection loading has no Canvas subscription or fabricated selection. */
function emptySubscribe(): () => void {
  return () => undefined;
}
/** Stable empty snapshot keeps React hook order while the first collection loads. */
function emptySnapshot(): null {
  return null;
}
