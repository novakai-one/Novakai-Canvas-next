# Host A1 — single correction round

One bounded audit: `host-a1-implementation.md`. No second audit or rescore requested. This is a correction record, not certification of the remaining app.

| Finding | Parent verification | Disposition |
|---|---|---|
| F1 initial-read recovery | Confirmed: restore lived only in start(), while later successful snapshots skipped it | Restore each admitted workspace once from snapshot acceptance. Existing host case7 now starts offline, reconnects, recovers source and successfully transmits through the real submission journal. |
| F2 failed workspace restore | Confirmed: key advanced before destination read while old drafts remained | Block form writes/apply until destination recovery succeeds. Keep prior forms and stored data on failure. Existing inspector helper proves no B writes or applies after failed switch, then restores A. |
| F3 shared mutable session state | Literal rubric anchor applies | Open. Cached immutable snapshots do not erase target-owned cross-call state. No fabricated passing score. |
| F4 broad roles | Confirmed unused methods in declared roles | Narrow retained storage to read/write, workspace client to get/changes and inputs to its consumed methods; remove unused workspace retention. Router receives only mutation admission. Physical bridge receives its own three-method ConditionalStorage role. |
| F5 fixed lifecycle/registration steps | Literal OCP cap applies | Open. No speculative extension framework added to manufacture points. |
| F6 fallible void commands | Confirmed | Retained editor and its object/wire interfaces now return typed Results for restore/edit/discard/apply, alongside visible state diagnostics. Workspace public orchestration methods remain an open typed-outcome gap. |
| F7 repeated discriminant guards | Confirmed repeated narrowing idiom | Open; correctness retained. Wire file already passed the bounded pre-change score; no inferred rescore. |
| F8 detail-owned storage interface | Confirmed | Consumer-owned ConditionalStorage declares only snapshot/receipt/conditional commit. No backup/restore/close authority reaches the bridge. |
| F9 duplicated Model submission | Confirmed two identical assemblies | Object and wire commands share captured applyChanges assembly. |

Focused correction run: 3 existing cases passed (storage, ingress, recovery). Full integration checks are recorded in `docs/integration/Progress.md`. No new case count, E2E suite or repeated audit. New Library work is subsequent functionality, not represented as part of the A1 sample.

A2 found no incorrect assertions in its five-target sample. Later regression extensions exercise the verified A1 counterexamples and Library organization; they have not received a second audit.
