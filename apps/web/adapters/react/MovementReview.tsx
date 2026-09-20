import type { ReactElement } from 'react';
import type { WorkspaceController, WorkspaceView } from '../../contract/records/workspace.js';

export function MovementReview({ controller, view }: { controller: WorkspaceController; view: WorkspaceView }): ReactElement | null {
  const review = view.movementReview;
  if (review === null) return null;
  const option = review.review.options.find((item) => item.id === review.optionId);
  if (option === undefined) return null;
  return (
    <aside aria-label="Movement review" style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 40, width: 340, maxHeight: '50vh', overflow: 'auto', padding: 16, background: 'var(--surface-raised, #fff)', border: '1px solid var(--border-default, #bbc5d0)', borderRadius: 8, boxShadow: '0 8px 28px rgb(0 0 0 / 18%)' }}>
      <strong>{option.label}</strong>
      <p>{option.geometryChanges.length} changed object{option.geometryChanges.length === 1 ? '' : 's'} in this preview.</p>
      <ul>
        {option.geometryChanges.map((change) => (
          <li key={`${change.target.kind}:${change.target.id}`}>{change.target.kind === 'section' ? `Section ${change.target.id}` : `Node ${change.target.id}`}</li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => controller.cancelMove()}>Cancel</button>
        <button type="button" onClick={() => void controller.applyMove(option.id)}>Apply</button>
      </div>
    </aside>
  );
}
