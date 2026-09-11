---
custom-width: 100
---
# Capability: model — Entities & invariants

Collection "1" ──< "0..n" Object / Relationship / Section / Source / Asset  
Collection "1" ── "1" ThemePin  
Object "1" ──< "0..n" ContentBlock / Port  
Object "1" ──< "0..n" Appearance (maximum one per Section)  
Section "1" ──< "0..n" Appearance / Group / WireAppearance / SequenceItem  
Relationship "1" ── "2" Endpoint  
Endpoint "n" ── "1" Object; Endpoint "n" ── "0..1" addressable descendant  
Group "0..1" ──< "0..n" Appearance / Group  
WireAppearance "n" ── "1" Relationship  
Object / Relationship "n" >──< "0..n" Source

## Runtime records

All records strict, readonly, JSON-compatible. Unknown fields fail; no silent stripping. IDs match `[A-Za-z][A-Za-z0-9_-]*`; no `@` stored. Schema-validated brands separate collection, object, relationship, section, asset, source, group and descendant IDs. Labels/types are nonblank strings. Optional means absent, not null. Arrays preserve authored order; omitted optional collections resolve to empty arrays. No ID/time generation.

| Record | Fields (required unless `?`) |
|---|---|
| Collection | schemaVersion:1; id:CollectionId; revision:nonnegative safe integer; title:string; description?:string; theme:ThemePin; sections:Section[]; objects:DiagramObject[]; relationships:Relationship[]; sources:Source[]; assets:Asset[]; arrangement:LayoutIntent |
| ThemePin | id:string; version:string; digest:`sha256:<64 lowercase hex>`; roles:nonempty unique string[] (resolved role vocabulary) |
| Source | id:SourceId; uri:nonblank string; revision?/location?/description?:string; status:asserted/source-backed/unverified |
| Asset | id:AssetId; digest; mediaType:string; alt:nonblank string; license?/attribution?:string |
| DiagramObject | id:ObjectId; kind:ObjectKind; label:string; role:string=neutral; size:Size=medium; step?:positive safe integer; content:ContentBlock[]; ports:Port[]; sources:SourceId[] |
| Port | id:DescendantId; direction:in/out/inout; label:string; type:string |
| ContentBlock | discriminated `kind`, id:DescendantId; payload below |
| Relationship | id:RelationshipId; kind:RelationshipKind; label:string; source/target:Endpoint; from?/to?:Cardinality; guard?/effect?:string; style:solid/dashed=solid; sources:SourceId[] |
| Endpoint | object:ObjectId; member?:DescendantId |
| Section | id:SectionId; title:string; mode:Mode; order:safe integer=0; layout:LayoutIntent; appearances:Appearance[]; groups:Group[]; wires:WireAppearance[]; root?:ObjectId; sequence:SequenceItem[]; placement?:Placement |
| Appearance | object:ObjectId; group?:GroupId; role?:string; size?:Size; detail:full/summary/label=full; participation?:tree/annotation; placement?:Placement |
| Group | id:GroupId; title:string; parent?:GroupId; represents?:ObjectId; layout:LayoutIntent; placement?:Placement |
| WireAppearance | relationship:RelationshipId; route:orthogonal/curve=orthogonal; sourceSide/targetSide:auto/top/right/bottom/left=auto; manual?:Point[] (≥2 points); locked:boolean=false (requires manual points when true) |
| Placement | x/y:finite number; width?/height?:positive finite number; locked:boolean=false (human-authored override only) |
| Point | x/y:finite number |
| LayoutIntent | algorithm:flow/layered/tree/sequence/grid; direction:right/down/left/up=right; gap:compact/normal/roomy=normal; constraints:Constraint[] |
| Constraint | kind:rank/before/below/align; targets:LayoutTarget[]; rank/align ≥2 distinct targets; before/below exactly2 distinct targets |
| LayoutTarget | kind:object/group/section; id:string, resolved in section (collection constraints use section IDs with kind=section) |
| SequenceItem | event or fragment; id:DescendantId; parent?:DescendantId; branch?:DescendantId; order:nonnegative safe integer |
| Event | kind:event; source/target:ObjectId; label:string; message:call/return/async; activate?:boolean |
| Fragment | kind:fragment; operator:alt/opt/loop; label:string; branches:{id:DescendantId,label:string}[] |

