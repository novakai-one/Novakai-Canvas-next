import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import type { Assets, ReadLease } from '@novakai/canvas-assets';
import type { Catalog, Templates } from '@novakai/canvas-templates';
import type { Language, LoweredIntent } from '@novakai/canvas-language';
import { validate } from '@novakai/canvas-model';
import {
  composeExport,
  initializeRaster,
  type Documents,
  type Resource,
  type Resources,
  type Snapshot,
} from '@novakai/canvas-export';
import { createReactBindings } from '@novakai/canvas-presentation';
import type { CollectionRenderer } from '../contract/ports/collection-renderer.js';
import type { ResourceSelector } from '../contract/records/planning.js';
import type { WorkspaceReader } from '../contract/records/workspace.js';
import type { BuiltinResources } from '../contract/records/builtins.js';
import type { Authoring } from '../contract/records/owners.js';
import type { RouteOutcome } from '../contract/records/protocol.js';
import type { StaticFile } from '../contract/records/server.js';
import { failure, type Result } from '../contract/errors.js';
type ExportResult<T> = import('@novakai/canvas-export').Result<T>;

interface ExportOwners {
  readonly workspace: string;
  readonly installation: BuiltinResources;
  readonly assets: Assets;
  readonly templates: Pick<Templates<LoweredIntent>, 'read'>;
  readonly language: Language;
  readonly views: WorkspaceReader;
  readonly resources: ResourceSelector;
  readonly renderer: CollectionRenderer;
  readonly authoring: (signal: AbortSignal) => Authoring;
  readonly readSignal: AbortSignal;
}

/** Export is a read-only projection over one current Authoring snapshot; stale requested revisions are refused. */
export async function createWorkspaceExporter(
  owners: ExportOwners,
): Promise<Result<ExportHandler>> {
  const presentation = await createReactBindings(owners.installation.fonts);
  if (!presentation.ok)
    return failure('unavailable', 'export.presentation', presentation.error.message);
  const exporter = composeExport({
    presentation: presentation.value,
    readerCss: '',
    snapshots: { acquire: (identity) => acquireSnapshot(identity, owners) },
    documents: documents(owners),
    resources: resourceInspector(),
  });
  let raster: Promise<Result<void>> | null = null;
  return {
    ok: true,
    value: {
      // eslint-disable-next-line sonarjs/cognitive-complexity -- dispatch keeps DSL and native encoders on one captured service lease.
      async invoke(input, signal): Promise<RouteOutcome> {
        const request = inputRecord(input);
        if (!request.ok) return request;
        if (request.value.format === 'dsl') return dsl(request.value, owners, signal);
        if (request.value.format === 'png') {
          raster ??= initializeNativeRaster();
          const ready = await raster;
          if (!ready.ok) return ready;
        }
        const artifact = await exporter.service.exportArtifact(
          {
            identity: {
              collectionId: request.value.collectionId,
              revision: request.value.revision,
            },
            format: request.value.format,
            scope: request.value.scope,
            scale: request.value.scale,
          },
          signal,
        );
        if (!artifact.ok)
          return failure('invalid-input', artifact.error.path, artifact.error.message);
        return { kind: 'bytes', file: artifactFile(artifact.value) };
      },
    },
  };
}

export interface ExportHandler {
  invoke(input: unknown, signal: AbortSignal): Promise<RouteOutcome>;
}

