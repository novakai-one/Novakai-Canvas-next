# PR2 author evidence — literal file-local rubric

This is implementation self-evidence requested for PR2, not A1/A2 or a new independent audit. Scores apply to the whole changed file, including pre-existing code. LSP is exactly 7 where substitution is not demonstrated; fixed extension axes cap OCP at 6. Private helpers returning values while raising distinguishable faults receive P9=5. Automation establishes complexity and checks, not principle scores. No score is copied forward from an earlier certification.

Concrete retained findings: [unchecked bundle decoding](../../../capability/export/tests/fixtures.ts:433), [mutable lease counter](../../../capability/export/tests/fixtures.ts:405), [font filesystem reads](../../../capability/export/tests/fixtures.ts:59), [native initialization](../../../capability/export/tests/fixtures.ts:76), and [native Layout fixture setup](../../../capability/layout/tests/fixtures.ts:226). These are findings in the whole target files, not defects introduced by the constructor migration.

**Gate incomplete:** the constructor-only Layout and Export fixtures retain existing testability/failure/immutability/type-safety deductions. The allowlist does not authorize redesigning those helpers. Passing tests do not waive this gate. Orchestrator owns disposition, A1/A2 and browser acceptance.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|Total|Sonar max|Gate|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts)|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|
|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css)|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148|no functions|PASS|
|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css)|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148|no functions|PASS|
|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css)|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148|no functions|PASS|
|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts)|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148|0|PASS|
|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts)|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|PASS|
|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts)|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|PASS|
|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts)|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|2|PASS|
|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts)|10|6|7|10|10|10|10|10|8|10|9|10|10|10|10|10|150|1|PASS|
|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json)|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148|no functions|PASS|
|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts)|10|6|7|10|10|9|10|10|5|8|10|10|5|5|10|5|130|1|BLOCKED|
|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts)|10|6|7|10|10|10|10|10|8|8|10|10|10|10|10|5|144|1|BLOCKED|
|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx)|10|6|7|10|10|10|10|10|8|8|10|10|10|10|10|10|149|1|PASS|
|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts)|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148|0|PASS|
|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts)|10|6|7|10|10|10|10|10|10|8|9|10|10|10|10|10|150|2|PASS|
|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts)|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|2|PASS|
|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts)|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|1|PASS|
|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts)|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|2|PASS|
|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts)|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|
|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts)|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|
|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts)|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|1|PASS|
|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts)|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|151|1|PASS|
|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts)|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|
|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts)|10|6|7|10|10|9|10|10|5|10|10|10|10|10|10|10|147|2|PASS|
|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts)|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|1|PASS|
|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts)|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|
|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts)|10|10|7|10|10|10|10|10|8|8|10|10|10|10|10|5|148|1|PASS|
|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts)|10|6|7|10|10|10|10|10|8|10|9|10|10|10|10|10|150|2|PASS|
|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts)|10|6|7|10|10|10|10|10|8|10|9|10|10|10|10|10|150|1|PASS|

## apps/service/adapters/render-jobs.ts

Private font/asset/create helpers throw RenderResourceFault or Zod errors without Result return types; createRenderJobs catches them. Constructor migration only.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Adapts pinned owner resources into a rendering job.|
|2. OCP|6|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Private font/asset/create helpers throw RenderResourceFault or Zod errors without Result return types; createRenderJobs catches them. Constructor migration only.|
|10. Idempotency & failure semantics|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[apps/service/adapters/render-jobs.ts](../../../apps/service/adapters/render-jobs.ts:45) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/design-system/adapters/styles/preferences.generated.css

Declarative compiler output has thin behavior; fixed emitted token vocabulary caps OCP. Runtime scopes and cascade layers remain in their existing owners.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Serializes centrally compiled typography tokens into scoped CSS.|
|2. OCP|6|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|5|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Declarative compiler output has thin behavior; fixed emitted token vocabulary caps OCP. Runtime scopes and cascade layers remain in their existing owners.|
|12. Law of Demeter|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Observed maximum Sonar complexity: no functions; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/adapters/styles/preferences.generated.css](../../../capability/design-system/adapters/styles/preferences.generated.css:111) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/design-system/adapters/styles/semantics.generated.css

