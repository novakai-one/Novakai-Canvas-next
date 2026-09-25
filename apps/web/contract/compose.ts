import { previewModuleRoutes } from '../adapters/route-preview.js';
import type { Diagnostic } from './errors.js';
import { folderIdSchema } from '@novakai/canvas-library';
import { createLibraryController } from '../adapters/library-session.js';
import { createLibraryReader } from '../adapters/library-reader.js';
import { createLibraryBrowser } from '../adapters/react/LibraryBrowser.js';
import { createLibraryFilters } from '../adapters/react/LibraryFilters.js';
import { createLibraryResults } from '../adapters/react/LibraryResults.js';
import { createLibraryOrganisation } from '../adapters/react/LibraryOrganisation.js';
import { createElement, type ComponentType, type ReactElement } from 'react';
import type { FeatureProps, ThemeSelectorProps } from './react-types.js';
import type { LibraryBrowserProps } from './library-react.js';
import { createPreferenceController } from '../adapters/preference-session.js';
import { readEnvironment, observeEnvironment } from '../adapters/browser-preferences.js';
import { createInterfacePreferences } from '../adapters/react/InterfacePreferences.js';
import { createThemeSelector } from '../adapters/react/ThemeSelector.js';
import type { PreferenceController, ThemeChoice } from './records/preferences.js';
import { createEngineeringFields } from '../adapters/react/EngineeringFields.js';
import { createRetainedEditor } from '../adapters/retained-editor.js';
import { readWireDrafts } from '../adapters/wire-reader.js';
import { createWireEditor } from '../adapters/react/WireEditor.js';
import { createWireSemantics } from '../adapters/react/WireSemantics.js';
import { createWireEndpoints } from '../adapters/react/WireEndpoints.js';
import { createWireRouting } from '../adapters/react/WireRouting.js';
import type { InspectorBindings, InspectorSession } from './records/inspector.js';
import type { WireEditorBindings, WireEditorSession } from './records/wire-editor.js';
import {
  retainObjectCommand,
  retainWireCommand,
  editedObject,
  wireChanges,
  encodeObjectRecovery,
  encodeWireRecovery,
} from './api.js';
import { readInspectorDrafts } from '../adapters/inspector-reader.js';
import { createDefinitionSession } from '../adapters/definition-session.js';
import { readDefinitionDrafts } from '../adapters/definition-reader.js';
import { createSourceController } from '../adapters/source-session.js';
import { createWorkspaceNavigation } from '../adapters/browser-navigation.js';
import panelDefaults from '../../../resources/ui/panels.default.json' with { type: 'json' };
import type { PanelController, PanelSectionDefinition, PanelSizing } from './panel-types.js';
import { createPanelController } from '../adapters/panel-session.js';
import { readPanelPreferences } from '../adapters/panel-preferences.js';
import type { RegisteredSection } from '../adapters/react/WorkspaceSidePanel.js';
import { z } from 'zod';
import {
  createReactBindings as designBindings,
  composeDesignSystem,
  createScopeInstaller,
} from '@novakai/canvas-design-system';
import type {
  ReactBindings as DesignBindings,
  DesignSystem,
  Environment,
} from '@novakai/canvas-design-system';
import {
  createBrowserReactBindings as presentationBindings,
  fontSet,
} from '@novakai/canvas-presentation';
import { createCanvas, createReactBindings as canvasBindings } from '@novakai/canvas-canvas';
import { createLanguage } from '@novakai/canvas-language';
import { validate, plan, stage } from '@novakai/canvas-model';
import { createServiceClient } from '../adapters/service-client.js';
import { readDiagram, createSceneAdmission } from '../adapters/diagram-reader.js';
import { createWorkspaceInputs } from '../adapters/workspace-inputs.js';
import { createCanvasSessions } from '../adapters/canvas-session.js';
import { createDraftRetention } from '../adapters/draft-retention.js';
import { createSubmissionSession } from '../adapters/submission-session.js';
import { createSubmissionReaders } from '../adapters/submission-readers.js';
import { createWorkspaceController } from '../adapters/workspace-session.js';
import { createHistoryControls } from '../adapters/react/HistoryControls.js';
import { createWorkspaceHeader } from '../adapters/react/WorkspaceHeader.js';
import { createCollectionChooser } from '../adapters/react/CollectionChooser.js';
import { createViewMenu } from '../adapters/react/ViewMenu.js';
import { RevealInterface } from '../adapters/react/RevealInterface.js';
import { createCollectionLibrary } from '../adapters/react/CollectionLibrary.js';
import { createCollectionDialog } from '../adapters/react/CreateCollectionDialog.js';
import { createPanelTabs } from '../adapters/react/PanelTabs.js';
import { createWorkspaceSidePanel } from '../adapters/react/WorkspaceSidePanel.js';
import { createAddTools } from '../adapters/react/AddTools.js';
import { createRequestRecovery } from '../adapters/react/RequestRecovery.js';
import { createMovementReview } from '../adapters/react/MovementReview.js';
import { createSourceEditor } from '../adapters/react/SourceEditor.js';
import { createExportPanel } from '../adapters/react/ExportPanel.js';
import { createObjectEditor } from '../adapters/react/ObjectEditor.js';
import { createDefinitionsEditor } from '../adapters/react/Definitions.js';
import { createContentEditor } from '../adapters/react/ContentEditor.js';
import { descendantId } from '@novakai/canvas-model';
import { createSectionNavigator } from '../adapters/react/SectionNavigator.js';
import { ObjectOutline } from '../adapters/react/ObjectOutline.js';
import { createWorkspaceShell } from '../adapters/react/WorkspaceShell.js';
import { mountWorkspace, viewport, observeWorkspaceWidth } from '../adapters/browser-host.js';
import { planCanvasEdit } from './api.js';
import {
  buildMoveReview,
  buildExpandOption,
  buildRearrangeOption,
  chooseMoveOption,
} from '../core/editing/movement.js';
import type { Result } from './errors.js';
import { failure } from './errors.js';
import type { ServiceClient } from './ports/client.js';
import type { WorkspaceBindings } from './ports/workspace.js';
import type { WorkspaceController } from './records/workspace.js';
import type { EditIntent, RenderDocument } from './records/owners.js';
import type { MoveReview } from './records/movement.js';
/** Only fonts and public token source data are delivered at browser initialization; installation credentials are never included. */
const installation = z.strictObject({ fonts: fontSet, tokens: z.unknown() });
/** A typed initialization fault is caught once at startWeb; no half-mounted workspace is reported as ready. */
class InitializationRejected extends Error {
  /** Preserve an owner's complete failure until startWeb returns it to the display boundary. */
  constructor(
    message: string,
    readonly diagnostic?: Diagnostic,
  ) {
    super(message);
  }
}
/** Preserve a failing owner's readable message without asserting the success type. */
function accepted<T>(result: Result<T>): T {
  if (!result.ok) throw new InitializationRejected(result.error.message, result.error);
  return result.value;
}
/** Sources are authenticated transport data and then admitted through their public owner schemas. */
async function resources(client: ServiceClient): Promise<z.infer<typeof installation>> {
  const response = accepted(await client.get('/api/v1/installation'));
  return installation.parse(accepted(response.outcome));
}
/** Shipped theme pins come from the owner; labels do not substitute for release identity. */
function themeChoices(
  tokens: DesignSystem,
  sources: unknown,
  environment: Environment,
): readonly ThemeChoice[] {
  return (['light', 'dark'] as const).map((scheme) => {
    const resolved = accepted(
      tokens.resolve({
        scope: 'ui',
        sources,
        preferences: {
          schemaVersion: 1,
          theme: { mode: 'system' },
          textSize: 14,
          density: 'comfortable',
          motion: 'system',
        },
        environment: { ...environment, scheme },
      }),
    );
    const pin = resolved.provenance.ui;
    if (pin === null) throw new InitializationRejected('UI theme provenance is missing');
    return { label: scheme === 'light' ? 'Light' : 'Dark', pin };
  });
}
/** Numeric panel bounds are read from the resolved token scope, preserving one CSS/TS authority. */
function dimension(
  element: HTMLElement,
  variable: string,
): number {
  const value = parseFloat(getComputedStyle(element).getPropertyValue(variable));
  if (!Number.isFinite(value)) throw new InitializationRejected(`Missing UI token ${variable}`);
  return value;
}
/** Concrete side-panel registration is declarative; individual feature components do not import each other. */
function featureSections(
  design: DesignBindings,
  preferences: PreferenceController,
  ThemeSelector: ComponentType<ThemeSelectorProps>,
  Browser: ComponentType<LibraryBrowserProps>,
  roadVisibility: Pick<PanelController, 'subscribe' | 'getSnapshot' | 'setInterfaceVisibility'>,
): readonly RegisteredSection[] {
  function LibrarySection(props: FeatureProps): ReactElement {
    return createElement(Browser, { controller: props.controller, view: props.view });
  }
  return [
    { tab: 'add', id: 'creation', title: 'Create', Content: createAddTools(design) },
    { tab: 'browse', id: 'collections', title: 'Collections', Content: LibrarySection },
    { tab: 'browse', id: 'sections', title: 'Diagrams', Content: createSectionNavigator(design) },
    { tab: 'browse', id: 'objects', title: 'Objects', Content: ObjectOutline },
    { tab: 'browse', id: 'export', title: 'Export', Content: createExportPanel(design) },
    {
      tab: 'browse',
      id: 'definitions',
      title: 'Definitions',
      Content: createDefinitionsEditor(design),
    },
    {
      tab: 'inspect',
      id: 'connection',
      title: 'Connection',
      Content: createWireEditor({
        ...design,
        fields: [
          { id: 'meaning', Content: createWireSemantics(design) },
          { id: 'endpoints', Content: createWireEndpoints(design) },
          { id: 'routing', Content: createWireRouting(design) },
        ],
      }),
    },
    {
      tab: 'settings',
      id: 'interface',
      title: 'Interface',
      Content: createInterfacePreferences(design, preferences, ThemeSelector, roadVisibility),
    },
    {
      tab: 'inspect',
      id: 'shared-content',
      title: 'Selection',
      Content: createObjectEditor({
        ...design,
        Content: createContentEditor({ ...design, Engineering: createEngineeringFields(design) }),
        nextContentId: () => descendantId.parse(`content-${crypto.randomUUID()}`),
      }),
    },
  ];
}
/** Declarative resource order is authoritative; adding a feature registers its renderer and default ID placement. */
function panelDefinitions(
  sections: readonly RegisteredSection[],
): readonly PanelSectionDefinition[] {
  const sides = ['left', 'right'] as const;
  return sides.flatMap((side) =>
    panelDefaults.panels[side].sectionIds.flatMap((id) =>
      sections
        .filter((item) => item.id === id)
        .map((item) => ({
          id,
          title: item.title,
          defaultSide: side,
          defaultExpanded: !panelDefaults.collapsedSectionIds.includes(id),
        })),
    ),
  );
}
/** Layout thresholds and dimensions are read from the same installed token scope as UI CSS. */
function panelSizing(element: HTMLElement): PanelSizing {
  return {
    canvasMinimum:
      dimension(element, '--nv-breakpoint-medium') - dimension(element, '--nv-panel-right'),
    medium: dimension(element, '--nv-breakpoint-medium'),
    large: dimension(element, '--nv-breakpoint-large'),
    sides: { left: panelDimensions(element, 'left'), right: panelDimensions(element, 'right') },
  };
}
/** Pane sizing always uses the same root token values as the shared SidePanel CSS. */
function panelDimensions(
  element: HTMLElement,
  side: 'left' | 'right',
): { readonly width: number; readonly minimum: number; readonly maximum: number } {
  return {
    width: dimension(element, `--nv-panel-${side}`),
    minimum: dimension(element, `--nv-panel-${side}-minimum`),
    maximum: dimension(element, `--nv-panel-${side}-maximum`),
  };
}
function createMovementReviewBinding(
  document: RenderDocument,
  intent: Extract<EditIntent, { kind: 'placement' }>,
  stamp: Parameters<NonNullable<WorkspaceBindings['moveReview']>>[2],
): Result<MoveReview> {
  const context = {
    document,
    stamp,
    preview: (
      previewDocument: typeof document,
      previewIntent: typeof intent,
      changes: readonly import('./records/owners.js').Change[],
    ) => previewModuleRoutes(previewDocument, previewIntent, changes),
  };
  const move = buildMoveReview(intent, context);
  if (hasMoveOnlyOption(move)) return move;
  const expanded = buildExpandOption(intent, context);
  const rearranged = buildRearrangeOption(intent, context);
  const options = movementReviewOptions(move, expanded, rearranged);
  if (options.length === 0) return move;
  const base = movementReviewBase(move, document, intent, stamp);
  return { ok: true, value: { ...base, options, selectedOption: options[0]?.id ?? null } };
}
/** A node already at its group's edge stays there; that is an answer, not a review. */
function hasMoveOnlyOption(move: Result<MoveReview>): boolean {
  return move.ok && (move.value.options.length > 0 || move.value.reason !== undefined);
}
function movementReviewOptions(
  move: Result<MoveReview>,
  expanded: Result<MoveReview['options'][number] | null>,
  rearranged: Result<MoveReview['options'][number] | null>,
): MoveReview['options'] {
  return [
    ...(move.ok ? move.value.options : []),
    ...optionResult(expanded),
    ...optionResult(rearranged),
  ];
}
function optionResult<T>(result: Result<T | null>): readonly T[] {
  return result.ok && result.value !== null ? [result.value] : [];
}
function movementReviewBase(
  move: Result<MoveReview>,
  document: RenderDocument,
  intent: Extract<EditIntent, { kind: 'placement' }>,
  stamp: Parameters<NonNullable<WorkspaceBindings['moveReview']>>[2],
): MoveReview {
  if (move.ok) return move.value;
  return {
    id: intent.id,
    intent,
    stamp,
    collectionId: document.collection.id,
    revision: document.collection.revision,
    options: [],
    selectedOption: null,
  };
}
/** Native adapters receive narrow roles; every human mutation uses captured Authoring preconditions. */
function controller(
  client: ServiceClient,
  element: HTMLElement,
  panels: PanelController,
): WorkspaceController {
  const canvas = createCanvas({ sceneAdmission: createSceneAdmission() });
  const language = createLanguage({ reader: { validate }, planner: { plan }, stage: { stage } });
  const retention = createDraftRetention(localStorage);
  const inputs = createWorkspaceInputs(readDiagram, language);
  return createWorkspaceController({
    client,
    panels: {
      restore: panels.restore,
      open: (side, open) => {
        panels.open(side, open);
        if (side === 'right' && open) panels.selectTab('inspect');
      },
    },
    navigation: createWorkspaceNavigation(window.location, window.history),
    inputs,
    library: (callbacks) =>
      createLibraryController({
        retention,
        reader: createLibraryReader(),
        now: () => Date.now(),
        nextFolderId: () => folderIdSchema().parse(`folder-${crypto.randomUUID()}`),
        ...callbacks,
      }),
    wires: (callbacks) => createWireSession({ retention, read: readWireDrafts, ...callbacks }),
    inspector: (callbacks) =>
      createInspectorSession({ retention, read: readInspectorDrafts, ...callbacks }),
    definitions: (callbacks) =>
      createDefinitionSession({ retention, read: readDefinitionDrafts, ...callbacks }),
    source: (callbacks) =>
      createSourceController({
        inputs,
        retention,
        nextId: () => crypto.randomUUID(),
        ...callbacks,
      }),
    sessions: createCanvasSessions(canvas, () => viewport(element)),
    edits: { plan: planCanvasEdit },
    moveReview: createMovementReviewBinding,
    chooseMoveOption: chooseMoveOption,
    previewRoutes: previewModuleRoutes,
    submissions: (callbacks) =>
      createSubmissionSession({
        client,
        retention,
        readers: createSubmissionReaders(),
        ...callbacks,
      }),
    nextId: () => crypto.randomUUID(),
  });
}
/** Assemble once before rendering: every child/React Flow registry retains stable component identity across edits. */
async function mount(element: HTMLElement): Promise<Result<{ dispose(): void }>> {
  const client = createServiceClient();
  const installed = await resources(client);
  const design = accepted(await designBindings());
  const scope = accepted(createScopeInstaller(design.createScopeTarget(element)));
  const tokens = composeDesignSystem();
  const environment = readEnvironment(window);
  const themes = themeChoices(tokens, installed.tokens, environment);
  const preferences = accepted(
    createPreferenceController({
      tokens,
      sources: installed.tokens,
      installer: scope,
      retention: createDraftRetention(localStorage),
      environment,
      themes: themes.map(({ pin }) => pin),
    }),
  );
  const stopPreferences = observeEnvironment(window, preferences.environment);
  const presentation = accepted(await presentationBindings(installed.fonts));
  const surface = accepted(await canvasBindings({ ...presentation, Button: design.Button }));
  const Browser = createLibraryBrowser([
    { id: 'filters', Content: createLibraryFilters(design) },
    { id: 'results', Content: createLibraryResults(design) },
    { id: 'organisation', Content: createLibraryOrganisation(design) },
  ]);
  const ChooserBrowser = createLibraryBrowser([
    { id: 'filters', Content: createLibraryFilters(design, { compact: true }) },
    { id: 'results', Content: createLibraryResults(design) },
  ]);
  const ThemeSelector = createThemeSelector(design, preferences, themes);
  const sections = featureSections(design, preferences, ThemeSelector, Browser, {
    subscribe: (listener) => panels.subscribe(listener),
    getSnapshot: () => panels.getSnapshot(),
    setInterfaceVisibility: (control, visible) => panels.setInterfaceVisibility(control, visible),
  });
  const sizing = panelSizing(element);
  const panels: PanelController = createPanelController({
    definitions: panelDefinitions(sections),
    sizing,
    initialWidth: element.getBoundingClientRect().width,
    retention: createDraftRetention(localStorage),
    read: readPanelPreferences,
    report: (message) =>
      runtime.report({
        code: 'panel-preferences',
        message,
        recovery: 'Customize or reset the panel layout.',
        owner: 'panel-preferences',
      }),
  });
  const runtime: WorkspaceController = controller(client, element, panels);
  const stopWidth = observeWorkspaceWidth(element, panels.viewport);
  const Workspace = createWorkspaceShell({
    panels,
    Header: createWorkspaceHeader(
      design,
      panels,
      createViewMenu(design, panels, element),
      createHistoryControls(design),
    ),
    Library: createCollectionLibrary({ ...design, Browser }),
    Panel: createWorkspaceSidePanel({
      ...design,
      sections,
      panels,
      sizing,
      portal: element,
      Tabs: createPanelTabs(design),
      tabs: {
        left: [
          {
            id: 'add',
            label: 'Add',
            scope: 'Create diagram content',
            empty: 'Creation tools are hidden. Customize panels to show them.',
          },
          {
            id: 'browse',
            label: 'Browse',
            scope: 'Shared collection',
            empty: 'All Browse sections are hidden. Customize to show them.',
          },
        ],
        right: [
          {
            id: 'inspect',
            label: 'Inspect',
            scope: 'Selected diagram content',
            empty: 'All Inspect sections are hidden. Customize to show them.',
          },
          {
            id: 'settings',
            label: 'Settings',
            scope: 'Personal to this browser',
            empty: 'Settings are hidden. Customize to show them.',
          },
        ],
      },
    }),
    Source: createSourceEditor(design, element),
    Recovery: createRequestRecovery(design),
    Button: design.Button,
    MovementReview: createMovementReview(design),
    Reveal: RevealInterface,
    CreateDialog: createCollectionDialog(design),
    Chooser: createCollectionChooser({ ...design, Browser: ChooserBrowser }),
    CanvasSurface: surface.CanvasSurface,
    FontDefinitions: presentation.FontDefinitions,
    portal: element,
    nextGestureId: () => crypto.randomUUID(),
  });
  const mounted = accepted(mountWorkspace(element, Workspace, runtime));
  return {
    ok: true,
    value: {
      dispose: () => {
        stopWidth();
        mounted.dispose();
        stopPreferences();
        preferences.dispose();
      },
    },
  };
}
/** Browser entry reports startup failure visibly; restarting after correcting the dependency does not alter canonical diagram data. */
export async function startWeb(element: HTMLElement): Promise<Result<{ dispose(): void }>> {
  try {
    return await mount(element);
  } catch (error) {
    return initializationFailure(error);
  }
}
/** Provider details are shown only when explicitly carried by the initialization boundary. */
function initializationFailure(error: unknown): Result<never> {
  if (error instanceof InitializationRejected) return initializationRejection(error);
  return failure('initialization-failed', 'Canvas could not initialize its UI resources');
}

/** Object forms reuse the browser draft lifecycle; feature policy owns command replay. */
export function createInspectorSession(bindings: InspectorBindings): InspectorSession {
  return createRetainedEditor({
    ...bindings,
    namespace: 'inspector',
    encode: encodeObjectRecovery,
    edit: retainObjectCommand,
    apply: (draft) => bindings.apply(draft, editedObject(draft)),
  });
}
/** Wire forms reuse the same retention/acknowledgement policy with section-scoped identities. */
export function createWireSession(bindings: WireEditorBindings): WireEditorSession {
  return createRetainedEditor({
    ...bindings,
    namespace: 'wire-inspector',
    encode: encodeWireRecovery,
    edit: retainWireCommand,
    apply: (draft) => bindings.apply(draft, wireChanges(draft)),
  });
}

/** Owner failures keep their original code; locally detected setup faults use the host vocabulary. */
function initializationRejection(error: InitializationRejected): Result<never> {
  if (error.diagnostic !== undefined) return { ok: false, error: error.diagnostic };
  return failure('initialization-failed', error.message);
}
