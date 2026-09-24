/*
 * Corpus fixture for Export: loads one recorded stage-5 input (collection, projection,
 * measurements, scene, fonts, style and resources captured from real DSL admissions), rechecks
 * it through the public Model, Presentation and Layout readers, and composes Export over it.
 * The encoders under test are the live ones, not saved SVGs.
 */
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { assert } from 'vitest';
import { validate, plan, stage, type Collection } from '@novakai/canvas-model';
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
import {
  composeExport,
  type Snapshot,
  type ExportBindings,
  type Documents,
} from '../contract/index.js';

/** The recorded file's shape: the captured payload and the resources as base64. */
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

/** The parsed recording. */
type Recording = z.infer<typeof recorded>;

/**
 * Loads corpus input `id` and composes Export over it. The lease always returns the recorded
 * snapshot and its release succeeds; the resource owner accepts every resource unchanged; the
 * documents provider is the real Model and Language, with the collection's own theme and assets
 * pinned.
 *
 * @param id - The corpus input name: lowercase letters and hyphens only.
 * @returns The composed Export and the snapshot it serves.
 * @throws Rejects with an `AssertionError` for a bad `id` or any rejection by a real reader
 * (its message is the whole result as JSON); with a file-system error when the input or the
 * reader stylesheet cannot be read; or with a `ZodError` when the recording has the wrong shape.
 */
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
    /** Validates through Model; a rejection fails the setup. */
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
          /** Rereads a measured projection for this collection; a rejection fails the setup. */
          read: (input) => ({
            ok: true,
            value: accepted(readMeasuredProjection(input, collection, domain)),
          }),
          /** Rereads measured content; a rejection fails the setup. */
          content: (input) => ({ ok: true, value: accepted(readMeasuredContent(input)) }),
        },
      },
    ),
  );
  const snapshot = corpusSnapshot(collection, scene, resources, payload.style);
  const documents = corpusDocuments(collection);
  const bindings = composeExport({
    presentation: accepted(await createReactBindings(payload.fonts)),
    snapshots: {
      /** Leases the recorded snapshot; its release always succeeds. */
      acquire: async () => ({
        ok: true,
        value: {
          snapshot,
          /** Succeeds without doing anything. */
          release: async () => ({ ok: true, value: undefined }),
        },
      }),
    },
    documents,
    /** Accepts every resource unchanged. */
    resources: { inspect: async (items) => ({ ok: true, value: items }) },
    readerCss: await readFile(new URL('../adapters/html/reader.css', import.meta.url), 'utf8'),
  });
  return { bindings, snapshot };
}

/**
 * The value of a successful outcome. An unexpected rejection fails the setup with the whole
 * result as JSON, and never becomes an invented success. The outcome is turned into JSON even
 * when it succeeds, so a value JSON cannot hold throws a `TypeError`.
 */
function accepted<T>(
  outcome: { readonly ok: true; readonly value: T } | { readonly ok: false },
): T {
  assert(outcome.ok, JSON.stringify(outcome));
  return outcome.value;
}

/**
 * The recorded snapshot: identity from the collection and scene, the resources with their bytes
 * decoded from base64, and the paint taken from the recorded style.
 */
function corpusSnapshot(
  collection: Collection,
  scene: Snapshot['scene'],
  resources: Recording['resources'],
  style: Recording['payload']['style'],
): Snapshot {
  return {
    identity: {
      collectionId: collection.id,
      revision: collection.revision,
      inputKey: scene.inputKey,
      title: collection.title,
    },
    collection,
    scene,
    resources: resources.map(
      /** One recorded resource with `base64` replaced by its decoded bytes. */
      ({ base64, ...resource }) => ({
        ...resource,
        bytes: Buffer.from(base64, 'base64'),
      }),
    ),
    paint: { fill: style.surface, text: style.text, stroke: style.border },
  };
}

/**
 * The documents provider, built on the real Model and Language. `read` validates, `print`
 * prints the whole collection, and `parse` lowers DSL with the collection's own theme and
 * assets pinned. Any rejection fails the setup.
 */
function corpusDocuments(collection: Collection): Documents {
  const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
  const pins = {
    themes: { [collection.theme.id]: collection.theme },
    assets: Object.fromEntries(
      collection.assets.map(/** One asset under its ID. */ (asset) => [asset.id, asset]),
    ),
  };
  return {
    /** Validates the input through Model. */
    read: (input) => ({ ok: true, value: accepted(validate(input)) }),
    /** Prints the whole collection as DSL source. */
    print: (input) => ({
      ok: true,
      value: accepted(language.print({ collection: input, scope: { kind: 'all' } })).source,
    }),
    /** Lowers DSL source into a new collection. */
    parse: (source) => ({
      ok: true,
      value: accepted(language.lower({ source, mode: 'create', snapshot: null, resources: pins }))
        .collection,
    }),
  };
}
