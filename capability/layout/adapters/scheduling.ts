import type { Job, JobControl } from '../contract/ports/scheduling.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
/** Host owns the latest-job state and actual worker; this adapter never introduces a scheduler singleton. */
export interface JobHost {
  isCurrent(job: Job): boolean;
  yield(): Promise<void>;
}
/** Yield allows queued cancellation to arrive before checking current-job identity again. */
export function createJobControl(host: JobHost): JobControl {
  return {
    async checkpoint(job: Job): Promise<Result<void>> {
      try {
        await host.yield();
        if (!host.isCurrent(job))
          return failure('cancelled', job.id, 'Layout job is no longer current');
        return { ok: true, value: undefined };
      } catch {
        return failure('engine-failed', job.id, 'Host scheduling failed');
      }
    },
  };
}
