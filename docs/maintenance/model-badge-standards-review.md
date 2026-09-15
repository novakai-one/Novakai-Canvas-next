# Model badge audit: corrected standards evidence

Reviewed 2026-09-15 against all sixteen anchors in
[CODING-STANDARDS.md](../standards/CODING-STANDARDS.md), including its structured-outcome
amendment. This supersedes the standards claims in the local builder round report.
These are manual target-file reviews, not an automated repository grade.

**The >144/160 gate is not met by every file.** The brief explicitly permits recording
threshold failures for reviewer decision. That option is used here; no exception is
self-approved. Real-font integration coverage remains intact. Green checks establish
behavior and mechanical constraints, not a passing manual standards score.

## Files and scores

All six TypeScript files changed by the badge feature are reviewed, including the
schema/vocabulary/annotation files that need no further edits in this fix round.

| Key | Target file | Total / 160 | >144 |
| --- | --- | ---: | --- |
| M | [Model composition schemas](../../capability/model/contract/records/composition.ts) | 140 | FAIL |
| L | [Language property vocabulary](../../capability/language/core/vocabulary/properties.ts) | 142 | FAIL |
| P | [Presentation block measurement](../../capability/presentation/core/content/blocks.ts) | 145 | PASS |
| A | [Presentation annotation measurement](../../capability/presentation/core/notation/annotations.ts) | 150 | PASS |
| LT | [Language composition tests](../../capability/language/tests/composition.test.ts) | 135 | FAIL |
| PT | [Presentation annotation tests](../../capability/presentation/tests/annotations.test.ts) | 120 | FAIL |

| Principle | M | L | P | A | LT | PT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. SRP | 10 | 10 | 10 | 10 | 10 | 10 |
| 2. OCP | 6 | 6 | 6 | 6 | 6 | 6 |
| 3. LSP | 7 | 7 | 7 | 7 | 7 | 7 |
| 4. ISP | 10 | 10 | 10 | 10 | 10 | 10 |
| 5. DIP | 10 | 10 | 10 | 10 | 10 | 5 |
| 6. DRY | 9 | 5 | 5 | 9 | 5 | 5 |
| 7. KISS | 10 | 9 | 9 | 9 | 9 | 9 |
| 8. YAGNI | 10 | 10 | 10 | 10 | 10 | 10 |
| 9. Typed error outcomes | 5 | 10 | 10 | 10 | 5 | 5 |
| 10. Idempotency / failure semantics | 8 | 10 | 10 | 10 | 8 | 8 |
| 11. Deep module / information hiding | 5 | 5 | 9 | 9 | 5 | 5 |
| 12. Law of Demeter | 10 | 10 | 10 | 10 | 10 | 10 |
| 13. Immutability | 10 | 10 | 10 | 10 | 10 | 10 |
| 14. Type safety | 10 | 10 | 10 | 10 | 10 | 10 |
| 15. Cognitive complexity | 10 | 10 | 9 | 10 | 10 | 10 |
| 16. Testability | 10 | 10 | 10 | 10 | 10 | 0 |
| **Total** | **140** | **142** | **145** | **150** | **135** | **120** |

## Evidence by principle

Line references below use the target files in the table. Collaborators are evidence;
only coupling chosen or failure behavior propagated by the target is scored.

1. **SRP:** M:4–19 declares composition values; L:5–126 declares property metadata;
   P:15–139 measures one content block; A:9–93 measures annotation capsules;
   LT:20–135 proves semantic composition round trips; PT:9–117 proves measured
   annotation/text behavior. Each has one reason to change.
2. **OCP:** M:13 and L:14 require editing closed vocabulary declarations. P:30–80
   owns a fixed processor table, A:9–93 fixed annotation assembly, and LT:20/75/112
   and PT:9/54/91 fixed scenarios. No target supplies an extension seam for its
   owned cases/steps. Apply the cap of 6, including declarations and tests;
   the original M/L scores of 9 were too generous.
3. **LSP:** exactly 7, **not demonstrated**, for all six. None supplies a shared
   substitutability suite for every implementation of an interface. P's exhaustive
   processor signature and PT's role parameterization alone do not establish that.
4. **ISP:** M/L/LT/PT declare no behavioral port; there is no fat declared interface
   to dock (10 is an absence-of-violation assessment, not measured utilization).
   P:15 declares only the callable Processor. P passes `metrics` and `assets` through
   its measurement flows; A's metrics flow through `labelContent`. Their one-method
   measurement/resource collaborators are fully consumed where used.
5. **DIP:** M:1 only binds a declaration-schema library; L:2–3 imports declarations
   and vocabulary defaults; P:1–13 and A:1–6 import own core/declaration contracts and
   receive metrics in context. LT:2 uses pure public Language/Model fixtures, no
   framework/storage behavior in domain logic. PT:10–12,55–61,94–96 chooses concrete
   `composePresentation` and ambient `fonts()` rather than injecting metric selection;
   the detail-side composition root owns that selection (5). This same chosen
   coupling also affects testability; the rubric forbids deduplicating deductions.
