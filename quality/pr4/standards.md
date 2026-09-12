# PR4 changed-production-file standards matrix

Author evidence under `docs/standards/CODING-STANDARDS.md`, not an independent audit. Columns P1–P16 follow the rubric order. OCP remains 6 for fixed owned policies; LSP is 7 where substitution is absent. Thin declaration records receive P11=5 and P10=8. Private structured rejection behind Layout's typed facade receives P9=5/P10=8. These literal deductions are retained; green checks do not erase them.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|Total|Sonar|max evidence|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
|`layout/adapters/elk.ts`|10|6|10|10|10|10|10|10|10|10|10|10|10|10|10|10|156|1|Typed adapter catches native faults; narrow port; job-local graph; separate real native acceptance|
|`layout/contract/records/engines.ts`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|One immutable version authority; thin declaration; no callable recovery surface|
|`layout/contract/records/problem.ts`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|Readonly engine DTOs; field TSDoc; no behavior, cast, I/O or host type|
|`layout/core/arrangement/collection.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153|2|Existing typed recovery entry; one renamed seed field; locks/history unchanged|
|`layout/core/placement/grid.ts`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|7|10|148|2|Pure measured tracks; explicit axis-gap map; two retained reverse-coordinate ternaries|
|`layout/core/placement/groups.ts`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|2|Bottom-up local scopes; immediate structured rejection bridge; pure contracted edges|
|`layout/core/placement/policy.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153|2|Typed Result/recovery entry; placement seam; independent values computed once|
|`layout/core/placement/spacing.ts`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|151|1|Pure local measured reservation; fixed policy vocabulary; caller owns recovery|
|`layout/core/sequence/frames.ts`|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|1|Measured immutable frame assembly; structured private rejection behind facade|
|`model/core/sections/modes.ts`|10|6|7|10|10|10|10|10|10|10|9|10|10|10|10|10|152|1|Prior whole-file score retained; only typed compatibility data changed|

All ten totals are **>144/160**. The threshold-zero ESLint probe measured the displayed maxima; normal `pnpm check` enforced the required ceiling of 2. Every changed/introduced production function has an explicit return type and direct responsibility documentation; no `any`, unchecked cast, ambient service, shared mutable state or new extension framework was introduced.
