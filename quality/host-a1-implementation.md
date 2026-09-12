# A1 — bounded host implementation and coding audit

Authority: repository `AGENTS.md`, `docs/standards/CODING-STANDARDS.md` (literal 16-principle SOP), and `docs/integration/Host-Build-Plan.md`. The required file gate is **strictly greater than 144/160**. This is one audit, with no second review, implementation edits, test edits, delegated work, or E2E.

Started 2026-09-12 07:39:54 UTC (17:39:54 Melbourne); evidence collection ended 07:44:50 UTC. Report completed and score sums verified at 07:47:35 UTC: 7 minutes 41 seconds elapsed, within the eight-minute deadline of 07:47:54 UTC. The parent continued unrelated library/UI work while keeping these five targets unchanged.

## Exact scope and result

| Alias | Sole source target | Lines | Score /160 | >144 gate |
|---|---|---:|---:|---|
| R | `apps/web/adapters/retained-editor.ts` | 97 | 127 | Fail |
| W | `apps/web/core/inspector/wire-edits.ts` | 116 | 148 | Pass |
| C | `apps/web/adapters/workspace-session.ts` | 528 | 126 | Fail |
| S | `apps/service/adapters/authoring-store.ts` | 101 | 143 | Fail |
| H | `apps/service/adapters/http-router.ts` | 61 | 141 | Fail |

The implemented paths preserve the Authoring write boundary: C builds captured Model/DSL requests and submits through its submission owner (318–340, 385–408); H decodes and forwards mutations exclusively to the Authoring session (20–29); S preserves expected versions and transaction identity in the physical commit (86–100). No independent canonical write bypass was found in these targets.

Two executable recovery counterexamples were confirmed. Passing existing checks does not close them. The complete UI, resources/export integration, restore handover UI, and final mixed-collection acceptance remain unfinished by explicit scope; their absence is not a finding here.

## Findings

The worst three findings are F1, F2 and F3. Classifications below use only the requested vocabulary. Prescriptive SOP failures are distinguished from operational defects; no subjective internal preference is treated as a blocker.

| ID | Classification | Evidence | Finding and concrete consequence |
|---|---|---|---|
| F1 | major build risk | C:66–85, 110–119, 416–441 | If the first workspace read fails, `start()` skips every recovery owner because `snapshot` is null. A later successful `refresh()` sets `connected: true` but never calls `restoreEdits()`. The real submission session therefore retains workspace `''`; subsequent collection creation fails `wrong-workspace`, and retained drafts have not loaded. Executable result: zero restore calls, zero posts, connected true, creation rejected. This is an implemented reconnect-path failure, not a request for a new feature. |
| F2 | engineering violation | R:30–37, 20–27, 62–63 | `restore('B')` changes the persistence key before reading B. If that read fails, A's drafts remain in memory. Discarding one of A's forms writes the remaining A draft under B's retention key and clears the problem. Reproduced using the public lifecycle. This can overwrite B's unread recovery data. The current workspace controller restores forms only at startup; this counterexample establishes the reusable editor contract failure, not evidence that a shipped workspace-switch UI exists. |
| F3 | engineering violation | R:11–17, 31, 89–90; C:31–59, 139–142, 462–486 | Both factories keep shared mutable closure state across calls. The SOP's literal immutability zero anchor applies: mutable `state`, workspace/job bookkeeping and listener Sets persist across invocations. Immutable published record copies do not satisfy “readonly/const everywhere.” This is a mandated standards failure, not a claim that React external stores inherently malfunction. |
| F4 | engineering violation | R:21,32; C:68,144,420 and 318–408; S:38,78,90; H:20–25 | Overbroad ports: R consumes retention read/write, 2/3 methods; C consumes client get/changes, 2/3, inputs 5/7, and never consumes its retention port, 0/3; S consumes Persistence readSnapshot/receipt/commit, 3/6; H passes admission only to a decoder whose ingress consumes mutation, 1/3. All invoke the literal ISP five-point anchor/cap. Pass-through consumption was included. |
| F5 | engineering violation | R:8–85; W:12–26; C:21–488; S:37–100; H:32–52 | Owned sequencing/registration axes require edits to these files. Injected collaborators do not provide an extension seam for lifecycle steps, storage validation/commit steps, router registrations or wire operations. Each receives the SOP OCP cap of 6. This is a prescribed scoring constraint, not an invented runtime requirement to add speculative plugin machinery. |
| F6 | engineering violation | R:30,57,62,66,73–77; C:66,138,362,416,444–456 | Public fallible command methods return `void`/`Promise<void>` and deliver diagnostic codes through state/reporting. Failures are programmatically distinguishable but absent from the command return signatures: typed-error score 5. No actual escaping plain-Error path was established; this is not scored as an untyped-throw violation. |
| F7 | engineering violation | W:32–79 | Nine handlers repeat discriminant checking and no-op return before immutable field replacement. This is an extractable guard/replacement idiom repeated at least three times, meeting the literal DRY 5 anchor. The checked command registry currently routes valid commands correctly. |
| F8 | engineering violation | S:11–16,38,72,87,95 | Storage dependency abstraction is the detail-side `Persistence` interface, including backup/restore/close. The target did not declare a consumer-owned storage role. Literal DIP 5 anchor applies separately from ISP; no deduplication of scoring. |
| F9 | minor | C:386–408 | Object and wire submission repeat the same captured-base/request-ID/error/submit assembly. Two instances receive one DRY blemish, 9; they both currently preserve captured base/generation. |

