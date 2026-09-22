import { assert, expect } from 'vitest';
import { controller, memoryRetention, deferred, response } from './recovery-fixtures.js';
import type { Snapshot, RenderDocument, TransportResponse } from '../contract/records/owners.js';
import type { Result } from '../contract/errors.js';
/** Host5 continuation: controlled delivery of real owner output proves restart isolation and camera continuity. */
export async function verifyRenderGeneration(
  document: RenderDocument,
  snapshot: Snapshot,
): Promise<void> {
  let generation = 'first-service';
  let renders = 0;
  const delayed = deferred<Result<TransportResponse>>();
  const current = deferred<void>();
  async function renderResponse(path: string) {
    if (path.split('?')[0] === '/api/v1/workspace') return response(snapshot, generation);
    renders += 1;
    if (renders === 2) return delayed.promise;
    return response(document, generation);
  }
  const host = controller(
    {
      get: async (path) => {
        if (path === '/api/v1/history') return response(null, generation);
        return renderResponse(path);
      },
      post: async () => {
        throw new Error('A render cannot submit an edit');
      },
      changes: () => () => undefined,
    },
    memoryRetention(),
  );
  await host.start();
  await host.open(document.collection.id);
  const active = host.getSnapshot().active;
  assert(active);
  const positioned = active.session.dispatch({
    kind: 'viewport',
    camera: { ...active.session.getSnapshot().camera, x: 23, y: 41, zoom: 1.2 },
  });
  assert(positioned.ok, JSON.stringify(positioned));
  const camera = active.session.getSnapshot().camera;
  const stop = host.subscribe(() => {
    if (host.getSnapshot().active?.generation === 'second-service') current.resolve();
  });
  generation = 'second-service';
  await host.refresh();
  expect(host.getSnapshot().active?.generation).toBe('first-service');
  delayed.resolve(
    response({ broken: 'old-generation output must never be decoded' }, 'first-service'),
  );
  await current.promise;
  expect(host.getSnapshot().problem).toBeNull();
  expect(host.getSnapshot().active?.session).toBe(active.session);
  expect(active.session.getSnapshot().camera).toEqual(camera);
  expect(host.getSnapshot().active?.document.collection).toEqual(document.collection);
  stop();
  host.dispose();
  // Later snapshot requests win even when an older response carries another generation.
  const old = deferred<Result<TransportResponse>>();
  let reads = 0;
  const ordered = controller(
    {
      get: async () => {
        reads += 1;
        if (reads === 1) return old.promise;
        return response(snapshot, 'latest-service');
      },
      post: async () => {
        throw new Error('Snapshot reads cannot submit');
      },
      changes: () => () => undefined,
    },
    memoryRetention(),
  );
  const earlier = ordered.refresh();
  await ordered.refresh();
  old.resolve(response(snapshot, 'obsolete-service'));
  await earlier;
  expect(ordered.getSnapshot().generation).toBe('latest-service');
  ordered.dispose();
}
