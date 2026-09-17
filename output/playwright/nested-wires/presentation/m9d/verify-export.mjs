/** Real native SVG export through public contracts, with a previously admitted corpus snapshot. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { validate, plan, stage } from '../../../../../capability/model/contract/index.ts';
import { createLanguage } from '../../../../../capability/language/contract/index.ts';
import {
  createReactBindings,
  readMeasuredProjection,
  readSupplementalMeasurements,
  readMeasuredContent,
} from '../../../../../capability/presentation/contract/index.ts';
import { composeExport } from '../../../../../capability/export/contract/index.ts';
import {
  readScene,
  defaultEngineVersions,
} from '../../../../../capability/layout/contract/index.ts';
const out = new URL('./', import.meta.url);
const root = new URL('../../../../../', import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL('resources/examples/showcase/manifest.json', root), 'utf8'),
);
const id =
  manifest.examples.find((e) => e.collectionId.includes('module'))?.collectionId ??
  manifest.examples[0].collectionId;
const input = JSON.parse(
  gunzipSync(
    await readFile(
      new URL('quality/agent-diagrams/visual-quality/stage-5/inputs/' + id + '.json.gz', root),
    ),
  ),
);
const accepted = (result) => {
  assert(result.ok, JSON.stringify(result));
  return result.value;
};
const collection = accepted(validate(input.payload.collection));
const domain = { read: validate };
const projection = accepted(readMeasuredProjection(input.payload.projection, collection, domain));
const measurements = accepted(readSupplementalMeasurements(input.payload.measurements));
const scene = accepted(
  readScene(
    { projection, measurements, options: input.payload.options, candidate: input.payload.scene },
    {
      engineVersions: defaultEngineVersions,
      projection: {
        read: (value) => readMeasuredProjection(value, collection, domain),
        content: readMeasuredContent,
      },
    },
  ),
);
const snapshot = {
  identity: {
    collectionId: collection.id,
    revision: collection.revision,
    inputKey: scene.inputKey,
    title: collection.title,
  },
  collection,
  scene,
  resources: input.resources.map(({ base64, ...r }) => ({
    ...r,
    bytes: Buffer.from(base64, 'base64'),
  })),
  paint: {
    fill: input.payload.style.surface,
    text: input.payload.style.text,
    stroke: input.payload.style.border,
  },
};
const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
const pins = {
  themes: { [collection.theme.id]: collection.theme },
  assets: Object.fromEntries(collection.assets.map((a) => [a.id, a])),
};
const bindings = composeExport({
  presentation: accepted(await createReactBindings(input.payload.fonts)),
  snapshots: {
    acquire: async () => ({
      ok: true,
      value: { snapshot, release: async () => ({ ok: true, value: undefined }) },
    }),
  },
  documents: {
    read: validate,
    print: (input) => ({
      ok: true,
      value: accepted(language.print({ collection: input, scope: { kind: 'all' } })).source,
    }),
    parse: (source) => ({
      ok: true,
      value: accepted(language.lower({ source, mode: 'create', snapshot: null, resources: pins }))
        .collection,
    }),
  },
  resources: { inspect: async (items) => ({ ok: true, value: items }) },
  readerCss: await readFile(new URL('capability/export/adapters/html/reader.css', root), 'utf8'),
});
const request = {
  identity: { collectionId: collection.id, revision: collection.revision },
  format: 'svg',
};
const first = accepted(await bindings.service.exportArtifact(request));
const second = accepted(await bindings.service.exportArtifact(request));
assert.deepEqual(first.bytes, second.bytes);
assert(Buffer.from(first.bytes).toString().includes('data-wire='));
await writeFile(new URL('export-first.svg', out), first.bytes);
await writeFile(new URL('export-second.svg', out), second.bytes);
const report = {
  collectionId: collection.id,
  bytes: first.bytes.length,
  sha256: createHash('sha256').update(first.bytes).digest('hex'),
  identical: true,
  source:
    'Previously admitted semantic DSL corpus; public readers and native Export service, no synthetic coordinates',
  paint:
    'Native export retains admitted scene palette/notation and published 0.65 idle wire alpha. Prototype-only CSS depth tints, family tabs and node shadows are not exported; no hover or selection paint is exported.',
};
await writeFile(new URL('export.json', out), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
