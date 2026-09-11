---
custom-width: 100
---
# Capability: model — Modules

### contract/api.ts
**Exposes:** `validate(input:unknown):Result<Collection>`, `plan(snapshot:unknown, changes:unknown):Result<ChangePlan>`; readonly exported types through index.  
**Imports (internal):** invariants/validate; collection/plan; declaration records/errors.  
**Imports (external):** N/A.  
**Contract:** synchronous, deterministic, no I/O. JSON-like input only, bounded before schema parsing. Error result contains diagnostics; success contains detached frozen value. Authoring owns recovery and commit. Consumers: Authoring preparing UI edits; Language/CLI preparing semantic edits. No origin-specific bypass.

### contract/brands.ts; records/*.ts; errors.ts; types.ts
**Exposes:** exact runtime schemas; inferred readonly branded record types; Result and diagnostic codes; typed changes. Public index exports supported types and checked ID schemas, not private policy.  
**Imports (internal):** declaration records only. **Imports (external):** Zod.  
**Contract:** strict shape/default validation; all domain rules remain core-owned. No runtime plugin registration; extend shipped schema and owned rule module together.

### core/invariants/{validate,identity,references,issues,freeze,input}.ts
**Exposes (private):** validateCollection, validateIdentity, validateReferences, diagnostic helpers, input budget guard/freeze.  
**Imports (internal):** own records and object/relationship/section validators. **Imports (external):** Zod via schemas.  
**Contract:** shape → domain rule pipeline; no domain rule runs on structurally invalid data. Rules accumulate diagnostics, no mutation or externally injected rule bypass. Identity resolution collection-local. Pure rules receive only required data.

### core/objects/{content,keys}.ts
**Exposes (private):** validateContent, validateKeys, descendant lookup.  
**Imports (internal):** records; diagnostic/reference helpers. **Imports (external):** N/A.  
**Contract:** content placement, table dimensions, local links, role/source/asset references, endpoint-addressable descendants, primary/unique/composite/FK consistency.

### core/relationships/endpoints.ts
**Exposes (private):** validateRelationships, resolveEndpoint.  
**Imports (internal):** own records; content lookup; diagnostics. **Imports (external):** N/A.  
**Contract:** endpoint existence/kind, legal source/target object kinds, cardinality requirements; no wire routing or FK inference.

### core/sections/{views,groups,modes,tree,sequence,layout}.ts
**Exposes (private):** validateSections; visibleObjects; owned rule functions.  
**Imports (internal):** records; diagnostics; endpoint lookup. **Imports (external):** N/A.  
**Contract:** local appearance/group/wire topology; mode/layout compatibility; tree reachability; sequence containment, participants and ordering. No geometry generation.

### core/collection/{plan,operations,records,removal,cascade-content,cascade-views,view-operations,preservation,impact}.ts
**Exposes (private):** planChanges, applyOperation, deleteObject, preserveOverrides, describeImpact.  
**Imports (internal):** own declaration contracts and validation. **Imports (external):** N/A.  
**Contract:** parse bounded operation list → validate base → reduce operations with per-operation preservation/reset precedence → validate final state → return candidate/impact. Failed operation short-circuits without exposing candidate. Missing/duplicate operation targets fail. Returned revision unchanged.

## Change contract

`ChangePlan { candidate:Collection, impact:Impact[] }`  
`Impact { target:objects/relationships/sections/assets/sources/collection, id:string, action:added/updated/removed }`  
`Result<T> = {ok:true,value:T} | {ok:false,diagnostics:Diagnostic[]}`  
`Diagnostic { code:shape/limit/duplicate/reference/content/endpoint/key/group/layout/mode/tree/sequence/identity/not-found/already-exists/delete-referenced, path:string, message:string }`

| Operation discriminant `op` | Payload / exact behavior |
|---|---|
| replace-document | value:Collection; same collection ID/revision; whole semantic replacement; geometry preservation applies |
| create | target:objects/relationships/sections/assets/sources; value:matching complete record; existing ID fails |
| replace | target as above; value:matching complete record; missing ID fails; matching ID is identity |
| remove | target as above; id:namespace ID; missing ID fails; no cascade; references assessed on final candidate |
| delete-object | id:ObjectId; cascade:boolean=false; explicit impact-producing deletion policy M18 |
| hide | section:SectionId; object:ObjectId; requires ordinary appearance; removes local incident wire appearances |
| reset-layout | section:SectionId; removes section/appearance/group placements, manual routes and route locks; semantic constraints stay |
| reset-route | section:SectionId; relationship:RelationshipId; requires visible wire; removes manual points and route lock |

`changes` = operation array, maximum 1,000 operations. Structural replacements intentionally handle block edits, reorder, group membership, sequence edits and reconnects without arbitrary JSON paths. Language lowers named DSL patches into these typed operations; callers need no invariants or geometry algorithms. Omitted defaults in complete replacements resolve per schemas; ordinary patch lowering copies unedited semantic fields. No undo journal, CAS, permissions, timestamp, request fingerprint or durable receipt in Model.
