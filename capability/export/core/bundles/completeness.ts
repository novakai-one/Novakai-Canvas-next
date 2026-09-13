import type { Collection, Snapshot } from '../../contract/records/artifact.js';
import type { Resource } from '../../contract/records/bundle.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';
/** Every canonical pin must travel with the bundle; an inspector cannot silently approve missing bytes. */
export function checkCollectionResources(
  collection: Collection,
  resources: readonly Resource[],
): Result<void> {
  const expected = [
    `preset:${collection.theme.digest.slice(7)}`,
    ...collection.assets.map((asset) => `asset:${asset.digest.slice(7)}`),
  ];
  const available = resources.map((resource) => `${resource.kind}:${resource.digest}`);
  if (!expected.every((key) => available.includes(key)))
    return failure(
      'resource-rejected',
      'resources',
      'A pinned theme or asset is missing from the retained transfer',
    );
  return success(undefined);
}
/** Rendered labels and media can use resources beyond the semantic manifest, notably exact pinned fonts. */
export function checkSceneResources(snapshot: Snapshot): Result<void> {
  const contents = snapshot.scene.sections.flatMap((section) => [
    section.title.content,
    ...section.nodes.map((node) => node.measured.content),
    ...section.wires.map((wire) => wire.measuredLabel),
    ...section.sequence.events.map((event) => event.content),
    ...section.sequence.fragments.flatMap((fragment) => [
      fragment.content,
      ...fragment.branches.map((branch) => branch.content),
    ]),
  ]);
  const required = contents.flatMap((content) => content.primitives).flatMap(resourceKey);
  const available = snapshot.resources.map((resource) => `${resource.kind}:${resource.digest}`);
  if (!required.every((key) => available.includes(key)))
    return failure(
      'resource-rejected',
      'resources',
      'Measured scene references an unretained font or image',
    );
  return checkCollectionResources(snapshot.collection, snapshot.resources);
}
/** Rules carry no external bytes; text and media require exact immutable resources. */
function resourceKey(
  primitive: Snapshot['scene']['sections'][number]['title']['content']['primitives'][number],
): readonly string[] {
  if (primitive.kind === 'text') return [`font:${primitive.font.digest}`];
  if (primitive.kind !== 'media') return [];
  return mediaKey(primitive.digest);
}
/** Generated figures carry complete inline artwork in the scene; retention covers external asset bytes only. */
function mediaKey(digest: string): readonly string[] {
  return digest.startsWith('figure:') ? [] : [`asset:${digest}`];
}
