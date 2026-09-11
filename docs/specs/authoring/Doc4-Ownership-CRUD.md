# Capability: authoring — Ownership / CRUD

| Object | Create | Read | Update | Delete |
|---|---|---|---|---|
| Submitted request | human/Language caller | boundary, fingerprint, planner | never; changed intent needs new request ID | caller outbox after reconciliation |
| Preparation | admission pipeline | UI/CLI preview/apply comparison | recompute | ephemeral |
| Canonical record | admitted planner proposal | consistent snapshot | atomic revisioned put | admitted tombstone |
| Exact resource pins | protected admission resolution | planner, validator, receipt | explicit new transaction | retention policy outside ordinary mutation |
| Transaction | journal with commit | history reader | never | no ordinary delete |
| History head | original transaction | inverse planner | atomic undo/redo | never through client planner |
| Receipt | successful/no-op atomic commit | receipt/retry lookup | never | workspace lifetime |
| Revision notification | postcommit publisher | subscribed hosts | never | ephemeral hint |
| Draft / pending generation | caller | caller | caller | caller; Authoring does not clear drafts |

Physical storage is injected; Authoring remains sole mutation authority. Maintenance restore is a separate validated workspace replacement operation, not a general raw-write API.
