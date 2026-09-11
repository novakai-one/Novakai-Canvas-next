# Persistence file-local author review

Author assessments, separate from independent A1 sample. Each row is the target only; injected collaborators are evidence, not a blanket transfer of their internal scores. P1–P16 use the repository original anchors. No automatic score from file size, coverage or Sonar.

All nondeducted lenses were inspected for one capability-owned outcome, narrow used dependencies, absence of core/framework imports, named readable steps, present-scope purpose, typed supported outcomes/recovery, hidden internals, direct collaborator access, readonly copies, checked input types, absence of clever/nested expressions, and in-process seams. Explicit exceptions below remain deducted. LSP7 is conservative: two SQLite configurations alone are not claimed as independent substitute implementations. Sonar maxima are measured separately with the actual ESLint plugin at threshold0, then the required <=2 gate.

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 | P11 | P12 | P13 | P14 | P15 | P16 | /160 | Sonar |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| adapters/sqlite.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 2 |
| contract/api.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **152** | 2 |
| contract/brands.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | **151** | 0 |
| contract/compose.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 2 |
| contract/errors.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **148** | 0 |
| contract/index.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 0 |
| contract/ports/database.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/ports/resources.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/ports/store.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **148** | 0 |
| contract/records/backup.ts | 10 | 6 | 7 | 10 | 10 | 9 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | **150** | 0 |
| contract/records/storage.ts | 10 | 6 | 7 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **148** | 0 |
| contract/records/transaction.ts | 10 | 6 | 7 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **148** | 0 |
| contract/types.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **148** | 0 |
| core/recovery/backup.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **151** | 2 |
| core/recovery/resources.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **152** | 1 |
| core/recovery/restore.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 2 |
| core/transaction/commit.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 2 |
| core/transaction/keys.ts | 10 | 10 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 5 | 10 | 10 | 10 | 10 | 10 | **150** | 0 |
| core/transaction/receipts.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **152** | 2 |
| core/transaction/versions.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 2 |
| core/validation/outcomes.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **150** | 2 |
| core/validation/request.ts | 10 | 10 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **155** | 2 |
| core/validation/state.ts | 10 | 10 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **155** | 2 |
| tests/backup.test.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | **151** | 0 |
| tests/fixtures.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | **149** | 1 |
| tests/resource-harness.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 5 | 10 | 10 | 10 | 10 | **146** | 1 |
| tests/storage-harness.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | **146** | 1 |
| tests/store.contract.test.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 5 | 10 | 10 | 10 | **147** | 2 |

## Per-file evidence and deductions

