# PR1 implementation and authorized correction checkpoint

Core PR1 behavior and the single authorized findings-only correction batch are implemented. **`pnpm check` passes; the literal per-file standards gate remains open.** Commit this checkpoint as requested, with the residuals below. No new audit was performed.

Branch: `feat/agent-diagram-composition`; base: `a14f04aa61a9d59dfb3a59052652b27368ea7486`. Correction began 2026-09-12 11:07:40 UTC in the main isolated `Novakai-Canvas-next-agent-diagrams` worktree. Read A1, A2, their verified disposition, all five PR1 specs, baseline/build-order and coding/folder standards. Existing orchestrator changes were preserved.

## Implemented behavior and verified fixes

- Model accepts optional grid columns 1..12 at collection, section and group scope; non-grid/range violations remain typed. Language preserves each scope through creation, print/read and ordered edits, including nested groups and separate table-column vocabulary.
- Existing measured Layout code already supplied physical horizontal tracks and vertical reading order. This correction did **not** change `grid.ts`. Explicit columns regenerate automatic history; current human placement and locks remain authoritative.
- Relative constraints now reject member and section-address qualifiers before conversion, with the actual declaration span and referenced ID. Plain objects and explicit group/section namespaces retain their original representation. Both verified qualifier counterexamples are asserted through public Language lowering.
- One narrow `lowering/layout-fields.ts` helper derives the canonical partition from `layoutProperties`; document, view and patch lowering share it. Layout lowering consumes the shared direction/gap defaults.
- All fallible exports in the five A1 targets return the existing Result type. The same verified signature/recovery correction covers the previously sub-145 Layout collection arrangement, placement policy and section placement entries. Existing protect/execute and accepted/requireValue bridge immediate callers. Public facades retain exactly `Result<T>`, without nested Results. Exported entry TSDoc identifies source/scene retention and correction/commit recovery owners.
- A2 now asserts independently specified per-ID row and column membership, aligned edges and strict separation for right/left/down/up. The coherently shifted node-only history includes title, section bounds and scene bounds; public inspection must return `{ valid: true, diagnostics: [] }` before explicit columns restore placement.
- Invalid patch vectors assert `invalid-value` for fractional columns and `domain` for range/non-grid edits, actual target paths and exact source spans. Provider failures cannot pass. The staged range target is `0.value.layout.columns`; non-grid policy targets `sections.main.layout.columns` and can also report mode incompatibility.

The stronger fractional assertion exposed existing integer-prefix parsing: `1.5` formerly failed as a following patch command at the dot. The necessary attribute-reader correction now reports the full decimal span and `columns` target. This is the sole parser prerequisite added to satisfy A2's requested diagnostic family; no lexical redesign or new syntax was introduced.

## Scope and verification

27 first-party source/test files differ from the base: the original 19 PR1 files, seven necessary caller/attribute-reader files, and one new shared Language partition helper. The exact inventory and current line counts are in Doc2; the compact standards report covers all 27 files. The two original Layout helpers remain. No capability-wide rewrite or speculative extension framework was added.

Frozen budget: **four new cases**, one each in existing Model sections, Language roundtrip, Layout arrangement and Layout contracts suites. Strengthened assertions stay inside those cases. Real native/WASM, routing, cleanup, cancellation and human-placement assertions remain; no E2E tests were added.

Final **`pnpm check` passed** on the corrected code: typecheck, ESLint/Sonar ≤2, all-source Prettier, architecture (**809 modules / 1880 dependencies**, no violations), and **51 files / 166 tests** in 6.35 seconds. Focused correction runs were used to resolve actual diagnostic targets and test-fixture syntax before that final full run. SQLite experimental warnings were emitted without suppression.

Only Doc2's necessary inventory changed in this batch. Final five-spec count: **602 words / 61 lines**, versus frozen **559 / 58**: **+7.69% / +5.17%**, both within 20%. Orchestrator-owned count/plan/audit records were not overwritten.

## Exact remaining issues and ownership

[standards.md](standards.md) replaces the former 613-line report with a 45-line matrix containing all 16 scores per file, concrete evidence and deductions. A1 targets score **153/148/153/153/148**; the three corrected Layout production entries score **153** each. No guard wrapper earns extra depth points.

The mandatory >144 gate still fails for:

- `language/core/lowering/expansion.ts`: **141**. This immediate caller only unwraps the new Result; its thin recipe rebinding still has a record-return signature with structured faults and unnamed entry recovery. Further conversion was left outside this bounded batch.
- `layout/tests/arrangement.test.ts`: retained **124**; `layout/tests/contracts.test.ts`: retained **125**. Real native infrastructure, mutable test instrumentation and assertion throws remain. Prior conservative cognitive deductions were not re-audited; removing those alone would still leave both below 145. Tests were not weakened to raise scores.

No remaining functional failure is known from the required checks. The conservative cache policy still recalculates a section when any nested scope has columns; no new large-scene performance claim is made. Browser, service/DSL demonstrations, PR publication and final mixed-collection acceptance belong to the orchestrator; this correction claims none of them.

No subagents, push, browser or service actions. No Presentation, Design System, host, resources/examples, PR4–6, ORCHESTRATION or PROGRESS files were written by this correction. Existing unrelated changes and orchestrator artifacts remain outside the checkpoint.
