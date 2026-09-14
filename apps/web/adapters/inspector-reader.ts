import { z } from 'zod';
import { descendantId, objectId, validate } from '@novakai/canvas-model';
import { snapshotSchema } from '@novakai/canvas-authoring';
import type { ObjectDraft, ObjectEdit } from '../contract/records/inspector.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
import { objectDraftKey } from '../contract/api.js';
/** Draft command schemas admit unfinished strings; they do not claim domain validity. */
const command: z.ZodType<ObjectEdit> = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.enum(['label', 'role']), value: z.string() }),
  z.strictObject({ kind: z.literal('size'), value: z.enum(['small', 'medium', 'large']) }),
  z.strictObject({
    kind: z.literal('notation'),
    value: z.enum([
      'step',
      'start',
      'end',
      'decision',
      'fork',
      'join',
      'entity',
      'module',
      'interface',
      'function',
      'state',
      'participant',
      'concept',
      'system',
      'note',
    ]),
  }),
  z.strictObject({
    kind: z.literal('content-text'),
    id: descendantId,
    field: z.enum(['label', 'type', 'text', 'returns']),
    value: z.string(),
  }),
  z.strictObject({
    kind: z.literal('field-key'),
    id: descendantId,
    value: z.enum(['none', 'primary', 'foreign', 'unique']),
  }),
  z.strictObject({
    kind: z.literal('field-reference'),
    id: descendantId,
    target: z.strictObject({ object: objectId, member: descendantId.optional() }),
  }),
  z.strictObject({
    kind: z.literal('parameters'),
    id: descendantId,
    value: z.array(z.string()).readonly(),
  }),
  z.strictObject({ kind: z.literal('nullable'), id: descendantId, value: z.boolean() }),
  z.strictObject({ kind: z.literal('remove-content'), id: descendantId }),
  z.strictObject({
    kind: z.literal('add-content'),
    id: descendantId,
    content: z.enum(['text', 'field', 'member', 'signature']),
  }),
]);
const draftRecord = z.strictObject({
  key: z.string(),
  base: snapshotSchema,
  generation: z.string(),
  collection: z.object({ id: z.string() }),
  object: z.object({ id: z.string() }),
  edits: z.array(command).readonly(),
});
/** A stored original is recovered from Model's checked collection, never from an untrusted duplicate object payload. */
function readRecord(input: unknown): Result<ObjectDraft> {
  const parsed = draftRecord.safeParse(input);
  if (!parsed.success)
    return failure(
      'invalid-inspector-draft',
      'An inspector draft could not be read; stored data was retained',
    );
  return readCapturedCollection(parsed.data);
}
/** Recover from the captured authoritative record; duplicated client collection data cannot replace its versioned base. */
function readCapturedCollection(record: z.infer<typeof draftRecord>): Result<ObjectDraft> {
  const original = record.base.records.find(
    (item) =>
      item.key.kind === 'collection' && item.key.id === record.collection.id && !item.deleted,
  );
  if (!original)
    return failure('invalid-inspector-draft', 'The draft snapshot does not contain its collection');
  const collection = validate(original.value);
  if (!collection.ok)
    return failure('invalid-inspector-draft', 'The draft base is not a valid collection');
  return readOriginal(record, collection.value);
}
/** Identity is reconstructed from admitted data, preventing a stored key from aliasing another object's draft. */
function readOriginal(
  record: z.infer<typeof draftRecord>,
  collection: ObjectDraft['collection'],
): Result<ObjectDraft> {
  const object = collection.objects.find((item) => item.id === record.object.id);
  if (!object)
    return failure(
      'invalid-inspector-draft',
      'The draft object is absent from its original collection',
    );
  const key = objectDraftKey(collection.id, object.id);
  if (key !== record.key)
    return failure('invalid-inspector-draft', 'The draft identity does not match its object');
  return { ok: true, value: { ...record, collection, object, key } };
}
/** Each independently checked draft is returned atomically; malformed records never silently disappear. */
export function readInspectorDrafts(input: unknown): Result<readonly ObjectDraft[]> {
  const parsed = z.array(z.unknown()).max(1000).safeParse(input);
  if (!parsed.success)
    return failure('invalid-inspector-draft', 'Stored inspector drafts must be a bounded list');
  const results = parsed.data.map(readRecord);
  const rejected = results.find((result) => !result.ok);
  if (rejected) return rejected;
  return { ok: true, value: results.flatMap((result) => (result.ok ? [result.value] : [])) };
}
