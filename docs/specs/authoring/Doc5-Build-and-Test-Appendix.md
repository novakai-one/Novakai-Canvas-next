# Capability: authoring — Build & test appendix

**Build:** declarations → canonical identity/checked snapshots → dependencies/net revision changes → admitted planning/candidate guards → atomic commit/reconciliation → history → Node composition.
**Limits:** version 1; request JSON ≤16MiB, depth≤64, values≤100000; ≤1000 scoped writes; ≤10000 read dependencies; IDs≤128 chars; RequestId≤120 leaves room for generated `tx:`/`head:` prefixes. Reject unsupported version/duplicates/cycles/non-JSON/nonfinite data. No input execution or partial write.
**Failures:** invalid-input, unsupported-version, unknown-reference, invariant-violation, constraint-conflict, revision-conflict, request-reused, missing-asset, permission-denied, storage-unavailable, corrupt-record, cancelled. Recovery includes affected keys and action; unexpected boundary failure includes trace ID without stack exposure.

**Frozen budget: 14 behavioral cases, four suites.** Helpers are not additional test cases. Public facade plus injected roles; real Persistence SQLite and Model/Library validation bridges in fixtures. Resource/feasibility fault scripts deliberately test protocol failures; native geometry correctness belongs to Layout. No E2E suite.

| # | Observable oracle |
|---|---|
| 1 | Human create + catalog membership atomic, stored payload/slot revisions match; read detached |
| 2 | Agent edit, full-candidate semantic rejection, no mutation/receipt on rejection |
| 3 | Missing/incorrect expectations, out-of-scope/reserved/duplicate writes reject |
| 4 | No-op receipt compares dependencies without content/history revision; tombstone resurrection increments once |
| 5 | Stale preparation/hash and discovered catalog/resource dependencies conflict |
| 6 | Retry returns original pins before alias/byte resolution; changed envelope request-reused |
| 7 | Racing identical requests one effect; racing different fingerprints one winner; unrelated participants independent |
| 8 | Commit-then-response-loss recovers receipt; precommit storage failure remains typed/retryable |
| 9 | Undo restores every participant and resource pin, advances revisions; redo reapplies |
| 10 | Divergent participant/double undo/redo/missing history rejects; inverse validated and feasibility checked |
| 11 | Hard feasibility rejects without preview; soft warnings/diff preserved; no-op skips geometry |
| 12 | Asset missing/admission failure, lease release on rejection/commit; history retains referenced resources |
| 13 | Cancellation before commit writes nothing; cancelled/lost notification after commit cannot undo success |
| 14 | Malformed/oversized/versioned input, forged provider output, provider exception, caller mutation across await bounded and typed |

**Plan review:** one fresh-context bounded reviewer≤8min; four allowed finding classes; verify one fix round; per-document/aggregate word AND line growth≤20%.
**Build review:** A1 fidelity/standards and A2 assertion correctness (≤3 counterexamples), each≤8min/≤5 target files/capability-only; one verified fixes round; no re-audit.
**Gates:** every source file>144/160 with line evidence; named function docs and declared returns; actual Sonar≤2; typecheck/lint/format/import-boundaries/all retained tests; independent PR. Host/browser proof remains Part2, not claimed by these suites.
