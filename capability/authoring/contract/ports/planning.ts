import type { PlannerId } from '../brands.js';
import type { Result } from '../errors.js';
import type { Request } from '../records/request.js';
import type { Snapshot, Json, RecordKey, ReadVersion } from '../records/storage.js';
import type { Proposal, FeasibilityReport } from '../records/proposal.js';
/** Trusted composition provides public Model/Library planning; submitted payload never executes code. */
export interface IntentPlanner {
  readonly id: PlannerId;
  plan(request: Request, snapshot: Snapshot, pins: Json): Promise<Result<Proposal>>;
}
/** Validate the whole candidate and report all consulted record dependencies, including catalog membership. */
export interface CandidateValidator {
  validate(
    before: Snapshot,
    after: Snapshot,
    changed: readonly RecordKey[],
  ): Promise<Result<readonly ReadVersion[]>>;
}
/** Hard constraints must be checked even without a preview image; warnings cannot authorize invalid geometry. */
export interface Feasibility {
  check(
    candidate: Snapshot,
    changed: readonly RecordKey[],
    preview: boolean,
  ): Promise<Result<FeasibilityReport>>;
}
