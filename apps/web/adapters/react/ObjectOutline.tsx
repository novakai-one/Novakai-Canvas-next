import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';
import type { FeatureProps } from '../../contract/react-types.js';
import type { Target } from '../../contract/records/owners.js';
import styles from './Navigation.module.css';
type NodeTarget = Extract<Target, { readonly kind: 'node' }>;
/** The slice of the workspace view that outline selection actually reads; narrower than FeatureProps so it stays easy to construct in tests. */
export interface OutlineView {
  readonly active: {
    readonly session: { readonly dispatch: (event: unknown) => unknown };
    readonly document: {
      readonly scene: {
        readonly sections: readonly {
          readonly id: string;
          readonly nodes: readonly {
            readonly id: string;
            readonly measured: { readonly objectId: string | null };
          }[];
        }[];
      };
    };
  } | null;
}
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
        const target = objectNode(view, object.id);
        return (
          <li key={object.id}>
            <button
              type="button"
              className={styles.row}
              disabled={target === null}
              aria-current={
                target !== null &&
                state?.selection.some(
                  (item) =>
                    item.kind === 'node' &&
                    item.section === target.section &&
                    item.id === target.id,
                )
                  ? 'true'
                  : undefined
              }
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
/** Selecting jumps the camera to the object's node, matching Locate elsewhere: same zoom, new center. An object with no appearance is a no-op. */
export function selectAndLocate(view: OutlineView, objectId: string): void {
  const session = view.active?.session;
  const target = objectNode(view, objectId);
  if (session === undefined || target === null) return;
  session.dispatch({ kind: 'select', targets: [target], mode: 'replace' });
  session.dispatch({ kind: 'locate', target });
}
/** Canonical objects address scene nodes by measured identity; an object with no appearance has none to find. */
function objectNode(view: OutlineView, objectId: string): NodeTarget | null {
  if (view.active === null) return null;
  const found = view.active.document.scene.sections
    .flatMap((section) => section.nodes.map((node) => ({ section: section.id, node })))
    .find((item) => item.node.measured.objectId === objectId);
  return found === undefined ? null : { kind: 'node', section: found.section, id: found.node.id };
}
/** Initial collection loading has no Canvas subscription or fabricated selection. */
function emptySubscribe(): () => void {
  return () => undefined;
}
/** Stable empty snapshot keeps React hook order while the first collection loads. */
function emptySnapshot(): null {
  return null;
}
