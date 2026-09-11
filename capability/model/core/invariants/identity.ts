import type { Collection } from '../../contract/records/collection.js';
import { duplicates } from './issues.js';
const id = (value: { readonly id: string }) => value.id;
export function validateIdentity(collection: Collection) {
  return [
    ...duplicates(collection.objects, id, 'objects'),
    ...duplicates(collection.relationships, id, 'relationships'),
    ...duplicates(collection.sections, id, 'sections'),
    ...duplicates(collection.assets, id, 'assets'),
    ...duplicates(collection.sources, id, 'sources'),
    ...duplicates(collection.theme.roles, (value) => value, 'theme.roles'),
  ];
}
