import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { assert } from 'vitest';
import { validate, plan, stage } from '@novakai/canvas-model';
import { createLanguage } from '@novakai/canvas-language';
import {
  createReactBindings,
  fontSet,
  resolvedStyle,
  readMeasuredProjection,
  readMeasuredContent,
  readSupplementalMeasurements,
} from '@novakai/canvas-presentation';
import { readScene, defaultEngineVersions } from '@novakai/canvas-layout';
import { composeExport, type Snapshot, type ExportBindings } from '../contract/index.js';

const recorded = z.object({
  payload: z.object({
    collection: z.unknown(),
    projection: z.unknown(),
    measurements: z.unknown(),
    scene: z.unknown(),
    options: z.unknown(),
    fonts: fontSet,
    style: resolvedStyle,
  }),
  resources: z.array(
    z.strictObject({
      kind: z.enum(['asset', 'preset', 'font']),
      digest: z.string().regex(/^[a-f0-9]{64}$/u),
      mediaType: z.string().min(1),
      base64: z.string(),
      metadata: z.record(z.string(), z.json()),
    }),
  ),
});

/** Unexpected owner rejection fails fixture setup with its complete structured result; it never becomes an invented success. */
function accepted<T>(
  outcome: { readonly ok: true; readonly value: T } | { readonly ok: false },
): T {
  assert(outcome.ok, JSON.stringify(outcome));
  return outcome.value;
}

/** Recorded inputs came from actual DSL admissions. Public readers recheck them; live encoders, rather than saved SVGs, are under test. */
export async function corpusFixture(
  id: string,
): Promise<{ readonly bindings: ExportBindings; readonly snapshot: Snapshot }> {
  assert(/^[a-z-]+$/u.test(id));
  const file = new URL(
    `../../../quality/agent-diagrams/visual-quality/stage-5/inputs/${id}.json.gz`,
    import.meta.url,
  );
  const raw: unknown = JSON.parse(gunzipSync(await readFile(file)).toString('utf8'));
  const { payload, resources } = recorded.parse(raw);
  const collection = accepted(validate(payload.collection));
  const domain = {
    read: (input: unknown) => ({ ok: true as const, value: accepted(validate(input)) }),
  };
  const projection = accepted(readMeasuredProjection(payload.projection, collection, domain));
  const measurements = accepted(readSupplementalMeasurements(payload.measurements));
  const scene = accepted(
    readScene(
      { projection, measurements, options: payload.options, candidate: payload.scene },
      {
        engineVersions: defaultEngineVersions,
        projection: {
          read: (input) => ({
            ok: true,
            value: accepted(readMeasuredProjection(input, collection, domain)),
          }),
          content: (input) => ({ ok: true, value: accepted(readMeasuredContent(input)) }),
        },
      },
    ),
  );
  const snapshot: Snapshot = {
    identity: {
      collectionId: collection.id,
      revision: collection.revision,
      inputKey: scene.inputKey,
      title: collection.title,
    },
    collection,
    scene,
    resources: resources.map(({ base64, ...resource }) => ({
      ...resource,
      bytes: Buffer.from(base64, 'base64'),
    })),
    paint: { fill: payload.style.surface, text: payload.style.text, stroke: payload.style.border },
  };
  const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
  const pins = {
    themes: { [collection.theme.id]: collection.theme },
    assets: Object.fromEntries(collection.assets.map((asset) => [asset.id, asset])),
  };
  const bindings = composeExport({
    presentation: accepted(await createReactBindings(payload.fonts)),
    snapshots: {
      acquire: async () => ({
        ok: true,
        value: { snapshot, release: async () => ({ ok: true, value: undefined }) },
      }),
    },
    documents: {
      read: (input) => ({ ok: true, value: accepted(validate(input)) }),
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
    readerCss: await readFile(new URL('../adapters/html/reader.css', import.meta.url), 'utf8'),
  });
  return { bindings, snapshot };
}
