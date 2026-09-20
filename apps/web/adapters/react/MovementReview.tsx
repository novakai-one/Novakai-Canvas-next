import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './MovementReview.module.css';

function labelFor(view: FeatureProps['view'], target: { kind: string; id: string; section?: string }): string {
  const document = view.active?.document;
  if (document === undefined) return target.id;
  if (target.kind === 'section') return target.id;
  const section = document.scene.sections.find((item) => item.id === target.section);
  return section?.nodes.find((node) => node.id === target.id)?.measured.label ?? target.id;
}
function boxText(box: { x: number; y: number; width: number; height: number }): string {
  return `x ${Math.round(box.x)}, y ${Math.round(box.y)}, ${Math.round(box.width)}×${Math.round(box.height)}`;
}

export function createMovementReview({ Button }: Pick<DesignSlots, 'Button'>): ComponentType<FeatureProps> {
  function MovementReview({ controller, view }: FeatureProps): ReactElement | null {
    const review = view.movementReview;
    if (review === null) return null;
    const option = review.review.options.find((item) => item.id === review.optionId);
    if (option === undefined) return null;
    const waiting = review.phase !== 'review';
    return (
      <aside className={styles.review} aria-label="Movement review">
        <div className={styles.header}>
          <div>
            <strong>{option.label}</strong>
            <p>{review.phase === 'sending' ? 'Saving this exact preview…' : review.phase === 'uncertain' ? 'Confirmation is pending. Keep this review open and check recovery.' : 'Inspect the complete preview before applying.'}</p>
          </div>
          <span className={styles.count}>{option.geometryChanges.length} changes</span>
        </div>
        <ul className={styles.changes} aria-label="Changed geometry">
          {option.geometryChanges.map((change) => {
            const target = change.target as { kind: string; id: string; section?: string };
            const resized = change.before.width !== change.after.width || change.before.height !== change.after.height;
            return (
              <li key={`${target.kind}:${target.section ?? ''}:${target.id}`}>
                <strong>{labelFor(view, target)}</strong>
                <span>{resized ? 'Container resized' : 'Moved'} · {boxText(change.before)} → {boxText(change.after)}</span>
                <small>{target.kind}:{target.id}</small>
              </li>
            );
          })}
        </ul>
        <div className={styles.actions}>
          <Button label="Cancel" disabled={waiting} onClick={() => controller.cancelMove()} />
          <Button label={waiting ? 'Saving…' : 'Apply preview'} variant="primary" pending={waiting} disabled={waiting} onClick={() => void controller.applyMove(option.id)} />
        </div>
      </aside>
    );
  }
  return MovementReview;
}
