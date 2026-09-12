/** The only consumer surface; catalog policies and discovery mechanics remain private. */
export { validate, plan, query } from './api.js';
export { catalogId, folderId, collectionId, objectId, sectionId } from './brands.js';
export type { CatalogId, FolderId, CollectionId, ObjectId, SectionId } from './brands.js';
export type { Result, ValidationError, Diagnostic, DiagnosticCode } from './errors.js';
export type { Catalog, Folder, CatalogEntry } from './records/catalog.js';
export type { LibrarySnapshot, CollectionProjection, RecentVisit } from './records/snapshot.js';
export type { CatalogChange } from './records/change.js';
export type { QueryRequest, QueryPage, SearchHit } from './records/query.js';
export type { ReadVersions, CatalogPlan } from './types.js';
