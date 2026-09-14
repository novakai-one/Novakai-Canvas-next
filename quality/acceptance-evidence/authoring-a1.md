# Authoring A1 — sole bounded implementation audit

Read-only implementation review of exactly five production targets on `feat/authoring-capability`. Authority: the five Authoring specs, `authoring-plan-decisions.md`, and the literal 16-principle anchors in `docs/standards/CODING-STANDARDS.md`. Own collaborators were evidence, not additional scored targets. No implementation changes or second audit. Stopped within the eight-minute bound.

All five targets exceed 144/160. Four suites / 14 Authoring cases pass. Targeted ESLint passes; an ESLint API measurement with the Sonar reporting threshold temporarily set to zero in memory establishes actual maxima: prepare 1, pipeline 1, inverse 2, commit 1, plain-data 2. No configuration files were changed. Tests establish protocol behavior with injected owners and real SQLite; they do not establish browser readiness.

## Findings pending parent verification

| Category | Exact location | Reproduction and consequence |
|---|---|---|
| major build risk | `core/admission/prepare.ts:19–27` | Receipt lookup and snapshot/precondition validation have a retry race. Start apply A; allow its receipt lookup to return null, then pause its snapshot reader. Apply B with the identical envelope through the ordinary harness and let it commit. Resume A's snapshot reader. B succeeds, but A returns `revision-conflict` at `collection/demo`, despite the matching receipt now being durable. No additional effect occurs, but the caller receives a failed edit instead of the original outcome promised by A02. This path never reaches commit reconciliation. |
| major build risk | `core/history/inverse.ts:10–16,19–31,45–52` | Historical before/after record identity is not checked against the transition key before its payload is restored. Public probe: create workspace records a={label:A}, b={label:B}; edit a; replace the returned snapshot's `tx:edit.transitions[0].before` with the intact stored record b. Keep transition key a and head participants unchanged. Undo using a's current expectation succeeds and commits a={label:B} at version 2. The injected malformed snapshot passes structural decoding; `checkParticipants` verifies only transition/head key sets, and `restoreRecord` discards the conflicting before-image key. Authoring should reject internally inconsistent owned history rather than apply another participant's payload. |

Both probes used the existing Authoring protocol/domain harness and actual SQLite commits. The history probe altered only an injected snapshot response, not database files or production code. Its domain-validator fixture continued to call public Model/Library validation. These are findings for skeptical verification, not claims of an ordinary client raw-write path.

Probe entry points: `capability/authoring/tests/fixtures.ts:149` (`harness`), `:101` (`request`), `:125` (`observed`), and `:136` (`record`); public calls are `capability/authoring/contract/api.ts:72` (`apply`) and `:76` (`undo`). The probes ran as transient Node processes against the existing fixture; no permanent probe file was added. The exact injected scheduling and malformed-data shapes are specified above, and observed outputs are recorded below.

### Observed probe outcomes

- Retry race: winner `ok:true`; delayed identical caller `ok:false`, code `revision-conflict`, path `collection/demo`.
- History mismatch: undo receipt `status:committed`, transaction `undo-probe`; workspace/a became `{label:"B"}`, version 2, although the supplied historical before-image identified workspace/b.

## Exact-anchor scorecard

P = `core/admission/prepare.ts`; A = `core/admission/pipeline.ts`; H = `core/history/inverse.ts`; C = `core/transactions/commit.ts`; J = `core/validation/plain-data.ts`. All references below are within these targets unless a collaborator is named.

