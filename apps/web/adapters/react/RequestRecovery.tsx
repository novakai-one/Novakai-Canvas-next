import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import styles from './RequestRecovery.module.css';
/** Recovery presents explicit receipt lookup/retry actions; a missing receipt is never advertised as a saved edit. */
export function createRequestRecovery({
  Button,
}: Pick<DesignSlots, 'Button'>): ComponentType<FeatureProps> {
  const labels = {
    sending: 'Saving',
    uncertain: 'Save not confirmed — your draft is kept',
    retryable: 'Edit not saved — safe to retry',
    rejected: 'Edit not applied — your draft is kept',
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
              <details>
                <summary>Request details</summary>
                <span>{item.request.request}</span>
              </details>
            </div>
            <Button
              label="Check save status"
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
