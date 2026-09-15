import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { openAssets, type Assets } from '../../../capability/assets/contract/index.js';
import { prepareInstallation, type RenderDocument } from '@novakai/canvas-service';
import {
  composeDesignSystem,
  type DesignSystem,
} from '../../../capability/design-system/contract/index.js';
import {
  composeTemplates,
  type Catalog,
  type Templates,
} from '../../../capability/templates/contract/index.js';
import {
  createLanguage,
  type ResolvedResources,
  type ResourceRequest,
  type LoweredIntent,
} from '@novakai/canvas-language';
import { validate as validateLibrary } from '../../../capability/library/contract/index.js';
import { validate, plan, stage, type Collection } from '@novakai/canvas-model';
import { createReactBindings } from '../../../capability/presentation/contract/index.js';
import {
  composeExport,
  initializeRaster,
  type Resource,
  type Snapshot,
  type Documents,
  type Resources,
} from '../../../capability/export/contract/index.js';
import { filePath, type FilePath } from '../contract/records/headless.js';
import type {
  HeadlessOptions,
  HeadlessOwners,
  HeadlessReport,
} from '../contract/records/headless.js';
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
): Promise<Result<HeadlessReport>> {
  const directory = filePath.parse(await mkdtemp(join(tmpdir(), 'canvas-render-')));
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
async function environment(
  options: HeadlessOptions,
  owners: HeadlessOwners,
  assets: Pick<Assets, 'stage' | 'resolve'>,
) {
  const installation = accepted(
    await prepareInstallation(
      join(options.root, 'resources'),
      join(options.root, 'capability/design-system'),
      assets,
    ),
  );
  const system: Pick<DesignSystem, 'resolve' | 'resolveTheme' | 'projectDiagram'> =
    composeDesignSystem();
  const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
  const templates: Pick<Templates<LoweredIntent>, 'read' | 'planAdmission'> = composeTemplates(
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
  file: FilePath,
  catalog: Catalog,
  env: Environment,
  owners: HeadlessOwners,
): Promise<Catalog> {
  const source = accepted(owners.readTheme(await readFile(file, 'utf8')));
  const bindings = await Promise.all(
    source.resources.map(async (resource) => ({
      alias: resource.alias,
      digest: await admitResource(file, resource, env.assets, owners),
    })),
  );
  const prepared = accepted(
    owners.service.prepareTheme(z.json().parse(source.admission), catalog, bindings, env),
  );
  return accepted(env.templates.planAdmission(catalog, prepared)).candidate;
}
/** Reuse bounded, confined resource reads and exact Assets normalization from normal CLI admission. */
async function admitResource(
  file: FilePath,
  request: ResourceRequest,
  assets: Pick<Assets, 'stage' | 'resolve'>,
  owners: HeadlessOwners,
): Promise<NonNullable<import('../contract/records/resources.js').LocalInput['digest']>> {
  const resource = accepted(await owners.resourceFiles.read(file, request));
  if (resource.digest !== null) return resource.digest;
  return accepted(await assets.stage(resource.stage)).descriptor.digest;
}
/** Shipped optional themes follow the same admission lifecycle as user files. */
async function themes(
  options: HeadlessOptions,
  env: Environment,
  owners: HeadlessOwners,
): Promise<Catalog> {
  const root = join(options.root, 'resources');
  const files = (await readdir(root)).filter((name) => name.endsWith('.theme')).sort();
  const catalog = await files.reduce(
    async (prior, name) => admitTheme(filePath.parse(join(root, name)), await prior, env, owners),
    Promise.resolve(env.installation.presets),
  );
  if (!options.themeFile) return catalog;
  return admitTheme(filePath.parse(resolve(options.themeFile)), catalog, env, owners);
}
/** Pins are copied from admitted catalog records; Language and Presentation both verify them. */
function resources(catalog: Catalog, assets: Collection['assets'] = []): ResolvedResources {
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
    assets: Object.fromEntries(assets.map((asset) => [asset.id, asset])),
  };
}
/** Native file envelope; UTF-8 source is deliberately opaque until the Language parser validates it. */
const sourceFile = z.strictObject({ source: z.string(), file: filePath }).readonly();
type SourceFile = z.infer<typeof sourceFile>;
/** Selector comparison uses its text at the catalog edge; a path supplies DSL; a bare admitted recipe ID resolves its retained semantic source. */
async function collectionSource(
  options: HeadlessOptions,
  env: Environment,
  catalog: Catalog,
): Promise<SourceFile> {
  const recipe = catalog.find(
    (preset) => preset.kind === 'recipe' && preset.id === String(options.collection),
  );
  if (recipe?.kind === 'recipe')
    return {
      source: recipe.payload.source,
      file: filePath.parse(
        join(options.root, 'resources/recipes', recipe.payload.family + '.canvas'),
      ),
    };
  if (options.collection.endsWith('.canvas'))
    return {
      source: await readFile(resolve(options.collection), 'utf8'),
      file: filePath.parse(resolve(options.collection)),
    };
  return sourceFromId(options, env);
}
/** A file selector names the prepared preset; --theme takes precedence when both are supplied. */
async function selectedTheme(
  options: HeadlessOptions,
  owners: HeadlessOwners,
  original: Collection['theme']['id'],
): Promise<Collection['theme']['id']> {
  if (options.theme) return options.theme;
  if (!options.themeFile) return original;
  const parsed = accepted(owners.readTheme(await readFile(resolve(options.themeFile), 'utf8')));
  // Admission is opaque at this system edge; guard its envelope before reading the owner-validated ID.
  return z.string().parse(z.record(z.string(), z.unknown()).parse(parsed.admission).id);
}
/** Override an ephemeral validated copy; never write or mutate the source collection or its pin. */
async function input(
  options: HeadlessOptions,
  env: Environment,
  catalog: Catalog,
  owners: HeadlessOwners,
): Promise<Collection> {
  const originalSource = await collectionSource(options, env, catalog);
  const source = await overrideSource(originalSource, options, owners, env);
  const pins = resources(catalog);
  const assets = await sourceAssets(source, env, owners, pins.themes.paper);
  const bindings = resources(catalog, assets);
  const original = accepted(
    env.language.lower({
      source: source.source,
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
function retained(
  document: RenderDocument,
  catalog: Catalog,
  collection: Collection,
  env: Environment,
): readonly Resource[] {
  return [
    ...collection.assets.map((asset): Resource => {
      const blob = accepted(env.assets.resolve(asset.digest.slice(7)));
      return {
        kind: 'asset',
        digest: blob.descriptor.digest,
        mediaType: blob.descriptor.mediaType,
        bytes: Buffer.from(blob.base64, 'base64'),
        metadata: { alt: asset.alt },
      };
    }),
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
function documents(env: Environment, catalog: Catalog, assets: Collection['assets']): Documents {
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
          resources: resources(catalog, assets),
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
): Promise<HeadlessReport['files']> {
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
    documents: documents(env, catalog, snapshot.collection.assets),
    resources: resourceInspector(snapshot.resources),
  });
  await raster(options);
  await mkdir(options.out, { recursive: true });
  return Promise.all(
    document.scene.sections.map(async (section) => {
      const artifact = accepted(
        await exporter.service.exportArtifact({
          identity: {
            collectionId: snapshot.collection.id,
            revision: snapshot.collection.revision,
          },
          format: options.format,
          scope: { kind: 'section', id: section.id },
        }),
      );
      const file = join(
        options.out,
        section.id.replace(/[^a-zA-Z0-9_-]/g, '-') + '.' + options.format,
      );
      await writeFile(file, artifact.bytes);
      return filePath.parse(file);
    }),
  );
}
/** Real owner sequence: admission, lowering, projection, layout, export; rerunning leaves stored state untouched. */
async function render(
  options: HeadlessOptions,
  owners: HeadlessOwners,
  directory: FilePath,
): Promise<HeadlessReport> {
  const assets = accepted(openAssets(directory));
  try {
    return await renderEnvironment(options, owners, await environment(options, owners, assets));
  } finally {
    accepted(assets.close());
  }
}
/** One immutable prepared environment drives the render; render owns asset cleanup even on failure. */
async function renderEnvironment(
  options: HeadlessOptions,
  owners: HeadlessOwners,
  env: Environment,
): Promise<HeadlessReport> {
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
    resources: retained(document, catalog, collection, env),
    paint: {
      fill: document.style.surface,
      stroke: document.style.border,
      text: document.style.text,
    },
  };
  const files = await output(options, snapshot, document, env, catalog);
  return {
    files,
    theme: collection.theme,
    inspection: {
      valid: true,
      diagnostics: [],
      warnings: document.scene.warnings,
      crossings: document.scene.warnings.filter((warning) => warning.code === 'wire-crossing')
        .length,
      relaxed: document.scene.warnings.filter((warning) => warning.code === 'constraint-relaxed')
        .length,
      sections: document.scene.sections.length,
      engineVersions: document.scene.engineVersions,
    },
    digests: catalog
      .filter((preset) => preset.kind === 'theme')
      .map((preset) => ({ id: preset.id, digest: preset.digest })),
  };
}

/** Bare collection IDs are resolved from shipped semantic sources; filesystem paths remain explicit. */
async function sourceFromId(options: HeadlessOptions, env: Environment): Promise<SourceFile> {
  const root = join(options.root, 'resources');
  const names = (await readdir(root, { recursive: true }))
    .filter((name) => name.endsWith('.canvas'))
    .sort();
  const sources = await Promise.all(
    names.map(async (name) => ({
      source: await readFile(join(root, name), 'utf8'),
      file: filePath.parse(join(root, name)),
    })),
  );
  const matches = sources.filter((source) => sourceMatches(source.source, options.collection, env));
  if (matches.length !== 1)
    throw new RenderFault({
      code: 'collection-selection',
      id: options.collection,
      matches: matches.length,
    });
  return sourceFile.parse(matches[0]);
}
/** Raw UTF-8 text stays unbranded at the Language parsing edge; parsing resolves semantic identity without running layout, trusting filenames or mutating collections. */
function sourceMatches(
  source: string,
  id: HeadlessOptions['collection'],
  env: Environment,
): boolean {
  const parsed = env.language.parse(source);
  if (!parsed.ok) return false;
  return parsed.value.collection === id;
}

/** Export may inspect only the exact resources already admitted for this immutable snapshot. */
function resourceInspector(retained: readonly Resource[]): Resources {
  return {
    async inspect(items) {
      if (!items.every((item) => retained.some((candidate) => sameResource(item, candidate))))
        return {
          ok: false,
          error: {
            code: 'resource-rejected',
            path: 'snapshot.resources',
            message: 'Resource differs from its owner-admitted snapshot',
            recovery: 'Rebuild the snapshot through its resource owners and retry.',
          },
        };
      return { ok: true, value: items };
    },
  };
}
/** Byte equality and complete metadata equality prevent a new input from borrowing a retained identity. */
function sameResource(left: Resource, right: Resource): boolean {
  return (
    left.kind === right.kind &&
    left.digest === right.digest &&
    left.mediaType === right.mediaType &&
    Buffer.from(left.bytes).equals(Buffer.from(right.bytes)) &&
    JSON.stringify(left.metadata) === JSON.stringify(right.metadata)
  );
}

/** Source media uses normal confined reads, normalized bytes and Model-owned metadata validation. */
async function sourceAssets(
  source: SourceFile,
  env: Environment,
  owners: HeadlessOwners,
  theme: Collection['theme'] | undefined,
): Promise<Collection['assets']> {
  const parsed = accepted(env.language.parse(source.source));
  const entries = await Promise.all(
    parsed.resources
      .filter((request) => request.kind !== 'theme')
      .map(async (request) => {
        const digest = await admitResource(source.file, request, env.assets, owners);
        const blob = accepted(env.assets.resolve(digest));
        return {
          id: request.alias,
          digest: 'sha256:' + digest,
          mediaType: blob.descriptor.mediaType,
          alt: request.alt ?? request.alias,
          ...Object.fromEntries(
            Object.entries({ license: request.license, attribution: request.attribution }).filter(
              ([, value]) => value !== undefined,
            ),
          ),
        };
      }),
  );
  return accepted(
    validate({
      schemaVersion: 1,
      id: 'headless-assets',
      revision: 0,
      title: 'Headless asset bindings',
      arrangement: { algorithm: 'grid' },
      theme,
      assets: entries,
    }),
  ).assets;
}

/** A render-only source copy replaces only the parsed theme value, so even unavailable prior pins can be overridden. */
async function overrideSource(
  source: SourceFile,
  options: HeadlessOptions,
  owners: HeadlessOwners,
  env: Environment,
): Promise<SourceFile> {
  const selected = await selectedTheme(options, owners, '');
  if (!selected) return source;
  return { ...source, source: sourceWithTheme(source.source, selected, env) };
}
/** Raw UTF-8 source stays text at the Language serialization edge; parser-provided UTF16 spans preserve all authored content; the chosen pin is verified normally during lowering. */
function sourceWithTheme(
  source: string,
  theme: Collection['theme']['id'],
  env: Environment,
): string {
  const parsed = accepted(env.language.parse(source));
  if (parsed.kind !== 'canvas') throw new RenderFault({ code: 'collection-required' });
  const field = parsed.declaration.fields.theme;
  if (field === undefined)
    return insertTheme(source, theme, parsed.declaration.fields.title?.span.end.offset);
  return (
    source.slice(0, field.span.start.offset) +
    JSON.stringify(theme) +
    source.slice(field.span.end.offset)
  );
}
/** Raw DSL text is serialized without normalization; theme omission means paper in stored DSL; an explicit render override is inserted after its parsed title. */
function insertTheme(
  source: string,
  theme: Collection['theme']['id'],
  offset: number | undefined,
): string {
  if (offset === undefined) throw new RenderFault({ code: 'collection-title-required' });
  return source.slice(0, offset) + ' theme=' + JSON.stringify(theme) + source.slice(offset);
}