| Content kind | Payload |
|---|---|
| text | text:string (empty allowed) |
| code | text:string; language?:string |
| list | items:string[]; ordered:boolean=false |
| image/icon | asset:AssetId; size:Size=medium; fit:contain/cover=contain |
| link | label:string; target:{kind:object,id:ObjectId,section?:SectionId} or {kind:uri,uri:string} |
| field | label/type:string; nullable:boolean=false; key?:primary/foreign/unique; references?:Endpoint |
| keygroup | key:primary/foreign/unique; fields:DescendantId[]; references?:Endpoint[] |
| signature | label:string; parameters:string[]; returns:string |
| member | label/type:string; visibility:public/private/protected=public |
| table | columns:nonempty string[]; rows:{id:DescendantId,cells:string[]}[] |

ObjectKind = step/start/end/decision/fork/join/entity/module/interface/function/state/participant/concept/system/note.  
RelationshipKind = flow/association/imports/calls/implements/contains/parent/reference/transition.  
Mode = flow/er/modules/tree/sequence/state/story/grid. Size = small/medium/large.  
Cardinality = `0..1` / `1` / `0..many` / `1..many`.

## Invariants

| ID | Required state |
|---|---|
| M01 | Separate typed ID namespaces; unique within each collection namespace. All blocks, table rows and ports share one descendant namespace per object. Group IDs section-local; sequence items/branches share one section-local namespace. |
| M02 | Every source, asset, local link, group parent, endpoint and view reference resolves in the candidate collection. External URIs remain opaque; Model performs no fetch or asset-byte verification. Local link section, if specified, contains the linked object's appearance. |
| M03 | Entity endpoints: field/port; module/interface/function: member/signature/port; others: port/table row. Whole-object endpoints legal. Field/keygroup blocks only entity; member/signature only module/interface/function. |
| M04 | Every wire label nonblank. Association requires both cardinalities and entity endpoints; other kinds forbid cardinalities. Imports: module→module/interface/function; calls: module/function→function; implements: module/function→interface; contains: module/system→any; parent/reference/flow unrestricted; transition: start/state→state/end. |
| M05 | Field FK requires key=foreign and real entity-field reference; foreign field requires reference. Keygroup fields are nonempty unique local fields; foreign references equally sized, distinct fields of one entity. Nonforeign groups require references absent; foreign groups require references present. At most one primary key definition per entity (single field OR group); foreign targets exactly match an ordered primary/unique key. Type strings must match corresponding FK targets; nullability/cardinality not inferred. |
| M06 | Table cell count equals column count. Source IDs in each source list unique. Theme roles unique; every object/appearance role exists in pinned role vocabulary. Step numbers need not be unique. |
| M07 | One object appearance per section, including group representation. Group parenting acyclic; each appearance/group has at most one parent. Represented group does not create semantic contains relationships. |
| M08 | A wire appears at most once per section; both endpoint objects visible there, including represented groups. Group itself is not an endpoint. |
| M09 | Layout targets resolve locally, no duplicates/self constraints. Collection constraints address sections only; section/group constraints address visible objects/groups only. Group constraints limited to descendants. Generated geometry absent; finite human overrides allowed. Model checks structure; Layout checks actual feasibility. |
| M10 | flow/state layouts flow or layered; er/modules layered; tree tree; sequence sequence; story/grid grid. Group layout uses same compatibility. Non-tree sections forbid root/participation. Non-sequence sections have no sequence items. |
| M11 | Flow decision visible outgoing flow labels distinct. Loops legal. ER visible non-reference wires associations; module non-reference wires imports/calls/implements/contains; state non-reference wires transitions. Annotation objects allowed. |
| M12 | Tree participants: explicit participation, else note=annotation and others=tree; represented objects participate. Nonempty tree exactly one explicit root; root has zero incoming parent wires; every other participant exactly one; no cycles/disconnected participant. Parent wires cannot touch annotations. Only parent/reference wires in tree sections. Empty tree has no root. |
| M13 | Sequence events use visible participant objects. Items ordered by order within parent+branch scope, ties invalid. Parent must be fragment; graph acyclic. alt has ≥2 uniquely labelled branches; opt/loop no branches. Child of alt names its branch; other child forbids branch. Flat containment represents properly nested fragments; crossing ranges impossible. Event/fragment labels nonblank. Sequence sections have no wire appearances. |
| M14 | Inputs are JSON data: finite acyclic plain records/arrays/primitives; accessors/exotic objects rejected. Budget: ≤100,000 input values, nesting≤64. Limit diagnostic, not stack overflow. Results detached and recursively frozen; neither validation nor planning mutates input or retains shared mutable state. |
| M15 | Schema version exactly1. No silent coercion, truncation or unsupported-field loss. Validation reports stable typed code/path/message; independent failures may accumulate, order deterministic. No assertion about source truth, type compilation or visual quality. |
| M16 | Plan validates starting snapshot and final candidate. Operations sequential; intermediate dangling references allowed. Failure returns no candidate. Collection identity/revision fixed; Authoring increments revision at commit. Pure replay with same snapshot/request gives equal output; no write occurs. |
| M17 | Geometry retained by section, section/object, section/group and section/relationship identity. Operations obey statement order: reset prevents resurrection of earlier overrides; later explicitly supplied geometry wins. Route locks travel with manual points. Hiding ordinary appearance removes local incident wires; canonical data remains. Represented appearance removal uses group replacement/removal, not hide. |
| M18 | Delete-object without cascade rejects if references exist. Explicit cascade removes incident relationships, appearances, represented groups, group descendants' placement membership, local links, affected key definitions, view wires/constraints, tree root and sequence references; final mode validity still required. Other removes never silently cascade and reject unresolved references at final validation. Impact reports every added/removed/updated top-level record. |

