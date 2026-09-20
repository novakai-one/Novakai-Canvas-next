import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import type { Assets, ReadLease, StoredBlob } from '@novakai/canvas-assets';
import type { Catalog, Templates, ThemePreset } from '@novakai/canvas-templates';
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
import { createReactBindings, type ReactBindings } from '@novakai/canvas-presentation';
import type { CollectionRenderer } from '../contract/ports/collection-renderer.js';
import type { ResourceSelector } from '../contract/records/planning.js';
import type { WorkspaceContents, WorkspaceReader } from '../contract/records/workspace.js';
import type { BuiltinResources } from '../contract/records/builtins.js';
import type { Authoring } from '../contract/records/owners.js';
import type { RouteOutcome } from '../contract/records/protocol.js';
import type { StaticFile } from '../contract/records/server.js';
import type { OperationSource } from '../contract/records/failure-source.js';
import { formatMarkdown, type MarkdownScope } from '@novakai/canvas-export';
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
}

/** Export is a read-only projection over one current Authoring snapshot; stale requested revisions are refused. */
export async function createWorkspaceExporter(
  owners: ExportOwners,
): Promise<Result<ExportHandler>> {
  const presentation = await createReactBindings(owners.installation.fonts);
  if (!presentation.ok)
    return failure('unavailable', 'export.presentation', presentation.error.message);
  let raster: Promise<Result<void>> | null = null;
  return {
    ok: true,
    value: {
      async invoke(input, signal): Promise<RouteOutcome> {
        const request = inputRecord(input);
        if (!request.ok) return request;
        return dispatchExport(request.value, owners, presentation.value, signal, () => {
          raster ??= initializeNativeRaster();
          return raster;
        });
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
  readonly format: 'dsl' | 'svg' | 'png' | 'markdown';
  readonly scope: { readonly kind: 'all' } | { readonly kind: 'section'; readonly id: string };
  readonly scale: number;
}

function inputRecord(input: unknown): Result<ExportInput> {
  if (!input || typeof input !== 'object')
    return failure('invalid-input', 'export', 'Export request is invalid');
  return recordInput(input as Record<string, unknown>);
}

function recordInput(value: Record<string, unknown>): Result<ExportInput> {
  const identity = inputIdentity(value.identity);
  const scope = inputScope(value.scope);
  const format = inputFormat(value.format);
  if ([identity, scope, format].some((item) => item === null)) return invalidExportRequest();
  const checkedIdentity = identity as NonNullable<typeof identity>;
  const checkedScope = scope as NonNullable<typeof scope>;
  const checkedFormat = format as NonNullable<typeof format>;
  const scale = inputScale(value.scale);
  if (!scale.ok) return scale;
  return {
    ok: true,
    value: {
      collectionId: checkedIdentity.collectionId,
      revision: checkedIdentity.revision,
      format: checkedFormat,
      scope: checkedScope,
      scale: scale.value,
    },
  };
}

function invalidExportRequest(): Result<never> {
  return failure(
    'invalid-input',
    'export',
    'Export request contains an unsupported identity, format or scope',
  );
}

function validScale(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 4;
}

function inputScale(value: unknown): Result<number> {
  const scale = value === undefined ? 1 : value;
  return validScale(scale)
    ? { ok: true, value: scale }
    : failure('invalid-input', 'export.scale', 'Export scale must be between 1 and 4');
}

function inputIdentity(value: unknown): { collectionId: string; revision: number } | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return makeIdentity(record.collectionId, record.revision);
}

function makeIdentity(
  collectionId: unknown,
  revision: unknown,
): { collectionId: string; revision: number } | null {
  if (!validCollectionId(collectionId) || !validRevision(revision)) return null;
  return { collectionId, revision };
}

function validCollectionId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value);
}

function validRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function inputFormat(value: unknown): ExportInput['format'] | null {
  return value === 'dsl' || value === 'svg' || value === 'png' || value === 'markdown'
    ? value
    : null;
}

function inputScope(value: unknown): ExportInput['scope'] | null {
  if (!value || typeof value !== 'object') return null;
  return scopeRecord(value as Record<string, unknown>);
}

