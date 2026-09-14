import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { openAssets, type Assets } from '../../../capability/assets/contract/index.js';
import { prepareInstallation, type RenderDocument } from '@novakai/canvas-service';
import { composeDesignSystem } from '../../../capability/design-system/contract/index.js';
import { composeTemplates, type Catalog } from '../../../capability/templates/contract/index.js';
import { createLanguage, type ResolvedResources } from '@novakai/canvas-language';
import { validate as validateLibrary } from '../../../capability/library/contract/index.js';
import { validate, plan, stage, type Collection } from '@novakai/canvas-model';
import { createReactBindings } from '../../../capability/presentation/contract/index.js';
import {
  composeExport,
  initializeRaster,
  type Resource,
  type Snapshot,
  type Documents,
} from '../../../capability/export/contract/index.js';
import type { HeadlessOptions, HeadlessOwners } from '../contract/records/headless.js';
import { failure, type Result } from '../contract/errors.js';
/** Owner failures remain structured until the CLI prints them; no partial render is reported as success. */
class RenderFault extends Error {
  constructor(readonly evidence: unknown) {
    super('Headless render rejected');
  }
}
/** Private throws terminate one read-only render; runHeadless reports typed failure and cleans temporary resources. */
function accepted<T>(result: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!result.ok) throw new RenderFault(result);
  return result.value;
}
/** Temporary admission is isolated from workspaces; retry replaces the same named output files. */
export async function renderHeadless(
  options: HeadlessOptions,
  owners: HeadlessOwners,
): Promise<Result<string>> {
  const directory = await mkdtemp(join(tmpdir(), 'canvas-render-'));
  try {
    return { ok: true, value: await render(options, owners, directory) };
  } catch (error) {
    return failure(
      'render-failed',
      JSON.stringify(evidence(error)),
      'Correct the named input or resource and rerun; stored collections were not changed.',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
/** Preserve owner diagnostics; unexpected filesystem failures are terminal CLI evidence. */
function evidence(error: unknown): unknown {
  if (error instanceof RenderFault) return error.evidence;
  if (error instanceof Error) return { message: error.message };
  return error;
}
/** Create one real language and token environment for all section renders. */
async function environment(options: HeadlessOptions, owners: HeadlessOwners, directory: string) {
  const assets = accepted(openAssets(directory));
  const installation = accepted(
    await prepareInstallation(
      join(options.root, 'resources'),
      join(options.root, 'capability/design-system'),
      assets,
    ),
  );
  const system = composeDesignSystem();
  const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
  const templates = composeTemplates(
    owners.service.createPresetCodecs({
      system,
      language,
      sources: installation.tokens,
      resources: { themes: {}, assets: {} },
    }),
  );
  return { assets, installation, system, language, templates };
}
type Environment = Awaited<ReturnType<typeof environment>>;
/** Admitted theme files reuse the service preparation path and actual font asset descriptors. */
async function admitTheme(
  file: string,
  catalog: Catalog,
  env: Environment,
  owners: HeadlessOwners,
): Promise<Catalog> {
  const source = accepted(owners.readTheme(await readFile(file, 'utf8')));
  const bindings = await Promise.all(
    source.resources.map(async (resource) => ({
      alias: resource.alias,
      digest: await admitFont(resolve(dirname(file), resource.source), env.assets),
    })),
  );
  const prepared = accepted(
    owners.service.prepareTheme(z.json().parse(source.admission), catalog, bindings, env),
  );
  return accepted(env.templates.planAdmission(catalog, prepared)).candidate;
}
/** Assets validates font bytes; no array position or operating-system family is trusted. */
async function admitFont(file: string, assets: Assets): Promise<string> {
  const bytes = await readFile(file);
  return accepted(
    await assets.stage({
      mediaType: 'font/woff2',
      base64: bytes.toString('base64'),
      alt: '',
      provenance: { source: file },
    }),
  ).descriptor.digest;
}
/** Shipped optional themes follow the same admission lifecycle as user files. */
async function themes(
  options: HeadlessOptions,
  env: Environment,
  owners: HeadlessOwners,
): Promise<Catalog> {
  let catalog = env.installation.presets;
  for (const name of ['atlas', 'studio', 'onyx', 'blueprint'])
    catalog = await admitTheme(
      join(options.root, 'resources', name + '.theme'),
      catalog,
      env,
      owners,
    );
  if (options.themeFile)
    catalog = await admitTheme(resolve(options.themeFile), catalog, env, owners);
  return catalog;
}
/** Pins are copied from admitted catalog records; Language and Presentation both verify them. */
function resources(catalog: Catalog): ResolvedResources {
  return {
    themes: Object.fromEntries(
      catalog
        .filter((preset) => preset.kind === 'theme')
        .map((preset) => [
          preset.id,
          {
            id: preset.id,
            version: preset.version,
            digest: 'sha256:' + preset.digest,
            roles: preset.payload.roles,
          },
        ]),
    ),
    assets: {},
  };
}
/** A path supplies DSL; a bare admitted recipe ID resolves its retained semantic source. */
async function collectionSource(options: HeadlessOptions, catalog: Catalog): Promise<string> {
  const recipe = catalog.find(
    (preset) => preset.kind === 'recipe' && preset.id === options.collection,
  );
  if (recipe?.kind === 'recipe') return recipe.payload.source;
  return readFile(resolve(options.collection), 'utf8');
}
/** A file selector names the prepared preset; --theme takes precedence when both are supplied. */
async function selectedTheme(
  options: HeadlessOptions,
  owners: HeadlessOwners,
  original: string,
): Promise<string> {
  if (options.theme) return options.theme;
  if (!options.themeFile) return original;
  const parsed = accepted(owners.readTheme(await readFile(resolve(options.themeFile), 'utf8')));
  return z.object({ id: z.string() }).parse(parsed.admission).id;
}
/** Override an ephemeral validated copy; never write or mutate the source collection or its pin. */
async function input(
  options: HeadlessOptions,
  env: Environment,
  catalog: Catalog,
  owners: HeadlessOwners,
): Promise<Collection> {
  const bindings = resources(catalog);
  const original = accepted(
    env.language.lower({
      source: await collectionSource(options, catalog),
      mode: 'create',
      snapshot: null,
      resources: bindings,
    }),
  ).collection;
  const theme = await selectedTheme(options, owners, original.theme.id);
  const pin = bindings.themes[theme];
  if (!pin) throw new RenderFault({ code: 'missing-theme', theme });
  return accepted(validate({ ...original, theme: pin }));
}
/** Keep every preset and admitted font in the exact export snapshot's resource closure. */
function retained(document: RenderDocument, catalog: Catalog): readonly Resource[] {
  return [
    ...document.fonts.map((font): Resource => ({
      kind: 'font',
      digest: font.digest,
      mediaType: font.mediaType,
      bytes: Buffer.from(font.base64, 'base64'),
      metadata: { family: font.family },
    })),
    ...catalog.map((preset): Resource => ({
      kind: 'preset',
      digest: preset.digest,
      mediaType: 'application/json',
      bytes: Buffer.from(JSON.stringify(preset)),
      metadata: {},
    })),
  ];
}
/** Document adapters translate owner values into Export's public shape; Export owns terminal error reporting. */
function documents(env: Environment, catalog: Catalog): Documents {
  return {
    read: (value) => ({ ok: true, value: accepted(validate(value)) }),
    print: (collection) => ({
      ok: true,
      value: accepted(env.language.print({ collection, scope: { kind: 'all' } })).source,
    }),
    parse: (source) => ({
      ok: true,
      value: accepted(
        env.language.lower({
          source,
          mode: 'create',
          snapshot: null,
          resources: resources(catalog),
        }),
      ).collection,
    }),
  };
}
/** Real raster engine initialization is needed only by PNG requests. */
async function raster(options: HeadlessOptions): Promise<void> {
  if (options.format !== 'png') return;
  const require = createRequire(join(options.root, 'capability/export/package.json'));
  accepted(
    await initializeRaster(
      await WebAssembly.compile(await readFile(require.resolve('@resvg/resvg-wasm/index_bg.wasm'))),
    ),
  );
}
/** Export acquires one immutable scene and emits every section with deterministic filesystem-safe IDs. */
async function output(
  options: HeadlessOptions,
  snapshot: Snapshot,
  document: RenderDocument,
  env: Environment,
  catalog: Catalog,
): Promise<readonly string[]> {
  const presentation = accepted(await createReactBindings(document.fonts));
  const exporter = composeExport({
    presentation,
    readerCss: '',
    snapshots: {
      acquire: async () => ({
        ok: true,
        value: { snapshot, release: async () => ({ ok: true, value: undefined }) },
      }),
    },
    documents: documents(env, catalog),
    resources: { inspect: async (items) => ({ ok: true, value: items }) },
  });
  await raster(options);
  await mkdir(options.out, { recursive: true });
  const files: string[] = [];
  for (const section of document.scene.sections) {
    const artifact = accepted(
      await exporter.service.exportArtifact({
        identity: { collectionId: snapshot.collection.id, revision: snapshot.collection.revision },
        format: options.format,
        scope: { kind: 'section', id: section.id },
      }),
    );
    const file = join(
      options.out,
      section.id.replace(/[^a-zA-Z0-9_-]/g, '-') + '.' + options.format,
    );
    await writeFile(file, artifact.bytes);
    files.push(file);
  }
  return files;
}
/** Real owner sequence: admission, lowering, projection, layout, export; rerunning leaves stored state untouched. */
async function render(
  options: HeadlessOptions,
  owners: HeadlessOwners,
  directory: string,
): Promise<string> {
  const env = await environment(options, owners, directory);
  const catalog = await themes(options, env, owners);
  const collection = await input(options, env, catalog, owners);
  const jobs = owners.service.createRenderJobs({
    ...env,
    sources: env.installation.tokens,
    wasmResource: join(options.root, 'resources/vendor/layout/libavoid.wasm'),
  });
  const job = accepted(
    jobs.create(
      collection,
      {
        collections: [collection],
        presets: catalog,
        library: accepted(
          validateLibrary({
            catalog: { schemaVersion: 1, id: 'headless', revision: 0, folders: [], entries: [] },
            collections: [],
            recent: [],
          }),
        ),
      },
      null,
      'headless',
    ),
  );
  const document = accepted(await owners.service.produceDiagram(job, new AbortController().signal));
  const snapshot: Snapshot = {
    identity: {
      collectionId: collection.id,
      revision: collection.revision,
      inputKey: document.scene.inputKey,
      title: collection.title,
    },
    collection,
    scene: document.scene,
    resources: retained(document, catalog),
    paint: {
      fill: document.style.surface,
      stroke: document.style.border,
      text: document.style.text,
    },
  };
  const files = await output(options, snapshot, document, env, catalog);
  return JSON.stringify({
    files,
    theme: collection.theme,
    warnings: document.scene.warnings,
    digests: catalog
      .filter((preset) => preset.kind === 'theme')
      .map((preset) => ({ id: preset.id, digest: preset.digest })),
  });
}