| Principle | P | A | H | C | J | Evidence |
|---|---:|---:|---:|---:|---:|---|
| SRP | 10 | 10 | 10 | 10 | 10 | P13–35 owns admission/lease lifetime; A46–92 guarded candidate construction; H41–65 inverse proposals; C15–37 commit settlement reconciliation; J95–100 detached JSON decoding. |
| OCP | 6 | 6 | 6 | 6 | 6 | P19–34, A54–87, H45–58, C21–24 and J96–99 have fixed owned stages without a step extension seam. Providers/limits vary; those stages do not. This is the literal cap, not a recommendation to make mandatory guards optional. |
| LSP | 7 | 7 | 7 | 7 | 7 | No subtype implementation in these targets: not demonstrated, fixed seven. |
| ISP | 10 | 10 | 10 | 10 | 10 | P consumes every AdmissionDependencies role directly or through buildCandidate. A consumes each PlanningDependencies role. C uses both single-method commit/receipt roles. H/J have no unused behavioral ports. |
| DIP | 10 | 10 | 10 | 10 | 10 | Imports and signatures use own core/declaration contracts; no concrete framework/storage construction. IDs/hashes at the provider seams use checked domain brands. |
| DRY | 10 | 10 | 10 | 10 | 10 | P shares fingerprint/reconciliation/candidate helpers; A delegates candidate/dependency/resource rules; H shares key/version/history readers; C reuses reconciliation for failures; J centralizes descriptor/scalar/count checks. No extractable repeated policy established. |
| KISS | 10 | 10 | 10 | 10 | 10 | Explicit named stages and returns. P30–32 is a direct awaited continuation, not a hidden alternate admission path. J separates bounded type cases without nested ternaries. |
| YAGNI | 10 | 10 | 10 | 10 | 10 | Only the specified admission, history, settlement and JSON boundary responsibilities are present. |
| Typed error outcomes | 5 | 5 | 5 | 5 | 5 | These private exports return values/Promises of values and propagate structured AuthoringFault failures; failure kinds are distinguishable but absent from their signatures. Public facade protection is verified in the own collaborator `contract/api.ts`; this preserves public typed failures but does not change the literal target-file anchor. |
| Idempotency / failure semantics | 8 | 10 | 8 | 8 | 10 | P12, H40 and C14 do not name recovery ownership at the entry point, although recovery exists in their collaborators/module. A45 names Authoring recovery; J94 names Authoring rejection/draft retention. Replays do not duplicate writes; the false-conflict race is reported separately. |
| Deep modules | 10 | 10 | 10 | 10 | 10 | P hides receipt/snapshot/lease sequencing; A hides complete mandatory guard ordering; H hides participant/version/history restoration; C hides terminal acknowledgement recovery; J hides safe bounded copying. |
| Law of Demeter | 10 | 10 | 10 | 10 | 10 | Direct role/helper calls and record-field reads; no service navigation chains. |
| Immutability | 10 | 10 | 10 | 10 | 10 | Copies/maps construct results; no target-owned shared mutable state. P delegates decoded snapshots to the frozen boundary; A88 freezes the candidate. J copies descriptor values rather than freezing submitted objects. |
| Type safety | 10 | 10 | 10 | 10 | 10 | No any, unchecked assertions or non-null assertions in targets. Checked schemas and descriptor narrowing construct values. |
| Cognitive complexity | 10 | 10 | 10 | 10 | 10 | No prohibited named idioms found; measured per-file maxima 1/1/2/1/2 respectively. |
| Testability | 10 | 10 | 10 | 10 | 10 | Explicit providers/data; no ambient clock, filesystem, network or environment dependency in these targets. Public harness reproduced both findings. |
| **Total /160** | **146** | **148** | **146** | **146** | **148** | **All clear the strict >144 gate.** |

## Bounded conclusions

Required owner bridges are injected; the scripted planner is expressly a protocol fixture. Candidate validation and changed-candidate feasibility cannot be bypassed by preview=false. Resource protection encloses terminal commit/reconciliation; failed release cannot replace a committed receipt. Commit failures reconcile before propagating. No additional implementation defect is claimed for those sampled paths.

The JSON boundary rejects enumerable accessors without invoking them, nonfinite/unsupported values, cycles/depth, decorated arrays and excessive decoded size through typed public outcomes. No stress-performance guarantee was inferred from its shape tests. No extra audit targets or follow-up audit were added.