Declarative compiler output has thin behavior; fixed emitted token vocabulary caps OCP. Runtime scopes and cascade layers remain in their existing owners.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Serializes centrally compiled typography tokens into scoped CSS.|
|2. OCP|6|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|5|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Declarative compiler output has thin behavior; fixed emitted token vocabulary caps OCP. Runtime scopes and cascade layers remain in their existing owners.|
|12. Law of Demeter|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Observed maximum Sonar complexity: no functions; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/adapters/styles/semantics.generated.css](../../../capability/design-system/adapters/styles/semantics.generated.css:48) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/design-system/adapters/styles/themes.generated.css

Declarative compiler output has thin behavior; fixed emitted token vocabulary caps OCP. Runtime scopes and cascade layers remain in their existing owners.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Serializes centrally compiled typography tokens into scoped CSS.|
|2. OCP|6|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|5|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Declarative compiler output has thin behavior; fixed emitted token vocabulary caps OCP. Runtime scopes and cascade layers remain in their existing owners.|
|12. Law of Demeter|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Observed maximum Sonar complexity: no functions; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/adapters/styles/themes.generated.css](../../../capability/design-system/adapters/styles/themes.generated.css:111) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/design-system/contract/generated/token-names.ts

Generated literal names provide a controlled declaration surface; no hidden algorithm or substitutable implementation exists in this file.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Publishes compiler-generated token names.|
|2. OCP|6|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|5|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Generated literal names provide a controlled declaration surface; no hidden algorithm or substitutable implementation exists in this file.|
|12. Law of Demeter|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Observed maximum Sonar complexity: 0; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/contract/generated/token-names.ts](../../../capability/design-system/contract/generated/token-names.ts:1) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/design-system/contract/records/theme.ts

Declaration-only shapes cannot enforce numeric invariants; Presentation validates the projected record. No runtime body is hidden here.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Declares portable theme and typography records.|
|2. OCP|6|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|8|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Declaration-only shapes cannot enforce numeric invariants; Presentation validates the projected record. No runtime body is hidden here.|
|11. Deep module / information hiding|5|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Declaration-only shapes cannot enforce numeric invariants; Presentation validates the projected record. No runtime body is hidden here.|
|12. Law of Demeter|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Observed maximum Sonar complexity: 0; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/contract/records/theme.ts](../../../capability/design-system/contract/records/theme.ts:36) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/design-system/contract/types.ts

A narrow declaration surface, not a behavioral module; fixed interface expansion requires editing this file.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Publishes the Design System service and data types.|
|2. OCP|6|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|8|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — A narrow declaration surface, not a behavioral module; fixed interface expansion requires editing this file.|
|11. Deep module / information hiding|5|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — A narrow declaration surface, not a behavioral module; fixed interface expansion requires editing this file.|
|12. Law of Demeter|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Observed maximum Sonar complexity: 0; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/contract/types.ts](../../../capability/design-system/contract/types.ts:8) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/design-system/core/themes/diagram.ts

Private rejection uses the owning public token boundary but is absent from the value-returning signature. Fixed projection roles/steps cap OCP.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Resolves and projects pinned diagram tokens.|
|2. OCP|6|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Private rejection uses the owning public token boundary but is absent from the value-returning signature. Fixed projection roles/steps cap OCP.|
|10. Idempotency & failure semantics|8|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Private rejection uses the owning public token boundary but is absent from the value-returning signature. Fixed projection roles/steps cap OCP.|
|11. Deep module / information hiding|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Observed maximum Sonar complexity: 2; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/core/themes/diagram.ts](../../../capability/design-system/core/themes/diagram.ts:88) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/design-system/tests/themes.test.ts