function scopeRecord(record: Record<string, unknown>): ExportInput['scope'] | null {
  if (record.kind === 'all') return { kind: 'all' };
  const id = record.id;
  if (record.kind !== 'section' || !validCollectionId(id)) return null;
  return { kind: 'section', id };
}

async function dispatchExport(
  request: ExportInput,
  owners: ExportOwners,
  presentation: ReactBindings,
  signal: AbortSignal,
  prepareRaster: () => Promise<Result<void>>,
): Promise<RouteOutcome> {
  switch (request.format) {
    case 'dsl':
      return dsl(request, owners, signal);
    case 'markdown':
      return markdown(request, owners, signal);
    default:
      return nativeExport(request, owners, presentation, signal, prepareRaster);
  }
}

async function nativeExport(
  request: ExportInput,
  owners: ExportOwners,
  presentation: ReactBindings,
  signal: AbortSignal,
  prepareRaster: () => Promise<Result<void>>,
): Promise<RouteOutcome> {
  const prepared = await prepareFormat(request.format, prepareRaster);
  if (!prepared.ok) return prepared;
  return encodeNative(request, owners, presentation, signal);
}

async function prepareFormat(
  format: ExportInput['format'],
  prepareRaster: () => Promise<Result<void>>,
): Promise<Result<void>> {
  return format === 'png' ? prepareRaster() : { ok: true, value: undefined };
}

async function encodeNative(
  request: ExportInput,
  owners: ExportOwners,
  presentation: ReactBindings,
  signal: AbortSignal,
): Promise<RouteOutcome> {
  const exporter = composeExport({
    presentation,
    readerCss: '',
    snapshots: { acquire: (identity) => acquireSnapshot(identity, owners, signal) },
    documents: documents(owners),
    resources: resourceInspector(),
  });
  const artifact = await exporter.service.exportArtifact(
    {
      identity: { collectionId: request.collectionId, revision: request.revision },
      format: request.format,
      scope: request.scope,
      scale: request.scale,
    },
    signal,
  );
  return artifactFileResult(artifact);
}

function artifactFileResult(
  artifact: ExportResult<import('@novakai/canvas-export').Artifact>,
): RouteOutcome {
  return artifact.ok
    ? { kind: 'bytes', file: artifactFile(artifact.value) }
    : routeFailure(artifact);
}

async function acquireSnapshot(
  identity: { readonly collectionId: string; readonly revision: number },
  owners: ExportOwners,
  signal: AbortSignal,
): Promise<
  import('@novakai/canvas-export').Result<import('@novakai/canvas-export').SnapshotLease>
> {
  const current = await readWorkspace(owners, signal);
  if (!current.ok) return current;
  const selected = selectCollection(current.value, identity, owners);
  if (!selected.ok) return selected;
  return retainSnapshot(selected.value, owners, signal);
}

async function readWorkspace(
  owners: ExportOwners,
  signal: AbortSignal,
): Promise<ExportResult<import('@novakai/canvas-authoring').Snapshot>> {
  if (signal.aborted) return rejected('cancelled', 'export', 'Export was cancelled');
  const current = await owners.authoring(signal).read(owners.workspace);
  return readWorkspaceResult(current, signal);
}

function readWorkspaceResult(
  current: ReturnType<Authoring['read']> extends Promise<infer T> ? T : never,
  signal: AbortSignal,
): ExportResult<import('@novakai/canvas-authoring').Snapshot> {
  if (!current.ok) return readFailure(current.error);
  return signal.aborted ? rejected('cancelled', 'export', 'Export was cancelled') : current;
}

function readFailure(error: { readonly code: string; readonly message: string }) {
  return rejected(
    error.code === 'cancelled' ? 'cancelled' : 'encoding-failed',
    'workspace',
    error.message,
  );
}

type SelectedCollection = {
  readonly collection: import('@novakai/canvas-model').Collection;
  readonly view: WorkspaceContents;
};

