import type { ComponentType, ReactElement } from 'react';
import type { DesignSlots } from '../../contract/react-types.js';
import type { LibraryFeatureProps } from '../../contract/library-react.js';
import styles from './Navigation.module.css';
/** Search results expose their scope; selecting one explicitly opens its collection. */
export function createLibraryResults({
  Button,
}: Pick<DesignSlots, 'Button'>): ComponentType<LibraryFeatureProps> {
  /** Exact Library pagination tokens stay inside the controller. */
  function LibraryResults({ library, state, workspace }: LibraryFeatureProps): ReactElement {
    const page = state.page;
    if (page === null) return <p>Library is loading…</p>;
    return (
      <div>
        <p role="status">{page.total} results</p>
        <ul className={styles.list}>
          {page.hits.map((hit) => (
            <li key={JSON.stringify([hit.collection, hit.kind, hit.id])}>
              <button
                type="button"
                className={styles.row}
                onClick={() => {
                  void workspace.open(hit.collection);
                }}
              >
                <strong>{hit.label}</strong>
                <small>
                  {hit.kind} ·{' '}
                  {state.source?.collections.find((item) => item.id === hit.collection)?.title}
                </small>
              </button>
            </li>
          ))}
        </ul>
        {page.hits.length === 0 && (
          <p>No matching items. Try a broader query or include archived collections.</p>
        )}
        {page.nextCursor && <Button label="Next results" onClick={library.next} />}
      </div>
    );
  }
  return LibraryResults;
}