interface ExportInput {
  readonly collectionId: string;
  readonly revision: number;
  readonly format: 'dsl' | 'svg' | 'png';
  readonly scope: { readonly kind: 'all' } | { readonly kind: 'section'; readonly id: string };
  readonly scale: number;
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- request validation keeps identity, format and scope rejection explicit.
function inputRecord(input: unknown): Result<ExportInput> {
  if (!input || typeof input !== 'object')
    return failure('invalid-input', 'export', 'Export request is invalid');
  const value = input as Record<string, unknown>;
  const identity = value.identity;
  const scope = value.scope;
  if (!identity || typeof identity !== 'object' || !scope || typeof scope !== 'object')
    return failure('invalid-input', 'export', 'Export request is incomplete');
  const id = (identity as Record<string, unknown>).collectionId;
  const revision = (identity as Record<string, unknown>).revision;
  const format = value.format;
  const kind = (scope as Record<string, unknown>).kind;
  const section = (scope as Record<string, unknown>).id;
  if (
    typeof id !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9_-]*$/.test(id) ||
    typeof revision !== 'number' ||
    !Number.isInteger(revision) ||
    revision < 0 ||
    !['dsl', 'svg', 'png'].includes(String(format)) ||
    !['all', 'section'].includes(String(kind)) ||
    (kind === 'section' &&
      (typeof section !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(section)))
  )
    return failure(
      'invalid-input',
      'export',
      'Export request contains an unsupported identity, format or scope',
    );
  const scale = value.scale === undefined ? 1 : value.scale;
  if (typeof scale !== 'number' || !Number.isFinite(scale) || scale < 1 || scale > 4)
    return failure('invalid-input', 'export.scale', 'Export scale must be between 1 and 4');
  return {
    ok: true,
    value: {
      collectionId: id,
      revision,
      format: format as ExportInput['format'],
      scope: kind === 'all' ? { kind: 'all' } : { kind: 'section', id: section as string },
      scale,
    },
  };
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- one lease spans read, render, resource capture and every failure release.
async function acquireSnapshot(
  identity: { readonly collectionId: string; readonly revision: number },
  owners: ExportOwners,
): Promise<
  import('@novakai/canvas-export').Result<import('@novakai/canvas-export').SnapshotLease>
> {
  const current = await owners.authoring(owners.readSignal).read(owners.workspace);
  if (!current.ok) return rejected('encoding-failed', 'workspace', current.error.message);
  const view = owners.views.read(current.value);
  if (!view.ok) return rejected('encoding-failed', 'workspace', view.error.message);
  const collection = view.value.collections.find((item) => item.id === identity.collectionId);
  if (!collection)
    return rejected('invalid-input', 'identity.collectionId', 'Collection does not exist');
  if (collection.revision !== identity.revision)
    return rejected(
      'snapshot-mismatch',
      'identity.revision',
      'Requested revision is no longer available',
    );
  const digests = owners.resources.forCollection(collection, view.value);
  if (!digests.ok) return rejected('resource-rejected', 'resources', digests.error.message);
  const lease = owners.assets.acquire(digests.value);
  if (!lease.ok) return rejected('resource-rejected', 'resources', lease.error.message);
  try {
    const document = await owners.renderer.render(collection, view.value, owners.readSignal);
    if (!document.ok) {
      lease.value.release();
      return rejected('encoding-failed', 'render', document.error.message);
    }
    const resources = retainedResources(
      lease.value,
      collection,
      document.value,
      view.value.presets,
    );
    if (!resources.ok) {
      lease.value.release();
      return resources;
    }
    const snapshot: Snapshot = {
      identity: {
        collectionId: collection.id,
        revision: collection.revision,
        inputKey: document.value.scene.inputKey,
        title: collection.title,
      },
      collection,
      scene: document.value.scene,
      resources: resources.value,
      paint: {
        fill: document.value.style.surface,
        stroke: document.value.style.border,
        text: document.value.style.text,
      },
    };
    return {
      ok: true,
      value: {
        snapshot,
        release: async () => resultFromRelease(lease.value.release()),
      },
    };
  } catch {
    lease.value.release();
    return rejected(
      'encoding-failed',
      'snapshot',
      'The retained export snapshot could not be prepared',
    );
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- each retained resource kind has an explicit owner read and failure path.
function retainedResources(
  lease: ReadLease,
  collection: import('@novakai/canvas-model').Collection,
  document: import('../contract/records/rendering.js').RenderDocument,
  presets: Catalog,
): ExportResult<readonly Resource[]> {
  try {
    const resources: Resource[] = [];
    const theme = presets.find(
      (item) =>
        item.kind === 'theme' &&
        item.id === collection.theme.id &&
        item.version === collection.theme.version,
    );
    if (!theme)
      return rejected('resource-rejected', 'resources.theme', 'The pinned theme is unavailable');
    resources.push({
      kind: 'preset',
      digest: theme.digest,
      mediaType: 'application/json',
      bytes: Buffer.from(JSON.stringify(theme)),
      metadata: {},
    });
    for (const item of collection.assets) {
      const blob = lease.read(item.digest.slice(7));
      if (!blob.ok)
        return rejected('resource-rejected', `resources.${item.id}`, blob.error.message);
      resources.push({
        kind: 'asset',
        digest: blob.value.descriptor.digest,
        mediaType: blob.value.descriptor.mediaType,
        bytes: Buffer.from(blob.value.base64, 'base64'),
        metadata: { alt: item.alt },
      });
    }
    for (const font of document.fonts) {
      const blob = lease.read(font.digest);
      if (!blob.ok)
        return rejected('resource-rejected', `resources.${font.digest}`, blob.error.message);
      resources.push({
        kind: 'font',
        digest: blob.value.descriptor.digest,
        mediaType: blob.value.descriptor.mediaType,
        bytes: Buffer.from(blob.value.base64, 'base64'),
        metadata: { family: font.family },
      });
    }
    return { ok: true, value: resources };
  } catch {
    return rejected(
      'resource-rejected',
      'resources',
      'The retained export resources could not be read',
    );
  }
}

function documents(owners: ExportOwners): Documents {
  return {
    read: (value) => {
      const checked = validate(value);
      return checked.ok
        ? checked
        : rejected('invalid-input', 'collection', 'Collection is invalid');
    },
    print: (collection) => {
      const printed = owners.language.print({ collection, scope: { kind: 'all' } });
      return printed.ok
        ? { ok: true, value: printed.value.source }
        : rejected('invalid-input', 'source', 'Collection could not be printed');
    },
    parse: () =>
      rejected('invalid-import', 'source', 'Import parsing is not part of browser export'),
  };
}

function resourceInspector(): Resources {
  return {
    inspect: async (items) => ({ ok: true, value: items }),
  };
}

function artifactFile(artifact: import('@novakai/canvas-export').Artifact): StaticFile {
  const name = `${artifact.identity.collectionId}-${artifact.identity.revision}-${artifact.scope.kind}.${artifact.extension}`;
  return {
    bytes: artifact.bytes,
    mediaType: artifact.mediaType,
    filename: name,
    headers: {
      'X-Novakai-Export-Revision': String(artifact.identity.revision),
      'X-Novakai-Export-Digest': artifact.digest,
    },
  };
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- DSL export has explicit scope, cancellation, lease and print stages.
async function dsl(
  input: ExportInput,
  owners: ExportOwners,
  signal: AbortSignal,
): Promise<RouteOutcome> {
  if (input.scope.kind !== 'all')
    return failure('invalid-input', 'scope', 'Canonical DSL export requires the whole collection');
  const acquired = await acquireSnapshot(input, owners);
  if (!acquired.ok) return failure('invalid-input', acquired.error.path, acquired.error.message);
  try {
    if (signal.aborted) return failure('cancelled', 'export', 'Export was cancelled');
    const source = documents(owners).print(acquired.value.snapshot.collection);
    if (!source.ok) return failure('invalid-input', source.error.path, source.error.message);
    return {
      kind: 'bytes',
      file: {
        bytes: Buffer.from(source.value, 'utf8'),
        mediaType: 'text/plain; charset=utf-8',
        filename: `${input.collectionId}-${input.revision}.canvas`,
        headers: { 'X-Novakai-Export-Revision': String(input.revision) },
      },
    };
  } finally {
    await acquired.value.release();
  }
}

async function initializeNativeRaster(): Promise<Result<void>> {
  try {
    const require = createRequire(import.meta.url);
    const wasm = await WebAssembly.compile(
      await readFile(require.resolve('@resvg/resvg-wasm/index_bg.wasm')),
    );
    const result = await initializeRaster(wasm);
    return result.ok ? result : failure('unavailable', 'export.png', result.error.message);
  } catch {
    return failure('unavailable', 'export.png', 'PNG export runtime is unavailable');
  }
}

function resultFromRelease(
  result: import('@novakai/canvas-assets').Result<void>,
): import('@novakai/canvas-export').Result<void> {
  return result.ok ? result : rejected('cleanup-failed', 'export.release', result.error.message);
}

function rejected(
  code: import('@novakai/canvas-export').ErrorCode,
  path: string,
  message: string,
): import('@novakai/canvas-export').Result<never> {
  return {
    ok: false,
    error: {
      code,
      path,
      message,
      recovery: 'Correct the input or repair the provider, then retry the read.',
    },
  };
}
