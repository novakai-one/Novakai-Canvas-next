# Broad agent-authored diagrams — orchestration proposal

Status: initial proposal for one Kimi K3 + one Codex Astra pressure-test round.
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
|1|Reusable composition foundations|Minimum composition intent across Model/Language/Presentation/Layout; one complete vertical slice; freeze contracts before parallel workers|One new subject demonstrates grouping, reading order and arrangement without coordinates|
|2|Readable typography and content|Presentation text/table/signature layout, content-aware sizing, reusable hierarchy; depends PR1 contract|Dense ER/module and long-label variants fit without clipped content or isolated signature punctuation|
|3|Assets and diagram themes|CLI/service resource staging through existing Assets/Authoring; approved image/icon/font bytes, diagram theme pins; depends PR1 contract|New illustrated explanations with reusable assets and meaningful themes, no UI editor requirement|
|4|Balanced automatic arrangement|Layout collection/group/grid/tree/layered policies, compactness and measured spacing; depends PR2 geometry input|Balanced comparison, hierarchy, nested and engineering views with varied content|
|5|Clear routing and labels|Layout endpoint sides, member anchors, branches, cycles, crossings and measured labels; share PR4 geometry contract|Field-level ER, adapter dependencies and rework loops use readable economical routes|
|6|Reusable recipes and broad acceptance collection|General recipes and 24 DSL examples; depends PR2–5 integration|Three distinct examples per family, all on a mixed collection canvas, through real CLI create/read/edit and visible browser|

## Required final family matrix

Eight acceptance families: ER; modules/interfaces/functions; flow/SOP; sequence; state; mindmap/tree; educational story/infographic; structured grid/comparison.
Each family needs three distinct subjects and compositions/topologies. A relabelled copy or theme-only variation does not qualify. Each example uses real DSL through the service; preserve source, committed identity/revision and screenshot evidence.
Examples must vary label lengths, content density and topology. Include nested groups, cyclic flows, field/port endpoints, repeated comparison panels, icon/image-plus-text compositions, sequence alternatives and hierarchical branches across the corpus. Images are individual assets; never a screenshot of a complete reference used as a diagram background.
All semantic wires are labelled. Content is readable at a practical viewing scale; fit-all collection overview is navigation, not proof of per-diagram readability. Record failures/limitations honestly.

## Per-PR SOP

1. Five terse scoped specs: tree, entities/invariants + file/estimated LOC inventory, modules/contracts, ownership/CRUD, build/test appendix. State responsibility. Record baseline words/lines and exact justified test budget; existing tests can be extended, no E2E suites.
2. One fresh-context plan pressure test, eight-minute maximum. Classification exactly: engineering violation / major build risk / preference / minor. Scope limited to this PR.
3. Verify findings skeptically; one correction round; word/line growth each <=20%; no second plan audit.
4. Build a complete contract-to-CLI-to-render slice; meaningful checks; DSL dogfood whenever a visible improvement is expected. Use different subjects from references.
5. A1 spec/coding audit and A2 test-correctness audit, eight minutes each, <=5 target files each. A2 tries three assertion counterexamples or reports none. A1 must inspect browser screenshot evidence. Use actual visible browser checks; no headless substitutes.
6. One verified findings-only implementation correction round, relevant checks, no re-audit. One additional bounded agent realignment/correction is permitted if a delegate deviates; record trigger and outcome, not an unlimited retry loop.
7. Commit and PR with evidence and residual gates; never merge automatically. Every changed source file requires honest >144/160 evidence and Sonar <=2/function; sampled audits do not certify unsampled files.

## Orchestration and interference control

- One orchestrator owns the integration branch, shared contracts, final service/browser and PR assembly.
- PR1 sequential. PR2 and PR3 may run in separate worktrees with explicit file allowlists. PR4 starts after measured-geometry contract stabilizes. PR5 may develop beside PR4 after freezing shared interfaces; acceptance runs after integration. PR6 sequential integration/acceptance, with independent fixture authoring permitted.
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