No preference finding was promoted to a defect. LSP demonstration and the router's recovery-documentation/module-depth deductions are recorded in the score tables rather than represented as user failures.

## Counterexample verification

Both counterexamples ran once via an inline `pnpm exec tsx` program importing the actual target factories. No source or test file was created or changed.

F1 used `createWorkspaceController` with a first failing transport read, then a successful checked workspace response. It used the real `createSubmissionSession`; only transport, owner input decoding, unused Canvas ports and UI callbacks were controlled fakes. Sequence: `await start(); online = true; await refresh(); await create('Demo')`. Result:

```json
{"restoreCount":0,"posts":0,"connected":true,"problem":{"code":"wrong-workspace","message":"The request belongs to another workspace","recovery":"Keep your draft. Correct the problem or reconnect, then reconcile any pending request."}}
```

F2 used `createRetainedEditor` with two A drafts, a failing read for B, and successful writes. Sequence: `restore('A'); edit('A','one'); edit('A','two'); restore('B'); discard('one')`. Result:

```json
{"snapshot":{"drafts":[{"key":"two","base":{"workspace":"A"}}],"problem":null},"lastWrite":{"key":"forms.B","value":[{"key":"two","base":{"workspace":"A"}}]}}
```

## Literal scoring evidence

Scores start from no presumed credit: each row states the observed basis. Ten means no blemish found within the bounded target review, not an unlimited proof. All targets contain functional factories/functions rather than demonstrated substitutable implementations run through a shared implementation contract suite; LSP is the fixed **7, not demonstrated**. Existing concrete host tests are useful evidence but do not establish that stronger claim.

### R — retained-editor.ts — 127/160

| Principle | Score | Target evidence |
|---|---:|---|
| SRP | 10 | 7–10,20–85: one retained-form lifecycle; feature policy injected. |
| OCP | 6 | 20–85: lifecycle steps fixed, collaborators injected. |
| LSP | 7 | 8–10,86–96: functional factory; substitution suite not demonstrated. |
| ISP | 5 | 21,32: retention 2/3; other binding methods all consumed. |
| DIP | 10 | 1–9: own declaration-only bindings, no concrete storage/framework import. |
| DRY | 10 | 20–27,62–64: shared save/discard policy; no additional repeated fact found. |
| KISS | 9 | 30–37: key advances while old state survives a failed restore, F2. |
| YAGNI | 10 | 8–10: generic lifecycle serves concrete object and wire forms in composition. |
| Typed error outcomes | 5 | 30,57,62,66: fallible void methods; coded diagnostics in state/report. |
| Idempotency/failure semantics | 5 | 29–37: documented workspace-scoped recovery has F2's data-overwrite gap. |
| Deep module | 10 | 8–10,66–84: small lifecycle hides persistence and asynchronous acknowledgement. |
| Law of Demeter | 10 | 20–84: direct binding calls and data-record reads only. |
| Immutability | 0 | 11–17,31,89–90: mutable closure state and listeners shared across calls. |
| Type safety | 10 | 1–97: no any or unchecked cast. |
| Cognitive complexity | 10 | 20–84: early guards, no SOP bad ternary idiom; targeted ESLint passes ≤2. |
| Testability | 10 | 9,21,32,58,73: all external behavior injected, fakes suffice. |

