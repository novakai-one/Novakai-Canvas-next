# Increment B — final per-file review

Reviewed against `docs/standards/CODING-STANDARDS.md`, with whole-file scope for seven new modules and diff scope for eleven legacy files under ruling 23. No pre-awarded scores. These are source judgments after the active public-contract, independent replay, retained certificate and operations audits. No subagents used. The run-2 review is preserved separately.

All citations below are final-file line numbers. For each file the cited scope supplies the evidence for each row: one purpose (SRP); fixed policy/steps with no extension seam (OCP capped 6); **no subtype implementation, not demonstrated (LSP exactly 7)**; no unused behavioral port methods (ISP); imports only own core/declaration modules (DIP); shared formulas/references rather than duplicated policy (DRY); explicit data transformations (KISS); B-only required functionality (YAGNI); typed domain interruptions caught by the named public boundary, with unexpected programming failures propagating (error score 8 unless declaration-only); pure reconstruction as recovery (idempotency); hiding described in the scope (depth); only direct record reads (Demeter); copy/local-mutation evidence (immutability); no any/unchecked assertion (type safety; `as const` preserves literal information); style expressions noted below (cognitive style); no ambient clock/filesystem/framework (testability).

Local mutable maps/arrays score **5**, not 10. A green lint result is evidence for Sonar <=2, not a substitute for the style score. Data-only/facade targets score **5** for depth. Every deduction is retained even where the same cause affects another row.

## core/nested-support-equalities.ts — 146/160

**Scope:** Whole new file. **Evidence:** 11–49: two-pass zero-edge SCC discovery; 51–76: indexed component provenance; 81–121: stable collapse and maximum floor.

Mutable DFS sets, maps and buckets are invocation-local; recursion follows the finite graph.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 5 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Immutability 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## core/nested-embedding-solve.ts — 146/160

**Scope:** Whole new file. **Evidence:** 8–42: topological relaxation, independent edge replay, original equality floors and moved-alias receipt.

Local maps are mutated; typed reject/required route to the embedding Result boundary.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 5 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Immutability 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## core/nested-embedding-bodies.ts — 148/160

**Scope:** Whole new file. **Evidence:** 10–34: solved walls/gates; 36–67: section offsets and rigid node copies.

All records are copied. The returned port mapping contains a ternary: cognitive-style deduction.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 7 |
| Testability | 10 |

Worst three findings: OCP 6; LSP 7; Cognitive style 7. The concrete deductions are described above; no waiver is claimed.

## core/nested-embedding-roads.ts — 146/160

**Scope:** Whole new file. **Evidence:** 13–62: street identity/cap and driveway endpoints; 63–121: neighbor index, bijection and contact migration.

Map and endpoint-array mutation is local. No all-pairs discovery or ID parsing.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 5 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Immutability 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## core/nested-embedding-plan.ts — 145/160

**Scope:** Whole new file. **Evidence:** 8–19: road/lane rebinding; 21–58: retained gate planes; 60–103: endpoint copies and retained assignments.

Local gate-plane Map and endpoint variables mutate; one conditional expression at 56 is a style deduction.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 5 |
| Type safety | 10 |
| Cognitive style | 9 |
| Testability | 10 |

Worst three findings: Immutability 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## core/nested-embedding-validation.ts — 146/160

**Scope:** Whole new file. **Evidence:** 5–24: finite bounds and pair intersections; 28–34: bounded retained-contact replay.

Pure observer; intentionally thin validation module (depth 5).

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 5 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Depth / information hiding 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## core/nested-embedding.ts — 151/160

**Scope:** Whole new file. **Evidence:** 21–30: typed public failure boundary; 32–51: independent query; 55–106: one shared materializer and no-movement branch.

Fixed pipeline has no step-extension seam; callers reconstruct; all returned records are copied.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: OCP 6; LSP 7; Typed error outcomes 8. The concrete deductions are described above; no waiver is claimed.

## core/nested-support-graph.ts — 151/160

**Scope:** Diff versus 46f67c3. **Evidence:** 1,178–185: collapse zero-edge groups before unchanged Kahn admission.

Pure diff; positive self/cyclic failures remain in the existing typed boundary.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: OCP 6; LSP 7; Typed error outcomes 8. The concrete deductions are described above; no waiver is claimed.

## core/nested-support-input.ts — 145/160

**Scope:** Diff versus 46f67c3. **Evidence:** 1–6,52–113,124: shared retained record assembly and semantic driveway identity.

