import type { VisualSection } from '../../contract/records/input.js';
import type { SectionCandidate } from '../../contract/records/candidate.js';
import type {
  DerivationContext,
  GeometryDependencies,
  Inspection,
  SupplementalMeasurements,
} from '../../contract/types.js';
import type { Scene, PlacedSection } from '../../contract/records/geometry.js';
import type { SceneCandidate } from '../../contract/records/candidate.js';
import type { NestedEngine } from '../../contract/records/engine-scene.js';
import { candidate } from '../../contract/records/candidate.js';
import type {
  CheckedLayoutRequest,
  CheckedInspectionRequest,
  CheckedRouteRequest,
} from '../validation/input.js';
import { arrangeSection, completeSection } from './section.js';
import { admitNested } from '../scene-in.js';
import { deriveNestedSection } from '../scene-out.js';
import { accumulate } from './sequential.js';
import { arrangeSections } from './collection.js';
import { engaged, requestKey, sectionKey, versions } from './keys.js';
import { adjustments, warnings } from './notices.js';
import { union } from '../geometry/bounds.js';
import { inspectSections } from '../validation/sections.js';
import { inspectNodes } from '../validation/nodes.js';
import { same, sameIds } from '../validation/facts.js';
import { equal } from '../validation/equality.js';
import { parse, protect, reject, requireValue } from '../validation/outcomes.js';
/** A different collection or future revision is not an admissible geometry preference. */
function previous(request: CheckedLayoutRequest): SceneCandidate | null {
  if (request.previous?.collectionId !== request.projection.collectionId) return null;
  if (request.previous.revision > request.projection.revision) return null;
  return request.previous;
}
/** All final success paths pass through the same independent inspector, including cache and route-only operations. */
function inspected(
  scene: Scene,
  request: Pick<CheckedLayoutRequest, 'projection' | 'measurements' | 'options'>,
  engines: readonly string[],
): Scene {
  const checked = parse(candidate, scene);
  const sections = inspectSections(request.projection, checked, {
    measurements: request.measurements,
    options: request.options,
    engines,
  });
  same(warnings(sections, request.projection, request.options), scene.warnings, 'warnings');
  return { ...scene, sections };
}
/** One derived section plus whether the nested engine arranged it. */
interface ArrangedSection {
  readonly section: PlacedSection;
  readonly nested: boolean;
}
/** A protected nested derivation returns nothing on any structured failure; legacy always remains available. */
function attempted(
  source: VisualSection,
  engine: NestedEngine,
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): PlacedSection | null {
  const derived = protect(() => deriveNestedSection(source, engine, metrics, context));
  return derived.ok ? derived.value : null;
}
/** The nested engine arranges admitted modules sections only. */
function nestedArranged(
  source: VisualSection,
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): PlacedSection | null {
  const engine = context.dependencies.nested;
  if (engine === undefined || !admitNested(source)) return null;
  return attempted(source, engine, metrics, context);
}
/** A nested-admitted modules section derives through the in-repo engine; any failure keeps the legacy derivation. */
async function sectionOf(
  source: VisualSection,
  prior: SectionCandidate | null,
  metrics: SupplementalMeasurements,
  context: DerivationContext,
): Promise<ArrangedSection> {
  const derived = nestedArranged(source, metrics, context);
  if (derived !== null) return { section: derived, nested: true };
  return { section: await arrangeSection(source, prior, metrics, context), nested: false };
}
/** Every placed section resolves its authoritative source for the execution-accurate restamp. */
function sourceOf(request: CheckedLayoutRequest, id: string): VisualSection {
  const source = request.projection.sections.find((section) => section.id === id);
  if (source === undefined)
    return reject('engine-failed', id, 'Placed section is missing its source');
  return source;
}
/** Derive one complete scene and reject stale work before it can be returned to Authoring. */
export async function arrange(
  request: CheckedLayoutRequest,
  dependencies: GeometryDependencies,
): Promise<Scene> {
  same(requestKey(request, dependencies), request.job.inputKey, 'job.inputKey');
  const prior = previous(request);
  const context = { dependencies, options: request.options, job: request.job };
  const local = await accumulate<VisualSection, readonly ArrangedSection[]>(
    request.projection.sections.toSorted((a, b) => a.order - b.order),
    [],
    async (result, source) => {
      requireValue(await dependencies.jobs.checkpoint(request.job));
      const section = await sectionOf(
        source,
        prior?.sections.find((section) => section.id === source.id) ?? null,
        request.measurements,
        context,
      );
      return [...result, section];
    },
  );
  const engines = local.some((item) => item.nested)
    ? engaged(dependencies)
    : versions(dependencies);
  const arranged = requireValue(
    await arrangeSections(
      local.map((item) => item.section),
      request.projection,
      prior,
      context,
    ),
  );
  const sections = arranged.map((section): PlacedSection => ({
    ...section,
    inputKey: sectionKey(
      sourceOf(request, section.id),
      request.measurements,
      request.options,
      engines,
    ),
  }));
  const scene: Scene = {
    collectionId: request.projection.collectionId,
    revision: request.projection.revision,
    inputKey: request.job.inputKey,
    engineVersions: engines,
    sections,
    bounds: union(sections.map((section) => section.box)),
    warnings: warnings(sections, request.projection, request.options),
    adjustments: adjustments(sections, request.projection, prior),
  };
  const result = inspected(scene, request, engines);
  requireValue(await dependencies.jobs.checkpoint(request.job));
  return result;
}
/** A candidate is inspected against the stamp set it carries; an unavailable engine's stamp fails equality. */
function admitted(
  candidate: SceneCandidate,
  dependencies: GeometryDependencies,
): readonly string[] {
  const nested = dependencies.nested;
  if (nested !== undefined && equal(candidate.engineVersions, engaged(dependencies)))
    return engaged(dependencies);
  return versions(dependencies);
}
/** Public inspection returns a typed invalid verdict while malformed envelopes remain boundary failures. */
export function inspect(
  request: CheckedInspectionRequest,
  dependencies: GeometryDependencies,
): Inspection {
  const result = protect(() =>
    inspectSections(request.projection, request.candidate, {
      measurements: request.measurements,
      options: request.options,
      engines: admitted(request.candidate, dependencies),
    }),
  );
  if (!result.ok) return { valid: false, diagnostics: [result.error] };
  const crossingCheck = protect(() =>
    same(
      warnings(result.value, request.projection, request.options),
      request.candidate.warnings,
      'warnings',
    ),
  );
  if (!crossingCheck.ok) return { valid: false, diagnostics: [crossingCheck.error] };
  return { valid: true, diagnostics: [] };
}
/** Route-only uses fixed node boxes and section origins; expanded route bounds may fail existing inter-section clearance. */
export async function reroute(
  request: CheckedRouteRequest,
  dependencies: GeometryDependencies,
): Promise<Scene> {
  same(
    requestKey({ ...request, previous: request.fixed }, dependencies),
    request.job.inputKey,
    'job.inputKey',
  );
  same(request.projection.collectionId, request.fixed.collectionId, 'collection');
  sameIds(
    request.projection.sections.map((item) => item.id),
    request.fixed.sections.map((item) => item.id),
    'sections',
  );
  const sections = await accumulate<VisualSection, readonly PlacedSection[]>(
    request.projection.sections.toSorted((a, b) => a.order - b.order),
    [],
    async (result, source) => {
      const fixed = fixedSection(source, request);
      const nodes = inspectNodes(source, fixed.nodes, request.options);
      const local = await completeSection(source, nodes, request.measurements, {
        dependencies,
        options: request.options,
        job: request.job,
      });
      const section = {
        ...local,
        origin: fixed.origin,
        box: { ...local.box, x: local.box.x + fixed.origin.x, y: local.box.y + fixed.origin.y },
      };
      return [...result, section];
    },
  );
  const scene: Scene = {
    collectionId: request.projection.collectionId,
    revision: request.projection.revision,
    inputKey: request.job.inputKey,
    engineVersions: versions(dependencies),
    sections,
    bounds: union(sections.map((item) => item.box)),
    warnings: warnings(sections, request.projection, request.options),
    adjustments: adjustments(sections, request.projection, request.fixed),
  };
  const result = inspected(scene, request, versions(dependencies));
  requireValue(await dependencies.jobs.checkpoint(request.job));
  return result;
}

/** Route-only requires an existing section before any native work is requested. */
function fixedSection(source: VisualSection, request: CheckedRouteRequest): SectionCandidate {
  const fixed = request.fixed.sections.find((item) => item.id === source.id);
  if (!fixed) return reject('invalid-input', source.id, 'Fixed section is missing');
  return fixed;
}