function selectCollection(
  snapshot: import('@novakai/canvas-authoring').Snapshot,
  identity: { readonly collectionId: string; readonly revision: number },
  owners: ExportOwners,
): ExportResult<SelectedCollection> {
  const view = owners.views.read(snapshot);
  if (!view.ok) return rejected('encoding-failed', 'workspace', view.error.message);
  const collection = view.value.collections.find((item) => item.id === identity.collectionId);
  if (!collection)
    return rejected('invalid-input', 'identity.collectionId', 'Collection does not exist');
  return matchingRevision(collection, identity.revision, view.value);
}

function matchingRevision(
  collection: import('@novakai/canvas-model').Collection,
  revision: number,
  view: WorkspaceContents,
): ExportResult<SelectedCollection> {
  if (collection.revision !== revision)
    return rejected(
      'snapshot-mismatch',
      'identity.revision',
      'Requested revision is no longer available',
    );
  return { ok: true, value: { collection, view } };
}

async function retainSnapshot(
  selected: SelectedCollection,
  owners: ExportOwners,
  signal: AbortSignal,
): Promise<ExportResult<import('@novakai/canvas-export').SnapshotLease>> {
  const digests = owners.resources.forCollection(selected.collection, selected.view);
  if (!digests.ok) return rejected('resource-rejected', 'resources', digests.error.message);
  const lease = owners.assets.acquire(digests.value);
  if (!lease.ok) return rejected('resource-rejected', 'resources', lease.error.message);
  return finishLease(selected, owners, signal, lease.value);
}

async function finishLease(
  selected: SelectedCollection,
  owners: ExportOwners,
  signal: AbortSignal,
  lease: ReadLease,
): Promise<ExportResult<import('@novakai/canvas-export').SnapshotLease>> {
  if (signal.aborted)
    return settledFailure(
      rejected('cancelled', 'export', 'Export was cancelled'),
      releaseLease(lease),
    );
  const prepared = await prepareSnapshot(selected, owners, lease, signal);
  if (!prepared.ok) return settledFailure(prepared, releaseLease(lease));
  return {
    ok: true,
    value: { snapshot: prepared.value, release: async () => releaseLease(lease) },
  };
}

async function prepareSnapshot(
  selected: SelectedCollection,
  owners: ExportOwners,
  lease: ReadLease,
  signal: AbortSignal,
): Promise<ExportResult<Snapshot>> {
  try {
    const document = await renderDocument(selected, owners, signal);
    return document.ok ? buildSnapshot(selected, document.value, lease, signal) : document;
  } catch {
    return rejected(
      'encoding-failed',
      'snapshot',
      'The retained export snapshot could not be prepared',
    );
  }
}

async function renderDocument(
  selected: SelectedCollection,
  owners: ExportOwners,
  signal: AbortSignal,
): Promise<ExportResult<import('../contract/records/rendering.js').RenderDocument>> {
  const document = await owners.renderer.render(selected.collection, selected.view, signal);
  return document.ok ? document : renderFailure(document.error);
}

function renderFailure(error: { readonly code: string; readonly message: string }) {
  return rejected(
    error.code === 'cancelled' ? 'cancelled' : 'encoding-failed',
    'render',
    error.message,
  );
}

function buildSnapshot(
  selected: SelectedCollection,
  document: import('../contract/records/rendering.js').RenderDocument,
  lease: ReadLease,
  signal: AbortSignal,
): ExportResult<Snapshot> {
  if (signal.aborted) return rejected('cancelled', 'export', 'Export was cancelled');
  const resources = retainedResources(lease, selected.collection, document, selected.view.presets);
  if (!resources.ok) return resources;
  return {
    ok: true,
    value: {
      identity: {
        collectionId: selected.collection.id,
        revision: selected.collection.revision,
        inputKey: document.scene.inputKey,
        title: selected.collection.title,
      },
      collection: selected.collection,
      scene: document.scene,
      resources: resources.value,
      paint: {
        fill: document.style.surface,
        stroke: document.style.border,
        text: document.style.text,
      },
    },
  };
}

