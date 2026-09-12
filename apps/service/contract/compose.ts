import { openAssets } from '@novakai/canvas-assets';
import { openSqlite } from '@novakai/canvas-persistence';
import { composeAuthoring, failure as authoringFailure } from '@novakai/canvas-authoring';
import type {
  Authoring,
  CandidateValidator,
  Request,
  Result as AuthoringResult,
} from '@novakai/canvas-authoring';
import type { WorkspaceOptions, NativeWorkspace } from './records/startup.js';
import type { AdmissionRuntime } from './records/runtime.js';
import type { WorkspaceSession } from './types.js';
import { createWorkspaceSession, createHttpAdmission, readCommand } from './api.js';
import type { LocalServer, ServerOptions } from './records/server.js';
import type { Assets } from '@novakai/canvas-assets';
import { createTokenFileBindings, composeDesignSystem } from '@novakai/canvas-design-system';
import { composeTemplates } from '@novakai/canvas-templates';
import { createLanguage } from '@novakai/canvas-language';
import { validate, plan, stage } from '@novakai/canvas-model';
import type { BuiltinResources } from './records/builtins.js';
import type { DiagramProducer } from './ports/rendering.js';
import { produce } from '../core/rendering/produce.js';
import type { Result } from './errors.js';
import { failure } from './errors.js';
/** Explicit worker lifecycle keeps native measurement away from browser imports; the parent owns worker failure/retry. */
export async function runRenderWorker(): Promise<Result<void>> {
  try {
    const [entry, input, rendering] = await Promise.all([
      import('../adapters/worker-entry.js'),
      import('../adapters/rendering-input.js'),
      import('../adapters/rendering.js'),
    ]);
    return entry.serveRenderWorker({
      producer: { produce: rendering.produceDiagram },
      read: input.readRenderingJob,
    });
  } catch {
    return failure('unavailable', 'worker', 'Rendering worker could not initialize');
  }
}

/** Bind real worker execution and independent owner readout once; service retains the prior scene on any failed job. */
export async function createDiagramProducer(timeoutMs = 30000): Promise<Result<DiagramProducer>> {
  try {
    const [worker, output] = await Promise.all([
      import('../adapters/render-worker.js'),
      import('../adapters/rendering-output.js'),
    ]);
    const transport = worker.createRenderTransport(timeoutMs);
    return {
      ok: true,
      value: {
        produce: (job, signal) =>
          produce(job, signal, transport, { read: output.readRenderDocument }),
      },
    };
  } catch {
    return failure('unavailable', 'render', 'Rendering bindings could not initialize');
  }
}

/** Read and prepare shipped resources through their real owners; caller submits returned preset bindings through Authoring. */
async function prepareInstallationInputs(
  resourceRoot: string,
  tokenRoot: string,
  assets: Assets,
): Promise<Result<BuiltinResources>> {
  const files = await createTokenFileBindings(tokenRoot);
  if (!files.ok) return failure('unavailable', 'tokens', files.error.message);
  const [loader, codecs, builtins] = await Promise.all([
    import('../adapters/builtin-files.js'),
    import('../adapters/preset-codecs.js'),
    import('../adapters/builtin-presets.js'),
  ]);
  const sources = await loader.loadBuiltinSources(resourceRoot, assets, files.value);
  if (!sources.ok) return sources;
  const context = {
    system: composeDesignSystem(),
    sources: sources.value.tokens,
    language: createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } }),
    resources: { themes: {}, assets: {} },
  };
  return builtins.prepareBuiltinPresets(sources.value, {
    context,
    templates: (context) => composeTemplates(codecs.createPresetCodecs(context)),
  });
}

/** Resource/provider startup failures leave the existing workspace untouched; caller repairs the installation and retries. */
export async function prepareInstallation(
  resourceRoot: string,
  tokenRoot: string,
  assets: Assets,
): Promise<Result<BuiltinResources>> {
  try {
    return await prepareInstallationInputs(resourceRoot, tokenRoot, assets);
  } catch {
    return failure(
      'unavailable',
      'installation',
      'Installation resource providers could not initialize',
    );
  }
}

