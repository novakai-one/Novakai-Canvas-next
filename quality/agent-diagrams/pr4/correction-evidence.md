# PR4 combined correction evidence

One findings-only correction from `1160b0a` in `feat/diagram-arrangement`, using root-verified A1/A2 dispositions. No agents, additional audit/review round, services, browser/E2E, push or PR. Supplied implementation-a1/a2 and CLI receipts are retained as historical evidence.

## Corrections and measured boundary

- `placement/spacing.ts` reserves a scope-local cross floor of `3c + max(source advance, target advance)` over local wires. Existing native checkpoints extend `2c + advance`; the remaining `c` keeps that checkpoint outside an adjacent buffered obstacle. With c=12 and ER advance=23, the justified floor is 59. It is sufficient for this sibling-corridor prerequisite, not a proof of general route feasibility. PR5 owns more economical endpoint-local candidates.
- `placement/groups.ts` contracts every local wire for reservations, then independently selects semantic parent edges for tree ranking. Child-only wires cannot enlarge parent reservations; local direction mapping remains intact. `policy.ts` applies independent cross/flow minima in native and grid paths. Collection scopes pass zero minima, preserving semantic gap. Policy version is now `layout-policy-5`.
- A2 seed assertions compare the complete parent edge ID/source/target. Labelled unequal grids check physical boundary gaps in all four directions while prior membership, history/reset, locks and sequence assertions remain. Seed capture executes real ELK/grid placement, then returns a deliberate test-owned solver rejection before any routing; this is explicitly placement evidence.
- A separate positive helper arranges the original Model-valid parent/annotation tree through real native routing, checks complete wire identity and requires valid independent inspection. It now passes after the correction. The old requirement that routing fail is removed, and the prior build report's acceptance claim is withdrawn.
- Scope and PlacementFactory declarations now document semantics/lifetime. `frames.body` documents actual `LayoutFault` invalid-input propagation and recovery through the public facade. No Result refactor or scoring waiver: existing literal P9=5, P10=8, total146 remain.

## Checks

|Command / evidence|Result|
|---|---|
|Arrangement regressions before production fix|Red: native cross 24 vs46; grid cross 24 vs48|
|`pnpm exec vitest run capability/layout/tests capability/model/tests` after correction|8 files, 35 tests passed|
|`pnpm check` after source/test fixes|Types, ESLint/Sonar≤2, formatting, architecture and 51 files / 172 tests passed|
|Architecture|821 modules / 1,943 dependencies; no violations|
|Threshold-zero ESLint measurement on ten PR4 production files|Actual maxima 0–2, recorded in correction-checks.json; normal threshold2 gate passed|
|Frozen spec count|509 words/57 lines → 602/63, under 610/68|
|Test budget|2 retained new definitions across PR4; one temporary positive native-tree diagnostic folded into the existing test (≤3 during verification)|

Initial formatting/type issues encountered during editing were fixed before the final check. Author file-level evidence is updated in `quality/pr4/standards.md`; all existing literal production totals remain >144. No independent test-fixture grade is invented.

## Exact remaining gates

1. Broader valid-tree/native routing acceptance remains open for PR5 integration; one passing tree fixture and sufficient sibling clearance do not establish all native acceptance. Endpoint-local candidates, fixed-node routing quality and long global outside wires remain PR5-owned; routing source files were untouched.
2. Fresh root-owned DSL/browser acceptance has not run on this correction. Historical CLI evidence remains 20/24: habitat survey, emergency dispatch and equipment return rejected after PR4; payroll was already blocked. None is marked fixed without fresh receipts/inspection. Root owns integration, fresh DSL/browser captures and PR creation.
3. Native test-fixture/boundary grading clarification remains pending as previously recorded. No additional audit round was performed or requested here.

## Single additional sequence alignment — base d55d71f

The user authorized this one extra correction after root observed the actual library-reservation DSL at 1604×1736 with excessive vertical whitespace and 13.7px messages appearing about 7px at fit. This exhausts PR4 additional alignment permission; no new audit/pressure round or further review/fix loop. Earlier auditor findings, dispositions, scoring question and positive valid-tree acceptance are unchanged.

Only `sequence/sequence.ts` changes production behavior. Its local immutable options scale sequenceGap by chosen semantic gap / configured normal gap: 48×24/64=18 compact, 48 normal, 72 roomy. This applies to the initial band, event advance, self-loop gap and nested frame/branch whitespace through the existing context. Existing double-gap event policy remains, now local. Measured label/header/branch width and height, label clearance, frame padding and activation width are untouched; participant constraints, hard locks, placement and native routing are untouched. No fixture IDs or coordinates enter policy. Existing scene inspection regenerates sequence policy, so explicit measured-box and ordering assertions additionally check geometry independently of that equality check.

Existing case 6 now runs compact content and compares normal/roomy geometry, complete ordered event and activation identity, participant order, actual public inspection, measured label extents, path/label separation and a 900×160 measured branch heading. Existing cases retain hard constraints, history, fragments and the original positive native-tree arrange/inspect helper. Zero new test definitions; PR4 retains two.

|Read-only actual DSL, fixture font metrics|Compact bounds|Normal bounds|Roomy bounds|Participants/events/fragments/activations|
|---|---|---|---|---|
|Library reservation|968×1001|1128×1691|1256×2243|5/8/1/2|
|Payment settlement|956×995|1116×1565|1244×2021|5/8/1/3|
|Incident notification|920×1313|1080×2123|1208×2771|5/11/2/4|

All nine native corpus arrangements passed public inspection and exact source event-order/label-size assertions. A temporary standalone harness reused existing Layout fixture measurements and real native engines, with public Language lowering of sibling DSL; the first setup rejected a missing theme role, then complete fixture role aliases resolved setup. These are fixture-font measurements, **not** production-font/browser fit evidence or a replay of root's 1604×1736 measurement. Source hashes and full receipts are in correction-checks.json. Sibling sources were not edited.

Native checks: **8 files / 35 tests passed**. The **single** whole `pnpm check`: **51 files / 172 tests passed**, types/lint/format/architecture green; 821 modules/1,943 dependencies. Threshold-zero diagnostic measured sequence.ts Sonar maximum **1** (expected diagnostic exit1); normal ≤2 gate passed. Source matrix appended below the existing author evidence; no independent fixture grade or scoring reclassification. Doc2 adds exactly “Sequence bands respect local gap.” Final frozen specification: **607 words / 64 lines**, within **610 / 68**.

Remaining risks: root owns production-font/browser fit and readability after integration. Existing cache reuse re-inspects derived sequences; no engine-version change is introduced in this scoped correction. Explicit human placements may limit compactness. Broader PR5 routing acceptance and the existing native-fixture grading question remain open. No agents, service launches, browser, push or PR were used.

Root integration completion of the same sequence alignment: policy version advances to layout-policy-6 so cached pre-alignment geometry cannot match current derivation keys. This is the frozen versioning requirement, not a further audit or correction round.
