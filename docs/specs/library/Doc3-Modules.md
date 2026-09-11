# Capability: library — Modules

### contract/api.ts
**Exposes:** validate(snapshot:unknown):Result<LibrarySnapshot>; plan(snapshot:unknown,changes:unknown,proposedCollections?:unknown):Result<CatalogPlan>; query(snapshot:unknown,request:unknown):Result<QueryPage>.
**Imports (internal):** validation/validate; catalog/plan; discovery/query; declaration types.
**Imports (external):** N/A.
**Contract:** synchronous pure operations; typed, detached frozen outcomes. Authoring supplies authoritative original snapshot and optionally prospective collection projections after Model planning. Proposed inventory defaults to original. No client may bypass Authoring by supplying a proposed inventory directly to persistence. Recovery/commit owner: Authoring.

### contract/{brands,errors,types}.ts; records/*.ts
**Exposes:** readonly schemas/types, branded namespaces, typed diagnostics/operations/query outcomes. Public index exports validate/plan/query plus supported types and checked ID schemas; private policy stays hidden.
**Imports:** own declarations; Zod for checked shapes.
**Contract:** strict defaults and bounds, no graph or storage behavior.

### core/validation/{validate,outcomes}.ts
**Exposes (private):** parse/check snapshot/catalog/projections; typed diagnostic constructors/frozen boundary.
**Imports:** own declaration schemas; folders ancestry.
**Contract:** L01–L06/L13; accumulate domain diagnostics only after shape succeeds. Final proposed inventory may differ from original; consistency assessed against final entries. Read DTOs are projections, not Model document validation.

### core/catalog/folders.ts
**Exposes (private):** ancestry/descendant lookup; folder removal plan.
**Imports:** own declarations/outcomes.
**Contract:** bounded parent walks; cyclic input terminates. L01/L09. Rehome creates copied records; never assigns explicit undefined to optional parent/folder.

### core/catalog/{operations,plan}.ts
**Exposes (private):** apply checked change; plan catalog batch.
**Imports:** own contracts; validation; folders.
**Contract:** L07–L09. Original snapshot must be valid. Optional proposedCollections is validated read projection data; dropped collections' recent visits are omitted in final consistency check, not persisted/deleted preferences. Return original read versions; final inventory does not replace original preconditions.

| Operation | Payload / behavior |
|---|---|
| create-folder | value:Folder; ID absent |
| replace-folder | value:Folder; ID present; moves/renames/reorders by complete replacement |
| remove-folder | id:FolderId, policy:'reject'/'rehome'='reject' |
| register | value:CatalogEntry; collection absent in catalog; must exist in final proposed inventory |
| replace-entry | value:CatalogEntry; membership exists; move/order/archive/restore by complete replacement |
| unregister | collection:CollectionId; membership exists; collection absent in final proposed inventory |

### core/discovery/project.ts
**Exposes (private):** canonical search-hit projection, source version set.
**Imports:** own snapshot/query/types declarations.
**Contract:** one hit per collection/section/object; objects with no appearance included. Rebuildable on each query; no persisted index or stale cache.

### core/discovery/{query,cursor}.ts
**Exposes (private):** filter/rank/page; cursor encode/validate.
**Imports:** own declaration schemas, validated snapshot, project, folder ancestry.
**Contract:** L10–L12. Cursor is opaque JSON envelope {offset,queryKey,versionKey}; key strings derive only from normalized request/recent data and sorted version set. Cursor tampering is not a mutation/permission path; mismatching keys reject. No I/O, ambient locale/time, or external search provider.
