# Capability: library — Entities and invariants

Catalog "1" ──< "0..N" Folder
Folder "0..1 parent" ──< "0..N" Folder
Catalog "1" ──< "0..N" CatalogEntry
CatalogEntry "1" ── "1" CollectionProjection
CollectionProjection "1" ──< "0..N" SectionProjection / ObjectProjection
ObjectProjection "1" ── "0..N" SectionProjection (visibleIn)

All records/arrays readonly. IDs use `[A-Za-z][A-Za-z0-9_-]*`, separate brands. Labels nonblank; plain strings preserved. Root is implicit: omit parent/folder. Version/schema numbers are safe nonnegative integers; schemaVersion=1. Orders safe integers; ties legal, sorted by identity.

| Entity | Complete fields |
|---|---|
| Catalog | schemaVersion:1, id:CatalogId, revision:number, folders:Folder[]=[], entries:CatalogEntry[]=[] |
| Folder | id:FolderId, title:label, parent?:FolderId, order:number=0 |
| CatalogEntry | collection:CollectionId, folder?:FolderId, order:number=0, archived:boolean=false |
| LibrarySnapshot | catalog:Catalog, collections:CollectionProjection[], recent:RecentVisit[]=[] |
| CollectionProjection | id:CollectionId, revision:number, title:label, description:string='', sections:SectionProjection[]=[], objects:ObjectProjection[]=[] |
| SectionProjection | id:SectionId, title:label |
| ObjectProjection | id:ObjectId, label:label, description:string='', visibleIn:SectionId[]=[] |
| RecentVisit | collection:CollectionId, openedAt:number (safe nonnegative epoch milliseconds) |
| ReadVersions | catalog:{id:CatalogId,revision:number}, collections:{id:CollectionId,revision:number}[] (ID sorted) |
| CatalogPlan | candidate:Catalog, versions:ReadVersions (original read set), changed:boolean (structural normalized candidate/original inequality, including array order; projection changes excluded) |
| QueryRequest | text:string='', folder?:FolderId, descendants:boolean=false, archived:'exclude'/'include'/'only'='exclude', sort:'order'/'title'/'recent'='order', kinds:('collection'/'section'/'object')[] default all, limit:number=50 (1..200), cursor?:string |
| SearchHit | kind:'collection'/'section'/'object', collection:CollectionId, id:CollectionId/SectionId/ObjectId matched to kind, label:string, description:string, visibleIn:SectionId[]; section description='', visibleIn=[id]; object description/visibleIn from projection; collection description from projection, visibleIn=[] |
| QueryPage | hits:SearchHit[], total:number, versions:ReadVersions, nextCursor?:string |
| Diagnostic | code:'shape'/'limit'/'duplicate'/'reference'/'cycle'/'identity'/'not-found'/'already-exists'/'folder-not-empty'/'stale-cursor', path:string, message:string |
| Result<T> | {ok:true,value:T} / {ok:false,diagnostics:Diagnostic[]} |

| ID | Invariant / outcome |
|---|---|
| L01 | Folder IDs unique catalog-wide; parent resolves; no self/ancestor cycles. Root cannot be deleted. |
| L02 | Exactly one entry for every supplied live/archived collection projection; no orphan entries/projections. Projection IDs unique; no duplicated title authority in entries. |
| L03 | Every entry folder resolves. Archive preserves location/order; restoring clears archived. |
| L04 | Section and object identities unique within each collection independently; visibleIn unique and resolves in its collection. Empty/unplaced objects remain searchable. |
| L05 | Recent visits unique per collection and resolve to supplied collections. Most-recent first; never-visited last. Visits are preferences, not catalog changes. |
| L06 | Inputs strict/schema bounded: at most 10,000 records per catalog/projection/visit array; text fields <=10,000 characters; operations <=1,000; cursor <=1,000,000 characters. If an emitted next cursor would exceed this bound, query returns limit without a partial page. Non-JSON JS objects unsupported; parser/read exceptions become shape failures, not inert-proxy guarantees. |
| L07 | Plans preserve catalog ID/revision. Validate original snapshot, apply checked operations in order, validate complete final catalog against proposed inventory. No partial candidate on failure. Same inputs replay identically. |
| L08 | Complete replacements keep record identity. Create-existing, replace/remove-missing reject. Intermediate folder references may be repaired later in the same batch. |
| L09 | Folder removal policy 'reject' fails if direct child folders/entries exist; 'rehome' moves direct children/entries to removed folder's parent, preserving their order/archive fields. Nested descendants remain attached to surviving children. No collection is deleted. |
| L10 | query reads only its supplied immutable snapshot. Trim/case-fold text, split on whitespace; every term must occur in a hit's combined label/description. Empty text lists all matching kinds. Folder filter selects direct membership, optionally descendants; omitted folder spans all folders/root. Unknown folder rejects. |
| L11 | Order sort: entry.order then collection ID, then collection hit, section hits, object hits, then hit ID. Title sort: case-folded hit label then the order tie-breaker. Recent sort: visit descending (missing last), then order tie-breaker. Code-unit comparison; no ambient locale/clock. Archive and kind filters apply before pagination. |
| L12 | Opaque cursor binds exact normalized query (including page size), recent preferences and catalog/collection version set; changed input or malformed cursor returns stale-cursor. Cursor offset is nonnegative and <=filtered count. Source revision set returned on every page; index never authoritative. |
| L13 | Public outputs detached and deeply frozen. Planning performs no durable write, revision increment, events or visit update. Authoring owns admission and commit/recovery. |

| File | Estimated LOC |
|---|---:|
| contract/index.ts | 25 |
| contract/api.ts | 35 |
| contract/brands.ts | 50 |
| contract/errors.ts | 30 |
| contract/records/catalog.ts | 55 |
| contract/records/snapshot.ts | 70 |
| contract/records/change.ts | 65 |
| contract/records/query.ts | 75 |
| contract/types.ts | 35 |
| core/validation/validate.ts | 180 |
| core/validation/outcomes.ts | 55 |
| core/catalog/folders.ts | 100 |
| core/catalog/plan.ts | 90 |
| core/catalog/operations.ts | 160 |
| core/discovery/project.ts | 90 |
| core/discovery/query.ts | 130 |
| core/discovery/cursor.ts | 90 |
| tests/fixtures.ts | 70 |
| tests/catalog.test.ts | 120 |
| tests/planning.test.ts | 160 |
| tests/query.test.ts | 160 |

Estimates are indications only, neither targets nor limits. Add focused private files when necessary for responsibility/readability; record actual inventory in implementation evidence.
