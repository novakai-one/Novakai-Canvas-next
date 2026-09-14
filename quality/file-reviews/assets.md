# Assets file-local author review

Author assessments after the single verified fix round; not a second independent audit. Original A1 scores remain in build-audits evidence. P1–P16 use exact original anchors. Unlisted deductions are10: inspected single owned responsibility, used narrow roles, dependency direction, present scope, named/readable functions, immutable checked data and hidden policy. Every file conservatively starts OCP6 (fixed owned steps/vocabulary) and LSP7 (not demonstrated), overridden only by explicit evidence. No automatic scores from coverage, size or Sonar.

| File | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 | P11 | P12 | P13 | P14 | P15 | P16 | /160 | Sonar |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| adapters/detect.ts | 10 | 10 | 7 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | **151** | 2 |
| adapters/files.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | **146** | 2 |
| adapters/font.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | **148** | 2 |
| adapters/identity.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | **146** | 2 |
| adapters/raster.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 2 |
| adapters/sqlite-files.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 2 |
| adapters/svg.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 7 | 10 | **145** | 2 |
| contract/api.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **152** | 2 |
| contract/brands.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/compose.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | **148** | 2 |
| contract/errors.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **148** | 0 |
| contract/index.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **153** | 0 |
| contract/ports/identity.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/ports/media.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **148** | 0 |
| contract/ports/native.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/ports/reachability.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/ports/storage.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/records/lease.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/records/media.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 5 | 10 | 10 | 10 | 10 | **146** | 0 |
| contract/types.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 5 | 10 | 10 | 10 | 10 | 10 | **146** | 0 |
| core/admission/stage.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | **149** | 2 |
| core/admission/validate.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 9 | 10 | 10 | 10 | 10 | 10 | **150** | 2 |
| core/reachability/collect.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 8 | 10 | 10 | 10 | 10 | 9 | 10 | **148** | 2 |
| core/reachability/leases.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 8 | 10 | 10 | 10 | 10 | 9 | 10 | **148** | 2 |
| core/resolution/resolve.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | **149** | 2 |
| core/validation/outcomes.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 5 | 10 | 10 | 10 | **146** | 1 |
| tests/admission.test.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **152** | 0 |
| tests/fixtures.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | **149** | 1 |
| tests/harness.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 8 | 10 | 10 | 10 | 10 | 10 | 10 | 5 | **146** | 0 |
| tests/leases.test.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **152** | 0 |
| tests/storage.test.ts | 10 | 6 | 7 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 9 | 10 | 10 | 10 | 10 | 10 | **152** | 0 |

## Evidence and deductions

- `adapters/svg.ts`: Strict local SVG subset; A1 replay/resource bypass fixes verified. Per-call parser arrays/set mutate; two local conditional expressions in serializeTag retain P15=7 even though Sonar<=2.
- `adapters/sqlite-files.ts`: A1 missing-header and returned-statement chain fixed. First initialization serialized, existing header required. Typed rollback/uncertainty; all SQL/File methods consumed.
- `adapters/files.ts`: Immutable no-overwrite publication with file/directory flush and injected IO. Native default functions retain ambient filesystem access; native throws are consumed by explicitly named AssetStorage boundary.
- `adapters/identity.ts`: Native PID/signal defaults retain ambient process access; injected identity methods permit substitution. newLease schema exceptions belong to protected Assets boundary.
- `adapters/raster.ts`: Narrow injected codec factory, complete decode and normalized output; four used pipeline methods, native failures caught. No subtype suite claim.
- `adapters/font.ts`: Injected font parser and checked metrics/signatures; Buffer subarray-to-string chain retained as conservative P12 deduction; bounded native rejection typed.
- `adapters/detect.ts`: Data-driven signature vocabulary, minor MIME/signature knowledge shared with processors. Buffer slice/string conversion chains retained; detection is not safety proof.
- `contract/api.ts`: Deep bound public lifecycle/lease API, protected callbacks, checked unknown inputs. Fixed operation inventory and some small adapter-facing wrappers.
- `contract/compose.ts`: Explicit open IO lifecycle, injected native location factories; codec defaults remain composition choices. Typed open failures retain original files.
- `contract/brands.ts`: Checked fixed digest/lease grammar; thin declaration. Invalid brand recovery named by caller rather than each schema.
- `contract/errors.ts`: Fixed structured errors/recovery vocabulary; thin error-construction module. StorageFault fields readonly; no unchecked cast.
- `contract/index.ts`: Fixed public export surface hides private storage/normalization workflows. No subtype behavior demonstrated.
- `contract/ports/identity.ts`: Narrow hash/lease/liveness roles consumed by whole capability; native ID construction failure handled by facade. Declaration-only depth.
- `contract/ports/media.ts`: Handlers selected by supported media types; typed normalization/detection. Thin declarative role.
- `contract/ports/native.ts`: All native driver/file methods consumed in storage flow; adapter owns typed exception conversion. Explicit unknown native rows.
- `contract/ports/reachability.ts`: One authoritative reader role; typed failures. Maintenance ownership named, retry details reside in facade.
- `contract/ports/storage.ts`: Transaction role consumed across Assets flow; raw adapter throws explicitly owned by outer store boundary. No foreign storage imports.
- `contract/records/lease.ts`: Readonly schema/brand model for local lease metadata; decode/recovery decisions in reader. No manual type duplication.
- `contract/records/media.ts`: Central limits and schema-derived types. Chained schema transformation retained as conservative Demeter deduction. Checked immutable descriptor/admission records.
- `contract/types.ts`: Readonly service/lease/outcome contracts. Public signature is typed, individual method recovery documentation remains in API.
- `core/admission/stage.ts`: Registered normalizers and narrow IO roles. Internal helpers rely on enclosing documented stage/restore boundaries; no duplicate byte admission.
- `core/admission/validate.ts`: Pure metadata/size/metric rules; explicit results. Retry/correction owner is public admission; no infrastructure dependency.
- `core/reachability/collect.ts`: Maintenance lock and authoritative reachability are caller-owned contracts. Raw IO protected by facade; one local conditional callback in checked lease aggregation.
- `core/reachability/leases.ts`: A1 score retained: narrow read/write roles, atomic all-or-none/final-membership checks. Boundary recovery outside individual helper entry points; one local conditional expression.
- `core/resolution/resolve.ts`: Exact descriptor/hash/length checks; raw storage throws settle at facade. No placeholder success or IO imports.
- `core/validation/outcomes.ts`: Protected sync/async failures and checked schema mapping. Recursive Object.freeze mutates local result object status; no shared cache. Small outcome helper depth deduction.
- `tests/admission.test.ts`: Frozen five scenarios; native codec through public service. A2 independent SHA256 gap fixed in existing raster test; SVG counterexamples added without new definitions.
- `tests/storage.test.ts`: Frozen two scenarios; persistence/corruption assertions use public service and injected native harness. Missing-header regression joins reopen scenario.
- `tests/leases.test.ts`: Frozen three scenarios; A2 counterexamples establish expectations consistent with lease contract. Provider liveness override is explicit test input.
- `tests/fixtures.ts`: Pure metadata/assertion helpers; Vitest owns assertion exceptions. Handler delay is an explicit promise seam; no mutable global queue.
- `tests/harness.ts`: A1 readonly finding fixed; returned records readonly. Injected factories isolate IO, native defaults retain ambient filesystem deduction. Vitest owns failures/cleanup.

Strict TypeScript, actual Sonar<=2, formatting and138-module/338-dependency graph passed;50 tests,10 Assets cases. Node24.13 SQLite experimental warning recorded. Actual browser asset rendering is later integration work.
