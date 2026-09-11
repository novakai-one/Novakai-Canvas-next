# Capability: language — Entities & invariants

Source "1" ──< "n" Token
ParsedDocument "1" ── "1" CollectionSyntax
CollectionSyntax "1" ──< "n" Declaration
NodeSyntax "1" ──< "n" ContentSyntax / PortSyntax
SectionSyntax "1" ──< "n" ViewStatement
Patch "1" ──< "n" Operation
LoweredIntent "1" ── "1" validated Collection
Diagnostic "1" ── "1" Span

| Entity | Fields / types |
|---|---|
| Span | start/end UTF16 offsets; start/end line,column one-based; end exclusive |
| Token | kind:word/string/id/integer/symbol/eof; text; decoded value; span |
| ValueSyntax | string/word/integer/boolean/reference/list variants; source span; reference has optional namespace/member/section address |
| Attribute | name; value:ValueSyntax; span; duplicate names reject |
| Declaration | kind; required positional fields; checked attributes[]; children[]; span; fixed construct registry |
| Document | kind:canvas,version:1,collection; resource requests; source map |
| Patch | kind:patch,version:1,collection ID,operations[]; resource requests; source map |
| ViewReadout | kind:view,version:1,collection ID,revision,scope:section/object; display-only declarations |
| ResourceRequest | theme alias/pin; asset alias/kind/source/alt/license/attribution; no fetched bytes |
| ResolvedResources | exact theme metadata and admitted asset records keyed by alias; supplied immutable data |
| LowerRequest | source:string; mode:create/replace/patch; snapshot:Collection/null; resources:ResolvedResources |
| LoweredIntent | mode; collection:Collection; changes:Model.Change[]; resource requests; source map; no revision allocation |
| PrintRequest | collection:unknown; scope:all/section/object plus ID; optional display heading; no geometry export flag |
| Readout | source:string; collection ID; revision; scope; manual target summary; exact pins |
| Description | version, constructs/properties/defaults, kinds/modes, patch operations, examples, diagnostics |
| Result<T> | success(value:T) / failure(diagnostics[]); each diagnostic code/span/target/expected/message/recovery |

| ID | Invariant |
|---|---|
| G01 | UTF8 canvas1/patch1; whitespace insignificant, braces delimit; # comments outside quotes. No evaluation/interpolation/JSON payload blocks. |
| G02 | Quoted strings decode only quote/backslash/n/t escapes; unknown escapes reject. Literal Unicode/control characters retained where representable; printer never drops text. Lone surrogate input rejects as unsupported Unicode. |
| G03 | IDs match @ followed by [A-Za-z][A-Za-z0-9_-]*. Namespaces and descendant uniqueness match Model; declaration references resolve after complete batch. Labels never rename IDs. |
| G04 | Fixed construct/property tables reject unknown, duplicate, incompatible or incorrectly typed fields. Explicit x/y/width/height/manual coordinate properties always reject. |
| G05 | Defaults follow baseline04. Mode supplies omitted layout; collection arrangement defaults grid/right/normal; source status defaults unverified. Printed default omission must lower to the same semantic state. |
| G06 | Nodes/content/ports, labelled wires/endpoints/cardinalities, sources, groups/represented appearances, layout constraints, tree roots/annotations and sequence scopes retain all supported information. |
| G07 | Source/asset/theme data is descriptive only. Pure parse/lower performs no file/network access. Exact supplied pins must match requested aliases/digests; missing/mismatching resources reject. |
| G08 | Print→parse→lower preserves IDs, values, pins and constraints. Order is exact for sections/content/ports/rows/branches/constraint targets; appearances/groups compare within owning layout scope, sequence within parent/branch. Sequence numeric gaps and cross-scope storage interleaving are nonsemantic; unrepresentable facts reject. Comments/formatting and human geometry are excluded from semantic equality, never silently from storage. |
| G09 | Full replacement uses Model preservation on surviving section/object/group/wire IDs. Patch builds ordered operations; Model.stage supplies exact intermediate structural reads; final Model.plan validates once. |
| G10 | Stage output is explicitly unchecked and never exposed as a successful LoweredIntent. Forward references can temporarily be unresolved; failed final validation returns no candidate. |
| G11 | Patch set/unset uses owning-property whitelist; required/structural identities/kinds/membership cannot be arbitrarily set. Unknown targets reject. Delete/recreate of a section in one patch rejects. |
| G12 | Replace node/section removes omitted semantic content but retains feasible manual overrides through Model. Explicit reset uses Model reset operations; no synthetic coordinates. |
| G13 | Scoped print uses structural `view 1 @collection revision=N scope=section:@id` (or object:@id). Parse/lower reject view as authoring input even without comments. Full read contains applicable canvas source plus revision metadata. |
| G14 | Lossless sequence branch identity requires optional `branch @id "label"`; label-only source generates deterministic fragment-local IDs, printed explicitly. Collisions reject. |
| G15 | Collection layout/direction/gap attributes and collection-level constraints over section:@id preserve canonical arrangement. Content order and port order each preserved; ports have a separate interface compartment. |
| G16 | Bounds:16MiB source,250000 tokens,1000 patch operations, nesting64. Progress-checked iterative repetition prevents stack growth by declaration count. Input/provider faults become typed diagnostics. |

| File scope | Estimated lines each |
|---|---:|
| contract/index; api; types; brands; errors | 45;100;70;30;60 |
| contract/records/syntax; vocabulary; requests; ports/model | 150;80;75;55 |
| core/lexing/tokens; strings; locations | 120;70;70 |
| core/parsing/cursor; repetition; values; attributes | 100;80;110;90 |
| core/parsing/declarations; content; views; patch; document | 160;130;160;170;100 |
| core/vocabulary/constructs; properties; defaults; description | 110;180;65;80 |
| core/lowering/document; content; views; sequence; resources; properties; diagnostics | 130;140;150;140;100;90;80 |
| core/patching/compile; targets; properties; blocks; views; structural | 130;100;130;110;100;100 |
| core/printing/document; content; views; sequence; properties; strings; scope; geometry | 120;120;150;130;90;50;100;80 |
| core/validation/input; outcomes | 80;60 |
| tests/fixtures; domain-fixture; engineering-fixtures; patch-fixtures | 150;100;180;140 |
| tests/documents; engineering; roundtrip; patches; boundaries | 140;180;160;220;180 |
| Model stage public/core integration (existing files or focused stage file) | 20;100 |

Estimates indicate scope only, not limits or targets. Resource examples are authored DSL, not source code or screenshots masquerading as editable diagrams.
