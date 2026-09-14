# Capability: persistence — Build / acceptance appendix

| Step | Exit evidence |
|---|---|
| 1 | Parse checked envelopes, typed errors, complete read sets and immutable plans |
| 2 | Real SQLite atomic store; public facade; file close/reopen recovery |
| 3 | Complete leased backup and independently validated pristine restore |
| 4 | Frozen tests, type/lint/import gates, previous capability regressions |
| 5 | Two bounded audits; one verified fix; separate stacked PR; continue Assets |

## Frozen test budget

Existing persistence coverage: none. Nine test definitions; first five run against both explicit SQLite memory and file configurations = fourteen executed cases. These are adapter configurations, not two independent implementations; no LSP score10 claim from this alone. Remaining four execute once. In-process contracts only, no host boot or E2E.

| # | Test | Tier/type | Loop/nightly s | Maintenance | For + confidence | Against + confidence | Already covered | Retires when |
|---|---|---|---:|---|---|---|---|---|
| 1 | Atomic multi-record commit and read-only dependency conflict (x2) | fast/contract | .04/.04 | medium | Prevents partial diagrams/history (95%) | Fixture cost (20%) | none | Transaction contract removed |
| 2 | Request retry, fingerprint reuse and no-op semantics (x2) | fast/contract | .04/.04 | low | Prevents duplicate agent effects (95%) | Cases share fixtures (20%) | none | Receipt contract removed |
| 3 | Tombstone ABA prevention and checked request failures (x2) | fast/contract | .04/.04 | medium | Prevents stale overwrite (90%) | Edge fixture cost (25%) | none | Version contract replaced |
| 4 | Detached snapshots, workspace/schema integrity (x2) | fast/contract | .04/.04 | low | Prevents accidental mutation/reset (90%) | Some schema overlap (25%) | none | Storage envelope replaced |
| 5 | Close/reopen durable records and receipts (x2) | fast/contract | .04/.04 | low | Prevents losing completed edits (95%) | Memory deliberately resets (15%) | none | Adapter removed |
| 6 | Injected write/commit/read failure has typed recovery | fast/contract | .02/.02 | medium | Prevents false success on disk errors (90%) | Driver model limited (30%) | tests1/5 partial | Adapter replaced |
| 7 | Backup pins/verifies/releases all reachable resources | fast/contract | .03/.03 | medium | Prevents missing media in backup (95%) | Lease fixture cost (25%) | none | Backup removed |
| 8 | Restore verifies domain/resources before atomic install | fast/contract | .03/.03 | medium | Prevents accepting corrupt backups (95%) | Cross-cap validator mocked here (30%) | none | Restore removed |
| 9 | Failed/racing restore preserves destination and releases backup lease | fast/contract | .03/.03 | medium | Prevents destructive restore (95%) | Fault fixture upkeep (25%) | test8 partial | Maintenance contract replaced |
| **Fast / TOTAL** | **9 definitions / 14 cases** | | **.31/.31** | | | | | |
| **Slow / guard** | **0** | | **0/0** | | | | | |

Test5 file mode closes/reopens same temp DB and checks receipt+records; memory mode proves explicit ephemeral reset. Test6 injects driver faults through adapter's declaration port, not private core. Tests7–9 use resource providers recording lease lifecycle and digest verification with independent bytes. Failed staging may leave orphan bytes, never installed documents. Counterexamples for malformed JSON, duplicate IDs and limits belong to tests3/4/8. Host/browser+CLI integration happens during Authoring/UI delivery, not claimed by these harnesses.

## Bounded review

Counts recorded before one fresh-context plan reviewer; 8-minute deadline, scope only Persistence. Categories: engineering violation / major build risk / preference / minor. One verified fix round, <=20% words AND lines growth per doc/total, no second review. Freeze budget before code.

After build: A1 sample ceil(10% source), max5files, fidelity+16-principle evidence; A2 <=5testfiles, attempt three incorrect assertion scenarios. Eight minutes each. One verified findings-only fix round; no re-audit. File evidence >144/160, meaningful TSDoc and explicit named return types; Sonar<=2. Full suite includes prior capabilities, no E2E.
