import { inputKey } from '../../contract/brands.js';
import type { LayoutInputKey } from '../../contract/brands.js';
import { parse } from '../validation/outcomes.js';
import { nativeEngineVersions } from '../../contract/records/engines.js';
import type { VisualSection } from '../../contract/records/input.js';
import type { LayoutOptions, SupplementalMeasurements } from '../../contract/types.js';
import type { CheckedLayoutRequest } from '../validation/input.js';
import type { SectionCandidate } from '../../contract/records/candidate.js';
import { encoded } from '../validation/equality.js';
/** Key construction consumes version metadata only, not unused native or owner methods. */
interface VersionedEngines {
  readonly placement: { readonly version: string };
  readonly solver: { readonly version: string };
  readonly routing: { readonly version: string };
  readonly nested?: { readonly version: string };
}
/** Engine versions form part of every derivation key; injected providers cannot silently reuse another implementation's geometry. */
export function versions(dependencies: VersionedEngines): readonly string[] {
  if (dependencies.nested)
    return [dependencies.nested.version, nativeEngineVersions.policy];
  return [
    dependencies.placement.version,
    dependencies.solver.version,
    dependencies.routing.version,
    nativeEngineVersions.policy,
  ];
}
/** Local section identity intentionally excludes unrelated collection revision and other sections. */
export function sectionKey(
  section: VisualSection,
  metrics: SupplementalMeasurements,
  options: LayoutOptions,
  engines: readonly string[],
): LayoutInputKey {
  const headings = metrics.branchHeadings.filter((item) => item.section === section.id);
  const canonicalInput = encoded({
    section,
    metrics: { ...metrics, branchHeadings: headings },
    options,
    engines,
  });
  return parse(inputKey, canonicalInput);
}
/** Previous content/keys never nest recursively in new request keys; only geometry preferences affect derivation. */
function geometry(section: SectionCandidate): unknown {
  return {
    id: section.id,
    origin: section.origin,
    box: section.box,
    nodes: section.nodes.map((node) => ({ id: node.id, box: node.box })),
    wires: section.wires.map((wire) => ({ id: wire.id, points: wire.points })),
  };
}
/** Public key is a complete canonical identity, not a security token or abbreviated hash. */
export function requestKey(
  request: Omit<CheckedLayoutRequest, 'job'>,
  dependencies: VersionedEngines,
): LayoutInputKey {
  const canonicalInput = encoded({
    projection: request.projection,
    measurements: request.measurements,
    options: request.options,
    previous: request.previous?.sections.map(geometry) ?? null,
    engines: versions(dependencies),
  });
  return parse(inputKey, canonicalInput);
}
