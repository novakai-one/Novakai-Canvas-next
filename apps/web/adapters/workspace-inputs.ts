import { z } from 'zod';
import { snapshotSchema, requestSchema } from '@novakai/canvas-authoring';
import type { Snapshot, Request } from '@novakai/canvas-authoring';
import { validate } from '@novakai/canvas-model';
import type { Collection, Change } from '@novakai/canvas-model';
import type { Language } from '@novakai/canvas-language';
import type { WorkspaceInputs } from '../contract/ports/workspace.js';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
/** Invalid canonical data is surfaced, not hidden as an empty collection. */
function collections(snapshot: Snapshot): Result<readonly Collection[]> {
  const candidates = snapshot.records
    .filter((item) => item.key.kind === 'collection' && !item.deleted)
    .map((item) => validate(item.value));
  if (candidates.some((item) => !item.ok))
    return failure('invalid-workspace', 'A collection failed Model validation');
  return { ok: true, value: candidates.flatMap((item) => (item.ok ? [item.value] : [])) };
}
/** Authoring owns snapshot shape; Model owns each live collection document. */
function snapshot(input: unknown): ReturnType<WorkspaceInputs['snapshot']> {
  const checked = snapshotSchema.safeParse(input);
  if (!checked.success) return failure('invalid-workspace', 'Workspace response was invalid');
  const content = collections(checked.data);
  if (!content.ok) return content;
  return { ok: true, value: { snapshot: checked.data, collections: content.value } };
}
/** Request identity is credential-derived and all expected versions come from the caller's captured snapshot. */
function request(
  snapshot: Snapshot,
  id: string,
  planner: string,
  payload: unknown,
  collection: string,
  create: boolean,
): Result<Request> {
  const key = { kind: 'collection', id: collection };
  const previous = snapshot.records.find(
    (item) => item.key.kind === 'collection' && item.key.id === collection,
  );
  const version = previous?.version ?? 'absent';
  const catalog = snapshot.records
    .filter((item) => item.key.kind === 'catalog' && !item.deleted)
    .map((item) => ({ key: item.key, version: item.version }));
  const expected = create ? [{ key, version: 'absent' }, ...catalog] : [{ key, version }];
  const checked = requestSchema.safeParse({
    workspace: snapshot.workspace,
    request: id,
    version: 1,
    actor: { id: 'human:browser', kind: 'human' },
    assets: [],
    expected,
    scope: expected.map((item) => item.key),
    intent: { kind: 'change', planner, payload },
  });
  if (!checked.success)
    return failure('invalid-request', 'The diagram change could not be prepared');
  return { ok: true, value: checked.data };
}
/** Human starter content is ordinary readable DSL, admitted through the same Language and Authoring path as agent source. */
function newSource(id: string, title: string): string {
  return `canvas 1\ncollection @${id} ${JSON.stringify(title)} theme=paper {\n  node @start start "Start" {}\n  node @step step "Describe the next step" {}\n  node @end end "Done" {}\n  wire @first @start -> @step "begin"\n  wire @next @step -> @end "complete"\n  section @process "Process" mode=flow layout=flow direction=right {\n    show @start @step @end\n    connect @first @next\n  }\n}`;
}
/** Inputs are owner-based translators. Diagram readout and Language printing are supplied at composition, avoiding sibling imports. */
export function createWorkspaceInputs(
  diagram: WorkspaceInputs['diagram'],
  language: Pick<Language, 'print'>,
): WorkspaceInputs {
  return {
    snapshot,
    diagram,
    newSource,
    library: libraryRequest,
    sourceRecovery: (input) => {
      const checked = z
        .strictObject({
          source: z.string(),
          snapshot: snapshotSchema,
          generation: z.string(),
          collection: z.string(),
          edit: z.number().int().nonnegative(),
        })
        .safeParse(input);
      if (!checked.success)
        return failure(
          'invalid-recovery',
          'Stored source draft is invalid; it was preserved for recovery',
        );
      return { ok: true, value: checked.data };
    },
    dsl: (snapshot, collection, source, mode, id) =>
      request(snapshot, id, 'dsl', { source, mode }, collection, mode === 'create'),
    model: (snapshot, collection, changes: readonly Change[], id) =>
      request(snapshot, id, 'model', { collection, changes }, collection, false),
    source: (collection) => {
      const result = language.print({ collection, scope: { kind: 'all' } });
      if (!result.ok)
        return failure(
          'source-unavailable',
          'Language could not print this collection',
          result.error,
        );
      return { ok: true, value: result.value.source };
    },
  };
}

/** Organization changes acquire only the observed catalog's write scope; Library owns their validation. */
function libraryRequest(
  snapshot: Snapshot,
  changes: readonly import('@novakai/canvas-library').CatalogChange[],
  id: string,
): Result<Request> {
  const expected = snapshot.records
    .filter((item) => item.key.kind === 'catalog' && !item.deleted)
    .map((item) => ({ key: item.key, version: item.version }));
  const parsed = requestSchema.safeParse({
    version: 1,
    workspace: snapshot.workspace,
    request: id,
    actor: { id: 'human:browser', kind: 'human' },
    assets: [],
    expected,
    scope: expected.map((item) => item.key),
    intent: { kind: 'change', planner: 'library', payload: { changes } },
  });
  if (!parsed.success)
    return failure('invalid-library-request', 'The catalog change could not be prepared');
  return { ok: true, value: parsed.data };
}
