import { z } from 'zod';
import { requestSchema, receiptSchema } from '@novakai/canvas-authoring';
import type { SubmissionReaders } from '../contract/records/submission.js';
import { failure } from '../contract/errors.js';
const submission = z.strictObject({
  request: requestSchema,
  generation: z.string().min(1),
  sourceEdit: z.number().int().nonnegative(),
  gesture: z.string().nullable(),
  state: z.enum(['sending', 'uncertain', 'retryable', 'rejected']),
});
/** Browser records are untrusted after restart; schemas admit their full request before recovery offers an action. */
export function createSubmissionReaders(): SubmissionReaders {
  return {
    pending: (input) => {
      const result = z.array(submission).max(100).safeParse(input);
      if (!result.success)
        return failure('invalid-recovery', 'Retained requests could not be read safely');
      return { ok: true, value: result.data };
    },
    receipt: readReceipt,
  };
}
/** Null is a valid lookup result; non-null values require schema and request-identity admission. */
function readReceipt(
  input: unknown,
  request: import('../contract/records/owners.js').Request,
): ReturnType<SubmissionReaders['receipt']> {
  if (input === null) return { ok: true, value: null };
  const result = receiptSchema.safeParse(input);
  if (!result.success)
    return failure('invalid-receipt', 'The response did not contain an Authoring receipt');
  return matchingReceipt(result.data, request);
}
/** A valid receipt for another request cannot confirm this local draft. */
function matchingReceipt(
  receipt: import('../contract/records/owners.js').Receipt,
  request: import('../contract/records/owners.js').Request,
): ReturnType<SubmissionReaders['receipt']> {
  if (receipt.request !== request.request)
    return failure('invalid-receipt', 'The receipt belongs to a different request');
  return { ok: true, value: receipt };
}
