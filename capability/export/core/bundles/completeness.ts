/*
 * Resource completeness: every blob a collection or scene refers to must travel with it, so an
 * export or bundle can never silently lose a theme, asset, font or image.
 */
import type { Collection, Snapshot } from '../../contract/records/artifact.js';
import type { Resource } from '../../contract/records/bundle.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
import { success } from '../validation/outcomes.js';

/** One drawing primitive inside a scene's measured content. */
type Primitive = Snapshot['scene']['sections'][number]['title']['content']['primitives'][number];

/**
 * Checks that the collection's pinned theme (a `preset`) and every pinned asset are among the
 * resources. Collection digests carry a `sha256:` prefix; it is dropped before matching.
 *
 * @param collection - The collection whose pins must be present.
 * @param resources - The resources that travel with it.
 * @returns Success, or `resource-rejected` if any pin is missing.
 */
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
/**
 * Checks that every font and image the measured scene draws is among the snapshot's resources,
 * then that the collection's pins are too. Rendered text needs exact pinned fonts, which the
 * collection itself does not list.
 *
 * @param snapshot - The leased snapshot.
 * @returns Success, or `resource-rejected` if anything is missing.
 */
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
/** The resource a primitive needs: its font for text, its asset for media, nothing otherwise. */
function resourceKey(primitive: Primitive): readonly string[] {
  if (primitive.kind === 'text') return [`font:${primitive.font.digest}`];
  if (primitive.kind !== 'media') return [];
  return mediaKey(primitive.digest);
}
/** The asset key for a media digest; generated figures (`figure:` digests) are inline: none. */
function mediaKey(digest: string): readonly string[] {
  return digest.startsWith('figure:') ? [] : [`asset:${digest}`];
}
