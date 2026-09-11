import type { Result } from '../errors.js';
/** Job identity is supplied by the host; Layout never maintains a global latest-job singleton. */
export interface Job {
  readonly id: string;
  readonly inputKey: string;
}
/** Host yields/cancels and owns worker termination; stale native completions fail the next checkpoint. */
export interface JobControl {
  checkpoint(job: Job): Promise<Result<void>>;
}
