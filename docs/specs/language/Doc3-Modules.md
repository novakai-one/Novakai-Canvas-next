# Capability: language — Modules

### contract/api.ts
**Exposes:** createLanguage({reader,planner,stage}):Language. describe(version=1):Result<Description>; parse(source):Result<Document|Patch>; lower(request):Result<LoweredIntent>; print(request):Result<Readout>.
**Imports:** own lexing/parsing/lowering/printing/validation; declaration contracts.
**Contract:** synchronous pure facade; detached immutable outcomes. Language owns correction diagnostics; Authoring owns commit/retry/drafts. Required Model roles have no permissive defaults.

### contract/ports/model.ts
| Role | Operation / contract |
|---|---|
| ModelReader | validate(unknown) → Result<Collection>; reject unsupported record fields before printing |
| ModelPlanner | plan(snapshot,changes) → Result<ChangePlan>; complete final invariants/preservation/impact |
| ModelStage | stage(snapshot,changes) → Result<{validity:'unchecked',candidate:Collection,changes:readonly Change[]}>; validates original plus change shapes; no final semantic-validity claim |

Diagnostics adapt Model paths to nearest owning syntax span; no parsing error-message text. Stage includes checked operations for cast-free compilation. Final lower never returns stage output. Create plans against a validated empty shell with matching identity/theme; replacement uses the supplied snapshot. Stage is a compiler projection, not a new persistence path.

### core/lexing/*.ts; parsing/*.ts
**Exposes (private):** tokenize, source locations, cursor reads, bounded repetition, value/attribute/construct readers.
**Imports:** own syntax/vocabulary and typed failure helpers.
**Contract:** G01–G04/G16. Grammar consumes required positional fields then name=value attributes; next declaration keyword terminates optional attributes. A token registry is not a generic-property escape hatch. Spans survive lowering. Earliest syntax failure is sufficient; multiple independent diagnostics optional.

| Construct | Required framing / accepted content |
|---|---|
| collection | @id "title" attributes {asset/source/node/wire/section/section constraints} |
| asset/source | @id kind source=... alt=... / @id "URI" provenance attributes |
| node | @id kind "label" attributes {text/code/link/list/image/icon/field/keygroup/signature/member/table/port} |
| table/row | table @id columns=[strings] {row @id cells=[strings]} |
| wire | @id @source[.@member] -> @target[.@member] "label" attributes |
| section/group | @id "title" layout attributes {show/group/constraints; section also connect/root/event/fragment} |
| show/connect | one or more @ids then appearance/route attributes |
| constraints | rank/align two-or-more targets; before/below exactly two; group:@id/section:@id typed scope |
| event/fragment | ordered message / alt-opt-loop body; alt branches individually labelled, optionally identified |

All accepted properties, enum values and defaults are the baseline04 tables plus G14/G15 identity/arrangement clarifications. `image/icon` preserve size and fit; custom roles resolve only through pinned theme metadata. Code/type strings are inert content.

### core/lowering/*.ts
**Exposes (private):** complete raw record construction, exact pin binding, nested view/sequence flattening, final owner validation, diagnostic mapping.
**Imports:** own syntax/role declarations and vocabulary.
**Contract:** G05–G10. Node content and port compartments preserve individual order. Flatten groups with parent IDs, appearances with group IDs; represented groups count as appearances without duplicate show. Sequence scopes/order/branch IDs become canonical fields. Collection constraints target section IDs. Relative rules remain semantic, never computed coordinates.

### core/patching/*.ts
**Exposes (private):** compile ordered edits into Model change data; obtain current structural target via Stage; final plan through ModelPlanner.
**Imports:** own record translators/target/property maps and owner role declarations.
**Contract:** G09–G12. Supported operations: add declarations; set/unset collection/node/wire/block/appearance/section/route; replace node/section; show/hide; connect/disconnect; add/remove/move block; delete node(with explicit cascade)/wire/section/asset/source; reset layout/route. Target syntax and exact semantics follow baseline04. `from-end`/`to-end` reconnect; `sources` only provenance. Prefix staging preserves Model cascade effects before later edits. Block rows/ports use replace node when their structure is not a content-block operation.

### core/printing/*.ts
**Exposes (private):** canonical readable source; scoped display projection; geometry-presence summary.
**Imports:** own vocabulary/strings; checked Model record declarations.
**Contract:** G08/G13–G15. Stable IDs and exact asset/theme pins; explicit branch IDs; schema-unknown data rejects before printing. Scoped views include necessary node/relationship/asset/source context without claiming a valid standalone collection. Geometry summary names manual/locked targets without numeric positions. Full source remains canvas1, while revision/scope live in Readout metadata. Portable geometry sidecar belongs to Export.

### core/vocabulary/*.ts
**Exposes (private):** fixed construct headers, property types/mappings, defaults, readable describe output and examples.
**Imports:** own declaration types.
**Contract:** one property fact feeds parser/lowerer/printer/describe; no four drifting grammars. New shipped forms add registered definitions and focused translators; Authoring transaction internals unchanged.