Assertions and fixture setup report through Vitest; setup/native exceptions are not typed results. Fixed acceptance cases are an owned extension axis.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Verifies theme interoperability and rejection.|
|2. OCP|6|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|8|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Assertions and fixture setup report through Vitest; setup/native exceptions are not typed results. Fixed acceptance cases are an owned extension axis.|
|10. Idempotency & failure semantics|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|9|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Assertions and fixture setup report through Vitest; setup/native exceptions are not typed results. Fixed acceptance cases are an owned extension axis.|
|12. Law of Demeter|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/tests/themes.test.ts](../../../capability/design-system/tests/themes.test.ts:76) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **150/160 — PASS**.

## capability/design-system/tokens/semantics.tokens.json

Declarative sum/reference recipes are checked by the compiler. Thin data policy does not earn deep-behavior points.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Defines canonical semantic token recipes.|
|2. OCP|6|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|5|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Declarative sum/reference recipes are checked by the compiler. Thin data policy does not earn deep-behavior points.|
|12. Law of Demeter|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Observed maximum Sonar complexity: no functions; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/design-system/tokens/semantics.tokens.json](../../../capability/design-system/tokens/semantics.tokens.json:357) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/export/tests/fixtures.ts

BLOCKER: bundle returns unchecked JSON.parse data; releaseCount mutates closure state; pinnedFonts/startRaster/fixture read filesystem/native resources. These pre-existing behaviors are outside the constructor-only migration allowance.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Composes a real export fixture and corruption helpers.|
|2. OCP|6|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|9|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — BLOCKER: bundle returns unchecked JSON.parse data; releaseCount mutates closure state; pinnedFonts/startRaster/fixture read filesystem/native resources. These pre-existing behaviors are outside the constructor-only migration allowance.|
|7. KISS|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — BLOCKER: bundle returns unchecked JSON.parse data; releaseCount mutates closure state; pinnedFonts/startRaster/fixture read filesystem/native resources. These pre-existing behaviors are outside the constructor-only migration allowance.|
|10. Idempotency & failure semantics|8|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — BLOCKER: bundle returns unchecked JSON.parse data; releaseCount mutates closure state; pinnedFonts/startRaster/fixture read filesystem/native resources. These pre-existing behaviors are outside the constructor-only migration allowance.|
|11. Deep module / information hiding|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|5|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — BLOCKER: bundle returns unchecked JSON.parse data; releaseCount mutates closure state; pinnedFonts/startRaster/fixture read filesystem/native resources. These pre-existing behaviors are outside the constructor-only migration allowance.|
|14. Type safety|5|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — BLOCKER: bundle returns unchecked JSON.parse data; releaseCount mutates closure state; pinnedFonts/startRaster/fixture read filesystem/native resources. These pre-existing behaviors are outside the constructor-only migration allowance.|
|15. Cognitive complexity|10|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|5|[capability/export/tests/fixtures.ts](../../../capability/export/tests/fixtures.ts:258) — BLOCKER: bundle returns unchecked JSON.parse data; releaseCount mutates closure state; pinnedFonts/startRaster/fixture read filesystem/native resources. These pre-existing behaviors are outside the constructor-only migration allowance.|

Total **130/160 — BLOCKED**.

## capability/layout/tests/fixtures.ts

Native wasm/placement/solver setup is required; result-unwrapping assertions remain outside typed outcomes. Constructor-only allowance prevents broad fixture redesign.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Composes controlled projections and native layout engines.|
|2. OCP|6|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|8|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Native wasm/placement/solver setup is required; result-unwrapping assertions remain outside typed outcomes. Constructor-only allowance prevents broad fixture redesign.|
|10. Idempotency & failure semantics|8|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Native wasm/placement/solver setup is required; result-unwrapping assertions remain outside typed outcomes. Constructor-only allowance prevents broad fixture redesign.|
|11. Deep module / information hiding|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|5|[capability/layout/tests/fixtures.ts](../../../capability/layout/tests/fixtures.ts:34) — Native wasm/placement/solver setup is required; result-unwrapping assertions remain outside typed outcomes. Constructor-only allowance prevents broad fixture redesign.|

Total **144/160 — BLOCKED**.

## capability/presentation/adapters/react/ContentBlocks.tsx

