import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
import { commitRequest } from '../../contract/records/transaction.js';
import type { CommitRequest } from '../../contract/records/transaction.js';
import { keyText, hasDuplicates } from '../transaction/keys.js';
import { boundedClone, parse, success } from './outcomes.js';
/** Read dependencies may be larger than writes, but every write must have exactly one precondition. */
const requestRules: readonly ((request: CommitRequest) => boolean)[] = [
  (request) => hasDuplicates(request.expected.map((read) => keyText(read.key))),
  (request) => hasDuplicates(request.writes.map((write) => keyText(write.key))),
  (request) =>
    request.writes.some(
      (write) => !request.expected.some((read) => keyText(read.key) === keyText(write.key)),
    ),
  (request) =>
    request.writes.some((write) => write.kind === 'put' && hasDuplicates(write.resources)),
];
/** Unknown request is detached and checked; Authoring corrects rejected input before new submission. */
export function validateRequest(input: unknown): Result<CommitRequest> {
  const parsed = parse(commitRequest, boundedClone(input), 'invalid-input');
  if (!parsed.ok) return parsed;
  if (requestRules.some((violated) => violated(parsed.value)))
    return fail('invalid-input', 'expected', 'Duplicate identities or missing write precondition');
  return success(parsed.value);
}