### W — wire-edits.ts — 148/160

| Principle | Score | Target evidence |
|---|---:|---|
| SRP | 10 | 7–9,87–115: replay captured wire edits into atomic Model changes. |
| OCP | 6 | 12–26: closed local registry must change for a new operation. |
| LSP | 7 | 4,8,88: pure functions; substitution not demonstrated. |
| ISP | 10 | 1–2,8–9: data-only inputs, no partially consumed behavior port. |
| DIP | 10 | 1–2: imports only own declaration modules, no concrete collaborators. |
| DRY | 5 | 32–79: repeated discriminant/no-op/replacement idiom, F7. |
| KISS | 10 | 28–29,88–99: explicit dispatch and ordered change composition. |
| YAGNI | 10 | 15–25: commands correspond to the existing typed wire-edit vocabulary. |
| Typed error outcomes | 10 | 8–9,88–115: total transformation over admitted typed drafts; owner validation occurs on apply. |
| Idempotency/failure semantics | 10 | 87–99: pure atomic change preparation, no external effect or crash window. |
| Deep module | 10 | 88–115: hides explicit Model reset-before-replace preservation policy. |
| Law of Demeter | 10 | 1–116: data traversal only, no indirect collaborator navigation. |
| Immutability | 10 | 34–85,109–115: copy updates; input relationships/sections retained untouched. |
| Type safety | 10 | 1–116: no any or unchecked cast; guards narrow union variants. |
| Cognitive complexity | 10 | 32–115: no nested/spread ternary idiom; simple map ternary at112 is not the SOP's bad idiom. ESLint passes ≤2. |
| Testability | 10 | 4–116: pure deterministic functions, no ambient dependencies. |

### C — workspace-session.ts — 126/160

| Principle | Score | Target evidence |
|---|---:|---|
| SRP | 10 | 20–21,458–488: workspace orchestration; domain policies injected. |
| OCP | 6 | 416–441,385–408: fixed start/recovery/edit sequence without step seam. |
| LSP | 7 | 21,458–488: functional controller factory; substitution not demonstrated. |
| ISP | 5 | 68,144,420,318–408: client2/3, inputs5/7, retention0/3; unused-port cap applies. |
| DIP | 10 | 1–19,21: own bindings, type-only imports; no concrete persistence/React dependencies. |
| DRY | 9 | 386–408: two copies of request/error/submission assembly, F9. |
| KISS | 9 | 416–441 versus110–119: restoration silently depends on first refresh success, F1. |
| YAGNI | 10 | 21–488: current workspace, source, inspector and submission flows; no speculative options found. |
| Typed error outcomes | 5 | 66,138,362,416,444–456: fallible public void commands; coded state diagnostics. |
| Idempotency/failure semantics | 5 | 416–441: startup/reconnect recovery gap F1 despite named journal ownership at330. |
| Deep module | 10 | 138–276,331–408: hides render cancellation, matching bases, receipt orchestration. |
| Law of Demeter | 10 | 304,352,511: session is a direct collaborator; its snapshots are data records. |
| Immutability | 0 | 31–59,139–142,462–486: shared mutable closure state/jobs/counters/listeners. |
| Type safety | 10 | 1–528: no any or unchecked cast. |
| Cognitive complexity | 10 | 66–119,138–276,490–528: early guards; no bad SOP idiom; ESLint passes ≤2. |
| Testability | 10 | 21,68,302,338: dependencies injected; built-in AbortController needs no real infrastructure. |

### S — authoring-store.ts — 143/160

