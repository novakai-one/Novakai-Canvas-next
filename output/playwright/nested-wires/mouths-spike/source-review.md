# Executable spike review

Target: `reproduce.mjs` only. Reviewed against `docs/standards/CODING-STANDARDS.md:15–57` and the stricter cognitive-complexity gate in `AGENTS.md:13`. These scores concern this diagnostic script, not product code or the borrowed prover. Total **145/160**, strictly above 144. Evidence below is relative to this directory.

| Principle | Score | File-local evidence |
|---|---:|---|
| SRP | 10 | One responsibility: reproduce and explain the captured illegality; `reproduce.mjs:114–136`. |
| OCP | 6 | Diagnostic steps and fixture identities are fixed; adding a failure family edits the orchestration, `reproduce.mjs:118–134`. No step seam. |
| LSP | 7 | No subtyping in this file; not demonstrated, per the prescribed anchor; `reproduce.mjs:6–163`. |
| ISP | 10 | Proof context provides precisely the collaborators used by the selected prover slice; `reproduce.mjs:64–74`, with consumer evidence `../templates-scene/verify-templates-scene.mjs:309–538`. |
| DIP | 10 | CLI infrastructure is explicit; scene analysis takes records, uses the layout public contract, and passes a narrow context to the offline prover; no private product imports, `reproduce.mjs:6–10,38–74,114–136`. |
| DRY | 9 | Prover algorithms are executed from their source rather than copied, `reproduce.mjs:64–74`; small pairs/axis/containment helpers duplicate verifier glue, `reproduce.mjs:15–26` versus `../templates-scene/verify-templates-scene.mjs:130,168–173`. Deduct one. |
| KISS | 10 | Explicit extraction sentinels, numerical assertions, returned witness records; no hidden instrumentation rewrite, `reproduce.mjs:38–74,92–136`. |
| YAGNI | 10 | Only the requested fixture chain and a red-capable legality control; no candidate geometry implementation, `reproduce.mjs:114–163`. |
| Typed error outcomes | 8 | Main replay has a declared Result with retained unknown source, `reproduce.mjs:139–159`. Negative-control assertion escapes outside that Result with its CLI recovery owner named, `reproduce.mjs:1–5,162–163`; deduction for the second public failure form. |
| Idempotency/failure semantics | 10 | Read-only replay; no filesystem writes. Retry/correction owner named at the entry boundary, `reproduce.mjs:2–4,142–159`. |
| Deep module/information hiding | 10 | One replay call hides the complete scene/prover witness chain; returned data carries reasons, `reproduce.mjs:38–136,155–159`. |
| Law of Demeter | 10 | Direct calls and record reads; no navigation through behavior-bearing collaborator chains, `reproduce.mjs:38–74,92–136`. |
| Immutability | 10 | Const bindings, derived records and invocation-local VM context; no shared input mutations in the target, `reproduce.mjs:12–136`. |
| Type safety | 10 | Under the specified file-local anchor, no own `any` or unchecked `as` casts; Result source is `unknown`, `reproduce.mjs:139–151`. This is not a claim of full static validation of input JSON (`reproduce.mjs:14`). |
| Cognitive complexity | 10 | No nested/spread ternaries or other named bad idioms. Functions use straight-line operations or one guard/catch; `reproduce.mjs:16–23,64–74,108–111,147–152`. ESLint's <=2 gate passed; command receipt is `validation.json`. |
| Testability | 5 | Core calculations take data, but file-level CLI reads ambient filesystem and argv, `reproduce.mjs:12–14,155–163`; no injectable CLI reader. |

Worst three: fixed orchestration (OCP 6), ambient CLI I/O (testability 5), and the deliberately separate assertion failure channel (typed outcomes 8). These are recorded limitations, not exceptions to the score threshold. [Evidence: table above.]

Validation exercises the real public inspector, the real existing proof routines, baseline data and the failing scale fixture. The 12 omitted endpoint cases and 4 boundary witnesses are asserted. `--assert-legal` exits 1 on the actual defective layout, rather than passing because the reproduction runner completed. [Evidence: `reproduce.mjs:114–129,163`; `reproduction-output.json`; `negative-control-output.txt`; `validation.json`.]
