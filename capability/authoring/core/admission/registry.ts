import type { IntentPlanner } from '../../contract/ports/planning.js';
import type { Request } from '../../contract/records/request.js';
import type { Json, Snapshot } from '../../contract/records/storage.js';
import type { Proposal } from '../../contract/records/proposal.js';
import type { Result } from '../../contract/errors.js';
import { plannerId } from '../../contract/brands.js';
import { failure } from '../../contract/errors.js';
import { accepted, reject } from '../validation/outcomes.js';
import { planInverse } from '../history/inverse.js';
/** Validate composition once without throwing out of the factory; invalid facades return this typed failure. */
export function validateRegistry(planners: readonly IntentPlanner[]): Result<void> {
  if (planners.some((planner) => !plannerId.safeParse(planner.id).success))
    return failure('invalid-input', 'planners', 'Malformed planner identity');
  if (new Set(planners.map((planner) => planner.id)).size !== planners.length)
    return failure('invalid-input', 'planners', 'Duplicate planner registration');
  return { ok: true, value: undefined };
}
/** New semantic families select a registered planner; none replace mandatory admission guards. */
async function planChange(
  request: Request,
  snapshot: Snapshot,
  pins: Json,
  planners: readonly IntentPlanner[],
): Promise<Proposal> {
  const intent = request.intent;
  if (intent.kind !== 'change')
    return reject('invalid-input', 'intent', 'Change planner requires a change intent');
  const planner = planners.find((item) => item.id === intent.planner);
  if (!planner) return reject('invalid-input', 'planner', 'Intent planner is not registered');
  return accepted(await planner.plan(request, snapshot, pins));
}
/** Intent routing is data-driven and closed over trusted registrations; Authoring owns retry/inverse recovery. */
export async function planIntent(
  request: Request,
  snapshot: Snapshot,
  pins: Json,
  planners: readonly IntentPlanner[],
): Promise<Proposal> {
  const handlers: Readonly<Record<Request['intent']['kind'], () => Promise<Proposal>>> = {
    change: () => planChange(request, snapshot, pins, planners),
    undo: async () => planInverse(request, snapshot),
    redo: async () => planInverse(request, snapshot),
  };
  return handlers[request.intent.kind]();
}
