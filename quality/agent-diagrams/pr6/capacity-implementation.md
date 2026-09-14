# Capacity implementation evidence

## Boundaries

Presentation owns one immutable projection budget: 32 sections, 1,000 node appearances and 1,500 wires. Producer and transported-reader admission share that aggregate policy. Layout, Canvas and Export receive the same record through declaration-only local bridges. Primitive, route-point, sequence and per-section node/wire bounds remain unchanged. This slice adds no DSL corpus, recipe, browser, panel, style, geometry, route, asset or template behavior.

## Frozen test budget

|#|Test|Tier/type|Cost|Reason for / against|Existing coverage|Retires when|
|---:|---|---|---:|---|---|---|
|1|Presentation producer/reader capacity boundary|fast contract|1.202s|Catches divergent 32/33 and aggregate admission (95%); adds a large fixture to a focused suite (20%)|Existing projection case 10 covers only primitive/input limits|Projection format replaces these limits|
|**TOTAL**|**1 new case**|**fast**|**1.202s**|Within the two-case ceiling||||

Existing Layout scale and forged-input, Canvas malformed-scene, Export allocation and portable-import cases were extended for downstream vectors; they add no cases.

## Results

Producer and reader accept 32 sections and reject 33. Both reject node and wire aggregate overflow distributed across 32 individually bounded sections. Layout derives exactly 1,000 nodes and 1,500 labelled wires across 32 sections in 1.914s. Forged 33-section inputs reject independently in Layout, Canvas, Export artifact allocation and portable manual import.

`pnpm check` passed: typecheck, ESLint, Prettier, dependency-cruiser (815 modules/1,902 dependencies) and 167 tests/51 files. Focused capacity run passed 20 tests/5 files. Exact threshold-zero Sonar measurement found changed-production maxima 0–2. The five PR6 specs remain 565 words/61 lines; no repeat review or specification edit occurred.

Actual commit scope is 14 production files, five extended test files and this evidence file. Pre-existing untracked PR6 specifications and plan-pressure/disposition evidence are excluded from the capacity commit.

## Changed production-file scores

Literal builder scores only; this is not an independent/sample audit. Deductions: O=fixed owned vocabulary/steps (P2=6), L=no subtyping demonstrated (P3=7), E=private structured rejection reaches a typed outer boundary (P9=5), R=recovery named only at the caller (P10=8), T=thin declaration/schema bridge (P11=5), D=existing raster ceiling repeated with PNG (P6=9).

|File|P1|P2|P3|P4|P5|P6|P7|P8|P9|P10|P11|P12|P13|P14|P15|P16|Total|Sonar|Deductions|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
|presentation/contract/records/limits.ts|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152|0|L,T|
|presentation/contract/records/interchange.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|O,L,R,T|
|presentation/contract/index.ts|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153|0|O,L|
|presentation/core/validation/capacity.ts|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|O,L,E|
|presentation/core/projection/collection.ts|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|O,L,E|
|presentation/core/validation/interchange.ts|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|1|O,L,E|
|layout/contract/records/limits.ts|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152|0|L,T|
|layout/contract/records/candidate.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|O,L,R,T|
|layout/core/validation/input.ts|10|6|7|10|10|10|10|10|5|8|10|10|10|10|10|10|146|2|O,L,E,R|
|canvas/contract/records/limits.ts|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152|0|L,T|
|canvas/core/scenes/validate.ts|10|6|7|10|10|10|10|10|5|10|10|10|10|10|10|10|148|2|O,L,E|
|export/contract/records/limits.ts|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152|0|L,T|
|export/contract/records/manual.ts|10|6|7|10|10|10|10|10|10|8|5|10|10|10|10|10|146|0|O,L,R,T|
|export/core/artifacts/produce.ts|10|6|7|10|10|9|10|10|10|10|10|10|10|10|10|10|152|2|O,L,D|

Full SHA-256 values, in table order: `06cca0fc921baecf6196e96143c6e8a894dcca048278651062692a06ecb49dfa`, `5500f4a93ebb12a22acf8290aa68fcc8d5eeefb83a1559bdbe650201796a9baa`, `68ad9421fae44ba946f82bd1d497a658e336eaffbcf8a50d0c305ebf80ca9082`, `16df837ffbab684f2050825be9b3fb0347fd1c0053761afa92b01c2f461e58d0`, `4d6f1ad44a0ba723e32fab0b64765663cf7ca6f3308c28d8fb92f0888a694c28`, `cc0ded0da2de0f046fe1ebcc6a89b737d2310d6ef9c01878c24887c6bdd44718`, `e30233ce7bfa8d774b26257f7d9def42d2796996776a039d53f2cde5875a3203`, `96ff27f60983a9111ef13cc33dbb1d4c85250484aa316b25f594d58dfc8c7ebe`, `ab08cbeed8a1e38b4bffb72a5e4538e7f3cc176034e42702c5836e94c6c10242`, `50308880fb771f3885dfb4873f50bd5876c6b74d41eb787853b08abdac90e1cd`, `43eaa80bf3ac77ac9305491cd18ded53755533718b8b3a4d7af50fbb73f80d31`, `679383ef4706b08f0afe3f3f0307c9736809656e4b57bd8f38db6c558b62aa81`, `6ddbc6c57d24dad42f75e2478c55010819697d54f296d7ab04a0814a454948a9`, `c0c0f351da596f64a6eea9d4c073c2a0c899a3f53055f7ecb9b7335ffcc626d7`.

## Remaining PR6 acceptance

The orchestrator retains the 24-example DSL corpus, recipes, mixed collection, visible-browser evidence, PR3–5 integration, A1/A2 work and final PR6 acceptance. No conclusion about original-corpus acceptance is made by this capacity slice.
