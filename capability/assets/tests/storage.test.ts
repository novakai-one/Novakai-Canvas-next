import { it, expect } from 'vitest';
import { openAssets, createAssets } from '../contract/index.js';
import { harness } from './harness.js';
import { submission, value, rejects, unavailable } from './fixtures.js';

it('reopens durable files and refuses missing or corrupted exact resources', async () => {
  const fixture = harness();
  const admission = value(await fixture.assets.stage(submission()));
  const id = admission.descriptor.digest;
  const before = value(fixture.assets.resolve(id));
  value(fixture.assets.close());
  const reopened = value(openAssets(fixture.root));
  expect(value(reopened.resolve(id))).toEqual(before);
  fixture.corrupt(id);
  rejects(reopened.resolve(id), 'corrupt-asset');
  rejects(await reopened.stage(submission()), 'corrupt-asset');
  fixture.unlink(id);
  rejects(reopened.resolve(id), 'missing-asset');
  value(reopened.close());
  fixture.removeSchema();
  rejects(openAssets(fixture.root), 'corrupt-asset');
});
it('returns typed native-open and reachability failures without false collection success', async () => {
  const fixture = harness();
  const id = value(await fixture.assets.stage(submission())).descriptor.digest;
  rejects(fixture.assets.collectUnreferenced(unavailable), 'storage-unavailable');
  const failing = createAssets({
    ...fixture.deps,
    storage: { transact: unavailable, close: unavailable },
  });
  rejects(await failing.stage(submission()), 'storage-unavailable');
  expect(value(fixture.assets.resolve(id)).descriptor.digest).toBe(id);
  rejects(
    openAssets(fixture.root, {
      files: () => {
        throw new Error('Disk unavailable');
      },
      database: () => {
        throw new Error('No database');
      },
    }),
    'storage-unavailable',
  );
  rejects(
    fixture.assets.collectUnreferenced(() => {
      throw new Error('Reader failed');
    }),
    'storage-unavailable',
  );
  expect(value(fixture.assets.resolve(id)).descriptor.digest).toBe(id);
});
