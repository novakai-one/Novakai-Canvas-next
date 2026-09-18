# Increment A — per-file source review

Basis: `docs/standards/CODING-STANDARDS.md`, all sixteen anchors; repository import contract; Sonar cognitive complexity <=2. Reviews performed after implementation and public audits. Scores below are judgments supported by the cited code, not tool-generated grades. No subagents were used.

New source and road construction reviewed whole-file. The projection observer is **diff-scope lines405–466**, following the established ruling-23 scope recorded in `ownership/source-review.md`; its first400 lines remain byte-identical. API/index review covers their boundary behavior, including the new exports. Audit-only scripts/evidence follow ruling22; they are not product imports. No assertion or baseline was relaxed.

Direct collaborators read: existing placement, routing, registry/contact construction, allocation, capacity, pin and projection implementations; all support modules; public records/API. Public audits exercise current fixtures and negative controls; repository checks enforce type/import/complexity constraints.

| File                                                   |       Score | Scope              |
| ------------------------------------------------------ | ----------: | ------------------ |
| `capability/layout/contract/records/nested-support.ts` | **148/160** | Whole target       |
| `capability/layout/core/nested-support.ts`             | **151/160** | Whole target       |
| `capability/layout/core/nested-support-input.ts`       | **149/160** | Whole target       |
| `capability/layout/core/nested-support-graph.ts`       | **150/160** | Whole target       |
| `capability/layout/core/nested-support-structure.ts`   | **150/160** | Whole target       |
| `capability/layout/core/nested-support-paths.ts`       | **149/160** | Whole target       |
| `capability/layout/core/nested-support-mouths.ts`      | **150/160** | Whole target       |
| `capability/layout/core/prototype-nested-roads.ts`     | **151/160** | Whole target       |
| `capability/layout/core/nested-lane-projection.ts`     | **150/160** | Observer diff only |
| `capability/layout/contract/api.ts`                    | **149/160** | Whole target       |
| `capability/layout/contract/index.ts`                  | **148/160** | Whole target       |

## Records

Target: `capability/layout/contract/records/nested-support.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                   |
| -------------------------- | ----: | -------------------------------------------------------------------- |
| SRP                        |    10 | 5–110: one feasibility request/ledger vocabulary                     |
| OCP                        |     6 | 50–60,113–132: adding a constraint/failure kind edits unions (cap 6) |
| LSP                        |     7 | No subtype implementations in declaration file; not demonstrated     |
| ISP                        |    10 | Only immutable data; no behavioral port to over-consume              |
| DIP                        |    10 | 1–2: own declaration records only                                    |
| DRY                        |    10 | 12–110: one declaration for each retained fact                       |
| KISS                       |    10 | 5–132: explicit records/discriminants                                |
| YAGNI                      |    10 | Only A outcomes, no geometry/materializer API                        |
| Typed error outcomes       |    10 | 113–132: typed failure and Result discriminants                      |
| Idempotency / recovery     |    10 | 5,90,128: read-only query; no partial success                        |
| Depth / information hiding |     5 | Declaration vocabulary only; behavior lives behind public operation  |
| Law of Demeter             |    10 | No collaborator behavior navigation                                  |
| Immutability               |    10 | Every field readonly, including arrays/tuples                        |
| Type safety                |    10 | No any or unchecked casts                                            |
| Cognitive style            |    10 | No executable branches                                               |
| Testability                |    10 | Data fixtures construct every outcome                                |

**Total: 148/160.** Worst three findings: Depth / information hiding 5 — Declaration vocabulary only; behavior lives behind public operation; OCP 6 — 50–60,113–132: adding a constraint/failure kind edits unions (cap 6); LSP 7 — No subtype implementations in declaration file; not demonstrated.

## Boundary

Target: `capability/layout/core/nested-support.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                                 |
| -------------------------- | ----: | -------------------------------------------------------------------------------------------------- |
| SRP                        |    10 | 14–60: one pure admission operation                                                                |
| OCP                        |     6 | 21–33: fixed compilation stages, no extension seam (cap 6)                                         |
| LSP                        |     7 | No subtype implementation; not demonstrated                                                        |
| ISP                        |    10 | Request records, no fat behavioral ports                                                           |
| DIP                        |    10 | 1–9: own core/declaration-only imports                                                             |
| DRY                        |    10 | Stages each invoked once; no copied support formula                                                |
| KISS                       |    10 | 14–19,63–66: explicit result boundary                                                              |
| YAGNI                      |    10 | No embedding, projection emission, UI or retry                                                     |
| Typed error outcomes       |     8 | 11–12,63–66: typed domain failures; unexpected programming errors explicitly propagate (deduction) |
| Idempotency / recovery     |    10 | 11: caller reconstruction named; all state local                                                   |
| Depth / information hiding |    10 | 14: one public operation hides compiler/admission                                                  |
| Law of Demeter             |    10 | 21–60: direct collaborator records only                                                            |
| Immutability               |    10 | Only const values and new result records                                                           |
| Type safety                |    10 | unknown narrowed by instanceof; no casts/any                                                       |
| Cognitive style            |    10 | Flat stage calls; catch handling extracted; ESLint <=2                                             |
| Testability                |    10 | Only explicit request; public fixture/control audit                                                |

