import { expect, assert } from 'vitest';
import {
  createAuthoring,
  recordId,
  workspaceId,
  digest,
  requestId,
  actorId,
  plannerId,
  requestSchema,
  type Authoring,
  type Dependencies,
  type Json,
  type Request,
  type Snapshot,
  type StoredRecord,
  type RecordKey,
  type Write,
  type Result,
  type Receipt,
} from '../contract/index.js';
import { createNodeIdentity } from '../adapters/node-identity.js';
import { openStore, storageRoles } from './storage-fixture.js';
import { fixturePlanner, domainValidator } from './domain-fixture.js';
import type { Persistence } from '@novakai/canvas-persistence';
export const workspace = workspaceId.parse('workspace');
export const media = digest.parse('a'.repeat(64));
export const alternate = digest.parse('b'.repeat(64));
/** Vitest owns assertion failure reporting; never continue with a default successful value. */
export function value<T>(result: Result<T>): T {
  assert(result.ok, JSON.stringify(result));
  return result.value;
}
/** Failure expectations use specified categories, not implementation message substrings. */
export function rejects(result: Result<unknown>, code: string): void {
  expect(result).toMatchObject({ ok: false, error: { code } });
  expect(result).not.toHaveProperty('value');
}
/** Checked key construction follows public interchange rather than importing private helpers. */
export function key(kind: RecordKey['kind'], id: string): RecordKey {
  return { kind, id: recordId.parse(id) };
}
/** Independent stable scene seed includes a real Model-valid flow and its pinned theme. */
export function diagram(
  id = 'demo',
  title = 'Original',
  themeDigest: import('../contract/index.js').Digest = media,
): Json {
  return {
    schemaVersion: 1,
    id,
    revision: 0,
    title,
    theme: { id: 'paper', version: '1', digest: `sha256:${themeDigest}`, roles: ['neutral'] },
    arrangement: { algorithm: 'grid', constraints: [] },
    objects: [
      { id: 'a', kind: 'step', label: 'Start' },
      { id: 'b', kind: 'step', label: 'End' },
    ],
    relationships: [
      {
        id: 'ab',
        kind: 'flow',
        label: 'continues',
        source: { object: 'a' },
        target: { object: 'b' },
      },
    ],
    sections: [
      {
        id: 'main',
        title: 'Process',
        mode: 'flow',
        layout: { algorithm: 'flow', constraints: [] },
        appearances: [{ object: 'a' }, { object: 'b' }],
        wires: [{ relationship: 'ab' }],
      },
    ],
  };
}
/** One catalog entry for every live collection; no duplicate mutable titles. */
export function catalog(ids: readonly string[]): Json {
  return {
    schemaVersion: 1,
    id: 'catalog',
    revision: 0,
    folders: [],
    entries: ids.map((collection) => ({ collection, order: 0, archived: false })),
  };
}
/** Independent test put builder; production users author semantic intents, not storage operations. */
export function put(
  kind: RecordKey['kind'],
  id: string,
  data: Json,
  resources: readonly import('../contract/index.js').Digest[] = [],
): Write {
  return { kind: 'put', key: key(kind, id), value: data, resources };
}
/** Checked scripted planner payload exercises admission protocol; it is never registered in production. */
export function request(
  snapshot: Snapshot,
  id: string,
  writes: readonly Write[],
  extra: Readonly<Record<string, Json>> = {},
): Request {
  const targets = writes.map((write) => write.key);
  return requestSchema.parse({
    workspace,
    request: requestId.parse(id),
    actor: { id: actorId.parse('human'), kind: 'human' },
    version: 1,
    scope: targets,
    expected: targets.map((target) => observed(snapshot, target)),
    assets: [],
    intent: {
      kind: 'change',
      planner: plannerId.parse('fixture'),
      payload: { writes, reads: [], diff: { kind: 'change' }, warnings: [] },
    },
    ...extra,
  });
}
/** Snapshot observation includes tombstone tokens instead of pretending deletion means never seen. */
export function observed(
  snapshot: Snapshot,
  target: RecordKey,
): { readonly key: RecordKey; readonly version: number | 'absent' } {
  const found = snapshot.records.find(
    (record) => record.key.kind === target.kind && record.key.id === target.id,
  );
  if (!found) return { key: target, version: 'absent' };
  return { key: target, version: found.version };
}
/** Test assertions fail immediately when a required stored participant is absent. */
export function record(snapshot: Snapshot, target: RecordKey): StoredRecord {
  const found = snapshot.records.find(
    (item) => item.key.kind === target.kind && item.key.id === target.id,
  );
  assert(found, JSON.stringify(target));
  return found;
}
export interface Harness {
  readonly api: Authoring;
  readonly deps: Dependencies;
  readonly store: Persistence;
}
/** Real SQLite plus public Model/Library admission; scripted resource/geometry roles expose protocol faults explicitly. */
export function harness(overrides: Partial<Dependencies> = {}): Harness {
  const store = openStore();
  const deps: Dependencies = {
    ...storageRoles(store),
    ...createNodeIdentity(undefined, () => 1000),
    planners: [fixturePlanner],
    validation: domainValidator,
    resources: {
      acquire: async () => ({
        ok: true,
        value: {
          pins: { theme: 'paper@1' },
          reads: [],
          covered: [media, alternate],
          release: async () => ({ ok: true, value: undefined }),
        },
      }),
    },
    feasibility: {
      check: async () => ({ ok: true, value: { warnings: [], diff: [], preview: null } }),
    },
    cancellation: { cancelled: () => false },
    notifications: { publish: async () => ({ ok: true, value: undefined }) },
    ...overrides,
  };
  return { api: createAuthoring(deps), deps, store };
}
/** Bootstrap exercises atomic collection/catalog admission before later test actions. */
export async function seed(h: Harness, ids: readonly string[] = ['demo']): Promise<Receipt> {
  const before = value(await h.api.read(workspace));
  return value(
    await h.api.apply(
      request(before, 'seed', [
        ...ids.map((id) => put('collection', id, diagram(id), [media])),
        put('catalog', 'catalog', catalog(ids)),
      ]),
    ),
  );
}
/** Independent live-count oracle ignores retained history and storage tombstones. */
export function liveCollections(snapshot: Snapshot): readonly StoredRecord[] {
  return snapshot.records.filter((record) => record.key.kind === 'collection' && !record.deleted);
}
