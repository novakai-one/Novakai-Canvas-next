# PR2 post-audit production-file matrix

Literal whole-file judgments under `docs/standards/CODING-STANDARDS.md`, limited to production files changed in this correction round. These are updated author evidence, not a re-audit. LSP is exactly 7 where substitution is not demonstrated; the fixed owned behavior vocabulary caps OCP at 6; private value-returning stages that raise structured faults retain P9=5. Scores are not inferred from passing tests.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|Total|Sonar max|Gate|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
|`capability/design-system/core/themes/diagram.ts`|10|6|7|10|10|10|10|10|5|10|10|10|10|10|9|10|147|2|PASS|
|`capability/presentation/contract/records/style.ts`|10|6|7|10|10|10|10|10|10|8|5|10|10|10|9|10|145|2|PASS|
|`capability/presentation/core/content/signature.ts`|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|
|`capability/presentation/core/projection/node.ts`|10|6|7|10|10|10|10|10|5|10|10|10|10|10|9|10|147|2|PASS|
|`capability/presentation/core/projection/section.ts`|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|

Actual deductions:

- P2 is 6 because adding an owned projection/schema step still requires editing each fixed local vocabulary; no speculative extension seam was introduced.
- P3 is 7 because none of these targets demonstrates substitutable implementations.
- P9 is 5 in the four behavioral core files because private functions raise structured faults behind the named public `Result` boundary, but their own value-returning signatures do not expose that outcome.
- `style.ts` P10 is 8 and P11 is 5 because it is a retry-safe declaration/schema surface with recovery documented on validators, but no executable recovery owner or deep hidden implementation exists in that file.
- P15 is 9 in `diagram.ts`, `style.ts` and `node.ts` because each contains one readable ternary in a function; the literal SOP still requires the one-point deduction.

All other rows had no file-local blemish under the literal anchors. A threshold-zero Sonar probe measured the maxima above after correction; the ordinary full lint gate enforces ≤2.
