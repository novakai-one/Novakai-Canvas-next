import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './MovementReview.module.css';

function labelFor(document: FeatureProps['view']['movementReview'] extends infer R ? R extends { document: infer D } ? D : never : never, target: { kind: string; id: string; section?: string }): string {
  if (document === undefined) return target.id;
  if (target.kind === 'section') return document.scene.sections.find((section) => section.id === target.id)?.id === target.id ? (document.collection.sections.find((section) => section.id === target.id)?.title ?? target.id) : target.id;
  const section = document.scene.sections.find((item) => item.id === target.section);
  return section?.nodes.find((node) => node.id === target.id)?.measured.label ?? target.id;
}
function deltaText(before: { x: number; y: number; width: number; height: number }, after: { x: number; y: number; width: number; height: number }): string {
  const dx = Math.round(after.x - before.x);
  const dy = Math.round(after.y - before.y);
  const dw = Math.round(after.width - before.width);
  const dh = Math.round(after.height - before.height);
  const parts = [dx !== 0 ? `x ${dx > 0 ? '+' : ''}${dx}` : '', dy !== 0 ? `y ${dy > 0 ? '+' : ''}${dy}` : '', dw !== 0 ? `width ${dw > 0 ? '+' : ''}${dw}` : '', dh !== 0 ? `height ${dh > 0 ? '+' : ''}${dh}` : ''].filter(Boolean);
  return parts.join(', ') || 'unchanged';
}

export function createMovementReview({ Button }: Pick<DesignSlots, 'Button'>): ComponentType<FeatureProps> {
  function MovementReview({ controller, view }: FeatureProps): ReactElement | null {
    const review = view.movementReview;
    if (review === null) return null;
    const option = review.review.options.find((item) => item.id === review.optionId);
    if (option === undefined) return null;
    const waiting = review.phase === 'sending' || review.phase === 'uncertain';
    const canApply = review.phase === 'review';
    return (
      <aside className={styles.review} aria-label="Movement review">
        <div className={styles.options} aria-label="Movement options">
          {review.review.options.map((candidate) => (
            <Button key={candidate.id} label={candidate.label} selected={candidate.id === review.optionId} disabled={waiting} onClick={() => controller.chooseMoveOption(candidate.id)} />
          ))}
        </div>
        <div className={styles.header}>
          <div>
            <strong>{option.label}</strong>
            <p>{review.phase === 'sending' ? 'Saving this exact preview…' : review.phase === 'uncertain' ? 'Confirmation is pending. Keep this review open and check recovery.' : review.phase === 'rejected' ? 'The request was rejected. Cancel to discard this retained draft.' : 'Inspect the complete preview before applying.'}</p>
          </div>
          <span className={styles.count}>{option.geometryChanges.length} changes</span>
        </div>
        <ul className={styles.changes} aria-label="Changed geometry">
          {option.geometryChanges.map((change) => {
            const target = change.target as { kind: string; id: string; section?: string };
            const resized = change.before.width !== change.after.width || change.before.height !== change.after.height;
            return (
              <li key={`${target.kind}:${target.section ?? ''}:${target.id}`}>
                <strong>{labelFor(review.document, target)}</strong>
                <span>{resized ? 'Container resized' : 'Moved'} · {deltaText(change.before, change.after)}</span>

              </li>
            );
          })}
        </ul>
        <div className={styles.actions}>
          <Button label="Cancel" disabled={waiting} onClick={() => controller.cancelMove()} />
          <Button label={waiting ? 'Saving…' : 'Apply preview'} variant="primary" pending={waiting} disabled={!canApply} onClick={() => void controller.applyMove(option.id)} />
        </div>
      </aside>
    );
  }
  return MovementReview;
}