Local indexes mutate; nine explicit assembly arguments require following more context (KISS 9).

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 9 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 5 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Immutability 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## core/nested-support-paths.ts — 151/160

**Scope:** Diff versus 46f67c3. **Evidence:** 35–41: consume the already-observed supports or preserve the read-only query replay.

One source of template algebra; no copied formula and no change to support policy.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: OCP 6; LSP 7; Typed error outcomes 8. The concrete deductions are described above; no waiver is claimed.

## core/nested-support.ts — 151/160

**Scope:** Diff versus 46f67c3. **Evidence:** 15–68: Result adapter over one shared constraint compiler.

The public query still owns failure conversion; fixed compilation steps cap OCP.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: OCP 6; LSP 7; Typed error outcomes 8. The concrete deductions are described above; no waiver is claimed.

## core/nested-lane-projection.ts — 151/160

**Scope:** Added observer only, 469–504. **Evidence:** 472–504: observe adjusted connectors via existing connectionLine/connectorLine; original emission unchanged.

Lazy contact-region supplier is fully consumed; observation shares exact emitter algebra.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: OCP 6; LSP 7; Typed error outcomes 8. The concrete deductions are described above; no waiver is claimed.

## core/prototype-nested-scene.ts — 146/160

**Scope:** Diff versus 46f67c3. **Evidence:** 58–69: origin capture; 91–111: one support observation; 114–155: embedding boundary before one final network/projection.

Failure removes wiring from an invocation-local copy. Fixed builder pipeline and local maps earn OCP/mutation deductions.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 5 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Immutability 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## core/prototype-road-network.ts — 151/160

**Scope:** Diff versus 46f67c3. **Evidence:** 219,272–280: extract the existing construction-region expression for shared observation.

No changed junction union/ownership policy; pure extraction.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 8 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 10 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: OCP 6; LSP 7; Typed error outcomes 8. The concrete deductions are described above; no waiver is claimed.

## contract/records/nested-support.ts — 148/160

**Scope:** Added declarations. **Evidence:** 91–97,102,144–156: equality evidence and typed embedding Result.

Readonly data; no executable behavior, hence depth 5.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 10 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 5 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Depth / information hiding 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## contract/records/road-prototype.ts — 148/160

**Scope:** Added declarations. **Evidence:** 1,74: typed optional failure, absent on successful scenes.

Readonly data; failure does not masquerade as projected wiring. Depth 5.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 10 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 5 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Depth / information hiding 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## contract/api.ts — 148/160

**Scope:** Added export. **Evidence:** Final export: one public embedding operation from own core.

Declaration facade hides behavior in the operation; thin target gets depth 5.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 10 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 5 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Depth / information hiding 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## contract/index.ts — 148/160

**Scope:** Added export. **Evidence:** Final export: the only consumer entry to the new operation.

Controlled facade; no implementation imports by consumers. Depth 5.

| Principle | Score |
| --- | ---: |
| SRP | 10 |
| OCP | 6 |
| LSP | 7 |
| ISP | 10 |
| DIP | 10 |
| DRY | 10 |
| KISS | 10 |
| YAGNI | 10 |
| Typed error outcomes | 10 |
| Idempotency / recovery | 10 |
| Depth / information hiding | 5 |
| Law of Demeter | 10 |
| Immutability | 10 |
| Type safety | 10 |
| Cognitive style | 10 |
| Testability | 10 |

Worst three findings: Depth / information hiding 5; OCP 6; LSP 7. The concrete deductions are described above; no waiver is claimed.

## Verification evidence and limits

`verify-increment-b.mjs` exercises active complete builds and independent public query equivalence on all five fixtures, twice, and checks semantic/dimension/rank/demand preservation. `replay-increment-b.py` reconstructs scalar solutions without product imports, checks every constraint and physical contact, and resolves the 17 prior span witnesses. `verify-increment-b-frozen.mjs` verifies retained travels and nominal connector choices through observation-only public builds. The unchanged complete retained verifier passes templates/scale including its existing certificate negative controls. These are meaningful public-contract audits; no mirror tests or passing placeholders were added to the 208-test repository suite.

The zero-edge SCC rule covers exactly the six literal forced-equality components present here. Residual cycles still reject; this is not a general signed-cycle difference-constraints solver. DFS is recursive; the measured fixture/doubled regime is tested, not arbitrary unbounded recursion depth. The independent preflight/query accepts a reservation scene (the saved A baseline), not an already embedded scene. Those limitations are part of the interface/evidence, not silent legality or scale claims.
