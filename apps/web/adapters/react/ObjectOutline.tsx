import type { ReactElement } from 'react';
import type { FeatureProps } from '../../contract/react-types.js';
import styles from './Navigation.module.css';
/** The outline shows canonical objects independently of how often they appear on canvas. */
export function ObjectOutline({ view }: FeatureProps): ReactElement {
  return (
    <ul className={styles.list}>
      {view.active?.document.collection.objects.map((object) => (
        <li key={object.id} className={styles.object}>
          <span>{object.label}</span>
          <small>{object.kind}</small>
        </li>
      ))}
    </ul>
  );
}
