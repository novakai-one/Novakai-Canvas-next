import type { Request } from '../../contract/records/request.js';
import type { Receipt } from '../../contract/records/storage.js';
import type { Notifications } from '../../contract/ports/runtime.js';
/** Hints may fail without invalidating a terminal commit; clients re-read or reconcile through Authoring. */
export async function notifyCommitted(
  request: Request,
  receipt: Receipt,
  notifications: Notifications,
): Promise<void> {
  try {
    await notifications.publish(request.workspace, receipt);
  } catch {
    return;
  }
}
