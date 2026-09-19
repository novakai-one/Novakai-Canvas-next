import { snapshotSchema } from '@novakai/canvas-authoring';
import { z } from 'zod';

/** Owner schemas are reused through the public Authoring contract. */
export const capturedCollectionBaseSchema = z.strictObject({
  kind: z.literal('captured-collection'),
  schemaVersion: z.literal(1),
  workspace: snapshotSchema.shape.workspace,
  sequence: snapshotSchema.shape.sequence,
  record: snapshotSchema.shape.records.element,
});

export const editingBaseSchema = z.union([capturedCollectionBaseSchema, snapshotSchema]);

export function hasRecoveryTag(input: unknown): boolean {
  if (typeof input !== 'object' || input === null) return false;
  return 'kind' in input || 'schemaVersion' in input;
}
