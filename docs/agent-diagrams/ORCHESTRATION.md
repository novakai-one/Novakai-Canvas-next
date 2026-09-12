# Broad agent-authored diagrams — orchestration proposal

Status: revised after the single Kimi K3 + Codex Astra pressure-test round.
Date: 2026-09-12. Base: 70d36f6. Human UI feature work is deferred.

## Objective and boundaries

- Agents create polished engineering diagrams and educational infographics through readable DSL, without authoring JSON coordinates.
- Improve general composition, measured content, assets/themes, automatic arrangement and routing. Do not implement reference-image-specific renderers or layouts.
- Existing React Flow canvas is the presentation surface. Canvas content rendering is in scope; panel/editor redesign and human-authoring feature completion are deferred.
- Model owns valid meaning; Language translates DSL; Presentation measures/styles content; Layout owns geometry; Assets admits bytes; Templates expands ordinary editable intent. Authoring remains the sole mutation gate; Persistence owns physical writes.
- A theme/recipe can change data/configuration without transaction-internal edits. New semantics can require explicit coordinated public-contract extensions; do not pretend arbitrary future kinds are already extensible.

## Proposed PRs

|PR|Owned outcome|Scope and dependencies|Visible acceptance|
|---|---|---|---|
|1|Reusable composition foundations|Inventory eight families; add explicit grid columns across Model/Language/Layout; existing groups/content/sequence reused; freeze three composition probes|ER, nested illustrated comparison and sequence probes prove coordinate-free composition|
|2|Readable typography and content|Presentation text/table/signature layout, content-aware sizing, Design System hierarchy tokens, media slots and sequence notation; depends PR1 contract|Dense ER/module and long-label variants fit without clipped content or isolated signature punctuation|
|3|Assets and diagram themes|Complete CLI asset staging/preset admission; Assets owns bytes, Templates pins, Design System tokens, Presentation measurement; shared interfaces frozen before parallel work|Admitted images/fonts and two differently themed collections prove isolated tokens; section role accents support mixed diagrams|
|4|Balanced automatic arrangement|Layout collection/group/grid/tree/layered policies, compactness and measured spacing; acceptance depends PR2+3 integrated font/theme measurements; includes sequence fragments and state topology|Balanced comparison, hierarchy, nested and engineering views with varied content|
|5|Clear routing and labels|Layout endpoint sides, member anchors, branches, cycles, crossings and measured labels; after PR4; measured labels/markers reserve directional space; bounded routing failure remains explicit|Field-level ER, adapter dependencies and rework loops use readable economical routes|
|6|Reusable recipes and broad acceptance collection|Coordinate section admission limits for24 examples within existing1000-node/1500-wire bounds; assemble incremental recipes/examples; third held-out example per family after interface freeze; depends PR2–5|Three distinct examples per family, all on a mixed collection canvas, through real CLI create/read/edit and visible browser|

## Required final family matrix

Eight acceptance families: ER; modules/interfaces/functions; flow/SOP; sequence; state; mindmap/tree; educational story/infographic; structured grid/comparison.
Each family needs three distinct subjects and compositions/topologies. A relabelled copy or theme-only variation does not qualify. Each example uses real DSL through the service; preserve source, committed identity/revision and screenshot evidence.
Examples must vary label lengths, content density and topology. Include nested groups, cyclic flows, field/port endpoints, repeated comparison panels, icon/image-plus-text compositions, sequence alternatives and hierarchical branches across the corpus. Images are individual assets; never a screenshot of a complete reference used as a diagram background.
All semantic wires are labelled. At 1600×1100, each 5–12-primary-node example must frame its title/bounds with effective text >=12px; larger examples additionally require readable detail captures. Zero unintended clipping, overlaps, wrong anchors/cardinalities or Layout.inspect errors. Review avoidable detours/crossings, not a universal crossing ban. Preserve printed readouts and meaningful edits. Fit-all is navigation only; record limitations honestly.

## Per-PR SOP

User clarification: round limits bound repeated audit/fix/re-audit cycles. They do not prohibit continuing implementation or fixing known defects to achieve the original visual-quality goal. Completed audit rounds remain closed; further implementation does not silently start another audit.

1. Five terse scoped specs: tree, entities/invariants + file/estimated LOC inventory, modules/contracts, ownership/CRUD, build/test appendix. State responsibility. Record baseline words/lines and exact justified test budget; existing tests can be extended, no E2E suites.
2. One fresh-context plan pressure test, eight-minute maximum. Classification exactly: engineering violation / major build risk / preference / minor. Scope limited to this PR.
3. Verify findings skeptically; one correction round; word/line growth each <=20%; no second plan audit.
4. Build a complete contract-to-CLI-to-render slice; meaningful checks; DSL dogfood whenever a visible improvement is expected. Use different subjects from references.
5. A1 spec/coding audit and A2 test-correctness audit, eight minutes each, <=5 target files each. A2 tries three assertion counterexamples or reports none. A1 must inspect browser screenshot evidence. Use actual visible browser checks; no headless substitutes.
6. One verified findings-only implementation correction round, relevant checks, no re-audit. One additional bounded agent realignment/correction is permitted if a delegate deviates; record trigger and outcome, not an unlimited retry loop.
7. Commit and PR with evidence and residual gates; never merge automatically. Every changed source file requires honest >144/160 evidence and Sonar <=2/function; sampled audits do not certify unsampled files.

## Orchestration and interference control

- One orchestrator owns the integration branch, shared contracts, final service/browser and PR assembly.
- PR1 sequential. PR2/3 may run in isolated worktrees after orchestrator freezes metric-bearing interfaces. PR4 acceptance follows both; PR5 follows integrated PR4 geometry. PR2–5 each deposit recipes and original DSL evidence. PR6 assembles all24; independent fixture authoring is permitted.
- CLI builders: Kimi K3, Codex Astra or Codex 5.6 Sol. Fresh minimal briefs; no inherited thread; one scoped deliverable per worker. No worker starts another agent, modifies main checkout, pushes, merges or controls shared browser/service unless expressly assigned.
- Pin base SHA, branch, owned paths, output path, tests and time limits before launch. Orchestrator inspects actual diffs and process logs for scope drift. Overlap in changed contracts serializes the affected work. Worktrees prevent accidental file collision, not conceptual conflict.
- Initial two reviewers critique this proposal only. They may inspect relevant implementation to identify risks, not audit the whole repository. Exactly one initial round.

## Three before / three target references

Before images are actual Atlas app captures at `quality/agent-diagrams/references/before/{er,modules,sop}.png`.
Target images are external benchmarks, not app output: `quality/agent-diagrams/references/target/{er,modules,infographic}.png`.

|Target|Source|Quality to borrow|
|---|---|---|
|ER|https://www.conceptdraw.com/How-To-Guide/erd-er-diagram-styles|Compact ER composition, visible cardinality and labelled relationships; use typed fields as additionally required|
|Modules|https://c4model.com/diagrams/component|Explicit boundaries/roles, labelled dependencies, meaningful grouping|
|Infographic|https://bytebytego.com/guides/top-5-caching-strategies/|Repeated comparison structure, icons, concise annotations and visual hierarchy|

Reference material is review evidence with attribution, not a bundled product asset library. Acceptance diagrams must be original subjects/compositions.
