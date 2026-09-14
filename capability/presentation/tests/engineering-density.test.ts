import { assert, expect, it } from 'vitest';
import { fixture, collection, object, section, value } from './fixtures.js';

/** Complete composite membership must fit before the shared name column, even for long type atoms. */
it('measures combined PK/FK rows and preserves long signatures and addressable fields', async () => {
  const app = (await fixture()).presentation;
  const source = collection({
    objects: [
      object('archive', 'entity', [
        { kind: 'field', id: 'tenant', label: 'tenant_id', type: 'TenantIdentifier' },
        {
          kind: 'field',
          id: 'record',
          label: 'record_id',
          type: 'ExternalArchiveRecordIdentifier',
        },
        { kind: 'keygroup', id: 'identity', key: 'primary', fields: ['tenant', 'record'] },
      ]),
      object('link', 'entity', [
        {
          kind: 'field',
          id: 'tenant',
          label: 'tenant_id',
          type: 'TenantIdentifier',
        },
        {
          kind: 'field',
          id: 'record',
          label: 'external_record_id',
          type: 'ExternalArchiveRecordIdentifier',
        },
        { kind: 'keygroup', id: 'identity', key: 'primary', fields: ['tenant', 'record'] },
        {
          kind: 'keygroup',
          id: 'archiveReference',
          key: 'foreign',
          fields: ['tenant', 'record'],
          references: [
            { object: 'archive', member: 'tenant' },
            { object: 'archive', member: 'record' },
          ],
        },
      ]),
      object('publish', 'function', [
        {
          kind: 'signature',
          id: 'call',
          label: 'publish',
          parameters: ['record: ValidatedArchiveRecord', 'policy: PublicationPolicy'],
          returns: 'Promise<Result<PublicationReceipt, PublicationFailure>>',
        },
      ]),
    ],
    relationships: [
      {
        id: 'references',
        kind: 'association',
        label: 'references archive record',
        source: { object: 'link', member: 'record' },
        target: { object: 'archive', member: 'record' },
        from: '0..many',
        to: '1',
      },
    ],
    sections: [
      section('er', ['archive', 'link', 'publish'], { wires: [{ relationship: 'references' }] }),
    ],
  });
  const before = JSON.stringify(source);
  const projection = value(app.project(source));
  expect(JSON.stringify(source)).toBe(before);
  const link = projection.sections[0]?.nodes.find((node) => node.objectId === 'link');
  const callable = projection.sections[0]?.nodes.find((node) => node.objectId === 'publish');
  assert(link && callable);
  const runs = link.content.primitives.filter((run) => run.kind === 'text');
  const badges = runs.filter((run) => run.text === 'PK/FK');
  expect(badges).toHaveLength(2);
  const names = ['tenant_id:', 'external_record_id:'].map((text) =>
    runs.find((run) => run.text === text),
  );
  names.forEach((name, index) => {
    const badge = badges[index];
    assert(name && badge);
    expect(badge.x + badge.width).toBeLessThan(name.x);
    expect(badge.y).toBe(name.y);
  });
  expect(names[0]?.x).toBe(names[1]?.x);
  expect(link.content.anchors.map((anchor) => anchor.member)).toEqual(['tenant', 'record']);
  expect(
    link.content.anchors.every((anchor) => anchor.y > link.headerHeight && anchor.y < link.height),
  ).toBe(true);
  expect(projection.sections[0]?.wires[0]?.source.member).toBe('record');
  expect(projection.sections[0]?.wires[0]?.target.member).toBe('record');
  const type = runs.find((run) => run.text === 'ExternalArchiveRecordIdentifier');
  assert(type);
  expect(type.x + type.width).toBeLessThan(link.width);
  expect(callable.content.outline).toContain(
    'publish(record: ValidatedArchiveRecord, policy: PublicationPolicy): Promise<Result<PublicationReceipt, PublicationFailure>>',
  );
  const signature = callable.content.primitives
    .filter((run) => run.kind === 'text')
    .slice(2)
    .map((run) => run.text)
    .join(' ');
  expect(signature).toBe(
    'publish(record: ValidatedArchiveRecord, policy: PublicationPolicy): Promise<Result<PublicationReceipt, PublicationFailure>>',
  );
  expect(callable.content.anchors[0]?.member).toBe('call');
  expect(callable.content.anchors[0]?.y).toBeGreaterThan(callable.headerHeight);
});
