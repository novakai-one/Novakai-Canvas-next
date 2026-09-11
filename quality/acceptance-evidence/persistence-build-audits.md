# Persistence build audits — one round

A1 persistence_implementation_audit: 3 production targets (SQLite adapter, restore, commit) plus1fixture target, bounded8minutes. A2 baseline_audit reused solely as independent test auditor after fresh-agent tool reached its thread limit; old-repo audit context explicitly excluded. Three Persistence test files, bounded8minutes. No other capability audited. No second audit round requested.

## A1 findings and independent verification

| ID | Category | Finding | Verified? / single fix |
|---|---|---|---|
| I1 | engineering violation | Fixture file mixes data, IO lifecycle/fault driver and resource mocks; hardcoded native IO scores0 testability | Verified direct fs/tempdir and DatabaseSync construction. Split pure fixtures, storage harness, resource harness; injected filesystem/service/database factories; prepared statements named; Vitest cleanup registered. Native default IO remains an honest Testability5 deduction in storage harness |
| I2 | engineering violation | Restore chooses2-method StorePort, uses1 | Verified all call paths only transact; replaced with Pick<StorePort,'transact'> |
| I3 | minor | Internal restore Promise<Result> could reject when reserve rejects | Verified exported private entry directly awaited unprotected provider; wrapped complete private operation in protectAsync; public facade was already safe |
| I4 | minor | Internal commit Result could throw when combined candidate exceeds64MiB | Verified validateState calls throwing boundedClone; wrapped candidate validation in typed invalid-input protection; public facade was already safe |

A1 original full scores by principle P1–P16:
- sqlite.ts: 10,6,7,10,10,10,10,10,10,10,10,10,10,10,10,10 =153.
- restore.ts: 10,6,7,5,10,10,10,10,8,10,10,10,10,10,10,10 =146.
- commit.ts: 10,6,7,10,10,10,10,10,8,10,10,10,10,10,10,10 =151.
- old fixtures.ts: 5,0,7,10,5,10,10,10,8,8,10,5,10,10,10,0 =118.

Original reviewer deductions retained. Author post-fix assessments are separate in quality/file-reviews/persistence.md, not claimed as independently re-audited. Some original fixture Demeter/ambient defaults remain honestly deducted in the separated helper files; no blanket fixture exemption.

## A2 assertion correctness

No incorrect assertion found;14/14 targeted cases passed. Three concrete attempts:
1. sequence1/no receipts: correctly corrupt, since every sequence increment retains one receipt.
2. stale no-op: correctly conflicts, because all read dependencies compare even with no writes.
3. uncertain restore: correctly may have installed state and release reservation; fixture throws after actual COMMIT.

A2 noted slot-count assertion is narrower than complete payload equality; this is missing coverage, not an incorrect assertion or demand for new tests. No new definitions added. Frozen9definitions/14cases remain. Static checks and all40 repository tests pass after one fix round. No E2E; actual browser/CLI/Assets host composition remains later delivery.