- [adapters/sqlite.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/adapters/sqlite.ts): Injected four-method SQL driver; explicit rollback and uncertain COMMIT recovery; no local mutable state or semantic policy.
- [contract/api.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/api.ts): Fixed facade operations; adapter/core seams injected. Validation, receipt lookup and protected backup/restore hide policy. All StorePort methods consumed across facade.
- [contract/brands.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/brands.ts): Closed ID grammar and namespace choices. Checked Zod brands; no subtype demonstration. Identity-only declarations do not name a runtime recovery owner at each schema.
- [contract/compose.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/compose.ts): Fixed native setup sequence; narrow optional opener and native driver permit injected failures. Open/setup/cleanup caught; partial database ownership explicit.
- [contract/errors.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/errors.ts): Closed error-code vocabulary; small typed outcome/recovery table is intentionally thin. No subtyping demonstration.
- [contract/index.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/index.ts): Fixed export inventory; hides transaction/recovery internals behind composed public service. Declarations do not demonstrate subtyping.
- [contract/ports/database.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/ports/database.ts): Four used driver methods. Native throws intentionally consumed by SQLite adapter; not declared Result methods. Thin infrastructure declaration, no subtype claim.
- [contract/ports/resources.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/ports/resources.ts): Narrow acquire/read/release and reserve/stage/release roles; injected validator mandatory. Promise rejection recovery is implemented in caller, not every individual signature.
- [contract/ports/store.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/ports/store.ts): Two-method atomic decision seam consumed by whole service. No claim that two configurations are two implementations. Thin declaration.
- [contract/types.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/types.ts): Fixed public method inventory; explicit readonly typed outcomes. Interface-only depth limitation.
- [contract/records/backup.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/records/backup.ts): Base64 grammar and bounded schema; schema/type field correspondence creates a small duplication. Envelope declaration recovery is owned by maintenance caller.
- [contract/records/storage.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/records/storage.ts): Runtime schemas and recursive readonly DTO declarations duplicate field facts; explicit Json union avoids unbounded mapped-type inference. No casts or mutable public records.
- [contract/records/transaction.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/contract/records/transaction.ts): Checked union and readonly DTO repeat field facts. Closed six-kind storage vocabulary lives in storage declaration; no semantic kind switches.
- [core/recovery/backup.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/recovery/backup.ts): Fixed acquire/read/verify/pack sequence; resource roles injected and cleanup shared. Exported internal async function relies on facade exception boundary named in module contract.
- [core/recovery/resources.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/recovery/resources.ts): Related resource coverage/verification/lease settlement policy; fixed stages, protected promises settle before release. Small helper depth deduction.
- [core/recovery/restore.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/recovery/restore.ts): Verified A1 fixes: dependency narrowed to transact only, and complete private restore entry protected against provider rejection. Fixed validation/stage/install stages remain OCP6.
- [core/transaction/commit.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/transaction/commit.ts): Verified A1 fix: candidate-validation exceptions now become typed invalid-input before returning decision. Gate list supports predicates; candidate/reconciliation steps remain fixed.
- [core/transaction/keys.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/transaction/keys.ts): Small pure composite-key/lookup helpers; no feature dispatch, no mutation. Pure replay exists; helpers do not each name physical crash-recovery owner.
- [core/transaction/receipts.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/transaction/receipts.ts): Closed identity/reuse decisions; original receipt retained before read comparisons. No IO or mutable cache; small single-policy helper.
- [core/transaction/versions.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/transaction/versions.ts): Fixed token/deletion policy. No caller mutation, complete precondition comparison, explicit tombstones and exhaustion checks.
- [core/validation/outcomes.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/validation/outcomes.ts): Bounded clone deliberately throws into named protect boundary; direct helper signature is not a Result. JSON data detached before recursive freeze; exception APIs explicit.
- [core/validation/request.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/validation/request.ts): Data-driven rule list; shape parser and canonical key collaborators. boundedClone exception belongs to documented facade boundary.
- [core/validation/state.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/core/validation/state.ts): Structural rule list covers identity, tombstone and sequence integrity. boundedClone exception belongs to documented facade boundary; no semantic model dependencies.
- [tests/backup.test.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/tests/backup.test.ts): Fixed frozen scenarios; independent hashes/provider call evidence. No direct filesystem or private core calls; operational providers injected through contract.
- [tests/store.contract.test.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/tests/store.contract.test.ts): Fixed public scenarios with local input mutation explicitly proving detached snapshots; no persisted fixture state shared across tests.
- [tests/fixtures.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/tests/fixtures.ts): After verified A1 fix: pure canonical data/assertion helpers only. Vitest owns explicitly documented assertion/schema throws; infrastructure and resource mocks removed.
- [tests/storage-harness.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/tests/storage-harness.ts): After verified A1 fix: isolated storage harness with injected filesystem/service/native database factories. Native defaults retain ambient IO (Testability5); setup/assertion exceptions explicitly owned by Vitest (8). Named prepared statements avoid chained navigation; test-finish cleanup now registered.
- [tests/resource-harness.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next/capability/persistence/tests/resource-harness.ts): After verified A1 fix: only resource-provider fixture and SHA256 oracle. Pure digest computation needs no external infrastructure. Hash builder call chain remains a Demeter5 deduction; mock lifecycle cleanup belongs to Vitest.

Static evidence: strict TypeScript, Sonar<=2, formatter and104-module/243-dependency import graph pass;40 tests total,14 Persistence cases. Tests were added after source in this slice: no behavioral red-first/TDD claim. Current host and second host are in-process service consumers/configurations; visible browser and actual CLI integration remain later work. Node24.13 native SQLite emits an experimental API warning.
