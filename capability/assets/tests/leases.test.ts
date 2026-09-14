import { it, expect } from 'vitest';
import { createAssets } from '../contract/index.js';
import { harness } from './harness.js';
import { submission, value, rejects, missing, delayedMedia } from './fixtures.js';

it('acquires all requested bytes atomically and releases idempotently', async () => {
  const { assets } = harness();
  const id = value(await assets.stage(submission())).descriptor.digest;
  rejects(assets.acquire([id, missing]), 'missing-asset');
  expect(value(assets.collectUnreferenced(() => ({ ok: true, value: [] }))).removed).toEqual([id]);
  value(await assets.stage(submission()));
  const lease = value(assets.acquire([id, id]));
  expect(value(lease.read(id)).descriptor.digest).toBe(id);
  expect(value(assets.collectUnreferenced(() => ({ ok: true, value: [] }))).retained).toEqual([id]);
  value(lease.release());
  value(lease.release());
  rejects(lease.read(id), 'lease-expired');
});
it('stages exact reserved bytes and rejects membership released during async validation', async () => {
  const source = harness();
  const destination = harness();
  const id = value(await source.assets.stage(submission())).descriptor.digest;
  const bytes = value(source.assets.resolve(id)).base64;
  const lease = value(destination.assets.reserve([id]));
  rejects(await lease.stage(missing, bytes), 'corrupt-asset');
  value(await lease.stage(id, bytes));
  expect(value(destination.assets.resolve(id)).base64).toBe(bytes);
  expect(
    value(destination.assets.collectUnreferenced(() => ({ ok: true, value: [] }))).retained,
  ).toEqual([id]);
  value(lease.release());
  const pause = Promise.resolve();
  const delayed = createAssets({
    ...destination.deps,
    media: delayedMedia(destination.deps.media, pause),
  });
  const pendingLease = value(delayed.reserve([id]));
  const pending = pendingLease.stage(id, bytes);
  value(pendingLease.release());
  rejects(await pending, 'lease-expired');
});
it('collects only unreferenced unleased bytes and handles stage-GC-reserve safely', async () => {
  const fixture = harness();
  const { assets } = fixture;
  const id = value(await assets.stage(submission())).descriptor.digest;
  const bytes = value(assets.resolve(id)).base64;
  expect(value(assets.collectUnreferenced(() => ({ ok: true, value: [id] }))).retained).toEqual([
    id,
  ]);
  expect(value(assets.collectUnreferenced(() => ({ ok: true, value: [] }))).removed).toEqual([id]);
  const reservation = value(assets.reserve([id]));
  rejects(assets.acquire([id]), 'missing-asset');
  value(await reservation.stage(id, bytes));
  const admitted = value(assets.acquire([id]));
  value(reservation.release());
  expect(value(assets.collectUnreferenced(() => ({ ok: true, value: [] }))).retained).toEqual([id]);
  const deadOwners = createAssets({
    ...fixture.deps,
    identity: { ...fixture.deps.identity, ownerAlive: () => false },
  });
  expect(value(deadOwners.collectUnreferenced(() => ({ ok: true, value: [] }))).removed).toEqual([
    id,
  ]);
  rejects(admitted.read(id), 'lease-expired');
});
