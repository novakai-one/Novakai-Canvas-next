import { z } from 'zod';
import { identity } from '../brands.js';
/** Unknown requests receive complete defaults before a lease is acquired. */
export const scopeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('all') }),
  z.strictObject({ kind: z.literal('section'), id: identity }),
]);
export const requestSchema = z
  .strictObject({
    identity: z.strictObject({ collectionId: identity, revision: z.number().int().nonnegative() }),
    format: z.enum(['svg', 'png', 'pdf', 'html', 'bundle']),
    scope: scopeSchema.default({ kind: 'all' }),
    scale: z.number().min(1).max(4).default(1),
    paper: z.enum(['A4', 'Letter']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  })
  .readonly();
export type ExportRequest = z.infer<typeof requestSchema>;
export type Scope = z.infer<typeof scopeSchema>;
export type Format = ExportRequest['format'];
/** Cancellation is observed at stage boundaries; bounded native work is not preemptible. */
export interface Cancellation {
  readonly aborted: boolean;
}