React infrastructure failures reach the shared renderer boundary; this entry does not name recovery. Closed primitive dispatch caps OCP.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Renders measured primitives using shared SVG markup.|
|2. OCP|6|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|8|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — React infrastructure failures reach the shared renderer boundary; this entry does not name recovery. Closed primitive dispatch caps OCP.|
|10. Idempotency & failure semantics|8|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — React infrastructure failures reach the shared renderer boundary; this entry does not name recovery. Closed primitive dispatch caps OCP.|
|11. Deep module / information hiding|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/adapters/react/ContentBlocks.tsx](../../../capability/presentation/adapters/react/ContentBlocks.tsx:24) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **149/160 — PASS**.

## capability/presentation/contract/index.ts

Exports provide real boundary hiding but contain thin behavior; adding a public symbol edits this file.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Controls the public Presentation export surface.|
|2. OCP|6|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|5|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Exports provide real boundary hiding but contain thin behavior; adding a public symbol edits this file.|
|12. Law of Demeter|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Observed maximum Sonar complexity: 0; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/contract/index.ts](../../../capability/presentation/contract/index.ts:4) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/presentation/contract/records/style.ts

safeParse gives typed validation; raw schema parse is an explicit rejecting reader. The declaration names validation, not retained-scene recovery.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Validates immutable style, font, and asset records.|
|2. OCP|6|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|8|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — safeParse gives typed validation; raw schema parse is an explicit rejecting reader. The declaration names validation, not retained-scene recovery.|
|11. Deep module / information hiding|9|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — safeParse gives typed validation; raw schema parse is an explicit rejecting reader. The declaration names validation, not retained-scene recovery.|
|12. Law of Demeter|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Observed maximum Sonar complexity: 2; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/contract/records/style.ts](../../../capability/presentation/contract/records/style.ts:25) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **150/160 — PASS**.

## capability/presentation/core/content/blocks.ts

Registered content dispatch is readable but new kinds still change the registry. Private failures travel through public project rather than the value signature.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Dispatches semantic blocks to local measurements.|
|2. OCP|6|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Registered content dispatch is readable but new kinds still change the registry. Private failures travel through public project rather than the value signature.|
|10. Idempotency & failure semantics|8|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Registered content dispatch is readable but new kinds still change the registry. Private failures travel through public project rather than the value signature.|
|11. Deep module / information hiding|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Observed maximum Sonar complexity: 2; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/content/blocks.ts](../../../capability/presentation/core/content/blocks.ts:27) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/presentation/core/content/fields.ts

Provider failures are distinguishable private outcomes, absent from this signature. Entry comments describe anchors without naming scene recovery.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Measures aligned field columns and row anchors.|
|2. OCP|6|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Provider failures are distinguishable private outcomes, absent from this signature. Entry comments describe anchors without naming scene recovery.|
|10. Idempotency & failure semantics|8|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Provider failures are distinguishable private outcomes, absent from this signature. Entry comments describe anchors without naming scene recovery.|
|11. Deep module / information hiding|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/content/fields.ts](../../../capability/presentation/core/content/fields.ts:36) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/presentation/core/content/media.ts

Private parse/requireValue rejection is not in the return type; the entry names missing assets but not retained-scene recovery.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Resolves admitted media into bounded centered slots.|
|2. OCP|6|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Private parse/requireValue rejection is not in the return type; the entry names missing assets but not retained-scene recovery.|
|10. Idempotency & failure semantics|8|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Private parse/requireValue rejection is not in the return type; the entry names missing assets but not retained-scene recovery.|
|11. Deep module / information hiding|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Observed maximum Sonar complexity: 2; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/content/media.ts](../../../capability/presentation/core/content/media.ts:8) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/presentation/core/content/signature.ts

Named public projection translates private provider failures; the returned value type itself does not expose failure. Fixed lexical policy caps OCP.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Wraps callable lexical groups and atomic members.|
|2. OCP|6|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Named public projection translates private provider failures; the returned value type itself does not expose failure. Fixed lexical policy caps OCP.|
|10. Idempotency & failure semantics|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/content/signature.ts](../../../capability/presentation/core/content/signature.ts:66) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/presentation/core/content/sizing.ts