## Files in scope — indicative estimates

All paths below relative to `capability/model/`; estimates exclude blank scaffold files. Splitting a concern is permitted if module responsibilities/import rules remain unchanged; final inventory must record actual files.

| File | Estimated lines |
|---|---:|
| `contract/index.ts` | 20 |
| `contract/api.ts` | 35 |
| `contract/brands.ts` | 25 |
| `contract/errors.ts` | 30 |
| `contract/types.ts` | 25 |
| `contract/records/content.ts` | 90 |
| `contract/records/object.ts` | 35 |
| `contract/records/relationship.ts` | 40 |
| `contract/records/layout.ts` | 55 |
| `contract/records/section.ts` | 75 |
| `contract/records/collection.ts` | 45 |
| `contract/records/change.ts` | 55 |
| `core/invariants/issues.ts` | 45 |
| `core/invariants/identity.ts` | 45 |
| `core/invariants/references.ts` | 85 |
| `core/invariants/validate.ts` | 55 |
| `core/objects/content.ts` | 65 |
| `core/objects/keys.ts` | 75 |
| `core/relationships/endpoints.ts` | 60 |
| `core/sections/groups.ts` | 75 |
| `core/sections/modes.ts` | 55 |
| `core/sections/tree.ts` | 65 |
| `core/sections/sequence.ts` | 80 |
| `core/sections/views.ts` | 65 |
| `core/collection/plan.ts` | 65 |
| `core/collection/operations.ts` | 95 |
| `core/collection/removal.ts` | 85 |
| `core/collection/preservation.ts` | 65 |
| `core/collection/impact.ts` | 45 |
| `core/invariants/freeze.ts` | 15 |
| `tests/fixtures.ts` | 100 |
| `tests/validation.test.ts` | 120 |
| `tests/content.test.ts` | 120 |
| `tests/sections.test.ts` | 140 |
| `tests/planning.test.ts` | 150 |
| `tests/contract.test.ts` | 85 |

| `core/collection/cascade-content.ts` | 25 |
| `core/collection/cascade-views.ts` | 65 |
| `core/collection/records.ts` | 64 |
| `core/collection/view-operations.ts` | 62 |
| `core/invariants/input.ts` | 99 |
| `core/sections/layout.ts` | 77 |

| Supporting repo file | Estimated lines |
|---|---:|
| `CODING-STANDARDS.md` | 160 |
| `package.json`, `capability/model/package.json` | 25 each |
| `tsconfig.json`, `.prettierrc.json` | 25 / 4 |
| `eslint.config.js` | 70 |
| `.dependency-cruiser.cjs` | 80 |
| `pnpm-lock.yaml` | generated |
| `capability/model/README.md` | 30 |
| `quality/acceptance-evidence/model-*.md/json` | 200 total; audit evidence |
| `quality/file-reviews/model.md` | 100 |
