import { jsonSchema } from '../../contract/records/storage.js';
import type { Request } from '../../contract/records/request.js';
import type { Snapshot } from '../../contract/records/storage.js';
import type { Digest } from '../../contract/brands.js';
import { digest } from '../../contract/brands.js';
import type { PlanningDependencies } from '../../contract/types.js';
import type { ResourceLease } from '../../contract/ports/resources.js';
import {
  proposalSchema,
  leaseDataSchema,
  feasibilitySchema,
} from '../../contract/records/proposal.js';
import type { PreparedCandidate, FeasibilityReport } from '../../contract/records/proposal.js';
import { navigationDependencies } from '../history/navigation.js';
import { planIntent } from './registry.js';
import { createCandidate } from './candidate.js';
import type { Candidate } from './candidate.js';
import { checkDependencies } from './dependencies.js';
import { checkCoverage } from './resources.js';
import { readShape } from '../validation/input.js';
import { accepted, freeze, reject } from '../validation/outcomes.js';
import { canonical } from '../identity/canonical.js';
/** Cancellation never overrides a recovered/committed receipt; Authoring checks it only before admission/commit. */
export function checkCancellation(
  request: Request,
  cancellation: PlanningDependencies['cancellation'],
): void {
  if (cancellation.cancelled(request.request))
    reject('cancelled', 'request', 'Request was cancelled before commit');
}
/** Always run hard feasibility for changed content; no-op has no new geometry to validate. */
async function checkFeasibility(
  candidate: Candidate,
  preview: boolean,
  feasibility: PlanningDependencies['feasibility'],
): Promise<FeasibilityReport> {
  if (candidate.changes.length === 0) return { warnings: [], diff: [], preview: null };
  const report = accepted(
    await feasibility.check(
      candidate.after,
      candidate.changes.map((write) => write.key),
      preview,
    ),
  );
  return readShape(feasibilitySchema, report, 'corrupt-record');
}
/** Registered planning is followed by non-removable candidate/dependency/resource/geometry guards; Authoring owns recovery. */
export async function buildCandidate(
  request: Request,
  fingerprint: Digest,
  before: Snapshot,
  lease: Pick<ResourceLease, 'pins' | 'reads' | 'covered'>,
  preview: boolean,
  deps: PlanningDependencies,
): Promise<PreparedCandidate> {
  checkCancellation(request, deps.cancellation);
  const resolved = readShape(
    leaseDataSchema,
    { pins: lease.pins, reads: lease.reads, covered: lease.covered },
    'corrupt-record',
  );
  const proposal = readShape(
    proposalSchema,
    await planIntent(request, before, resolved.pins, deps.planners),
    'corrupt-record',
  );
  const candidate = await createCandidate(request, before, proposal, deps.validation);
  const reads = checkDependencies(before, [
    request.expected,
    navigationDependencies(before),
    resolved.reads,
    proposal.reads,
    candidate.reads,
  ]);
  checkCoverage(before, candidate.changes, resolved.covered);
  const geometry = await checkFeasibility(candidate, preview, deps.feasibility);
  checkCancellation(request, deps.cancellation);
  const hashed = {
    fingerprint,
    reads,
    changes: candidate.changes,
    pins: resolved.pins,
    diff: { semantic: proposal.diff, geometry: geometry.diff },
    warnings: [...proposal.warnings, ...geometry.warnings],
  };
  const hashInput = readShape(jsonSchema, hashed, 'corrupt-record');
  const canonicalInput = canonical(hashInput);
  const hashedCandidate = accepted(deps.hash.digest(canonicalInput));
  const candidateHash = readShape(digest, hashedCandidate, 'corrupt-record');
  return freeze({
    before,
    after: candidate.after,
    preparation: { ...hashed, candidateHash, preview: geometry.preview },
  });
}
