# Capability: authoring — Modules

### contract/api.ts; compose.ts
**Exposes:** createAuthoring(dependencies):Authoring; composeAuthoring(owners):Authoring with checked Node identity.
**API:** read(workspace):Promise<Result<Snapshot>>; prepare(request,preview=false):Promise<Result<Preparation|Receipt>>; apply(request,{candidateHash?:Digest}):Promise<Result<Receipt>>; receipt(workspace,request):Promise<Result<Receipt|null>>; undo/redo(request,...):same apply path, require matching intent kind.
**Imports:** own private operations/declarations. Compose alone imports concrete adapter.
**Contract:** checked unknown boundaries; never accept prepared writes as authority; Authoring owns retry/inverse recovery. Read does not modify state.

### contract/ports/{store,planning,resources,runtime}.ts
| Role | Required operation / result |
|---|---|
| SnapshotReader | read(workspace) → Snapshot |
| ReceiptReader | find(workspace,request) → Receipt/null |
| Committer | commit(workspace,request,fingerprint,expected,writes,outcome) → Receipt; atomic comparison/uniqueness; settlement/throw only after physical transaction is terminal, never detached background writes |
| IntentPlanner | id; plan(request,snapshot,pins) → Proposal; trusted composition registry, never client code |
| CandidateValidator | validate(before,after,changedKeys) → additional read versions; full domain/reference/admission consistency, exact stored revision consistency |
| ResourceAdmission | acquire(request,snapshot) → lease:{pins,reads,covered:Digest[],release}; resolve aliases/bytes under protection; planner sees exact pins; protect snapshot/history resources, submitted bytes and resolved-preset dependencies; proposed resources must be covered |
| Feasibility | check(candidate,changedKeys,preview) → {warnings,diff,preview}; hard constraints mandatory; empty changes skip geometry |
| Identity | digest(canonicalText) → Digest; now() → Timestamp; typed failures |
| Cancellation | cancelled(request) → boolean |
| Notifications | publish(workspace,receipt) → Result<void>; revision hint after commit |

All asynchronous external roles return Promise<Result<T>> except identity/cancellation. No owner admits changes by calling storage directly. Missing roles fail construction by type contract; no production fake providers. Host auth occurs before facade access.

### core/admission/{registry,pipeline,prepare}.ts
**Exposes (private):** choose registered planner; execute injected planning step then fixed admission guards; build preparation.
**Imports:** own role declarations; identity, versions, candidate/history helpers.
**Contract:** A01–A08/A15. No command-kind switches inside transaction engine. Undo/redo use registered internal history planning. Ordinary planner cannot read/write reserved history. Planner registration cannot replace guards. Validate duplicate registration at construction.

### core/records/{keys,versions,changes}.ts; validation/*.ts
**Exposes (private):** bounded record decoding; dependency union; checked stamping/net writes; deterministic candidate snapshot.
**Imports:** own record schemas/errors.
**Contract:** A03–A05/A09. Duplicate targets/dependencies with inconsistent versions reject. Preserve tombstones and resource retention; canonical equality determines no-op. No revision from client payload is authoritative.

### core/identity/{canonical,receipts}.ts
**Exposes (private):** stable sorted-object serialization; request hash; recover matching receipt.
**Imports:** own identity/receipt slots.
**Contract:** A01/A02/A11; arrays retain submitted order. Request ID excluded; all other checked submitted fields included. Detached parse before first await prevents mutation races.

### core/history/{read,inverse,journal}.ts
**Exposes (private):** checked retained transaction/head; inverse/redo proposal; immutable journal plus head write.
**Imports:** own records/dependencies.
**Contract:** A12/A13. Transaction key `tx:<request>`; head key `head:<original-request>`. Participant data/resource snapshots include deletions and resurrection; new history IDs require absent preconditions. Shared history participant collisions remain transaction conflicts.

### core/transactions/{apply,commit,notifications}.ts
**Exposes (private):** apply prepared candidate; atomic transaction request; safe postcommit hint.
**Imports:** own pipeline/journal/receipt roles.
**Contract:** A10/A11/A14/A15. Cancellation before commit only; commit may already have succeeded after transport failure. Reconcile receipt on any commit failure before returning it. Resources protected through terminal commit/reconciliation. Local service bridge calls synchronous Persistence; a remote timeout is not a terminal Committer implementation. Release failure cannot replace successful receipt; retain protection for maintenance recovery. Notification failure ignored for admission outcome.

### adapters/node-identity.ts
**Exposes:** checked SHA256/clock role factory.
**Imports:** node:crypto; own contracts.
**Contract:** no ambient dependency in core; injectable clock/hash for deterministic contract suites. Node failures translated; Authoring owns recovery.
