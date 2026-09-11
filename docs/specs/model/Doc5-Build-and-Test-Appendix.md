---
custom-width: 100
---
# Capability: model — Build / acceptance appendix

| Build step | Exit evidence |
|---|---|
| 1. Contracts + gates | strict TS; pinned compatible dependencies; restricted imports; package exports and cycle check; builder standards examples |
| 2. Validation | schema + M01–M15 through public API; explicit bad-state diagnostics |
| 3. Planning | M16–M18; typed operations; immutable candidate/impact; no persistence side effect |
| 4. Fast verification | exact budget below; typecheck/lint/architecture/tests all pass; no browser/server/E2E |
| 5. Bounded audits | one plan reviewer; one implementation fidelity reviewer and one test-correctness reviewer; one verified-finding fix round per stage |

## Frozen test budget

Existing coverage: none; repository contained only scaffold markers at planning. Each row is one named `test` with related cases inside it, through public index. Fixtures independently authored; assertions specify outcomes, IDs and retained/removed content, not implementation helper output. No snapshots, timing sleeps, coverage target or E2E. Costs are estimates.

| # | Test name | Tier | Type | Loop s | Nightly s | Maintenance | Reason for + confidence | Reason against + confidence | Already covered | Retires when |
|---|---|---|---|---:|---:|---|---|---|---|---|
| 1 | accept empty and mixed collection | fast | contract | .03 | .03 | medium | Catches shape defaults, all supported records (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 2 | reject malformed and excessive inputs | fast | contract | .03 | .03 | medium | Catches unknown fields/version, cycles/depth/size (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 3 | enforce scoped identities | fast | contract | .03 | .03 | medium | Catches duplicate IDs including rows and ports (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 4 | resolve references and roles | fast | contract | .03 | .03 | medium | Catches dangling asset/source/link/theme role (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 5 | validate endpoint types | fast | contract | .03 | .03 | medium | Catches member addressability and relationship kind (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 6 | validate ER keys | fast | contract | .03 | .03 | medium | Catches FK targets, composite order/arity/types (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 7 | validate content payloads | fast | contract | .03 | .03 | medium | Catches table width and content placement (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 8 | validate groups and visible wires | fast | contract | .03 | .03 | medium | Catches cycles, duplicate representation, local endpoints (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 9 | validate layout intent | fast | contract | .03 | .03 | medium | Catches mode compatibility and scoped targets (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 10 | validate flow and state | fast | contract | .03 | .03 | medium | Catches decision branches, legal transitions (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 11 | validate tree topology | fast | contract | .03 | .03 | medium | Catches root, cycles, annotation participation (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 12 | validate sequence topology | fast | contract | .03 | .03 | medium | Catches parent/branch/order and visible participants (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 13 | plan ordered atomic changes | fast | contract | .03 | .03 | medium | Catches forward references and no partial outcome (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 14 | enforce operation identity | fast | contract | .03 | .03 | medium | Catches create/replace/remove and revision guards (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 15 | preserve and reset manual overrides | fast | contract | .03 | .03 | medium | Catches section/route locks survive replacement; both reset/update orders (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 16 | delete and hide with explicit impact | fast | contract | .03 | .03 | medium | Catches cascade vs reference rejection and local hide (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 17 | return detached immutable replayable results | fast | contract | .03 | .03 | medium | Catches input/output isolation and deterministic replay (90%) | Fixture upkeep (25%) | none | Owned contract removed |
| 18 | serve UI and language consumers equally | fast | contract | .03 | .03 | medium | Catches same public contract on two in-process inputs (90%) | Fixture upkeep (25%) | none | Owned contract removed |

| Subtotal fast / TOTAL | 18 tests | fast | contract | .54 | .54 | | | | | |
| Subtotal slow / guard | 0 tests | | | 0 | 0 | | | | | |

Static guards are commands, not runtime tests: `pnpm typecheck`, `pnpm lint`, `pnpm architecture`; test command `pnpm test` includes only Model unit/contract files. Diagnostic checks assert code plus affected path; success checks assert semantic values. Runtime external failures outside supported plain-data/resource contract are not claimed recoverable.

## Audit protocol

| Stage | Bound / deliverable |
|---|---|
| Initial specs | Record words and lines per document and aggregate outside five specs; declare counts before reviewer starts |
| Plan pressure test | Exactly one fresh-context agent; 8-minute wall-clock deadline; table: finding, category, evidence, consequence. Categories only `engineering violation`, `a major build risk`, `a preference`, `minor` |
| Plan corrections | Builder independently verifies every finding; one round; both final words and lines ≤120% of baseline, per document and aggregate; no second pressure test |
| Implementation fidelity | One agent, 8-minute deadline; test public promises; prioritize violations of builder coding examples; subjective internal preferences excluded |
| Test correctness | One separate agent, same deadline; attempt three incorrect-assertion counterexamples; report fewer/none honestly; no fabricated findings |
| Final corrections | Verify findings independently; one round limited to accepted auditor findings; rerun existing checks; no further audit |

Audit files live in repo quality/acceptance-evidence. Reviewers write available findings before deadline; timeout terminates review with explicit partial status. No agent delegation beyond requested three reviewers.

## Standards evidence

All first-party source: 16-principle evidence per file, >144/160; no pre-awarded pass or percentage-coverage substitute. LSP=7 when no subtyping, explicitly not demonstrated. Sonar cognitive complexity ≤2 per function. Immutable pure rules avoid fake infrastructure, generic plugin frameworks and speculative adapters. Source inventory records actual LOC; initial estimates are not budgets. Do not hide any failed quality gate behind passing functional tests.
