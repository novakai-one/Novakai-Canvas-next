import type { Authoring, CandidateValidator, ResourceAdmission, IntentPlanner } from './owners.js';
import type { AuthoringStore } from '../ports/store.js';
import type { FeasibilityOwners } from '../ports/render-jobs.js';
import type { ChangeChannel } from '../ports/notifications.js';
/** Per-operation cancellation is bound without shared request maps; physical commit remains Authoring-owned and terminal. */
export interface AdmissionRuntime {
  readonly store: AuthoringStore;
  readonly planners: readonly IntentPlanner[];
  readonly validation: CandidateValidator;
  readonly resources: ResourceAdmission;
  readonly changes: ChangeChannel;
  readonly feasibility: FeasibilityOwners;
}
export interface AdmissionFactory {
  create(signal: AbortSignal): Authoring;
}
