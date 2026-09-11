# Capability: persistence — Entities and invariants

| Record | Fields / cardinality |
|---|---|
| WorkspaceState | schemaVersion:1, workspace:WorkspaceId, sequence:safe integer>=0, slots:Slot[0..N], receipts:Receipt[0..N] |
| RecordKey | kind:catalog/collection/asset-admission/preset/history/workspace, id:RecordId; composite identity |
| Slot | key, version:safe integer>=0, value:JSON or null, deleted:boolean, resources:Digest[]; one/key, tombstones retained |
| ReadVersion | key, version:'absent' or safe integer>=0; absent means key never existed, including no tombstone |
| Write | put:{kind:'put',key,value:JSON,resources:Digest[]} or delete:{kind:'delete',key}; one/key |
| CommitRequest | workspace, request:RequestId, fingerprint:Digest, expected:ReadVersion[], writes:Write[], outcome:JSON |
| Receipt | request, fingerprint, sequence:positive safe integer, versions:ReadVersion[], outcome:JSON; one/request/workspace |
| BackupBundle | schemaVersion:1, state:WorkspaceState, blobs:{digest:Digest,base64:string}[]; exactly one blob/reachable digest |
| Result<T> | {ok:true,value:T} or {ok:false,error:{code,path,message,recovery}}; never partial success |

IDs: checked nonempty ASCII aliases [A-Za-z0-9][A-Za-z0-9_.:-]{0,127}, distinct WorkspaceId/RecordId/RequestId brands. Digest: lowercase SHA-256 hex. JSON: finite numbers, null, booleans, strings, arrays, string-keyed records; no undefined/functions/prototypes/cycles. Boundary JSON serialization max64MiB; each blob base64 max32MiB; whole backup max256MiB. Limits reject without truncation. Result values detached and deeply frozen.

| ID | Invariant / exact behavior |
|---|---|
| P01 | State schema version exactly1; unique keys/receipt IDs; receipt sequences unique, <=state.sequence; versions are safe integers; malformed/unsupported stored state rejects, never overwrites/reset |
| P02 | Put on never-seen key creates version0; put/delete on existing slot increments once. Delete requires live slot, clears value/resources, retains version tombstone. Recreate uses tombstone version+1, preventing ABA |
| P03 | Every write has a matching expected token; expectations/writes unique. Compare every expectation including read-only dependencies. Mismatch rejects entire transaction |
| P04 | Receipt lookup precedes expectation comparisons. Same request+fingerprint returns original receipt unchanged; different fingerprint returns request-reused. Fingerprint supplied by trusted Authoring from submitted envelope; storage does not reconstruct semantic request identity |
| P05 | New commit atomically writes all changed slots plus receipt; request.writes includes history prepared by Authoring. State.sequence increments once/new receipt. Empty writes yields receipt but no slot changes/history; supplied writes always advance versions even equal payload |
| P06 | Failed validation/conflict/storage transaction creates no receipt/partial records. SQLite transaction rollback owned by adapter; uncertain commit response recovered by retrying same request ID via Authoring |
| P07 | Commit workspace must match open workspace. Original outcome and resolved pins are opaque receipt payload, retained for workspace lifetime; no pruning |
| P08 | All slots/receipts in a snapshot come from one transaction. Deleted slots carry null value and no resources. Snapshot sequence0 is pristine; no restore into a used destination |
| P09 | Backup collects deduplicated resources across live slots, including retained history/preset/admission slots. Acquire lease before reading bytes; missing resources reject; verify each digest; release lease after success/failure. No incomplete bundle succeeds |
| P10 | Restore parses bundle, verifies exact resource coverage/digests and injected domain validation, stages all verified bytes durably, then atomically installs state into pristine destination of same logical workspace. Destination GC reservation protects staged bytes through installation. Known precommit failure leaves state untouched; uncertain COMMIT requires reopen/inspection before retry or activation. Old location remains active; released orphan bytes can be collected by Assets |
| P11 | Restore never overwrites active database. Host opens a new location and switches only after success; retaining old location and restarting sessions is mandatory. Clients from the old location must not remain attached after switch |
| P12 | SQLite synchronous callback transaction: BEGIN IMMEDIATE, read/check/replace JSON envelope, COMMIT; rollback on rejection/exception. WAL + synchronous FULL. Database location contains one workspace; wrong workspace refuses open/use |

Recovery codes: invalid-input (correct request), unsupported-version (upgrade reader), revision-conflict (re-read/reprepare), request-reused (new request ID), storage-unavailable (retry same request/reconcile), corrupt-record (restore verified backup), missing-resource (restage/retry), destination-not-empty (choose new location). Blob/domain verification failures use corrupt-record with path details.

## File scope — estimates only

| File | Estimated lines |
|---|---:|
| contract/index.ts | 20 |
| contract/api.ts | 70 |
| contract/compose.ts | 35 |
| contract/types.ts | 30 |
| contract/errors.ts | 25 |
| contract/brands.ts | 15 |
| contract/records/storage.ts | 55 |
| contract/records/transaction.ts | 45 |
| contract/records/backup.ts | 20 |
| contract/ports/store.ts | 25 |
| contract/ports/database.ts | 30 |
| contract/ports/resources.ts | 40 |
| core/validation/outcomes.ts | 65 |
| core/validation/state.ts | 80 |
| core/validation/request.ts | 40 |
| core/transaction/keys.ts | 25 |
| core/transaction/versions.ts | 55 |
| core/transaction/receipts.ts | 35 |
| core/transaction/commit.ts | 80 |
| core/recovery/backup.ts | 80 |
| core/recovery/restore.ts | 75 |
| core/recovery/resources.ts | 55 |
| adapters/sqlite.ts | 100 |
| tests/fixtures.ts | 70 |
| tests/storage-harness.ts | 100 |
| tests/resource-harness.ts | 65 |
| tests/store.contract.test.ts | 140 |
| tests/backup.test.ts | 120 |