Public projection owns rejection. Structured-kind membership is fixed and requires editing to extend, so OCP is capped.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Plans intrinsic interior width from visible content.|
|2. OCP|6|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Public projection owns rejection. Structured-kind membership is fixed and requires editing to extend, so OCP is capped.|
|10. Idempotency & failure semantics|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/content/sizing.ts](../../../capability/presentation/core/content/sizing.ts:35) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/presentation/core/content/table.ts

Private metric failures are absent from the return type. Fixed measurement steps cap OCP; the entry describes width behavior rather than recovery.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Measures intrinsic table columns and aligned rows.|
|2. OCP|6|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Private metric failures are absent from the return type. Fixed measurement steps cap OCP; the entry describes width behavior rather than recovery.|
|10. Idempotency & failure semantics|8|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Private metric failures are absent from the return type. Fixed measurement steps cap OCP; the entry describes width behavior rather than recovery.|
|11. Deep module / information hiding|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/content/table.ts](../../../capability/presentation/core/content/table.ts:69) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/presentation/core/notation/wires.ts

Pure mapping has no failure effect; entry docs do not name a recovery owner. Closed marker/operator vocabulary caps OCP.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Maps canonical relationships and sequence operators to notation.|
|2. OCP|6|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Validation supplies safeParse outcomes, or this declarative/pure target has no operational failure path.|
|10. Idempotency & failure semantics|8|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Pure mapping has no failure effect; entry docs do not name a recovery owner. Closed marker/operator vocabulary caps OCP.|
|11. Deep module / information hiding|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/notation/wires.ts](../../../capability/presentation/core/notation/wires.ts:62) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **151/160 — PASS**.

## capability/presentation/core/projection/collection.ts

Private reader/provider failures are not in the value return; public project catches them and Authoring retains prior state.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Builds one detached measured collection proposal.|
|2. OCP|6|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Private reader/provider failures are not in the value return; public project catches them and Authoring retains prior state.|
|10. Idempotency & failure semantics|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/projection/collection.ts](../../../capability/presentation/core/projection/collection.ts:22) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/presentation/core/projection/node.ts

Ordinary/represented node record assembly repeats frame metadata (DRY deduction). Public project and Authoring are named; private failures remain absent from the helper signature.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Projects appearance and represented-container content.|
|2. OCP|6|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|9|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Ordinary/represented node record assembly repeats frame metadata (DRY deduction). Public project and Authoring are named; private failures remain absent from the helper signature.|
|7. KISS|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Ordinary/represented node record assembly repeats frame metadata (DRY deduction). Public project and Authoring are named; private failures remain absent from the helper signature.|
|10. Idempotency & failure semantics|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Observed maximum Sonar complexity: 2; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/projection/node.ts](../../../capability/presentation/core/projection/node.ts:136) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **147/160 — PASS**.

## capability/presentation/core/projection/section.ts

Fixed orchestration steps and private value-returning failures remain; the entry does not name retained-scene recovery.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Projects section titles, nodes and annotations.|
|2. OCP|6|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Fixed orchestration steps and private value-returning failures remain; the entry does not name retained-scene recovery.|
|10. Idempotency & failure semantics|8|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Fixed orchestration steps and private value-returning failures remain; the entry does not name retained-scene recovery.|
|11. Deep module / information hiding|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/projection/section.ts](../../../capability/presentation/core/projection/section.ts:49) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **146/160 — PASS**.

## capability/presentation/core/projection/supplement.ts

Entry names resource restoration on failure. Value-returning helpers use the public boundary, not a local Result return.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Measures supplemental fragment branch headings.|
|2. OCP|6|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|5|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Entry names resource restoration on failure. Value-returning helpers use the public boundary, not a local Result return.|
|10. Idempotency & failure semantics|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/core/projection/supplement.ts](../../../capability/presentation/core/projection/supplement.ts:23) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **148/160 — PASS**.

## capability/presentation/tests/fixtures.ts

