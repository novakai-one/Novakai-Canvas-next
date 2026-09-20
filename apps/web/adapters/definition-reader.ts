import { z } from 'zod';
import { definitionSchema, validate, type Collection } from '@novakai/canvas-model';
import { capturedCollectionBaseSchema } from '../contract/schemas/editor-recovery.js';
import type { DefinitionDraft } from '../contract/records/definitions.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';

const draftSchema = z.strictObject({
  kind: z.literal('definition-draft'),
  schemaVersion: z.literal(1),
  key: z.string(),
  base: capturedCollectionBaseSchema,
  generation: z.string(),
  collection: z.string(),
  definition: definitionSchema,
  operation: z.enum(['create', 'replace', 'remove']),
});

export function readDefinitionDrafts(input: unknown): Result<readonly DefinitionDraft[]> {
  const parsed = z.array(z.unknown()).max(1000).safeParse(input);
  if (!parsed.success)
    return failure('invalid-definition-draft', 'Stored definition drafts must be a bounded list');
  const records = parsed.data.map((item) => readDraft(item));
  const rejected = records.find((item) => !item.ok);
  if (rejected) return rejected;
  return { ok: true, value: records.flatMap((item) => (item.ok ? [item.value] : [])) };
}

function readDraft(input: unknown): Result<DefinitionDraft> {
  const parsed = readRecord(input);
  if (!parsed.ok) return parsed;
  const collection = admitDraft(parsed.value);
  if (!collection.ok) return collection;
  return {
    ok: true,
    value: {
      key: parsed.value.key,
      base: parsed.value.base,
      generation: parsed.value.generation,
      collection: collection.value,
      definition: parsed.value.definition,
      operation: parsed.value.operation,
    },
  };
}

function admitDraft(record: z.infer<typeof draftSchema>): Result<Collection> {
  const collection = validate(record.base.record.value);
  if (!collection.ok)
    return failure('invalid-definition-draft', 'The retained definition base is invalid');
  const identity = checkIdentity(
    record.operation,
    collection.value.definitions.some((item) => item.id === record.definition.id),
  );
  if (!identity.ok) return identity;
  return collection;
}

function readRecord(input: unknown): Result<z.infer<typeof draftSchema>> {
  const parsed = draftSchema.safeParse(input);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : failure('invalid-definition-draft', 'A retained definition draft is invalid');
}

function checkIdentity(
  operation: 'create' | 'replace' | 'remove',
  original: boolean,
): Result<void> {
  if (original !== (operation !== 'create'))
    return failure('invalid-definition-draft', `The ${operation} definition identity is invalid`);
  return { ok: true, value: undefined };
}