**Total: 151/160.** Worst three findings: OCP 6 — 21–33: fixed compilation stages, no extension seam (cap 6); LSP 7 — No subtype implementation; not demonstrated; Typed error outcomes 8 — 11–12,63–66: typed domain failures; unexpected programming errors explicitly propagate (deduction).

## Input

Target: `capability/layout/core/nested-support-input.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                                            |
| -------------------------- | ----: | ------------------------------------------------------------------------------------------------------------- |
| SRP                        |    10 | 20–83: recover authoritative reservation inputs                                                               |
| OCP                        |     6 | 20–65: fixed replay stages (cap 6)                                                                            |
| LSP                        |     7 | No subtyping; not demonstrated                                                                                |
| ISP                        |    10 | 17,27: single callable observation/measurement slots                                                          |
| DIP                        |    10 | 1–15: own core and declaration records                                                                        |
| DRY                        |     8 | 20–43 repeats orchestration knowledge from existing builder, although algorithms reused (two-point deduction) |
| KISS                       |     9 | Long assembly function with several local indexes (deduction)                                                 |
| YAGNI                      |    10 | Only retention, mismatch validation and audit indexes                                                         |
| Typed error outcomes       |    10 | 38,44–46,87–90,127–135: typed SupportRejection converted by boundary                                          |
| Idempotency / recovery     |    10 | All Maps per call; public boundary names reconstruction                                                       |
| Depth / information hiding |    10 | 20: retains plan, provenance and demand behind one operation                                                  |
| Law of Demeter             |    10 | Calls declared core functions; consumes records directly                                                      |
| Immutability               |     9 | 27–28,52–55,137–141: invocation-local Map/array mutation                                                      |
| Type safety                |    10 | No unchecked casts or any; required lookup guards                                                             |
| Cognitive style            |    10 | ESLint <=2; no spread-ternary return machinery                                                                |
| Testability                |    10 | Semantic spec/scene explicit; public audit compares all populations/ranks                                     |

**Total: 149/160.** Worst three findings: OCP 6 — 20–65: fixed replay stages (cap 6); LSP 7 — No subtyping; not demonstrated; DRY 8 — 20–43 repeats orchestration knowledge from existing builder, although algorithms reused (two-point deduction).

## Graph

Target: `capability/layout/core/nested-support-graph.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                        |
| -------------------------- | ----: | ----------------------------------------------------------------------------------------- |
| SRP                        |    10 | 47–183: scalar equality/separation admission                                              |
| OCP                        |     6 | 87–97,138–174: fixed admissibility policy (cap 6)                                         |
| LSP                        |     7 | No subtype contract; not demonstrated                                                     |
| ISP                        |    10 | Small graph record; no infrastructure port                                                |
| DIP                        |    10 | 1–5: declaration-only outcome shapes                                                      |
| DRY                        |    10 | 70–84: one representative/equality implementation                                         |
| KISS                       |     9 | Equality representatives plus queue traversal require multiple passes to read (deduction) |
| YAGNI                      |    10 | No optimization solver/materializer or retries                                            |
| Typed error outcomes       |    10 | 31–42,65–68,138–174: private typed interruptions, boundary named at26                     |
| Idempotency / recovery     |    10 | 47: graph state local; no committed state to recover                                      |
| Depth / information hiding |    10 | 177–183: collapse and Kahn admission hidden together                                      |
| Law of Demeter             |    10 | Only supplied graph/maps and records                                                      |
| Immutability               |     8 | Many local Map/queue mutations including path compression (two-point deduction)           |
| Type safety                |    10 | No casts/any; missing groups guarded                                                      |
| Cognitive style            |    10 | ESLint <=2 in all functions                                                               |
| Testability                |    10 | Public graph replay verifies every inequality/topological edge                            |

