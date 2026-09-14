# PR2 extra-realignment changed-file matrix

Literal whole-file judgments under `docs/standards/CODING-STANDARDS.md`, limited to the two first-party source files changed in this realignment. These are updated author evidence, not a new audit. The fixed owned behavior vocabulary keeps OCP at 6; substitution remains undemonstrated, so LSP is exactly 7; private value-returning measurement stages keep P9 at 5. Scores are not inferred from passing tests.

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|Total|Sonar max|Gate|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
|`capability/presentation/core/content/signature.ts`|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|PASS|
|`capability/presentation/tests/projection.test.ts`|10|6|7|10|10|10|10|10|8|10|9|10|10|10|10|10|150|2|PASS|

Actual deductions:

- P2 is 6 because extending either fixed lexical policy or fixed scenario set still requires editing its owning file; no speculative extension seam was introduced.
- P3 is 7 because neither target demonstrates substitutable implementations.
- P9 is 5 in `signature.ts` because its private value-returning measurement stages raise structured faults behind the named public `Result` projection boundary.
- P9 is 8 in `projection.test.ts` because assertion failures intentionally report through Vitest rather than a typed test outcome.
- P11 is 9 in `projection.test.ts` because it is necessarily a broad public-projection scenario file rather than a deep hidden implementation.

All other rows had no file-local blemish under the literal anchors. Every new named helper has responsibility TSDoc and an explicit return type. A threshold-zero scoped Sonar probe measured the maxima above; the normal lint rule enforces the required maximum of 2.
