import { describe, it, expect } from 'vitest';
import { createExport } from '../contract/index.js';
import { fixture, value, bundle, encoding, failed } from './fixtures.js';
describe('Prepared import isolation', () => {
  it('10 new namespace retains exact semantic references and human placement/route locks', async () => {
    const f = await fixture();
    const artifact = value(await f.bindings.service.exportArtifact(f.request('bundle')));
    const imported = value(
      await f.bindings.service.prepareImport({ bytes: artifact.bytes, targetCollectionId: 'copy' }),
    );
    expect(imported.expected).toBe('absent');
    expect(imported.collection).toEqual({ ...f.snapshot.collection, id: 'copy', revision: 0 });
    expect(imported.collection.sections[0]?.wires[0]).toMatchObject({
      sourceSide: 'right',
      targetSide: 'left',
      locked: true,
      manual: [
        { x: 200, y: 100 },
        { x: 300, y: 100 },
      ],
    });
    expect(f.snapshot.collection.revision).toBe(7);
    const semantic = bundle(artifact.bytes);
    const extra = `node @customer entity "Customer" {field @id "id" type="Id" key=primary}
node @order entity "Order" {field @customer "customer" type="Id" key=foreign references=@customer.@id}
wire @owns @customer.@id -> @order.@customer "owns" kind=association from=1 to=0..many
section @data "ER tables" mode=er {show @customer @order connect @owns}
node @human participant "Human" {} node @agent participant "Agent" {}
section @exchange "Sequence" mode=sequence {show @human @agent event @request @human -> @agent "Request" kind=call activate=true}
`;
    const source = semantic.source.slice(0, semantic.source.lastIndexOf('}')) + extra + '}';
    const manual = {
      ...semantic.manual,
      sections: [
        ...semantic.manual.sections,
        {
          id: 'data',
          appearanceOrder: ['customer', 'order'],
          groupOrder: [],
          sequenceOrder: [],
          appearances: [],
          groups: [],
          wires: [],
        },
        {
          id: 'exchange',
          appearanceOrder: ['human', 'agent'],
          groupOrder: [],
          sequenceOrder: [{ id: 'request', order: 0 }],
          appearances: [],
          groups: [],
          wires: [],
        },
      ],
    };
    const transfer = {
      ...semantic,
      source,
      sourceDigest: encoding.hash(encoding.utf8(source)),
      manual,
      manualDigest: encoding.hash(
        encoding.utf8(JSON.stringify(manual, (_, item) => sortObject(item))),
      ),
    };
    const mixed = value(
      await f.bindings.service.prepareImport({
        bytes: encoding.utf8(JSON.stringify(transfer)),
        targetCollectionId: 'mixed',
      }),
    );
    expect(mixed.collection.objects.find((item) => item.id === 'order')?.content[0]).toMatchObject({
      kind: 'field',
      key: 'foreign',
      references: { object: 'customer', member: 'id' },
    });
    expect(
      mixed.collection.sections.find((item) => item.id === 'exchange')?.sequence[0],
    ).toMatchObject({ id: 'request', source: 'human', target: 'agent', activate: true, order: 0 });

    expect(
      await f.bindings.service.prepareImport({
        bytes: artifact.bytes,
        targetCollectionId: 'engineering',
      }),
    ).toMatchObject({ ok: false, error: { code: 'invalid-import' } });
  });
  it('11 invalid manual targets, semantic source and owner rejection expose no prepared candidate', async () => {
    const f = await fixture();
    const artifact = value(await f.bindings.service.exportArtifact(f.request('bundle')));
    const manifest = bundle(artifact.bytes);
    const section = manifest.manual.sections[0];
    expect(section).toBeDefined();
    const altered = {
      ...manifest,
      manual: {
        ...manifest.manual,
        sections: [...manifest.manual.sections, ...manifest.manual.sections],
      },
    };
    const canonical = (value: unknown): string =>
      JSON.stringify(value, (_, item) => sortObject(item));
    altered.manualDigest = encoding.hash(encoding.utf8(canonical(altered.manual)));
    expect(
      await f.bindings.service.prepareImport({
        bytes: encoding.utf8(JSON.stringify(altered)),
        targetCollectionId: 'copy',
      }),
    ).toMatchObject({ ok: false, error: { code: 'invalid-import' } });
    const missingResource = {
      ...manifest,
      resources: manifest.resources.filter((item) => item.kind !== 'preset'),
    };
    expect(
      await f.bindings.service.prepareImport({
        bytes: encoding.utf8(JSON.stringify(missingResource)),
        targetCollectionId: 'copy',
      }),
    ).toMatchObject({ ok: false, error: { code: 'resource-rejected' } });
    const noParse = createExport({
      ...f.bindings.dependencies,
      documents: { ...f.bindings.dependencies.documents, parse: () => failed() },
    });
    expect(
      (await noParse.prepareImport({ bytes: artifact.bytes, targetCollectionId: 'copy' })).ok,
    ).toBe(false);
    const denied = createExport({
      ...f.bindings.dependencies,
      resources: { inspect: async () => failed('resource-rejected') },
    });
    expect(
      (await denied.prepareImport({ bytes: artifact.bytes, targetCollectionId: 'copy' })).ok,
    ).toBe(false);
    expect(artifact.bytes).toEqual(
      value(await f.bindings.service.exportArtifact(f.request('bundle'))).bytes,
    );
  });
});
/** Independent corruption fixture key ordering matches the declared canonical JSON format. */
function sortObject(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}
