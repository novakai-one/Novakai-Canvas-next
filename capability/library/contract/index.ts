/**
 * Library's public surface: catalog validation, catalog change planning and collection search.
 *
 * Start with `validateLibrarySnapshot`, `planCatalog` and `queryLibrary`. Each stores nothing,
 * never throws and returns a frozen result. The ID schema factories check and brand IDs; each call
 * returns a new schema. Everything else is a type. Catalog rules and search mechanics stay private.
 */
export { validateLibrarySnapshot, planCatalog, queryLibrary } from './api.js';
export {
  catalogIdSchema,
  folderIdSchema,
  collectionIdSchema,
  objectIdSchema,
  sectionIdSchema,
} from './brands.js';
export type { CatalogId, FolderId, CollectionId, ObjectId, SectionId } from './brands.js';
export type { LibraryResult, ValidationError, Diagnostic, DiagnosticCode } from './errors.js';
export type { Catalog, Folder, CatalogEntry } from './records/catalog.js';
export type {
  LibrarySnapshot,
  CollectionProjection,
  SectionProjection,
  ObjectProjection,
  RecentVisit,
} from './records/snapshot.js';
export type { CatalogChange, RemovalPolicy } from './records/change.js';
export type {
  QueryRequest,
  QueryPage,
  SearchHit,
  HitKind,
  ArchiveMode,
  SortMode,
} from './records/query.js';
export type {
  PlanInput,
  QueryInput,
  ReadVersions,
  CatalogVersion,
  CollectionVersion,
  CatalogPlan,
} from './types.js';
