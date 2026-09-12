# Capability: design-system — Entities & invariants

SourceSet "1" ──< "n" TokenDefinition
TokenDefinition "1" ──< "n" TokenDependency
UiThemeDelta "n" ── "1" exact BaseVersion
ResolveRequest "1" ── "1" immutable ResolvedTokenSet
ResolvedTokenSet "1" ── "1" CSS view / numeric view / dependency graph
ArtifactSet "1" ──< "n" immutable Artifact
PanelFrame "1" ── "1" Header + Body
PanelBody "1" ── "0..1" BodyHeader; "1" ──< "n" Section slots

| Entity | Explicit fields / types |
|---|---|
| TokenId, Digest, Version | checked non-interchangeable identities; digest SHA256 hex; IDs map deterministically to public --nv-* names |
| TokenDefinition | DTCG $type/$value/$description; group type inheritance; alias references; optional declared novakai recipe metadata |
| TokenValue | sRGB components/alpha quantized round(channel×255) before contrast/hash; lowercase hex6 if opaque, hex8 otherwise; dimension(value,px); duration(value,ms); scalar number; approved fontFamily; aliases before resolution |
| Recipe | reference; multiply(value,scalar); sum/max(2..8 same-unit inputs); alpha(color,scalar); bounded typed tree, no scripts |
| SourceSet | schemaVersion1, definitionVersion, definitions, semantics, preferences, shipped themes; immutable input, no lookup I/O |
| UiThemeDelta | id/version, exact base definition/theme version, known typed overrides only; derived identity; paper/ink manifest |
| DiagramThemeInput | complete admitted token values, roles, exact font pins, source preset pin; no UI preferences |
| UiPreferencesV1 | schemaVersion1; theme:system or pinned UiThemePin; textSize integer12..20; density compact/comfortable/spacious; motion system/reduced/full |
| Environment | light/dark scheme, fine/coarse pointer, OS reduced-motion, forced-colors; explicit input |
| FontPin | family, exact digest, approved/admitted metadata; diagram requires body+mono pins; UI approved system aliases |
| ResolvedTokenSet | definitionVersion,input/resolved digests,scope ui/diagram/export,values,css variables,dependencies,primary roots,contrast evidence,fonts,theme provenance |
| PortableTheme | complete primitive tokens/roles/font digests/base pin; each role requires role.<id>.fill/stroke/text color tokens; neutral required; structurally bridgeable to Templates ThemePayload; Templates verifies preset identity |
| StyleProjection | body/mono exact fonts; size/line-height/padding/gap/stroke/radius; small/medium/large widths; roles/surface/text/secondary/border; Presentation-compatible data |
| ArtifactSet | digest,version,files(path,content,hash)[],manifest; no partial successful set |
| TokenError | code,path,targets,expected,message,recovery; no error-message parsing |
| Result<T> | success(value:T) / failure(error:TokenError); detached immutable outcomes |
| PrimitiveProps | readonly labelled/control/status/slot callbacks; native semantics; no collection IDs/domain stores |
| PanelProps | stable IDs, header/body/context/sections slots; controlled collapse/reorder/resize callbacks; section children retained when hidden |

| ID | Invariant |
|---|---|
| T01 | One authored authority: definitions/semantics/preferences/theme deltas. Sixteen primary names/defaults and supporting values exactly baseline06; no copied palette/spacing literals in components. |
| T02 | DTCG2025.10 supported profile: color(sRGB),dimension(px),duration(ms),number,fontFamily; groups/type inheritance and curly/JSON-pointer aliases. Unsupported standard types/extensions/group features reject explicitly; no claim of complete DTCG conformance. |
| T03 | Unknown names/types, alias cycles, missing references, mixed units, recipe arity, nonfinite/out-of-range values and CSS injection reject before emission. Bounds exactly baseline06. Maximum1000 tokens, alias/recipe depth64, source4MiB. |
| T04 | Derivations evaluated once. CSS/numeric views and fingerprints share resolved values. UI px, diagram pre-camera px/world1:1, scalar,ms,font references remain distinct. |
| T05 | UI precedence definitions→theme→personal preferences→accessibility floors. Diagram/export use exact admitted values/fonts; UI changes cannot alter their digest. Export motion0. |
| T06 | Text/control floors, density deltas, 800/1200 breakpoints, shell dimensions and panel bounds exactly baseline05/06. Full motion never overrides OS reduction. |
| T07 | Normal text≥4.5:1; large text/essential boundary/focus≥3:1, all required paper/ink and hover/pressed/selected/disabled/status pairs. Alpha composited against the actual surface; base surfaces opaque. Failure returns no new scope. Forced colors uses declared system-color pairs. |
| T08 | Every scope root installs complete semantic values; portal receives explicit matching scope. Nested overrides cannot inherit stale computed aliases. Installer changes only owned variables; invalid install retains previous scope. |
| T09 | UI pin identifies its shipped/custom UI theme. Diagram source preset pin remains Templates-owned provenance; resolved style digest is separate cache identity. No accidental interchange of these hashes. |
| T10 | Shared primitives use native controls plus Radix modality/menu/tab/tooltip behavior; labels/errors/status are explicit. Pending retains label, blocks duplicate action, cancellation separate. No disabled opacity shortcut. |
| T11 | Panel header/body/context-header/section-header/section-body are separate slots. Hidden sections stay mounted; reorder uses stable IDs. Host controls visibility/layout/applicability; no feature-ID switch in primitives. |
| T12 | Generated artifacts deterministic; complete immutable generation publishes via atomic manifest replacement. Checked-in generated CSS/TS are compiler snapshots, verified against regeneration; runtime readers pin one manifest generation. |
| T13 | CSS layers reset/vendor/tokens/themes/preferences/components/utilities; first-party component rules layered/module-scoped; no !important/unlayered vendor import or arbitrary inline visual values. |
| T14 | Style audit denominator/primary reachability exactly baseline06. Require>80% primary and≥95% token use for authored eligible declarations; exclude generated/vendor/instance geometry honestly. Whole-app metric and12 representative states remain Part2 gates. |

| File scope | Estimated lines each |
|---|---:|
| contract/index,api,compose,types,brands,errors | 55;120;160;90;45;60 |
| contract/token-types,token-schemas,react-types | 30;35;220 |
| contract/records/tokens,source,theme,preferences,resolved,artifacts | 120;90;100;70;130;70 |
| contract/ports/identity,token-source,token-artifacts,scope-target | 25;30;35;35 |
| core/tokens/read,flatten,references,recipes,values,bounds,contrast,resolve,emit | 120;110;140;130;100;90;150;150;130 |
| core/themes/resolve,preferences,fonts,diagram | 140;100;90;110 |
| core/artifacts/compile,manifest; core/styles/coverage,policy | 130;70;140;100 |
| adapters/hash/sha256; build/token-files,stylesheet-reader; browser/install-tokens | 55;170;100;150 |
| React Button,Field,Dialog,Menu,Tabs,Tooltip,StatusMessage | 85;95;100;110;95;70;65 |
| React SidePanel,PanelHeader,PanelBody,PanelBodyHeader,PanelSection,PanelSectionHeader,PanelSectionBody | 100;70;60;60;100;90;55 |
|14 colocated component CSS files | 35..100 each |
| styles entry,reset,utilities; five generated CSS; two generated TS | 15;35;50;40..200;40 |
| cli/build-tokens; tests fixtures + five suites | 80;160;130..220 each |

Estimates are indications only. JSON definitions/theme deltas are data, not duplicated TS policy.
