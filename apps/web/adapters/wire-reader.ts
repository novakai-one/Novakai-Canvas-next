import { z } from 'zod';
import { objectId, descendantId, validate } from '@novakai/canvas-model';
import { snapshotSchema } from '@novakai/canvas-authoring';
import type { WireDraft, WireEdit } from '../contract/records/wire-editor.js';
import type { Collection } from '../contract/records/owners.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
import { wireDraftKey } from '../contract/api.js';
/** Recovery admits unfinished text, but never arbitrary fields or untyped endpoint identities. */
const command: z.ZodType<WireEdit> = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.enum(['label', 'guard', 'effect']), value: z.string() }),
  z.strictObject({
    kind: z.literal('relationship-kind'),
    value: z.enum([
      'flow',
      'association',
      'imports',
      'calls',
      'implements',
      'contains',
      'parent',
      'reference',
      'transition',
    ]),
  }),
  z.strictObject({ kind: z.literal('style'), value: z.enum(['solid', 'dashed']) }),
  z.strictObject({
    kind: z.literal('endpoint'),
    side: z.enum(['source', 'target']),
    value: z.strictObject({ object: objectId, member: descendantId.optional() }),
  }),
  z.strictObject({
    kind: z.literal('cardinality'),
    side: z.enum(['from', 'to']),
    value: z.enum(['none', '0..1', '1', '0..many', '1..many']),
  }),
  z.strictObject({ kind: z.literal('route'), value: z.enum(['orthogonal', 'curve']) }),
  z.strictObject({ kind: z.literal('locked'), value: z.boolean() }),
  z.strictObject({
    kind: z.literal('side'),
    side: z.enum(['sourceSide', 'targetSide']),
    value: z.enum(['auto', 'top', 'right', 'bottom', 'left']),
  }),
  z.strictObject({ kind: z.literal('automatic-route') }),
]);
const record = z.object({
  key: z.string(),
  base: snapshotSchema,
  generation: z.string(),
  collection: z.object({ id: z.string() }),
  section: z.object({ id: z.string() }),
  relationship: z.object({ id: z.string() }),
  edits: z.array(command).readonly(),
});
/** Recover originals from the captured authoritative snapshot; duplicated browser payloads never override them. */
function readDraft(input: unknown): Result<WireDraft> {
  const parsed = record.safeParse(input);
  if (!parsed.success) return invalid('A retained wire form could not be read');
  const value = parsed.data;
  const original = value.base.records.find(
    (item) =>
      item.key.kind === 'collection' && item.key.id === value.collection.id && !item.deleted,
  );
  return captured(value, original?.value);
}
/** Model owns the validity of the captured base before any UI command is replayed. */
function captured(value: z.infer<typeof record>, input: unknown): Result<WireDraft> {
  const collection = validate(input);
  if (!collection.ok) return invalid('The wire form has no valid captured collection');
  return originalWire(value, collection.value);
}
/** Retained identities must resolve within the same section and collection. */
function originalWire(value: z.infer<typeof record>, collection: Collection): Result<WireDraft> {
  const section = collection.sections.find((item) => item.id === value.section.id);
  const relationship = collection.relationships.find((item) => item.id === value.relationship.id);
  if (section === undefined) return invalid('The captured diagram is missing');
  if (relationship === undefined) return invalid('The captured relationship is missing');
  const wire = section.wires.find((item) => item.relationship === relationship.id);
  return checkedWire(value, collection, section, relationship, wire);
}
/** The generated Canvas target is not needed for recovery: Model submission uses only canonical identity. */
function checkedWire(
  value: z.infer<typeof record>,
  collection: Collection,
  section: WireDraft['section'],
  relationship: WireDraft['relationship'],
  wire: WireDraft['wire'] | undefined,
): Result<WireDraft> {
  if (wire === undefined) return invalid('The captured wire appearance is missing');
  const key = wireDraftKey(collection.id, section.id, relationship.id);
  if (key !== value.key)
    return invalid('The retained wire identity does not match its captured scope');
  return { ok: true, value: { ...value, collection, section, relationship, wire, key } };
}
/** Corrupt retention remains available for explicit recovery; it is never overwritten by the reader. */
function invalid(message: string): Result<never> {
  return failure('invalid-wire-draft', `${message}; stored data was retained`);
}
/** Read all forms atomically; a malformed entry cannot disappear unnoticed. */
export function readWireDrafts(input: unknown): Result<readonly WireDraft[]> {
  const parsed = z.array(z.unknown()).max(1000).safeParse(input);
  if (!parsed.success) return invalid('Wire forms must be a bounded list');
  const results = parsed.data.map(readDraft);
  const rejected = results.find((result) => !result.ok);
  if (rejected) return rejected;
  return { ok: true, value: results.flatMap((result) => (result.ok ? [result.value] : [])) };
}