**Total: 150/160.** Worst three findings: OCP 6 — 87–97,138–174: fixed admissibility policy (cap 6); LSP 7 — No subtype contract; not demonstrated; Immutability 8 — Many local Map/queue mutations including path compression (two-point deduction).

## Structure

Target: `capability/layout/core/nested-support-structure.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                 |
| -------------------------- | ----: | ---------------------------------------------------------------------------------- |
| SRP                        |    10 | 21–36: construction-owned tracks/envelopes                                         |
| OCP                        |     6 | 38–306: fixed structural cases (cap 6)                                             |
| LSP                        |     7 | No subtyping; not demonstrated                                                     |
| ISP                        |    10 | Only input/graph records and readonly indexes                                      |
| DIP                        |    10 | 1–14: own core and records                                                         |
| DRY                        |     9 | 18: small axis/dimension lookup repeated in support modules (deduction)            |
| KISS                       |     9 | Track/frame/child anchor conventions require several helpers (deduction)           |
| YAGNI                      |    10 | No collision search or geometry update                                             |
| Typed error outcomes       |    10 | 76–82,119–136,193–214: required/typed unsupported paths                            |
| Idempotency / recovery     |    10 | Only query-local graph additions; boundary owns retry                              |
| Depth / information hiding |    10 | 21: one compilation entry hides grid/body/cap constraints                          |
| Law of Demeter             |    10 | Only direct Input fields; no sibling adapter access                                |
| Immutability               |     9 | Local line/width indexes and graph mutation (deduction)                            |
| Type safety                |    10 | No any/unchecked casts; const-literal axis maps                                    |
| Cognitive style            |    10 | ESLint <=2; flat handlers                                                          |
| Testability                |    10 | Public verifier covers every owned street four-sided envelope and terminal support |

**Total: 150/160.** Worst three findings: OCP 6 — 38–306: fixed structural cases (cap 6); LSP 7 — No subtyping; not demonstrated; DRY 9 — 18: small axis/dimension lookup repeated in support modules (deduction).

## Paths

Target: `capability/layout/core/nested-support-paths.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                                |
| -------------------------- | ----: | ------------------------------------------------------------------------------------------------- |
| SRP                        |    10 | 26–39: retained path support and adjustment classification                                        |
| OCP                        |     6 | 96–148,188–220: fixed selected-template cases (cap 6)                                             |
| LSP                        |     7 | No subtyping; not demonstrated                                                                    |
| ISP                        |    10 | Input records and narrow Map operations; no infrastructure port                                   |
| DIP                        |    10 | 1–11: own projection algebra and declarations                                                     |
| DRY                        |     9 | 23: repeated dimension vocabulary; actual fan/connect formulas reused (deduction)                 |
| KISS                       |     8 | 41–94 and reference-offset model need careful tracking; long argument lists (two-point deduction) |
| YAGNI                      |    10 | No emitted segment repair or witness ID branching                                                 |
| Typed error outcomes       |    10 | 50–52,150–165,207–220,306–308: typed rejection paths                                              |
| Idempotency / recovery     |    10 | Per-call indexes and arrays; caller reconstruction at public entry                                |
| Depth / information hiding |    10 | 26: hides offset references, reach constraints and exact emission check                           |
| Law of Demeter             |    10 | Direct records/maps only                                                                          |
| Immutability               |     9 | Local previous reference and output arrays mutate (deduction)                                     |
| Type safety                |    10 | No any/unchecked casts; guarded retained endpoints                                                |
| Cognitive style            |    10 | ESLint <=2; no nested ternaries                                                                   |
| Testability                |    10 | Public comparison against independent observer verifies every adjustment                          |

**Total: 149/160.** Worst three findings: OCP 6 — 96–148,188–220: fixed selected-template cases (cap 6); LSP 7 — No subtyping; not demonstrated; KISS 8 — 41–94 and reference-offset model need careful tracking; long argument lists (two-point deduction).

## Mouths

