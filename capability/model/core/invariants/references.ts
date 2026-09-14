import type { ObjectId, SectionId, SourceId } from '../../contract/brands.js';
import type { Diagnostic } from '../../contract/errors.js';
import type { Collection } from '../../contract/records/collection.js';
import type { ContentBlock } from '../../contract/records/content.js';
import type { DiagramObject } from '../../contract/records/object.js';
import { duplicates } from './duplicates.js';
import { referenceIssue } from './issues.js';
import { visibleObjects } from '../sections/groups.js';

type ReferenceRule = (
  block: ContentBlock,
  collection: Collection,
  path: string,
) => readonly Diagnostic[];

/** Provenance IDs must be unique on their owner and resolve in this collection. */
function validateSourceIds(
  ids: readonly SourceId[],
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  const duplicateIssues = duplicates(ids, (id) => id, path);
  const missingSources = ids.filter((id) => !collection.sources.some((source) => source.id === id));
  const unresolvedIssues = missingSources.flatMap((id) => referenceIssue(true, `${path}.${id}`));
  return [...duplicateIssues, ...unresolvedIssues];
}

/** A link without a section addresses the canonical object, independent of its visibility. */
function validateLinkSection(
  objectId: ObjectId,
  sectionId: SectionId | undefined,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (sectionId === undefined) return [];
  const section = collection.sections.find((candidate) => candidate.id === sectionId);
  if (section === undefined) return referenceIssue(true, `${path}.section`);
  const objectIsVisible = visibleObjects(section).includes(objectId);
  return referenceIssue(!objectIsVisible, `${path}.section`);
}

/** URI links are external claims; only local object links resolve against Model records. */
function validateObjectLink(
  block: ContentBlock,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (block.kind !== 'link') return [];
  if (block.target.kind !== 'object') return [];
  const target = block.target;
  const objectExists = collection.objects.some((object) => object.id === target.id);
  const objectIssues = referenceIssue(!objectExists, path);
  const sectionIssues = validateLinkSection(target.id, target.section, collection, path);
  return [...objectIssues, ...sectionIssues];
}

/** Asset-bearing blocks resolve manifest identities; bytes are never loaded here. */
function validateAssetReference(
  block: ContentBlock,
  collection: Collection,
  path: string,
): readonly Diagnostic[] {
  if (!('asset' in block)) return [];
  const assetExists = collection.assets.some((asset) => asset.id === block.asset);
  return referenceIssue(!assetExists, path);
}

const contentReferenceRules: readonly ReferenceRule[] = [
  validateObjectLink,
  validateAssetReference,
];

/** Keep provenance validation distinct from references embedded in node content. */
function validateObjectReferences(
  object: DiagramObject,
  collection: Collection,
): readonly Diagnostic[] {
  const path = `objects.${object.id}`;
  const sourceIssues = validateSourceIds(object.sources, collection, `${path}.sources`);
  const contentIssues = object.content.flatMap((block) => {
    const blockPath = `${path}.content.${block.id}`;
    return contentReferenceRules.flatMap((rule) => rule(block, collection, blockPath));
  });
  return [...sourceIssues, ...contentIssues];
}

/**
 * Checks provenance, local links and asset references, accumulating all failures.
 * Endpoint and key references have separate validators. Pure replay; Authoring owns
 * correction and commit/recovery. No network or asset access occurs here.
 */
export function validateReferences(collection: Collection): readonly Diagnostic[] {
  const objectIssues = collection.objects.flatMap((object) =>
    validateObjectReferences(object, collection),
  );
  const relationshipIssues = collection.relationships.flatMap((relationship) =>
    validateSourceIds(relationship.sources, collection, `relationships.${relationship.id}.sources`),
  );
  return [...objectIssues, ...relationshipIssues];
}
