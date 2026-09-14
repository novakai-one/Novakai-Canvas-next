# Capability: authoring — Entities & invariants

Workspace "1" ──< "n" StoredRecord
Workspace "1" ──< "n" Receipt
Request "1" ── "1" Intent
Request "1" ──< "n" ExpectedVersion
Preparation "1" ──< "n" ReadDependency
Transaction "1" ──< "n" RecordTransition
Transaction "1" ── "1" HistoryHead
Receipt "1" ── "0..1" Transaction

| Entity | Fields / types |
|---|---|
| Identity | WorkspaceId, RequestId, ActorId, RecordId, PlannerId: checked nonempty bounded strings; Digest: SHA256 hex; Timestamp: integer milliseconds |
| RecordKey | kind:collection/catalog/asset-admission/preset/workspace/history; id:RecordId |
| StoredRecord | key; version:nonnegative integer; value:Json; deleted:boolean; resources:Digest[] |
| Snapshot | workspace; sequence; records:StoredRecord[]; tombstones retain versions |
| ExpectedVersion | key; version:integer or `absent`; absence differs from tombstone |
| Request | workspace, request, actor:{id,kind:human/agent}, version:1, expected[], scope:RecordKey[], assets:{alias,digest}[], intent |
| Intent | change:{planner:PlannerId,payload:Json}; undo/redo:{transaction:RequestId} |
| Proposal | writes:put/delete[]; reads:ExpectedVersion[]; pins:Json; diff:Json; warnings:Diagnostic[] |
| Put / Delete | put:{key,value:Json,resources:Digest[]}; delete:{key}; client cannot submit these as privileged writes |
| Preparation | request fingerprint; candidateHash; reads[]; changes[]; diff; warnings; pins; preview:Json/null |
| Transaction | id; actor; timestamp; mode; target:RequestId/null; transitions:{key,before:StoredRecord/null,after:StoredRecord}[] |
| HistoryHead | original transaction; state:active/undone; participants:ExpectedVersion[]; last:RequestId |
| Receipt | request; fingerprint; sequence; versions[]; outcome:{status:committed/no-op,transaction:RequestId/null,pins,diff,warnings} |
| Result<T> | success(value:T) / failure(code,path,targets,message,recovery,traceId:null/string) |

| ID | Invariant |
|---|---|
| A01 | Fingerprint canonical submitted envelope excluding request ID; includes actor, versions, scope, exact intent and submitted asset manifest. Resolved alias pins excluded. |
| A02 | Receipt lookup precedes snapshot/preconditions/resource resolution. Same fingerprint returns original receipt; different fingerprint → request-reused. Only successful/no-op requests receipted. |
| A03 | Every write target lies in explicit scope and has client expected version, including creates/tombstones. Compare all supplied expectations; never replace them with fresh versions. |
| A04 | Consistent snapshot; unique keys; bounded plain JSON. Every proposal dependency matches snapshot. Final validation supplies additional dependencies; union compared atomically. Catalog membership guards inventory phantoms. |
| A05 | Registered planners return data only. Reserved history writes prohibited. Final complete-candidate validation mandatory, including Model/Library validity, catalog bijection, admissions and reference pins. |
| A06 | Admission resolves exact pins after receipt lookup; blobs durable and protected against garbage collection before commit; all proposed/history resource digests require lease coverage. Lease released on every exit. Missing bytes → missing-asset. |
| A07 | Hard feasibility always runs for changed candidates, even preview=false. Failure writes nothing. Soft adjustments reported; warnings never excuse hard locks. |
| A08 | Preparation reserves nothing. Apply recomputes; supplied candidateHash mismatch → revision-conflict. Hash covers request fingerprint, complete reads, stamped candidate writes, pins/diff/warnings; preview excluded. |
| A09 | Changed record revision increments exactly once; identical puts and absent/already-deleted deletes are no-ops. Collection/catalog payload revision equals slot version. New record starts at 0. Tombstone resurrection increments retained version. |
| A10 | Writes, history, history-head and successful receipt commit atomically. No-op still compares reads, stores receipt, creates no history/content revision. |
| A11 | Commit conflict/uncertainty reconciles receipt first. Identical concurrent retries have one effect; different fingerprints reject. Unexpected precommit failure has no receipt; uncertain postcommit caller retries same envelope. |
| A12 | Undo/redo create transactions, never rewind. Original before/after retained with resources. Head tracks participant versions; any divergent participant version blocks inverse/redo. User must supply current participant expectations. |
| A13 | History/head keys engine-generated; restored candidates pass the same validation/resources/feasibility gate. Redo targets original transaction after successful undo; double undo/redo rejects. |
| A14 | Notifications happen after commit, carry revisions only, and are hints. Delivery failure cannot change committed success. Drafts, pending browser generations and camera are caller-owned. |
| A15 | Detached immutable inputs/results; no untyped public rejection. Unsupported versions explicit. Cancellation checked before expensive work and commit; committed receipt wins over cancellation. |

| Files within scope | Estimated lines each |
|---|---:|
| contract/index; api; compose; types | 55;100;30;65 |
| contract/brands; errors | 40;65 |
| contract/records/storage; request; proposal; history | 100;85;65;85 |
| contract/ports/store; planning; resources; runtime | 55;65;45;40 |
| core/validation/input; outcomes; snapshot | 90;65;80 |
| core/identity/canonical; receipts | 55;65 |
| core/records/keys; versions; changes | 50;90;100 |
| core/admission/registry; pipeline; candidate; dependencies; prepare | 45;90;100;65;100 |
| core/transactions/apply; commit; notifications | 100;90;40 |
| core/history/read; inverse; journal | 80;100;100 |
| adapters/node-identity | 40 |
| tests/fixtures; requests; history-fixtures | 180;100;100 |
| tests/admission; retries; history; failures | 180;160;180;160 |

Estimates are indications, not targets or restrictions; split private modules when readability requires.
