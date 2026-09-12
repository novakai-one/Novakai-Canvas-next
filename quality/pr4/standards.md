# PR4 changed-production-file standards matrix

Author evidence under `docs/standards/CODING-STANDARDS.md`, not an independent audit. Columns P1–P16 follow the rubric order. OCP remains 6 for fixed owned policies; LSP is 7 where substitution is absent. Thin declaration records receive P11=5 and P10=8. Private structured rejection behind Layout's typed facade receives P9=5/P10=8. These literal deductions are retained; green checks do not erase them.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|Total|Sonar|max evidence|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
|`layout/adapters/elk.ts`|10|6|10|10|10|10|10|10|10|10|10|10|10|10|10|10|156|1|Typed adapter catches native faults; narrow port; job-local graph; separate real native acceptance|
|`layout/contract/records/engines.ts`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|One immutable version authority; thin declaration; no callable recovery surface|
|`layout/contract/records/problem.ts`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|Readonly engine DTOs; field TSDoc; no behavior, cast, I/O or host type|
|`layout/core/arrangement/collection.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153|2|Existing typed recovery entry; one renamed seed field; locks/history unchanged|
|`layout/core/placement/grid.ts`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|7|10|148|2|Pure measured tracks; explicit axis-gap map; two retained reverse-coordinate ternaries|
|`layout/core/placement/groups.ts`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|2|groups.ts:78/103/147: local reservations separated from parent ranking; structured rejection bridge|
|`layout/core/placement/policy.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153|2|Typed Result/recovery entry; placement seam; Scope TSDoc; both seed paths independently bound local axes|
|`layout/core/placement/spacing.ts`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|151|1|spacing.ts:8/37/51: local measured flow/cross bounds; labels excluded from cross floor; fixed policy|
|`layout/core/sequence/frames.ts`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|1|frames.ts:19/24/89: actual LayoutFault/facade recovery documented; literal P9=5 and P10=8 retained|
|`model/core/sections/modes.ts`|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|152|1|Prior whole-file score retained; only typed compatibility data changed|

All ten totals are **>144/160**. The threshold-zero ESLint probe measured the displayed maxima; normal `pnpm check` enforced the required ceiling of 2. Every changed/introduced production function has an explicit return type and direct responsibility documentation; no `any`, unchecked cast, ambient service, shared mutable state or new extension framework was introduced.

Correction verification remeasured the same maxima with ESLint threshold 0; all remain ≤2 under the enforced threshold. The existing literal 16-principle scores remain unchanged (minimum 146); TSDoc is not a Result-type waiver. `elk.ts:16` names factory invocation/lifetime; `policy.ts:13` names local scope semantics. This is amended author evidence, not another audit or test-fixture grade.

## Authorized sequence alignment author evidence

This adds the newly changed production file to the existing matrix; it is not another audit round. Earlier scores/findings and the unresolved native test-fixture grading question are unchanged.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|Total|Sonar|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|`layout/core/sequence/sequence.ts`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|1|

Line evidence in sequence.ts: P1/P11 lines12–44 assemble complete measured sequence geometry behind one entry; P2 lines22–38 own fixed policy/steps without an extension seam (**6**); P3 lines12–17 have no subtyping (**7, not demonstrated**). P4 lines26–38 pass data records to directly owned core collaborators, no fat method port; P5 imports1–7 use own declaration-only types and own core only. P6 line24 centralizes semantic normalization once; P7/P8 lines18–44 retain one early return and a local options copy, no new helper/framework. P9 lines33/38 propagate structured LayoutFault outside this private return signature (**5**); P10 lines8–10 name public facade/Authoring recovery but retain the existing conservative pure-helper **8**, without reclassifying the prior scoring question. P12 lines33–42 use direct calls and data fields; P13 lines20–32 copy immutable data; P14 lines12–43 have explicit return types, no any or casts. P15 line18 is one guard, measured Sonar **1**; P16 inputs12–16 carry all data/metrics/options with no ambient clock, filesystem or service. The three principal deductions remain fixed-policy OCP, absent LSP evidence and untyped private fault propagation.

Existing arrangement.test.ts case 6 and owned assertion helpers changed; real native checks and the single whole check pass. No independent test-fixture score is invented, and the existing boundary/grading question remains pending. No production exception is claimed.
