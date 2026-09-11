# Capability: library — Build / acceptance appendix

| Step | Exit evidence |
|---|---|
| 1. Contracts/gates | Exact schemas, public boundary, documented result types; type/lint/architecture scripts include Library |
| 2. Catalog validity/planning | L01–L09/L13; complete atomic candidate; no I/O; source version provenance |
| 3. Discovery | L10–L12: folder/archive filtering, title/content search, unplaced objects, recents, stable pagination |
| 4. Verification | Frozen tests below; static checks and Model regression suite; no E2E |
| 5. Audits/PR | One plan pressure test; two implementation auditors; one verified fix round after each stage; separate PR |

## Frozen test budget

Existing Library coverage: none (scaffold). Eight named public-contract tests; related counterexamples stay inside their assigned test. Assertions independently authored, no snapshots of private helpers. No coverage target. Costs estimates; confidence reflects judgment, not measured probability.

| # | Test | Tier/type | Loop/nightly s | Maintenance | Reason for + confidence | Reason against + confidence | Already covered | Retires when |
|---|---|---|---:|---|---|---|---|---|
| 1 | validate catalog and inventory identities | fast/contract | .03/.03 | low | Prevents duplicate/orphan membership (90%) | Fixture upkeep (20%) | none | Catalog contract removed |
| 2 | validate containment and projection references | fast/contract | .03/.03 | medium | Prevents cycles, vanished sections and invalid visits (90%) | Multiple related cases (25%) | none | Owned contracts removed |
| 3 | plan ordered immutable catalog changes | fast/contract | .03/.03 | medium | Prevents partial writes and revision mutation (90%) | Fixture upkeep (20%) | none | Planner removed |
| 4 | coordinate inventory registration and deletion | fast/contract | .03/.03 | medium | Prevents cross-record catalog divergence (90%) | Integration later adds coverage (30%) | none | Atomic ownership changes |
| 5 | remove folders only with explicit rehome | fast/contract | .03/.03 | low | Prevents hidden data deletion (95%) | Small policy (20%) | none | Folder removal removed |
| 6 | search visible and unplaced content by scope | fast/contract | .03/.03 | medium | Prevents lost search results/archive leaks (90%) | Projection fixtures (25%) | none | Search replaced |
| 7 | paginate stable ordering and reject stale cursors | fast/contract | .03/.03 | medium | Prevents mixed-revision pages (90%) | Cursor contract upkeep (25%) | none | Cursor contract replaced |
| 8 | serve recent/title discovery through two consumers | fast/contract | .03/.03 | low | Prevents host-specific assumptions/mutated results (85%) | Overlaps immutability checks (30%) | test 3 partial | Public discovery removed |
| **Fast subtotal / TOTAL** | **8 tests** | | **.24/.24** | | | | | |
| **Slow/guard subtotal** | **0 tests** | | **0/0** | | | | | |

Malformed shapes/bounds and emitted-cursor limits belong to tests 1/2/7. Test 3 includes identical replacement and change-then-revert no-ops; projection-only changes leave changed=false. Diagnostic assertions check code and path; success assertions check independent IDs/order/archive/source versions, not just ok=true. Two consumers are in-process browser/CLI-shaped harnesses; actual host integration belongs to later UI/Language work and is not claimed here.

## Bounded reviews

Record words/lines before plan reviewer. One fresh-context reviewer, 8-minute timeout, capability-only; findings table categories engineering violation / major build risk / preference / minor. One independently verified fix round; words and lines per doc and total <=120% of baseline. No second plan audit.

A1 implementation fidelity/coding patterns: sample ceil(10% of source files), min1/max5, varied contract/core roles; read collaborators within Library only. A2 assertion correctness: three test files, attempt up to three incorrect-assertion scenarios. Each has 8 minutes. One verified fix round, audit findings only; rerun relevant checks, no repeated audit. Every source file receives separate author evidence >144/160; Sonar <=2. Tests use public index only. No E2E.