interface WiredWorkspace {
  readonly session: WorkspaceSession;
  readonly validation: CandidateValidator;
  readonly initialize: AuthoringResult<Request>;
}
/** Bind one request's cancellation through Authoring and actual feasibility workers; no global current-request variable is used. */
function requestAuthoring(
  runtime: AdmissionRuntime,
  signal: AbortSignal,
  makeFeasibility: typeof import('../adapters/feasibility.js').createFeasibility,
): Authoring {
  return composeAuthoring({
    ...runtime.store,
    planners: runtime.planners,
    validation: runtime.validation,
    resources: runtime.resources,
    notifications: runtime.changes,
    cancellation: { cancelled: () => signal.aborted },
    feasibility: makeFeasibility({
      ...runtime.feasibility,
      producer: {
        produce: (job) => runtime.feasibility.producer.produce(job, signal),
      },
    }),
  });
}
/** All concrete bridges are wired here; adapters never import siblings or reach another capability's private implementation. */
async function wireWorkspace(
  native: NativeWorkspace,
  installation: BuiltinResources,
  options: WorkspaceOptions,
  producer: DiagramProducer,
): Promise<WiredWorkspace> {
  const [
    storeModule,
    codecModule,
    viewModule,
    resourceModule,
    leaseModule,
    collectionModule,
    libraryModule,
    plannerModule,
    validationModule,
    jobModule,
    feasibilityModule,
    rendererModule,
    installationModule,
    channelModule,
    lifetimeModule,
  ] = await Promise.all([
    import('../adapters/authoring-store.js'),
    import('../adapters/preset-codecs.js'),
    import('../adapters/workspace-reader.js'),
    import('../adapters/resource-selection.js'),
    import('../adapters/resource-leases.js'),
    import('../adapters/collection-plans.js'),
    import('../adapters/library-planner.js'),
    import('../adapters/diagram-planners.js'),
    import('../adapters/candidate-validation.js'),
    import('../adapters/render-jobs.js'),
    import('../adapters/feasibility.js'),
    import('../adapters/collection-renderer.js'),
    import('../adapters/installation-planner.js'),
    import('../adapters/change-channel.js'),
    import('../adapters/session-lifetime.js'),
  ]);
  const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
  const system = composeDesignSystem();
  const context = {
    system,
    language,
    sources: installation.tokens,
    resources: { themes: {}, assets: {} },
  };
  const templates = composeTemplates(codecModule.createPresetCodecs(context));
  const views = viewModule.createWorkspaceReader({ templates });
  const resources = resourceModule.createResourceSelector({
    assets: native.assets,
    templates,
    language,
    installation: installation.presets,
  });
  const collections = collectionModule.createCollectionPlanner(views, resources);
  const initial = {
    workspace: options.workspace,
    title: options.title,
    createdAt: options.createdAt,
    presets: installation.presets,
  };
  const planners = [
    installationModule.createInstallationPlanner(initial),
    libraryModule.createLibraryPlanner(views),
    ...plannerModule.createDiagramPlanners({ language, workspace: views, resources, collections }),
  ];
  const validation = validationModule.createCandidateValidator({
    workspace: views,
    resources,
    assets: native.assets,
  });
  const jobs = jobModule.createRenderJobs({
    assets: native.assets,
    system,
    sources: installation.tokens,
    templates,
    wasmResource: `${options.resourceRoot}/vendor/layout/libavoid.wasm`,
  });
  const changes = channelModule.createChangeChannel();
  const lifetime = lifetimeModule.createSessionLifetime(async () => {
    changes.close();
    return native.close();
  });
  const runtime = {
    store: storeModule.createAuthoringStore(native.storage),
    planners,
    validation,
    resources: leaseModule.createResourceAdmission(resources, native.assets),
    changes,
    feasibility: { workspace: views, jobs, producer },
  };
  const session = createWorkspaceSession({
    workspace: options.workspace,
    installation,
    views,
    changes,
    lifetime,
    readSignal: new AbortController().signal,
    unavailable: () =>
      authoringFailure('storage-unavailable', 'session', 'Workspace is closing or closed'),
    authoring: (signal) => requestAuthoring(runtime, signal, feasibilityModule.createFeasibility),
    renderer: rendererModule.createCollectionRenderer({
      assets: native.assets,
      jobs,
      producer,
      resources,
    }),
  });
  return { session, validation, initialize: installationModule.installationRequest(initial) };
}
/** Existing workspaces are validated without rewriting them; new workspaces receive one ordinary atomic initialization request. */
async function initialize(wired: WiredWorkspace): Promise<Result<WorkspaceSession>> {
  const snapshot = await wired.session.read();
  if (!snapshot.ok) return failure('unavailable', snapshot.error.path, snapshot.error.message);
  const existing = snapshot.value.records.some(
    (item) => item.key.kind === 'workspace' && !item.deleted,
  );
  return initialized(existing, snapshot.value, wired);
}
/** Startup never replaces an existing catalog after a failed read or failed owner validation. */
async function initialized(
  existing: boolean,
  snapshot: import('./records/owners.js').Snapshot,
  wired: WiredWorkspace,
): Promise<Result<WorkspaceSession>> {
  if (existing) {
    const checked = await wired.validation.validate(snapshot, snapshot, []);
    return started(checked, wired.session);
  }
  if (!wired.initialize.ok)
    return failure('invalid-input', wired.initialize.error.path, wired.initialize.error.message);
  return started(
    await wired.session.apply(wired.initialize.value, new AbortController().signal),
    wired.session,
  );
}
/** A startup receipt proves initialization was admitted; an existing-state result proves its current owner contracts. */
function started(
  result: AuthoringResult<unknown>,
  session: WorkspaceSession,
): Result<WorkspaceSession> {
  if (!result.ok) return failure('unavailable', result.error.path, result.error.message);
  return { ok: true, value: session };
}
/** Resource preparation and worker construction precede registration of the authoritative workspace facade. */
async function configureWorkspace(
  native: NativeWorkspace,
  options: WorkspaceOptions,
): Promise<Result<WorkspaceSession>> {
  const installation = await prepareInstallation(
    options.resourceRoot,
    options.tokenRoot,
    native.assets,
  );
  if (!installation.ok) return installation;
  const producer = await createDiagramProducer();
  if (!producer.ok) return producer;
  return initialize(await wireWorkspace(native, installation.value, options, producer.value));
}
/** Failed startup releases only native handles; committed records and staged bytes remain at their original location. */
async function startOpened(
  native: NativeWorkspace,
  options: WorkspaceOptions,
): Promise<Result<WorkspaceSession>> {
  const result = await configureWorkspace(native, options).catch(() =>
    failure<WorkspaceSession>('unavailable', 'startup', 'Workspace composition failed'),
  );
  if (!result.ok) await native.close();
  return result;
}
/** Open a real persistent workspace explicitly. Every canonical initial/edit write passes through Authoring; caller owns startup recovery. */
export async function openWorkspace(options: WorkspaceOptions): Promise<Result<WorkspaceSession>> {
  try {
    const files = await import('../adapters/workspace-files.js');
    const native = await files.openWorkspaceFiles(options, {
      assets: openAssets,
      storage: openSqlite,
    });
    if (!native.ok) return native;
    return await startOpened(native.value, options);
  } catch {
    return failure('unavailable', 'startup', 'Workspace could not open; retain its existing files');
  }
}

