import type { FailureSource } from '../../contract/records/failure-source.js';
import { z } from 'zod';
import { validate } from '@novakai/canvas-model';
import type { Collection } from '@novakai/canvas-model';
import { digest, failure } from '@novakai/canvas-authoring';
import type { Request, Snapshot, Result, Digest } from '@novakai/canvas-authoring';
import type { Catalog, Preset } from '@novakai/canvas-templates';
import type { ResolvedResources, ResourceRequest } from '@novakai/canvas-language';
import type { ResourceOwners } from '../../contract/records/resources.js';
import type { ResourceSelector, ResourceSelection } from '../../contract/records/planning.js';
import type { WorkspaceContents } from '../../contract/records/workspace.js';
import { dslCommand, modelCommand } from '../../contract/records/commands.js';
/** Exact owner diagnostics cross private selection steps; Authoring catches the resulting typed rejection. */
class ResourceFault extends Error {
  /** Private native/input failures have no invented source; checked owner failures retain theirs. */
  constructor(
    message: string,
    readonly source?: FailureSource,
  ) {
    super(message);
  }
}
/** No missing resource is replaced by an empty alias, fallback theme or unverified blob. */
function accepted<T>(result: Result<T, FailureSource>): T {
  if (!result.ok)
    throw new ResourceFault('The owning capability rejected this input', result.error);
  return result.value;
}
/** Startup candidates are fixed trusted installation data; ordinary requests read only authoritative stored presets. */
function presets(
  request: Request,
  snapshot: Snapshot,
  owners: ResourceOwners,
): Catalog {
  if (request.intent.kind !== 'change') return storedPresets(snapshot, owners);
  if (request.intent.planner === 'bootstrap') return owners.installation;
  return storedPresets(snapshot, owners);
}
/** Complete catalog decoding checks hashes and dependency closure, including versions not selected by this request. */
function storedPresets(
  snapshot: Snapshot,
  owners: ResourceOwners,
): Catalog {
  return accepted(
    owners.templates.readCatalog(
      snapshot.records
        .filter((item) => item.key.kind === 'preset' && !item.deleted)
        .map((item) => item.value),
    ),
  );
}
/** A tiny empty collection asks Model to mint the actual binding schema; host does not duplicate its schema or invariants. */
function binding(preset: Preset): Collection['theme'] {
  if (preset.kind !== 'theme') throw new ResourceFault('Selected preset is not a theme');
  return accepted(
    validate({
      schemaVersion: 1,
      id: 'binding',
      revision: 0,
      title: 'Resource binding',
      arrangement: { algorithm: 'grid' },
      theme: {
        id: preset.id,
        version: preset.version,
        digest: `sha256:${preset.digest}`,
        roles: preset.payload.roles,
      },
    }),
  ).theme;
}
/** Exact pins and latest aliases are distinct keys; Templates owns version ordering for the latter. */
function themes(
  catalog: Catalog,
  owners: ResourceOwners,
): ResolvedResources['themes'] {
  const records = catalog.filter((item) => item.kind === 'theme');
  const exact = records.map(
    (item) => [`${item.id}@${item.version}#sha256:${item.digest}`, binding(item)] as const,
  );
  const aliases = [...new Set(records.map((item) => item.id))].map(
    (id) => [id, binding(accepted(owners.templates.read(catalog, { kind: 'theme', id })))] as const,
  );
  return Object.fromEntries([...exact, ...aliases]);
}
interface AuthoredResources {
  readonly collection: string | null;
  readonly requests: readonly ResourceRequest[];
}
/** Only a checked DSL envelope contributes authored resource metadata; no arbitrary JSON field is interpreted as a file path. */
function authored(
  request: Request,
  owners: ResourceOwners,
): AuthoredResources {
  if (request.intent.kind !== 'change') return { collection: null, requests: [] };
  return authoredChange(request.intent, owners);
}
/** Model changes identify their collection but never authorize filesystem or network reads. */
function authoredChange(
  intent: Extract<Request['intent'], { readonly kind: 'change' }>,
  owners: ResourceOwners,
): AuthoredResources {
  if (intent.planner === 'preset') return presetAuthored(intent.payload, owners);
  if (intent.planner === 'dsl') {
    const command = dslCommand.parse(intent.payload);
    const parsed = accepted(owners.language.parse(command.source));
    return { collection: parsed.collection, requests: parsed.resources };
  }
  return authoredModel(intent);
}
/** Model selections carry scope only; they cannot supply filesystem declarations. */
function authoredModel(
  intent: Extract<Request['intent'], { readonly kind: 'change' }>,
): AuthoredResources {
  if (intent.planner === 'model')
    return { collection: modelCommand.parse(intent.payload).collection, requests: [] };
  return { collection: null, requests: [] };
}
/** Preset acquisition distinguishes theme fonts from recipe asset declarations without inventing collection metadata. */
function presetAuthored(
  input: unknown,
  owners: ResourceOwners,
): AuthoredResources {
  const payload = z
    .looseObject({
      admission: z.looseObject({
        kind: z.enum(['theme', 'recipe']),
        source: z.string().optional(),
      }),
    })
    .parse(input);
  if (payload.admission.kind === 'theme') return { collection: null, requests: [] };
  const parsed = accepted(owners.language.parse(payload.admission.source ?? ''));
  return { collection: null, requests: parsed.resources };
}
/** Existing bindings are collection-local; identical aliases in another collection never leak into this request. */
function priorAssets(
  id: string | null,
  snapshot: Snapshot,
): Collection['assets'] {
  const record = snapshot.records.find(
    (item) => item.key.kind === 'collection' && item.key.id === id && !item.deleted,
  );
  if (!record) return [];
  return accepted(validate(record.value)).assets;
}
/** Resolve byte identity through Assets, and let Model check the authored binding metadata. */
function newAsset(
  request: Request['assets'][number],
  metadata: ResourceRequest,
  theme: Collection['theme'],
  owners: ResourceOwners,
): Collection['assets'][number] {
  const blob = accepted(owners.assets.resolve(request.digest));
  const asset = {
    id: request.alias,
    digest: `sha256:${request.digest}`,
    mediaType: blob.descriptor.mediaType,
    alt: metadata.alt ?? request.alias,
    ...optionalMetadata(metadata),
  };
  const validated = accepted(
    validate({
      schemaVersion: 1,
      id: 'binding',
      revision: 0,
      title: 'Asset binding',
      theme,
      assets: [asset],
      arrangement: { algorithm: 'grid' },
    }),
  ).assets[0];
  if (!validated) throw new ResourceFault('Asset binding is missing after owner validation');
  return validated;
}
/** Optional provenance remains absent when unauthored; the bridge never invents a license or attribution. */
function optionalMetadata(metadata: ResourceRequest): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries({ license: metadata.license, attribution: metadata.attribution }).filter(
      (item): item is [string, string] => typeof item[1] === 'string',
    ),
  );
}
/** An explicit upload must have metadata in the source; otherwise a known unchanged binding must already identify the same bytes. */
function suppliedAsset(
  request: Request['assets'][number],
  authored: AuthoredResources,
  previous: Collection['assets'],
  theme: Collection['theme'],
  owners: ResourceOwners,
): Collection['assets'][number] {
  const metadata = authored.requests.find(
    (item) => item.alias === request.alias && item.kind !== 'theme',
  );
  if (metadata) return newAsset(request, metadata, theme, owners);
  const existing = previous.find(
    (item) => item.id === request.alias && item.digest === `sha256:${request.digest}`,
  );
  if (!existing) throw new ResourceFault(`Missing authored asset metadata: ${request.alias}`);
  return existing;
}
/** Incoming aliases override only their own prior binding; all values remain checked canonical Model data. */
function assets(
  request: Request,
  source: AuthoredResources,
  snapshot: Snapshot,
  resolvedThemes: ResolvedResources['themes'],
  owners: ResourceOwners,
): ResolvedResources['assets'] {
  const previous = priorAssets(source.collection, snapshot);
  if (isThemeAdmission(request)) return {};
  const pinned = source.requests
    .filter((item) => item.kind !== 'theme' && item.source.startsWith('sha256:'))
    .map((item) => ({ alias: item.alias, digest: digest.parse(item.source.slice(7)) }));
  const supplied = [...pinned, ...request.assets];
  if (supplied.length === 0) return Object.fromEntries(previous.map((item) => [item.id, item]));
  const theme = firstTheme(resolvedThemes);
  return Object.fromEntries(
    [
      ...previous,
      ...supplied.map((item) => suppliedAsset(item, source, previous, theme, owners)),
    ].map((item) => [item.id, item]),
  );
}
/** Theme font bytes enter lease coverage directly, never through Model asset binding metadata. */
function isThemeAdmission(request: Request): boolean {
  if (request.intent.kind !== 'change') return false;
  if (request.intent.planner !== 'preset') return false;
  const payload = z
    .looseObject({ admission: z.looseObject({ kind: z.string() }) })
    .parse(request.intent.payload);
  return payload.admission.kind === 'theme';
}
/** Retained alias pins are validated against the current exact catalog; latest aliases cannot replace their bytes. */
function pinnedThemes(
  request: Request,
  available: ResolvedResources['themes'],
): ResolvedResources['themes'] {
  if (request.intent.kind !== 'change') return available;
  if (request.intent.planner !== 'dsl') return available;
  const command = dslCommand.parse(request.intent.payload);
  const pins = Object.entries(command.themePins ?? {}).map(([alias, exact]) => {
    const pin = available[exact];
    if (!pin) throw new ResourceFault(`Retained theme pin unavailable: ${exact}`);
    return [alias, pin] as const;
  });
  return { ...available, ...Object.fromEntries(pins) };
}
/** Hold actual bytes for current content, history, installation fonts and submitted bindings until physical commit settles. */
function coverage(
  request: Request,
  snapshot: Snapshot,
  catalog: Catalog,
): readonly Digest[] {
  const fontDigests = catalog
    .filter((item) => item.kind === 'theme')
    .flatMap((item) => item.payload.fonts);
  return [
    ...new Set([
      ...snapshot.records.flatMap((item) => item.resources),
      ...request.assets.map((item) => item.digest),
      ...fontDigests,
    ]),
  ]
    .toSorted()
    .map((value) => digest.parse(value));
}
/** Resolve immutable aliases and conservative read dependencies; unrelated data is not granted write scope. */
function select(
  request: Request,
  snapshot: Snapshot,
  owners: ResourceOwners,
): ResourceSelection {
  const catalog = presets(request, snapshot, owners);
  const resolvedThemes = pinnedThemes(request, themes(catalog, owners));
  const source = authored(request, owners);
  const resources = {
    themes: resolvedThemes,
    assets: assets(request, source, snapshot, resolvedThemes, owners),
  };
  return {
    resources,
    pins: z.json().parse({ resources }),
    covered: [
      ...new Set([
        ...coverage(request, snapshot, catalog),
        ...Object.values(resources.assets).map((item) => digest.parse(item.digest.slice(7))),
      ]),
    ],
    reads: snapshot.records
      .filter((item) => item.key.kind === 'preset')
      .map((item) => ({ key: item.key, version: item.version })),
  };
}
/** Canonical theme roles must equal the actual pin's roles; referenced images retain their mechanically verified media type. */
function collectionResources(
  collection: Collection,
  view: WorkspaceContents,
  owners: ResourceOwners,
): readonly Digest[] {
  const theme = accepted(
    owners.templates.read(view.presets, {
      kind: 'theme',
      id: collection.theme.id,
      version: collection.theme.version,
      digest: collection.theme.digest.slice(7),
    }),
  );
  if (theme.kind !== 'theme') throw new ResourceFault('Collection pin does not identify a theme');
  checkAssets(collection, theme.payload.roles, owners);
  return [
    ...new Set([...theme.payload.fonts, ...collection.assets.map((item) => item.digest.slice(7))]),
  ]
    .toSorted()
    .map((value) => digest.parse(value));
}
/** Byte descriptors and pinned roles are cross-owner references; failure rejects the whole proposed binding. */
function checkAssets(
  collection: Collection,
  roles: readonly string[],
  owners: ResourceOwners,
): void {
  if (
    JSON.stringify([...collection.theme.roles].toSorted()) !== JSON.stringify([...roles].toSorted())
  )
    throw new ResourceFault('Collection theme roles differ from the pinned preset');
  collection.assets.forEach((item) => {
    const blob = accepted(owners.assets.resolve(item.digest.slice(7)));
    if (blob.descriptor.mediaType !== item.mediaType)
      throw new ResourceFault(`Asset media type differs: ${item.id}`);
  });
}
/** Structured owner failures ask for resource correction; malformed envelopes never leak native exception strings. */
function rejected(error: unknown): Result<never> {
  if (error instanceof ResourceFault)
    return failure('missing-asset', 'resources', error.message, [], error.source);
  return failure('invalid-input', 'resources', 'Resource request could not be decoded');
}
/** Private selection exceptions are translated into Authoring's public outcome before any lease/write is exposed. */
function guarded<T>(operation: () => T): Result<T> {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    return rejected(error);
  }
}
/** Pure alias selection and resource correspondence are separate from the physical Assets lease lifecycle. */
export function createResourceSelector(owners: ResourceOwners): ResourceSelector {
  return {
    select: (request, snapshot) => guarded(() => select(request, snapshot, owners)),
    forCollection: (collection, workspace) =>
      guarded(() => collectionResources(collection, workspace, owners)),
  };
}

/** Model binding validation requires one actual admitted theme. */
function firstTheme(themes: ResolvedResources['themes']): Collection['theme'] {
  const theme = Object.values(themes)[0];
  if (!theme) throw new ResourceFault('Asset binding requires an admitted theme');
  return theme;
}
