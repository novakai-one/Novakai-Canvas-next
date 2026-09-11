import type { Collection } from '../../contract/records/collection.js';
import type { ContentBlock } from '../../contract/records/content.js';
import { duplicates, required } from './issues.js';
import { visibleObjects } from '../sections/groups.js';
function sources(ids: readonly string[], collection: Collection, path: string) {
  return [
    ...duplicates(ids, (id) => id, path),
    ...ids.flatMap((id) =>
      required(
        collection.sources.some((source) => source.id === id),
        `${path}.${id}`,
      ),
    ),
  ];
}
function localLink(
  block: Extract<ContentBlock, { kind: 'link' }>,
  collection: Collection,
  path: string,
) {
  const target = block.target;
  if (target.kind !== 'object') return [];
  return [
    ...required(
      collection.objects.some((object) => object.id === target.id),
      path,
    ),
    ...linkSection(target.id, target.section, collection, path),
  ];
}
function linkSection(
  id: string,
  sectionId: string | undefined,
  collection: Collection,
  path: string,
) {
  if (!sectionId) return [];
  const section = collection.sections.find((section) => section.id === sectionId);
  return required(section !== undefined && visibleObjects(section).includes(id), `${path}.section`);
}
function blockReference(block: ContentBlock, collection: Collection, path: string) {
  if (block.kind === 'link') return localLink(block, collection, path);
  if ('asset' in block)
    return required(
      collection.assets.some((asset) => asset.id === block.asset),
      path,
    );
  return [];
}
export function validateReferences(collection: Collection) {
  return [
    ...collection.objects.flatMap((object) => [
      ...sources(object.sources, collection, `objects.${object.id}.sources`),
      ...object.content.flatMap((block) =>
        blockReference(block, collection, `objects.${object.id}.content.${block.id}`),
      ),
    ]),
    ...collection.relationships.flatMap((relationship) =>
      sources(relationship.sources, collection, `relationships.${relationship.id}.sources`),
    ),
  ];
}
