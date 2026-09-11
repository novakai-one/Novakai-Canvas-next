import { it, expect, vi } from 'vitest';
import type { Result } from '../contract/index.js';
import { request, value, rejects, abcDigest } from './fixtures.js';
import { harness, faultStore } from './storage-harness.js';
import { resources, failure } from './resource-harness.js';

it('backs up exactly retained resources under a verified released lease', async () => {
  const source = harness('memory');
  value(
    source.persistence.commit({
      ...request(),
      writes: [
        {
          ...request().writes[0],
          kind: 'put',
          key: request().expected[0]?.key,
          value: { title: 'Media' },
          resources: [abcDigest],
        },
      ],
    }),
  );
  const provider = resources();
  const bundle = value(await source.persistence.backup(provider));
  expect(provider.acquire).toHaveBeenCalledWith([abcDigest]);
  expect(bundle.blobs).toEqual([{ digest: abcDigest, base64: 'YWJj' }]);
  expect(provider.release).toHaveBeenCalledTimes(1);
  provider.read.mockResolvedValueOnce({ ok: true, value: 'YmFk' });
  rejects(await source.persistence.backup(provider), 'corrupt-record');
  expect(provider.release).toHaveBeenCalledTimes(2);
  value(source.persistence.close());
  source.remove();
});
it('validates domain and resource coverage before pristine destination installation', async () => {
  const source = harness('memory');
  const destination = harness('file');
  value(source.persistence.commit(request()));
  const provider = resources();
  const bundle = value(await source.persistence.backup(provider));
  const domain = vi.fn(async (): Promise<Result<void>> => ({ ok: true, value: undefined }));
  rejects(
    await destination.persistence.restore(
      { ...bundle, blobs: [{ digest: abcDigest, base64: 'YWJj' }] },
      provider,
      domain,
    ),
    'corrupt-record',
  );
  expect(domain).not.toHaveBeenCalled();
  const rejectDomain = vi.fn(async (): Promise<Result<void>> => failure('corrupt-record'));
  rejects(await destination.persistence.restore(bundle, provider, rejectDomain), 'corrupt-record');
  expect(provider.reserve).not.toHaveBeenCalled();
  value(await destination.persistence.restore(bundle, provider, domain));
  expect(domain).toHaveBeenCalledWith(bundle.state);
  expect(value(destination.persistence.readSnapshot())).toEqual(bundle.state);
  rejects(await destination.persistence.restore(bundle, provider, domain), 'destination-not-empty');
  value(source.persistence.close());
  value(destination.persistence.close());
  source.remove();
  destination.remove();
});
it('preserves destination on staging/racing failures and always releases acquired leases', async () => {
  const source = harness('memory');
  const destination = harness('memory');
  value(
    source.persistence.commit({
      ...request(),
      writes: [{ kind: 'put', key: request().expected[0]?.key, value: {}, resources: [abcDigest] }],
    }),
  );
  const provider = resources();
  const bundle = value(await source.persistence.backup(provider));
  provider.stage.mockResolvedValueOnce(failure('storage-unavailable'));
  const domain = async (): Promise<Result<void>> => ({ ok: true, value: undefined });
  rejects(await destination.persistence.restore(bundle, provider, domain), 'storage-unavailable');
  expect(value(destination.persistence.readSnapshot()).sequence).toBe(0);
  expect(provider.release).toHaveBeenCalledTimes(2);
  provider.stage.mockImplementationOnce(async () => {
    value(destination.persistence.commit(request('race')));
    return { ok: true, value: undefined };
  });
  rejects(await destination.persistence.restore(bundle, provider, domain), 'destination-not-empty');
  expect(value(destination.persistence.receipt('race'))).not.toBeNull();
  provider.read.mockRejectedValueOnce(new Error('Provider failed'));
  rejects(await source.persistence.backup(provider), 'storage-unavailable');
  expect(provider.release).toHaveBeenCalledTimes(4);
  const uncertain = faultStore('after-commit');
  rejects(await uncertain.persistence.restore(bundle, provider, domain), 'storage-unavailable');
  expect(uncertain.inspect()).toEqual(bundle.state);
  expect(provider.release).toHaveBeenCalledTimes(5);
  uncertain.close();
  value(source.persistence.close());
  value(destination.persistence.close());
  source.remove();
  destination.remove();
});