Target: `capability/layout/core/nested-support-mouths.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                     |
| -------------------------- | ----: | -------------------------------------------------------------------------------------- |
| SRP                        |    10 | 27–40: terminal/gate feasibility                                                       |
| OCP                        |     6 | 42–54,95–142: fixed terminal/gate policies (cap 6)                                     |
| LSP                        |     7 | No subtyping; not demonstrated                                                         |
| ISP                        |    10 | MouthContext is data, not a fat service port                                           |
| DIP                        |    10 | 1–14: own core/declaration records                                                     |
| DRY                        |     9 | 17: repeated small axis vocabulary (deduction)                                         |
| KISS                       |     9 | Gate bounds, tangential reach and side ordering distributed across helpers (deduction) |
| YAGNI                      |    10 | Only retained gate identities/intervals; no center selection or geometry               |
| Typed error outcomes       |    10 | 87–90,95–104,118–122: typed pin/contact/interval failures                              |
| Idempotency / recovery     |    10 | Local graph/index state; boundary names reconstruction                                 |
| Depth / information hiding |    10 | 27: one entry hides separate tangent/normal logic                                      |
| Law of Demeter             |    10 | Only direct input/maps; no chained collaborator behavior                               |
| Immutability               |     9 | Per-call grouping/index arrays mutate (deduction)                                      |
| Type safety                |    10 | No any/unchecked casts; explicit tuples                                                |
| Cognitive style            |    10 | ESLint <=2 in all functions                                                            |
| Testability                |    10 | Public empty interval/pin controls and normal/tangent coverage assertions              |

**Total: 150/160.** Worst three findings: OCP 6 — 42–54,95–142: fixed terminal/gate policies (cap 6); LSP 7 — No subtyping; not demonstrated; DRY 9 — 17: repeated small axis vocabulary (deduction).

## Road construction

Target: `capability/layout/core/prototype-nested-roads.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                              |
| -------------------------- | ----: | ----------------------------------------------------------------------------------------------- |
| SRP                        |    10 | 19–127,130–217: construct topology-owned roads/contacts                                         |
| OCP                        |     6 | 19–74: fixed frame/grid/child families (cap 6)                                                  |
| LSP                        |     7 | No subtype implementation; not demonstrated                                                     |
| ISP                        |    10 | 104–107: optional single-method provenance observer                                             |
| DIP                        |    10 | 1–9: own placement/geometry/records only                                                        |
| DRY                        |    10 | 19–74: origins attached at construction, not reconstructed by parsing                           |
| KISS                       |     9 | 76–127: grouping/merging and identity conventions require care (deduction)                      |
| YAGNI                      |    10 | Only merged provenance added; road output shape unchanged                                       |
| Typed error outcomes       |    10 | Valid construction input produces data; provenance callback belongs to preflight typed boundary |
| Idempotency / recovery     |    10 | No global state; callback optional; ordinary builder deterministic twice                        |
| Depth / information hiding |    10 | 104: hides grouping and merge provenance                                                        |
| Law of Demeter             |    10 | Only placement/road records read                                                                |
| Immutability               |     9 | 63–74,115–118: local x/Map updates (deduction)                                                  |
| Type safety                |    10 | No any/unchecked casts; literal narrowing only                                                  |
| Cognitive style            |    10 | ESLint <=2                                                                                      |
| Testability                |    10 | All five byte/operation receipts equal base                                                     |

**Total: 151/160.** Worst three findings: OCP 6 — 19–74: fixed frame/grid/child families (cap 6); LSP 7 — No subtype implementation; not demonstrated; KISS 9 — 76–127: grouping/merging and identity conventions require care (deduction).

## Projection observer

