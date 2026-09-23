import type { ComponentType, ReactElement } from 'react';
import type { FeatureProps, DesignSlots } from '../../contract/react-types.js';
import type { Submission } from '../../contract/records/submission.js';
import styles from './RequestRecovery.module.css';
/** Recovery presents explicit receipt lookup/retry actions; a missing receipt is never advertised as a saved edit. */
export function createRequestRecovery({
  Button,
}: Pick<DesignSlots, 'Button'>): ComponentType<FeatureProps> {
  const labels = {
    sending: 'Saving',
    uncertain: 'Save not confirmed — your draft is kept',
    retryable: 'Edit not saved — safe to retry',
    rejected: 'Edit not applied. Nothing was changed.',
  };
  /** One row per unsettled request, so each keeps its Check/Retry actions. A refusal already shown
   * in the error bar gets no second row. */
  function RequestRecovery({ controller, view }: FeatureProps): ReactElement | null {
    const items = shownRequests(view);
    if (items.length === 0) return null;
    return (
      <aside className={styles.recovery} aria-label="Edit recovery">
        {items.map((item) => (
          <RequestRow key={item.request.request} controller={controller} item={item} />
        ))}
      </aside>
    );
  }
  function RequestRow({
    controller,
    item,
  }: {
    readonly controller: FeatureProps['controller'];
    readonly item: Submission;
  }): ReactElement {
    return (
      <div className={styles.request}>
        <div>
          <strong>{labels[item.state]}</strong>
          <details>
            <summary>Request details</summary>
            <span className={styles.requestId}>{item.request.request}</span>
          </details>
        </div>
        {item.state === 'rejected' ? (
          <Button
            label="Dismiss refused edit"
            icon="×"
            iconOnly
            onClick={() => controller.dismissRequest(item.request.request)}
          />
        ) : (
          <RecoveryActions controller={controller} item={item} />
        )}
      </div>
    );
  }
  /** A proven refusal has nothing to look up or resend; only unsettled requests get these actions. */
  function RecoveryActions({
    controller,
    item,
  }: {
    readonly controller: FeatureProps['controller'];
    readonly item: Submission;
  }): ReactElement {
    return (
      <>
        <Button
          label="Check save status"
          disabled={item.state === 'sending'}
          onClick={() => {
            void controller.reconcileRequest(item.request.request);
          }}
        />
        <Button
          label="Retry same edit"
          disabled={item.state !== 'retryable'}
          onClick={() => {
            void controller.retryRequest(item.request.request);
          }}
        />
      </>
    );
  }
  return RequestRecovery;
}

/** Every unsettled request, plus the newest refusal when the error bar is not already showing it. */
function shownRequests(view: FeatureProps['view']): readonly Submission[] {
  const newest = view.pending.at(-1);
  return view.pending.filter(
    (item) => item.state !== 'rejected' || refusalShown(item, newest, view),
  );
}
function refusalShown(
  item: Submission,
  newest: Submission | undefined,
  view: FeatureProps['view'],
): boolean {
  return item === newest && view.problem === null;
}
