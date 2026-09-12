import type { Dependencies } from '../../contract/types.js';
import type { Projection, VisualSection } from '../../contract/records/visual.js';
import { resolvedStyle } from '../../contract/records/style.js';
import { clone, parse, requireValue, reject } from '../validation/outcomes.js';
import { projectSection } from './section.js';
import { measureBlock } from '../content/blocks.js';
import { requireProjectionCapacity } from '../validation/capacity.js';
/** Stable key canonicalizes object property order while retaining significant array order. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  return canonicalRecord(value);
}
/** Only plain detached domain/style records reach identity serialization. */
function canonicalRecord(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)]),
  );
}
/** Build a complete immutable scene proposal; Authoring alone decides whether it becomes committed state. */
export function projectCollection(input: unknown, deps: Dependencies): Projection {
  const collection = requireValue(deps.domain.read(clone(input)));
  const style = parse(resolvedStyle, requireValue(deps.themes.resolve(collection.theme)));
  if (`sha256:${style.digest}` !== collection.theme.digest)
    return reject(
      'missing-resource',
      'theme',
      'Resolved theme digest does not match the pinned theme',
    );
  const context = {
    collection,
    style,
    width: style.contentSizing.widths.medium.preferred,
    metrics: deps.measurement,
    assets: deps.assets,
  };
  const sections = collection.sections.map((section) => projectSection(section, context));
  requireProjectionCapacity(sections);
  checkScene(sections);
  const outline = collection.objects.flatMap((object) => [
    object.label,
    ...object.content.flatMap((block) => measureBlock(block, context).outline),
  ]);
  return {
    collectionId: collection.id,
    revision: collection.revision,
    title: collection.title,
    styleDigest: style.digest,
    inputKey: JSON.stringify(
      canonical({
        collection,
        style,
        measurement: deps.measurement.version,
        renderer: deps.renderer.version,
      }),
    ),
    arrangement: collection.arrangement,
    sections,
    outline,
    assetDigests: collection.assets.map((asset) => asset.digest.slice(7)),
    fontDigests: [...new Set([style.bodyFont.digest, style.monoFont.digest])],
  };
}

/** Total scene budget includes wire/sequence labels and headings, not only each node's private limit. */
function checkScene(sections: readonly VisualSection[]): void {
  const total = sections.reduce(
    (sum, section) =>
      sum +
      section.title.primitives.length +
      section.nodes.reduce((count, node) => count + node.content.primitives.length, 0) +
      section.wires.reduce((count, wire) => count + wire.label.primitives.length, 0) +
      section.sequence.reduce((count, item) => count + item.label.primitives.length, 0),
    0,
  );
  if (total > 100000) reject('limit', 'scene', 'Scene exceeds100000primitives');
}