| Principle | Score | Target evidence |
|---|---:|---|
| SRP | 10 | 27–100: translate conditional storage operations to Authoring contracts. |
| OCP | 6 | 38–48,87–92: swappable storage, fixed validation/read/commit steps. |
| LSP | 7 | 95–100: factory with concrete host test; shared implementation suite not demonstrated. |
| ISP | 5 | 39,78,90: Persistence3/6, backup/restore/close unused. |
| DIP | 5 | 11–16,95: dependency abstraction owned by Persistence detail side. |
| DRY | 10 | 28–35,51–84: error/snapshot/receipt validation knowledge centralized. |
| KISS | 10 | 38–48,71–92: explicit sequential checks with early returns. |
| YAGNI | 10 | 95–100: only required snapshot, receipt and commit roles exposed. |
| Typed error outcomes | 10 | 28–35,51–92: typed unions preserve error kinds and absence; no escaping throw established. |
| Idempotency/failure semantics | 10 | 80–100: receipt identity retained, conditional request unchanged, Authoring recovery owner named. |
| Deep module | 10 | 37–100: hides physical-to-owner identities, validation and error mapping behind three roles. |
| Law of Demeter | 10 | 39,78,90: direct storage calls, record reads only. |
| Immutability | 10 | 17,28–100: readonly mapping/const locals; no target-owned mutable session state. |
| Type safety | 10 | 1–101: schema decoding, no any or unchecked cast. |
| Cognitive complexity | 10 | 28–92: early-return checks; ESLint passes ≤2. |
| Testability | 10 | 95: storage injected; an in-memory fake can return all typed outcomes. |

### H — http-router.ts — 141/160

| Principle | Score | Target evidence |
|---|---:|---|
| SRP | 10 | 14–59: map admitted API operations to owner calls. |
| OCP | 6 | 33–52: owners injected but adding a route edits local registration. |
| LSP | 7 | 32,53–60: factory; substitution not demonstrated. |
| ISP | 5 | 20–25: admission passed through; decoder consumes mutation1/3; session/source methods fully used. |
| DIP | 10 | 1–3,32: consumer-owned RouterBindings and direct owner roles. |
| DRY | 10 | 15–29,50–51: one mutation decoder shared by preview/apply. |
| KISS | 10 | 33–59: explicit route table and typed unsupported-route outcome. |
| YAGNI | 10 | 33–52: implemented route subset only; unfinished features excluded from defect scope. |
| Typed error outcomes | 10 | 5,19,26–29,54–58: typed WireOutcome throughout; no actual untyped provider throw established. |
| Idempotency/failure semantics | 8 | 14–29,32: Authoring preserves retries, but public factory doc does not name crash recovery path/owner. |
| Deep module | 5 | 33–59: genuine method/path hiding but predominantly thin dispatch to owners. |
| Law of Demeter | 10 | 6–12,38–45: direct session/source calls; installation fields are data. |
| Immutability | 10 | 33–52: const readonly route map; no target-owned changing cross-call state. |
| Type safety | 10 | 1–61: no any or unchecked cast. |
| Cognitive complexity | 10 | 5–29,54–58: early guards and simple dispatch; ESLint passes ≤2. |
| Testability | 10 | 32: all owners injected, no native server needed. |

## Verification and limits

- Targeted ESLint on exactly the five sources passed with the repository's stricter Sonar cognitive-complexity limit of 2. This does not replace the manual 16-principle score.
- Existing host cases1,4,7 passed once: `pnpm exec vitest run apps/service/tests/storage.test.ts apps/service/tests/transport.test.ts apps/web/tests/recovery.test.ts` — 3 files, 3 cases, 756ms. No test count was added. Case7 includes retained object/wire recovery, unfinished text, newer typing, captured bases and section-local reset behavior.
- S's existing SQLite case confirms conditional versions, identical-request receipts and cross-workspace rejection. H's transport case verifies admission failures before mutation. These are in-process observations, not real-browser/socket acceptance.
- Narrow collaborator reads covered own declaration contracts, composition wiring, submission/source recovery, existing host fixtures/cases, Model route preservation, and HTTP exception boundary documentation. Collaborators were not additional audit targets; their internal defects were not scored against these files. The parent reported ongoing Library planner/admission additions outside scope.
- No E2E, browser audit, new tests, implementation changes, complete typecheck, full-suite run, capability reaudit or second audit was performed. Arbitrarily throwing injected fakes were not used to manufacture untyped-error findings.

Reviewed SHA-256 identities:

```text
R ba43b835c24dfc51c308079e3f412ee57d83e2fe797ad3d9ac626f572f073883
W 977a00a709e4e5f2d68dbd4516325429c4223ede700433aac784d047c4245584
C 2c89a20de3ca1e3788b80163d23cfeedaa78388b1304dbda44c3d50ff2a430ac
S 96670417fd6e3e9b341758b4872d1eafcfc78e0ea7f807f33eaffb1e8c191479
H 04a7600fd2fe9e3b65454e42dd71b156bf198a7830b00a1ba37a488f9b151675
```