6. **DRY:** M:13 duplicates text-role vocabulary in L:14 (9). L repeats knowledge
   for frames (11–12), figure levels/fills (50–51), and keys/keyKind (58/61), with
   overlapping Model declarations (5). P repeats discriminator/mismatch guards
   across at least three processors (32,37,41,50,56,60,69,73,77; 5). A:23–25/59–61
   repeats capsule padding arithmetic in two paths (9). LT:27–35,88–101,115–123
   repeats print/lower/replace framing three times (5). PT:10–13,55–62,94–97
   repeats font/style/composition setup three times (5).
7. **KISS:** M's short enum declarations are direct (10). L's broad metadata table,
   P's discriminator guards plus dispatch, A's numbered-label arithmetic, LT's
   chained round-trip scenario setup, and PT's projection/primitive selection each
   impose one minor tracing burden (9 each); none warrants a claim of zero blemishes.
8. **YAGNI:** all targets implement current vocabulary, measurement or concrete
   regression scenarios. No unused extension point, option or speculative layer
   was found in M:1–19, L:1–126, P:1–139, A:1–93, LT:1–135 or PT:1–117 (10 each).
9. **Typed outcomes:** M exports Zod schemas (4–19), exposing both `safeParse` and
   throwing `parse`; Zod errors are distinguishable by class but the throwing route
   is absent from a return union (5, not 10 for that whole exported surface).
   L has no executable failure path and names Language protection in its first
   comment (10). P:82–105 documents its private structured failures behind public
   `project`; `core/validation/outcomes.ts:19–32,67–88` supplies the protecting Result
   boundary. A:57 names the same project failure owner (10 each under the repository
   amendment). LT's `value(...)` and PT's `assert(...)` expose assertion failures to
   Vitest, with distinguishable assertion classes, not a return Result (5 each).
   Tests have not been granted an unstated exemption from this row.
10. **Idempotency/failure:** M's declarations are repeatable but comments name no
    parse recovery owner (8). L:1 names protect/correct/retry; P:95–96 names project,
    input/resource correction and Authoring's retained scene; A:57 names project
    and measurement failure. Their immutable local computations have no durable
    crash gap (10). LT/PT build fresh fixtures on each invocation; retries are safe,
    but entry comments do not name Vitest as recovery owner (8 each).
11. **Depth:** M's six enum exports and L's two data tables contain real vocabulary
    knowledge with thin hidden behavior (5 each). P:97 has one measurement dispatch
    entry hiding multiple block families; A:58/85 hides capsule and numbered-label
    geometry, with some context/setup burden retained by callers (9 each).
    LT/PT hide fixture assembly and assertions but remain scenario harnesses rather
    than deep behavioral modules (5 each, not 8).
12. **Demeter:** across each complete target, calls go to direct imported functions,
    schemas, fixtures or local arrays. Reading `context.style`, projected records,
    or test expectations does not navigate another module's behavioral internals
    (10 each). Array chains over local values are not collaborator object chains.
13. **Immutability:** all six use const declarations and copies; P:114–116 and
    PT:57–60 copy context/token records. LT patches return new collections. No target
    assigns through a shared record, mutates a collection or maintains shared
    mutable state (10 each).
14. **Type safety:** no target contains `any` or an unchecked assertion. L:117/126
    uses `as const satisfies` to narrow checked declaration data, not to cast an
    unchecked runtime value. P's processor keys and role selection remain typed;
    test assertions narrow optionals explicitly (10 each).
15. **Complexity:** P:18/44 has simple ternary selection in separate functions
    (9); none of the other five targets contains a rubric conditional idiom
    warranting a dock (10). The actual ESLint Sonar gate is <=2 per function and
    passes; that gate is separate from this manual row.
16. **Testability:** M/L are deterministic declarations; P/A accept metric/resource
    ports with no ambient I/O; LT's pure Language/Model fixtures admit synthetic
    resource metadata without reading its nominal SVG path (10 each). PT:10/55/94
    calls `fonts()`; `presentation/tests/fixtures.ts:25–40` reads actual font files,
    and `composePresentation` selects native measurement. **0: needs real
    infrastructure to test.** The previous 8 is withdrawn. Changing this row alone
    would reduce the old claimed 147 to an optimistic ceiling of 139; 120 is the
    full re-review after applying the other anchors too.

## Threshold disposition and worst findings

1. PT requires real files/native font measurement: testability **0**, overall **120**.
   This useful integration test caught the actual badge bug. Replacing it with fake
   geometry to improve a score would weaken the evidence. Reviewer decision required.
2. M/L expose thin closed declarations (OCP **6**, depth **5**); M also exposes the
   throwing schema parse surface, while L repeats vocabulary facts. They score
   **140/142**, below threshold. The targeted role extension does not justify a
   schema/vocabulary architecture rewrite; reviewer decision required.
3. LT repeats three genuine round-trip scenarios and uses assertion failures
   (DRY **5**, typed outcomes **5**, depth **5**), totaling **135**. Its original
   caption scenario must remain verbatim and the new badge assertions additive.
   Reviewer decision required; no silent test-file exception is claimed.

P and A pass this review at **145/150**. All existing integration coverage is retained.
No standards threshold, exclusion, infrastructure fixture or engine was changed to
manufacture acceptance. The four-fix brief explicitly permits this reported failure
outcome; acceptance of the threshold failures remains with the reviewer.
