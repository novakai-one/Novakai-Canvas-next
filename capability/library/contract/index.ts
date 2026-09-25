/**
 * Library's public surface: organisation validation, organisation change planning and collection search.
 *
 * Start with `validateLibrarySnapshot`, `planOrganisation` and `queryLibrary`. Each stores nothing,
 * never throws and returns a frozen result. The ID schema factories check and brand IDs; each call
 * returns a new schema. Everything else is a type. Organisation rules and search mechanics stay private.
 */
export { validateLibrarySnapshot, planOrganisation, queryLibrary } from './api.js';
export {
  organisationIdSchema,
  folderIdSchema,
  collectionIdSchema,
  objectIdSchema,
  sectionIdSchema,
} from './brands.js';
export type { OrganisationId, FolderId, CollectionId, ObjectId, SectionId } from './brands.js';
export type { LibraryResult, ValidationError, Diagnostic, DiagnosticCode } from './errors.js';
export type { Organisation, Folder, OrganisationEntry } from './records/organisation.js';
export type {
  LibrarySnapshot,
  CollectionProjection,
  SectionProjection,
  ObjectProjection,
  RecentVisit,
} from './records/snapshot.js';
export type { OrganisationChange, RemovalPolicy } from './records/change.js';
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
  OrganisationVersion,
  CollectionVersion,
  OrganisationPlan,
} from './types.js';
