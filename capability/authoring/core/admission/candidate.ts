import type { Request } from '../../contract/records/request.js';
import type { Snapshot, Write, ReadVersion } from '../../contract/records/storage.js';
import type { Proposal } from '../../contract/records/proposal.js';
import type { CandidateValidator } from '../../contract/ports/planning.js';
import { versionSchema } from '../../contract/records/storage.js';
import { checkProposal } from './dependencies.js';
import { netWrite, installWrites } from '../records/changes.js';
import { accepted, freeze } from '../validation/outcomes.js';
import { readShape } from '../validation/input.js';
export interface Candidate {
  readonly after: Snapshot;
  readonly changes: readonly Write[];
  readonly reads: readonly ReadVersion[];
}
/** Complete domain validation sees the exact stamped candidate; Authoring owns rejection and commit recovery. */
export async function createCandidate(
  request: Request,
  before: Snapshot,
  proposal: Proposal,
  validation: CandidateValidator,
): Promise<Candidate> {
  checkProposal(request, proposal.writes);
  const changes = proposal.writes.flatMap((write) => netWrite(before, write));
  const after = freeze(installWrites(before, changes));
  const returned = accepted(
    await validation.validate(
      before,
      after,
      changes.map((write) => write.key),
    ),
  );
  const reads = returned.map((read) => readShape(versionSchema, read, 'corrupt-record'));
  return { after, changes, reads };
}
