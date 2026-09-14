# Language — builder file-local standards evidence before implementation audits

Exact user 16-principle rubric; each target authored/read individually. These are builder judgments, separately challenged by A1. No points follow from coverage, small size, or confidence. Actual Sonar is measured, not substituted for the rubric.

Common evidenced anchors: closed shipped vocabulary/orchestration steps cap P2 at6; no subtype contract proof gives P3 exactly7. Private value-returning structured rejections score P9=5 even though the facade catches them. Thin declaration tables score P11=5. Unnamed recovery at a private entry scores P10=8. Local mutable token/cursor accumulation scores P13=5. No unchecked casts/any/non-null assertions occur; const assertions in fixtures are literal narrowing. Narrow Model roles are consumed separately and imports pass capability-boundary enforcement.

P1/4/5/6/7/8/12/14/15/16 retain10 only after inspecting each target: one named syntax/mapping/printing role; chosen ports used throughout the flow; no foreign runtime core import; shared grammar facts reused; named stages rather than conditional spreads; no unused production mechanism; direct record reads; checked owner brands; no named clever-return idioms; no clock/network/filesystem globals. Input byte counting is deterministic. Schema assertions and Vitest failures in test fixtures have test-runner recovery.

|File / evidence entry|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|/160|Sonar|
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
|contract/api.ts:16 `createLanguage`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|**153**|1|
|contract/errors.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/index.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|**153**|0|
|contract/ports/model.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/records/requests.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/records/syntax.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/records/vocabulary.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|contract/types.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/lexing/locations.ts:3 `lineStarts`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|2|
|core/lexing/strings.ts:5 `decodeString`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/lexing/tokens.ts:8 `classify`|10|6|7|10|10|10|10|10|10|10|10|10|5|10|10|10|**148**|2|
|core/lowering/content.ts:8 `lowerRecord`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/lowering/diagnostics.ts:14 `ownerValue`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/lowering/document.ts:12 `lowerDocumentData`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/lowering/fields.ts:11 `field`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/lowering/layout.ts:8 `isConstraint`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/lowering/properties.ts:6 `lowerValue`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/lowering/resources.ts:6 `themePin`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/lowering/sequence.ts:10 `lowerSequence`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/lowering/views.ts:13 `lowerShows`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/parsing/attributes.ts:10 `readAttributes`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/parsing/cursor.ts:13 `peek`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/parsing/declarations.ts:20 `readDeclaration`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/parsing/document.ts:22 `parseSource`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/parsing/patch.ts:43 `readOperation`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/parsing/references.ts:5 `readIdentity`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/parsing/repetition.ts:5 `repeat`|10|6|7|10|10|10|10|10|10|10|10|10|5|10|10|10|**148**|1|
|core/parsing/value-types.ts:5 `isList`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/parsing/values.ts:17 `readValue`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/patching/blocks.ts:8 `replaceBlock`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/patching/compile.ts:19 `lowerPatch`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/patching/properties.ts:12 `editProperties`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/patching/property-targets.ts:16 `propertyTarget`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/patching/property-values.ts:8 `changedProperties`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/patching/structural.ts:18 `structuralChange`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/patching/targets.ts:5 `findRecord`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/patching/views.ts:7 `editMembership`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/printing/content.ts:7 `printNode`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/printing/document.ts:16 `printCollection`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/printing/geometry.ts:4 `manualSummary`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|2|
|core/printing/layout.ts:8 `printConstraints`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/printing/properties.ts:8 `definition`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/printing/scope.ts:5 `selectScope`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/printing/sequence.ts:8 `printSequence`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/printing/strings.ts:2 `quote`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|0|
|core/printing/values.ts:6 `record`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/printing/views.ts:8 `printSection`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|1|
|core/validation/input.ts:3 `readSource`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/validation/outcomes.ts:8 `reject`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|**146**|2|
|core/vocabulary/constructs.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/vocabulary/defaults.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/vocabulary/description.ts:7 `describeLanguage`|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|**148**|1|
|core/vocabulary/patch-properties.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|core/vocabulary/properties.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|tests/boundaries.test.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|1|
|tests/documents.test.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|0|
|tests/domain-fixture.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|tests/engineering-fixtures.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|**146**|0|
|tests/engineering.test.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|0|
|tests/fixtures.ts:32 `value`|10|6|7|10|10|10|10|10|8|8|10|10|10|10|10|10|**149**|0|
|tests/patches.test.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|0|
|tests/roundtrip.test.ts:1 `declarations/fixtures`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|**151**|1|

Model seam files also reviewed: contract/api/index/types expose only checked operations plus explicit unchecked-stage validity (153/153/146); core/collection/stage.ts shares existing applyOperation semantics and returns typed frozen outcomes (153); core/collection/plan.ts requires final validation and typed outcomes (153). Sonar≤2 and existing Model18 cases remain green. No Model cascade/schema policy was copied into Language.

Static source evidence: 62 TS files, 268 named functions, zero missing docs/return types. Tests:18/5suites. This does not claim CLI/browser implementation.
