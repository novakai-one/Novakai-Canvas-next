import type { Collection } from '../../contract/records/collection.js';
import type { Diagnostic } from '../../contract/errors.js';
import { duplicates } from './duplicates.js';

/** Read identity without erasing the brand carried by each collection record. */
function recordId<T extends { readonly id: string }>(record: T): T['id'] {
  return record.id;
}

/**
 * Checks uniqueness separately in each collection namespace and the theme role list.
 * Descendant and group scopes belong to their own validators. Returns all duplicates,
 * or an empty array. Pure replay; Authoring owns correction and commit/recovery.
 */
export function validateIdentity(collection: Collection): readonly Diagnostic[] {
  const objectIssues = duplicates(collection.objects, recordId, 'objects');
  const relationshipIssues = duplicates(collection.relationships, recordId, 'relationships');
  const sectionIssues = duplicates(collection.sections, recordId, 'sections');
  const assetIssues = duplicates(collection.assets, recordId, 'assets');
  const sourceIssues = duplicates(collection.sources, recordId, 'sources');
  const roleIssues = duplicates(collection.theme.roles, (role) => role, 'theme.roles');
  return [
    ...objectIssues,
    ...relationshipIssues,
    ...sectionIssues,
    ...assetIssues,
    ...sourceIssues,
    ...roleIssues,
  ];
}
