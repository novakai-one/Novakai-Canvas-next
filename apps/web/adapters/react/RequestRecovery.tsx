import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './RequestRecovery.module.css';
/** Recovery presents explicit receipt lookup/retry actions; a missing receipt is never advertised as a saved edit. */
export function createRequestRecovery({
  Button,
}: Pick<DesignSlots, 'Button'>): ComponentType<FeatureProps> {
  const labels = {
    sending: 'Saving',
    uncertain: 'Confirmation needed',
    retryable: 'No receipt found',
    rejected: 'Edit was rejected',
  };
  /** Each retained request keeps its identity visible so humans and agents can discuss the same operation. */
  function RequestRecovery({ controller, view }: FeatureProps): ReactElement | null {
    if (view.pending.length === 0) return null;
    return (
      <aside className={styles.recovery} aria-label="Edit recovery">
        {view.pending.map((item) => (
          <div className={styles.request} key={item.request.request}>
            <div>
              <strong>{labels[item.state]}</strong>
              <span>{item.request.request}</span>
            </div>
            <Button
              label="Check receipt"
              disabled={item.state === 'sending'}
              onClick={() => {
                void controller.reconcileRequest(item.request.request);
              }}
            />
            {item.state === 'rejected' && (
              <Button
                label="Dismiss rejection"
                onClick={() => controller.dismissRequest(item.request.request)}
              />
            )}
            <Button
              label="Retry same edit"
              disabled={item.state !== 'retryable'}
              onClick={() => {
                void controller.retryRequest(item.request.request);
              }}
            />
          </div>
        ))}
      </aside>
    );
  }
  return RequestRecovery;
}
