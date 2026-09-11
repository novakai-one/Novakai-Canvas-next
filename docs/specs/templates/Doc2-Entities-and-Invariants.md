# Capability: templates — Entities and invariants

## Owned records

| Record/type | Fields | Cardinality / rule |
|---|---|---|
| PresetId | ASCII letter then letters/digits/_/-;1..80chars | Kind+ID+version is immutable identity |
| Version | three nonnegative safe integers, dotted, no leading zeros | Numeric tuple ordering; prereleases unsupported in v1 |
| Digest | lowercase SHA25664hex | Hash canonical resolved preset, excluding its digest |
| Pin | kind:recipe/theme,id,version,digest | Exactly one preset; never implicit latest after resolution |
| Catalog | readonly Preset[] |0..1000 records; unique kind/ID/version; supplied authoritative snapshot |
| Preset header | schemaVersion:1,id,version,title,description,kind | Nonempty title<=256;description<=4096 |
| Recipe payload | languageVersion:1,source:string,family:er/modules/sop/mindmap/sequence/infographic,assets:Digest[],themes:Pin[] |1source<=1MiB;0..1000 unique assets;0..100theme pins; all immutable exact dependencies |
| Theme payload | tokens:Record<string,TokenValue>,roles:string[],fonts:Digest[],base:Pin or null | Fully resolved values, not runtime inheritance; base is provenance;0..1000tokens,1..100unique roles,0..100fonts |
| TokenValue | color:{type:color,value:#RRGGBB/#RRGGBBAA}; dimension:{type:dimension,value:number,unit:px/world/ms/scalar}; font:{type:font,family:string,digest:Digest} | No arbitrary CSS; semantic token names/contrast/bounds checked by injected DesignSystem role |
| AdmissionInput | header + raw recipe source or raw theme payload | Unknown input decoded at public boundary; codec resolves canonical payload |
| PresetPlan | candidate:Catalog,pin:Pin,changed:boolean | Adds exactly one immutable version or returns identical existing version; no physical write |
| Selection | kind,id,version optional,digest optional | Digest requires version; omitted version resolves numeric maximum once |
| ExpansionRequest | exact recipe pin,namespace:PresetId | Namespace names deterministic instance; no coordinates or JSON required from agent |
| Expansion<T> | pin,namespace,intent:T,assets:Digest[],themes:Pin[] | Detached ordinary editable intent; T owned by injected Language bridge; no live preset reference controlling later edits |
| Templates<T> | validatePreset,planAdmission,list,read,instantiate | Public Result outcomes; no persistence methods |

## Invariants

| ID | Invariant / failure |
|---|---|
| T01 | Every public external record starts unknown; strict versioned bounded JSON. Nonfinite numbers, executable values, oversized/deep inputs rejected. All successful DTOs detached/frozen; never freeze supplied providers. |
| T02 | SHA256 over deterministic sorted-key UTF8 JSON of normalized record excluding digest; arrays retain order. Native hashing is injected; hash failure→provider-failed. Same content replays same pin. |
| T03 | Catalog validates record shapes, hashes, uniqueness and declared dependency closure before queries/plans. Recipe theme pins/base theme pins resolve exactly in catalog; self/cyclic base ancestry rejected. Missing/changed pin→missing-preset/digest-mismatch. |
| T04 | New ID/version adds one record. Existing identical content is no-op; different content at same identity→version-exists. Upgrade is a new version; old pins unchanged. No in-place patch/delete API. |
| T05 | Source codec admits complete canvas1 source with pinned theme/assets, no unresolved paths/aliases or execution; returns canonical source and computed dependency manifest. Caller manifests are not trusted. Parser/Model semantic validity belongs to injected Language role. |
| T06 | Theme codec resolves a submitted delta/base to complete typed values, validates known IDs, bounds, roles, admitted fonts and contrast. It receives exact available theme records; invalid delta cannot replace existing theme. Every font token names its admitted digest; fonts equals sorted unique token digests. No retained system alias. DesignSystem owns token semantics. |
| T07 | Exact read verifies digest; latest uses numeric version tuple, never lexical order. List search matches ID/title/description/family case-insensitively, deterministic kind/id/version order. Empty query valid; no clock/recent state. |
| T08 | Instantiate verifies entire catalog/exact recipe pin and passes canonical source+namespace to codec. Codec remaps all collection-scoped aliases/references/constraints while preserving object-local members and external source URIs. Same namespace+pin→same intent; distinct namespaces→disjoint created IDs. |
| T09 | Expansion does not commit/admit assets. Returned assets include sorted unique direct media and fonts reachable through pinned themes/base ancestry; themes list includes that exact closure; Authoring verifies/acquires media, merges intents and validates final Model state. Namespace collision with existing collection must reject at final gate, never overwrite. |
| T10 | Preview uses the same expanded intent returned by instantiate; renderer/layout injected by host after expansion. Six shipped recipe families have actual authorable DSL examples; no diagram-sized raster substitute. |
| T11 | Codec/hash exceptions and invalid codec output become typed provider-failed/invalid-input; no partial admission. Authoring owns revision/CAS/history/retry; Templates returns immutable plans and no events. |
| T12 | Bounded JSON1MiB source/8MiB operation payload/depth48; preset count1000. Recipe inspection/theme resolution synchronous pure roles; no executable callback stored in records. |

## File scope and estimated lines

Indicative estimates, not limits or targets. All listed source files require>144/160 and Sonar<=2.

| File | Estimated lines |
|---|---:|
| contract/api.ts | 90 |
| contract/compose.ts | 20 |
| contract/index.ts | 24 |
| contract/brands.ts | 25 |
| contract/errors.ts | 40 |
| contract/types.ts | 60 |
| contract/records/preset.ts | 95 |
| contract/ports/codecs.ts | 48 |
| contract/ports/identity.ts | 12 |
| core/validation/outcomes.ts | 70 |
| core/validation/catalog.ts | 100 |
| core/admission/plan.ts | 90 |
| core/discovery/select.ts | 85 |
| core/expansion/instantiate.ts | 80 |
| adapters/identity.ts | 35 |
| tests/fixtures.ts | 100 |
| tests/presets.test.ts | 170 |
| tests/expansion.test.ts | 100 |
| resources/recipes/*.canvas (6 files) |40 each |
| resources/recipes/README.md |20 |
| capability/templates/package.json |15 |
