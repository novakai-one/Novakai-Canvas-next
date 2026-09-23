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
  /** One bar at a time: the newest request. Older ones show once it settles. */
  function RequestRecovery({ controller, view }: FeatureProps): ReactElement | null {
    const item = view.pending.at(-1);
    if (item === undefined) return null;
    const rejected = item.state === 'rejected';
    return (
      <aside className={styles.recovery} aria-label="Edit recovery">
        <div className={styles.request}>
          <div>
            <strong>{labels[item.state]}</strong>
            <details>
              <summary>Request details</summary>
              <span className={styles.requestId}>{item.request.request}</span>
            </details>
          </div>
          <Button
            label="Check save status"
            disabled={item.state === 'sending'}
            onClick={() => {
              void controller.reconcileRequest(item.request.request);
            }}
          />
          {!rejected && (
            <Button
              label="Retry same edit"
              disabled={item.state !== 'retryable'}
              onClick={() => {
                void controller.retryRequest(item.request.request);
              }}
            />
          )}
          {rejected && (
            <Button
              label="Dismiss"
              icon="×"
              iconOnly
              onClick={() => controller.dismissRequest(item.request.request)}
            />
          )}
        </div>
      </aside>
    );
  }
  return RequestRecovery;
}
