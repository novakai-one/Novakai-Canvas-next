import {
  validate as validateModel,
  plan as planModel,
  type Collection,
} from '@novakai/canvas-model';
import { validate as validateLibrary } from '@novakai/canvas-library';
import {
  proposalSchema,
  plannerId,
  failure,
  type CandidateValidator,
  type IntentPlanner,
  type Result,
  type Snapshot,
  type StoredRecord,
  type ReadVersion,
  type Proposal,
} from '../contract/index.js';
/** Scripted writes intentionally isolate Authoring guards; all successful candidates still pass real domain owners. */
export const fixturePlanner: IntentPlanner = {
  id: plannerId.parse('fixture'),
  plan: async (request) => readProposal(request.intent),
};
/** Schema failure is explicit even in the protocol harness; Vitest owns invalid fixture construction. */
function readProposal(intent: import('../contract/index.js').Intent): Result<Proposal> {
  if (intent.kind !== 'change')
    return failure('invalid-input', 'intent', 'Fixture requires change');
  const parsed = proposalSchema.safeParse(intent.payload);
  if (!parsed.success) return failure('invalid-input', 'payload', 'Fixture payload malformed');
  return { ok: true, value: parsed.data };
}
/** Public Model validates all collection semantics; empty planning also proves owner transition compatibility. */
function checkedCollection(record: StoredRecord): Result<Collection> {
  const result = validateModel(record.value);
  if (!result.ok) return failure('invariant-violation', 'collection', 'Model rejected candidate');
  const planned = planModel(result.value, []);
  if (!planned.ok)
    return failure('invariant-violation', 'collection', 'Model rejected empty transition');
  return { ok: true, value: planned.value.candidate };
}
/** Library receives derived search DTOs, not a second writable copy of collection content. */
function projection(collection: Collection): unknown {
  return {
    id: collection.id,
    revision: collection.revision,
    title: collection.title,
    description: collection.description ?? '',
    sections: collection.sections.map((section) => ({ id: section.id, title: section.title })),
    objects: collection.objects.map((object) => ({
      id: object.id,
      label: object.label,
      description: '',
      visibleIn: [],
    })),
  };
}
/** Pristine/deleted workspace may have no live catalog; every live collection requires the unique catalog. */
function validateInventory(snapshot: Snapshot, collections: readonly Collection[]): Result<void> {
  const catalogs = snapshot.records.filter(
    (record) => record.key.kind === 'catalog' && !record.deleted,
  );
  if (catalogs.length === 0 && collections.length === 0) return { ok: true, value: undefined };
  const result = validateLibrary({
    catalog: catalogs[0]?.value,
    collections: collections.map(projection),
    recent: [],
  });
  return checkedInventory(catalogs.length, result.ok);
}
/** Keep catalog count and owner validity explicit for the independent oracle. */
function checkedInventory(count: number, valid: boolean): Result<void> {
  if (count !== 1 || !valid)
    return failure('invariant-violation', 'catalog', 'Library rejected catalog membership');
  return { ok: true, value: undefined };
}
/** Accumulate real owner values only after all collection validations succeed. */
function validateCollections(snapshot: Snapshot): Result<readonly Collection[]> {
  const results = snapshot.records
    .filter((record) => record.key.kind === 'collection' && !record.deleted)
    .map(checkedCollection);
  const rejected = results.find((result) => !result.ok);
  if (rejected && !rejected.ok) return rejected;
  return { ok: true, value: results.flatMap((result) => (result.ok ? [result.value] : [])) };
}
/** Catalog read protects inventory phantoms; collection-only edits need not depend on unrelated content revisions. */
function dependencies(before: Snapshot): readonly ReadVersion[] {
  const catalog = before.records.find((record) => record.key.kind === 'catalog');
  if (!catalog) return [];
  return [{ key: catalog.key, version: catalog.version }];
}
/** Real domain-owner validation is mandatory after planner output and revision stamping. */
export const domainValidator: CandidateValidator = {
  validate: async (before, after) => {
    const collections = validateCollections(after);
    if (!collections.ok) return collections;
    const inventory = validateInventory(after, collections.value);
    if (!inventory.ok) return inventory;
    return { ok: true, value: dependencies(before) };
  },
};