function retainedResources(
  lease: ReadLease,
  collection: import('@novakai/canvas-model').Collection,
  document: import('../contract/records/rendering.js').RenderDocument,
  presets: Catalog,
): ExportResult<readonly Resource[]> {
  const theme = themeResource(collection, presets);
  if (!theme)
    return rejected('resource-rejected', 'resources.theme', 'The pinned theme is unavailable');
  const assets = assetResources(lease, collection);
  const fonts = fontResources(lease, document);
  return combineResources(theme, assets, fonts);
}

function themeResource(
  collection: import('@novakai/canvas-model').Collection,
  presets: Catalog,
): ThemePreset | undefined {
  return presets.find(
    (item): item is ThemePreset =>
      item.kind === 'theme' &&
      item.id === collection.theme.id &&
      item.version === collection.theme.version,
  );
}

function combineResources(
  theme: ThemePreset,
  assets: ExportResult<readonly Resource[]>,
  fonts: ExportResult<readonly Resource[]>,
): ExportResult<readonly Resource[]> {
  if (!assets.ok) return assets;
  if (!fonts.ok) return fonts;
  return {
    ok: true,
    value: [
      {
        kind: 'preset',
        digest: theme.digest,
        mediaType: 'application/json',
        bytes: Buffer.from(JSON.stringify(theme)),
        metadata: {},
      },
      ...assets.value,
      ...fonts.value,
    ],
  };
}

function assetResources(
  lease: ReadLease,
  collection: import('@novakai/canvas-model').Collection,
): ExportResult<readonly Resource[]> {
  return resourceList(
    collection.assets.map((item) => {
      const blob = readLease(lease, item.digest.slice(7), `resources.${item.id}`);
      return resourceFromBlob(blob, 'asset', { alt: item.alt });
    }),
  );
}

function fontResources(
  lease: ReadLease,
  document: import('../contract/records/rendering.js').RenderDocument,
): ExportResult<readonly Resource[]> {
  return resourceList(
    document.fonts.map((font) => {
      const blob = readLease(lease, font.digest, `resources.${font.digest}`);
      return resourceFromBlob(blob, 'font', { family: font.family });
    }),
  );
}

function resourceFromBlob(
  blob: import('@novakai/canvas-assets').Result<StoredBlob>,
  kind: Resource['kind'],
  metadata: Record<string, string>,
): ExportResult<Resource> {
  return blob.ok
    ? {
        ok: true,
        value: {
          kind,
          digest: blob.value.descriptor.digest,
          mediaType: blob.value.descriptor.mediaType,
          bytes: Buffer.from(blob.value.base64, 'base64'),
          metadata,
        },
      }
    : rejected('resource-rejected', blob.error.path, blob.error.message);
}

function resourceList(
  results: readonly ExportResult<Resource>[],
): ExportResult<readonly Resource[]> {
  const failureResult = results.find(
    (result): result is Extract<ExportResult<Resource>, { readonly ok: false }> => !result.ok,
  );
  if (failureResult) return failureResult;
  return {
    ok: true,
    value: results.map(
      (result) => (result as Extract<ExportResult<Resource>, { readonly ok: true }>).value,
    ),
  };
}