Target: `capability/layout/core/nested-lane-projection.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                                       |
| -------------------------- | ----: | -------------------------------------------------------------------------------------------------------- |
| SRP                        |    10 | 405–466: read selected supports without emission                                                         |
| OCP                        |     6 | 405–466: observer follows fixed selected-template stages (cap 6)                                         |
| LSP                        |     7 | No subtyping; not demonstrated                                                                           |
| ISP                        |    10 | Readonly wires/assignment/road maps only                                                                 |
| DIP                        |    10 | Imports unchanged: own core/records                                                                      |
| DRY                        |     9 | 450–464 replays join accumulation from existing projector (deduction); fan/connect/clamp formulas reused |
| KISS                       |     9 | 424–450: redundant guard plus defined-ends helper adds indirection (deduction)                           |
| YAGNI                      |    10 | No modification to first400 lines or emitter behavior                                                    |
| Typed error outcomes       |    10 | Missing end guards mirror retained projector; complete allocations validated by preflight; no new throw  |
| Idempotency / recovery     |    10 | 404: recovery caller reconstruction explicitly named                                                     |
| Depth / information hiding |    10 | 405: one private observer entry hides all template formulas                                              |
| Law of Demeter             |    10 | Direct returned allocation records only                                                                  |
| Immutability               |     9 | 453–465: local joins array updates (deduction)                                                           |
| Type safety                |    10 | Guarded optional ends; no casts/any                                                                      |
| Cognitive style            |    10 | ESLint <=2                                                                                               |
| Testability                |    10 | Independent AST observer matches all 86 adjustments; builder bytes unchanged                             |

**Total: 150/160.** Worst three findings: OCP 6 — 405–466: observer follows fixed selected-template stages (cap 6); LSP 7 — No subtyping; not demonstrated; DRY 9 — 450–464 replays join accumulation from existing projector (deduction); fan/connect/clamp formulas reused.

## API

Target: `capability/layout/contract/api.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                                                        |
| -------------------------- | ----: | ----------------------------------------------------------------------------------------- |
| SRP                        |    10 | 12–57: callable Layout boundary                                                           |
| OCP                        |     6 | 12–32: fixed operation assembly;57 explicit export (cap6)                                 |
| LSP                        |     7 | No alternative subtype implementation established; not demonstrated                       |
| ISP                        |    10 | Dependencies consumed by named Layout flows; new export has no dependency bag             |
| DIP                        |    10 | Own core binding, no concrete adapters                                                    |
| DRY                        |    10 | 57 exports implementation directly; no duplicate wrapper                                  |
| KISS                       |    10 | Explicit functions/exports                                                                |
| YAGNI                      |    10 | Only requested callable added                                                             |
| Typed error outcomes       |     8 | 57 preserves preflight typed domain result and documented exceptional rethrow (deduction) |
| Idempotency / recovery     |    10 | Public operation carries reconstruction comment from implementation                       |
| Depth / information hiding |     8 | Mostly boundary forwarding; substantive validation behind it (two-point deduction)        |
| Law of Demeter             |    10 | Only direct core operations                                                               |
| Immutability               |    10 | 32 frozen Layout surface; no shared state                                                 |
| Type safety                |    10 | Typed result signatures; no any/casts                                                     |
| Cognitive style            |    10 | ESLint <=2                                                                                |
| Testability                |    10 | Public entry used by evidence and existing tests                                          |

**Total: 149/160.** Worst three findings: OCP 6 — 12–32: fixed operation assembly;57 explicit export (cap6); LSP 7 — No alternative subtype implementation established; not demonstrated; Typed error outcomes 8 — 57 preserves preflight typed domain result and documented exceptional rethrow (deduction).

## Public index

Target: `capability/layout/contract/index.ts`. Line citations refer to this final source.

| Principle                  | Score | Evidence / finding                                    |
| -------------------------- | ----: | ----------------------------------------------------- |
| SRP                        |    10 | 1–133: explicit capability exports                    |
| OCP                        |     6 | Adding public operation requires export edit (cap6)   |
| LSP                        |     7 | No subtyping; not demonstrated                        |
| ISP                        |    10 | No declared behavioral bag                            |
| DIP                        |    10 | Only own contract modules                             |
| DRY                        |    10 | Operation/type exports each explicit                  |
| KISS                       |    10 | No wildcard export                                    |
| YAGNI                      |    10 | One requested public preflight surface                |
| Typed error outcomes       |    10 | Re-exports declared Result/failure vocabulary         |
| Idempotency / recovery     |    10 | No effects; public implementation owns reconstruction |
| Depth / information hiding |     5 | Declaration/export boundary only (score5)             |
| Law of Demeter             |    10 | No collaborator navigation                            |
| Immutability               |    10 | Declarations only                                     |
| Type safety                |    10 | No any/unchecked casts                                |
| Cognitive style            |    10 | No executable control flow                            |
| Testability                |    10 | All external evidence imports only this entry         |

**Total: 148/160.** Worst three findings: Depth / information hiding 5 — Declaration/export boundary only (score5); OCP 6 — Adding public operation requires export edit (cap6); LSP 7 — No subtyping; not demonstrated.

All scores exceed144. The lower OCP/LSP anchors are retained: fixed policy is not excused by YAGNI, and lack of subtype evidence is not awarded10. Local mutation, duplicated axis vocabulary, orchestration repetition and lengthy helper signatures are deducted where present. These reviews establish source standards only, not scene legality or future B/C sufficiency.