/** Expose one already-open workspace through authenticated loopback transport. Caller closes transport before draining its workspace. */
export async function serveWorkspace(
  session: WorkspaceSession,
  options: ServerOptions,
): Promise<Result<LocalServer>> {
  try {
    const [credentials, requests, router, source, io, files, server] = await Promise.all([
      import('../adapters/local-credentials.js'),
      import('../adapters/request-reader.js'),
      import('../adapters/http-router.js'),
      import('../adapters/language-readout.js'),
      import('../adapters/http-io.js'),
      import('../adapters/static-files.js'),
      import('../adapters/http-server.js'),
    ]);
    const security = await credentials.createLocalSecurity(options.port, options.credentialFile);
    if (!security.ok) return security;
    const admission = createHttpAdmission(security.value, { read: requests.readAuthoringRequest });
    const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
    return server.startHttpServer(options, {
      security: security.value,
      admission,
      changes: session,
      io: io.createHttpIo(),
      files: files.createStaticFiles(options.webRoot),
      router: router.createHttpRouter({
        session,
        generation: security.value.generation,
        admission,
        decoder: { read: readCommand },
        source: source.createSourceReadout(language),
      }),
    });
  } catch {
    return failure(
      'unavailable',
      'server',
      'HTTP bindings could not initialize; retain the existing workspace',
    );
  }
}
/** Local agent bootstrap reads an existing protected credential; browser consumers must use their HttpOnly session instead. */
export async function readAgentCredential(path: string): Promise<Result<string>> {
  const credentials = await import('../adapters/local-credentials.js');
  return credentials.readAgentCredential(path);
}