Fixture readers/assets are replaceable; default font IO still requires actual local resources. Assertions report outside typed fixture return signatures.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Supplies checked semantic fixtures and exact font bytes.|
|2. OCP|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Existing fixture parameters replace the owned resource/context inputs without altering fixture policy.|
|3. LSP|7|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|8|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Fixture readers/assets are replaceable; default font IO still requires actual local resources. Assertions report outside typed fixture return signatures.|
|10. Idempotency & failure semantics|8|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Fixture readers/assets are replaceable; default font IO still requires actual local resources. Assertions report outside typed fixture return signatures.|
|11. Deep module / information hiding|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Local measurement/rendering/composition hides its concrete steps behind the existing public operation.|
|12. Law of Demeter|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|5|[capability/presentation/tests/fixtures.ts](../../../capability/presentation/tests/fixtures.ts:42) — Fixture readers/assets are replaceable; default font IO still requires actual local resources. Assertions report outside typed fixture return signatures.|

Total **148/160 — PASS**.

## capability/presentation/tests/projection.test.ts

Assertions intentionally report via Vitest; fixed scenarios require editing. Existing definitions/assertions remain and independent vectors extend them.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Exercises measured semantics through the public API.|
|2. OCP|6|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|8|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Assertions intentionally report via Vitest; fixed scenarios require editing. Existing definitions/assertions remain and independent vectors extend them.|
|10. Idempotency & failure semantics|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|9|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Assertions intentionally report via Vitest; fixed scenarios require editing. Existing definitions/assertions remain and independent vectors extend them.|
|12. Law of Demeter|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Observed maximum Sonar complexity: 2; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/tests/projection.test.ts](../../../capability/presentation/tests/projection.test.ts:42) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **150/160 — PASS**.

## capability/presentation/tests/rendering.test.ts

Assertions intentionally report through Vitest. Fixed rendering scenarios cap OCP; new byte-parity vectors use the existing definition.

|Literal principle|Score|File-local evidence|
|---|---:|---|
|1. SRP|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Verifies exact shared markup, font bytes and shape containment.|
|2. OCP|6|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Fixed owned vocabulary/steps require editing this file; no speculative extension framework was added.|
|3. LSP|7|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — No substitutable implementation is demonstrated in this target; fixed rubric score 7.|
|4. ISP|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Consumed callable seams are narrow; record-field access does not create unused interface methods.|
|5. DIP|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Imports follow the capability boundary; core consumes owned records/ports and tests explicitly compose their providers.|
|6. DRY|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Authored metric/slot policy has one production authority; constructor literals are explicit independent test inputs.|
|7. KISS|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Named stages and direct record assembly; no nested ternary or conditional object-spread return idioms found.|
|8. YAGNI|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Only frozen typography, structured content, slots or constructor/verification changes; no speculative feature surface.|
|9. Typed error outcomes|8|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Assertions intentionally report through Vitest. Fixed rendering scenarios cap OCP; new byte-parity vectors use the existing definition.|
|10. Idempotency & failure semantics|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Pure/repeatable projection or deterministic test setup; named caller/runner retains recovery responsibility.|
|11. Deep module / information hiding|9|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Assertions intentionally report through Vitest. Fixed rendering scenarios cap OCP; new byte-parity vectors use the existing definition.|
|12. Law of Demeter|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Reads direct collaborator records; no object-navigation mutation chains found.|
|13. Immutability|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Readonly records, const locals and copied arrays; no cross-call mutable state introduced or found in this target.|
|14. Type safety|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Checked schemas/results or typed declarations; no unchecked assertion or any escape found in the target. Literal as-const discriminants are not unchecked widening.|
|15. Cognitive complexity|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Observed maximum Sonar complexity: 1; no named bad readability idiom found. The repository gate remains 2.|
|16. Testability|10|[capability/presentation/tests/rendering.test.ts](../../../capability/presentation/tests/rendering.test.ts:33) — Pure inputs, consumer-owned providers or explicit fixtures make behavior repeatable without ambient clock/network state.|

Total **150/160 — PASS**.