function readLease(
  lease: ReadLease,
  digest: unknown,
  path: string,
): import('@novakai/canvas-assets').Result<StoredBlob> {
  try {
    return lease.read(digest);
  } catch {
    return {
      ok: false,
      error: {
        code: 'storage-unavailable',
        path,
        message: 'The retained export resource could not be read',
        recovery: 'Re-read blob and lease state before retry; Assets owns orphan cleanup.',
      },
    };
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

async function dsl(
  input: ExportInput,
  owners: ExportOwners,
  signal: AbortSignal,
): Promise<RouteOutcome> {
  if (input.scope.kind !== 'all')
    return failure('invalid-input', 'scope', 'Canonical DSL export requires the whole collection');
  const acquired = await acquireSnapshot(input, owners, signal);
  if (!acquired.ok) return routeFailure(acquired);
  return settleDsl(input, owners, signal, acquired.value);
}

async function markdown(
  input: ExportInput,
  owners: ExportOwners,
  signal: AbortSignal,
): Promise<RouteOutcome> {
  const acquired = await acquireSnapshot(input, owners, signal);
  if (!acquired.ok) return routeFailure(acquired);
  return settleMarkdown(input, signal, acquired.value);
}

async function settleMarkdown(
  input: ExportInput,
  signal: AbortSignal,
  lease: import('@novakai/canvas-export').SnapshotLease,
): Promise<RouteOutcome> {
  const primary = markdownSource(signal, lease.snapshot.collection, input.scope);
  const settled = settledFailure(primary, await lease.release());
  return settled.ok ? markdownFile(input, settled.value) : routeFailure(settled);
}

function markdownSource(
  signal: AbortSignal,
  collection: import('@novakai/canvas-model').Collection,
  scope: MarkdownScope,
): ExportResult<string> {
  if (signal.aborted) return cancelledExport();
  const source = formatMarkdown(collection, scope);
  if (source === undefined)
    return rejected('invalid-input', 'scope', 'The requested section does not exist');
  return markdownCompletion(source, signal);
}

function markdownCompletion(source: string, signal: AbortSignal): ExportResult<string> {
  return signal.aborted ? cancelledExport() : { ok: true, value: source };
}

function cancelledExport(): ExportResult<never> {
  return rejected('cancelled', 'export', 'Export was cancelled');
}

function markdownFile(input: ExportInput, source: string): RouteOutcome {
  const scope = input.scope.kind === 'all' ? 'all' : input.scope.id;
  return {
    kind: 'bytes',
    file: {
      bytes: Buffer.from(source, 'utf8'),
      mediaType: 'text/markdown; charset=utf-8',
      filename: `${input.collectionId}-${input.revision}-${scope}.md`,
      headers: { 'X-Novakai-Export-Revision': String(input.revision) },
    },
  };
}

async function settleDsl(
  input: ExportInput,
  owners: ExportOwners,
  signal: AbortSignal,
  lease: import('@novakai/canvas-export').SnapshotLease,
): Promise<RouteOutcome> {
  const primary = dslSource(owners, signal, lease.snapshot.collection);
  const settled = settledFailure(primary, await lease.release());
  return settled.ok ? dslFile(input, settled.value) : routeFailure(settled);
}

function dslSource(
  owners: ExportOwners,
  signal: AbortSignal,
  collection: import('@novakai/canvas-model').Collection,
): ExportResult<string> {
  return signal.aborted
    ? rejected('cancelled', 'export', 'Export was cancelled')
    : documents(owners).print(collection);
}

function dslFile(input: ExportInput, source: string): RouteOutcome {
  return {
    kind: 'bytes',
    file: {
      bytes: Buffer.from(source, 'utf8'),
      mediaType: 'text/plain; charset=utf-8',
      filename: `${input.collectionId}-${input.revision}.canvas`,
      headers: { 'X-Novakai-Export-Revision': String(input.revision) },
    },
  };
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

function releaseLease(lease: ReadLease): ExportResult<void> {
  try {
    return resultFromRelease(lease.release());
  } catch {
    return rejected(
      'cleanup-failed',
      'export.release',
      'The export resource lease could not be released',
    );
  }
}

function settledFailure<T>(primary: ExportResult<T>, cleanup: ExportResult<void>): ExportResult<T> {
  if (cleanup.ok) return primary;
  if (primary.ok) return cleanup;
  return { ok: false, error: { ...primary.error, cleanup: cleanup.error } };
}

function routeFailure(
  result: Extract<ExportResult<unknown>, { readonly ok: false }>,
): RouteOutcome {
  const code = result.error.code === 'cancelled' ? 'cancelled' : 'invalid-input';
  return failure(code, result.error.path, result.error.message, exportSource(result.error));
}

function exportSource(error: import('@novakai/canvas-export').Diagnostic): OperationSource {
  return {
    code: error.code,
    path: error.path,
    message: error.message,
    recovery: error.recovery,
    cleanup: error.cleanup === undefined ? undefined : exportSource(error.cleanup),
  };
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
