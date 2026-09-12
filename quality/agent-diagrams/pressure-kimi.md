# Pressure test: six-PR agent-diagram orchestration

  **Verdict: Conditionally viable — do not launch as written.** Responsibility assignment (Model/Language/Presentation/Layout/Assets/Templates, Authoring as sole gate) is sound and matches the repo contract, and the base is stronger than the plan admits (crow's feet, measured notation, sequence gaps, activation widths, grid extents and scene inspection already exist per Progress.md and the Layout/Presentation contracts). But the plan freezes contracts before proving vocabulary coverage against its own 8-family matrix, sets no measurable visual acceptance, parallelizes the two most coupled PRs, and concentrates all recipe/family proof into a terminal PR. These are planning gaps (missing requirements), not implementation defects — nothing is built yet. Correctable in one revision round.

  ## Images inspected (all six, via ReadMediaFile)

  - before/er.png, before/modules.png, before/sop.png (full fidelity)
  - target/er.png (full fidelity), target/modules.png and target/infographic.png (downsampled by the reader from 3695×2590 and 2880×3340; composition/labels legible, finest detail lost — limitation declared)

  Observed before→target deltas: before ER is one tall column with border-attached edges and no visible crow's-foot cardinality at working zoom vs target's compact 2D grid with field-level crow's feet and colored headers; before modules has no labelled boundary containers, no shape/icon vocabulary (cylinders, component glyphs) vs the C4 target; before SOP is a single column with a long detouring retry loop vs balanced branching; the infographic target additionally needs repeated comparison panels, icon slots, numbered step badges and per-panel color themes. Several before screenshots also show adjacent diagrams' clipped titles bleeding into frame.

  ## Findings (unproven until the orchestrator verifies)

  | ID | Classification | Plan evidence | Failure scenario | Smallest general correction | Dependency/ownership impact |
  |---|---|---|---|---|---|
  | F1 | major build risk | PR1 freezes "minimum composition intent" before any family exists; matrix (lines 27–29) demands alt frames, cycles, nested groups, icon+text | Frozen contract lacks a construct (e.g. numbered badge, alt frame); mid-flight amendment triggers the plan's own "overlap serializes work" rule, stalling PR2/PR3 | PR1 freeze must derive from an explicit 8-family × construct vocabulary matrix, enumerating existing constructs (sequence/activation/markers already in Layout options) and new ones | PR1 grows; protects PR2–5 from contract churn; Model/Language/Presentation/Layout owners sign one matrix |
  | F2 | engineering violation | Acceptance is "readable at a practical viewing scale" (line 30); Layout already exposes `inspect()` returning validity diagnostics, and repo standards demand verifiable evidence | A1 screenshot audits become taste judgments; "balanced/compact" passes or fails by reviewer mood; regressions undetectable | Add numeric gates per example: min effective font px at declared zoom, zero `Layout.inspect` diagnostics (overlap/clearance), edge-crossing cap, container padding from tokens | No new ownership; routes existing Layout inspection into PR2–6 acceptance |
  | F3 | major build risk | "PR5 may develop beside PR4 after freezing shared interfaces" (line 45) | PR4 compactness policy changes node geometry; PR5's anchor/side assumptions silently invalidate; integration-phase routing rework — exactly the "conceptual conflict worktrees don't prevent" the plan warns about | Serialize PR4 → PR5; PR5 develops against an integrated geometry snapshot, not a parallel branch | Removes claimed parallelism; PR5 owner starts later but on stable ground |
  | F4 | major build risk | PR3 assumes "existing Assets/Authoring" staging; Progress.md "Remaining" lists Assets staging/library, preset admission, shared themes/custom colors as incomplete | PR3 blocked on unfinished host surfaces, or builds a second staging path that duplicates Assets ownership | Sequence the open Assets/theme integration items as PR3's explicit first deliverable, or descope PR3 acceptance to what is already admitted | Assets owner gains prerequisite work; PR3 timeline honest |
  | F5 | major build risk | Icon slots, numbered badges, labelled boundary containers, scoped per-diagram themes appear only in PR6's matrix, in no PR's owned outcome | PR6 discovers Presentation has no media slot inside nodes and themes bleed across the mixed collection canvas | Assign Presentation: node media/icon slot + badge construct (PR2/PR3); assign Design System scoped-theme-per-diagram proof on a two-diagram canvas (PR3 acceptance) | Presentation/DS owners gain named deliverables before PR6 |
  | F6 | major build risk | PR6 alone owns "general recipes and 24 DSL examples… depends PR2–5 integration" | All recipe design, all 24 subjects, collection assembly and evidence land in one PR; defects surface when nothing can move | Recipes land incrementally: each of PR2–5 leaves its family's recipe plus 1–2 qualifying examples as dogfood; PR6 only completes remaining examples and assembles the collection | Templates owner participates from PR2, not just PR6 |
  | F7 | minor | Before captures show clipped neighboring-diagram titles inside each panel | Screenshot evidence repeats the clipping; "not proof of readability" disputes | Acceptance requires per-diagram framed capture (bounds + title) at declared zoom | Canvas/web-shell framing only; no contract change |
  | F8 | minor | "No reference-specific renderers" asserted (line 9); only "use different subjects" (line 37) guards it | A worker ships a recipe that is the caching-infographic topology with relabelled nodes and passes | A1 checklist item: recipe parameterized by content only; topology/subject compared against the three references | Reviewer duty, no build impact |

  ## Concrete acceptance gaps to add

  - Measurable per-example gates (F2) plus a recorded zoom level per screenshot.
  - DSL round-trip proof per example: source → commit identity/revision → printed readout re-editable (plan preserves source but never requires print-back fidelity, despite Language's tested full/scoped readouts).
  - One mixed-theme, two-diagram canvas proof in PR3 (pre-proves PR6's 24-diagram collection against token bleed).
  - Family matrix enforced as a checklist artifact in PR6 with per-example construct annotations (badges, cycles, field ports…), not prose.

  ## Recommended revised dependency order

  PR1 (vocabulary-matrix-complete freeze, sequential) → PR2 typography/measure (sequential) → PR3 assets/themes ∥ nothing else, after the open Assets host items → PR4 arrangement (sequential, integrated) → PR5 routing strictly after PR4 integration → PR6 slimmed to remaining examples + collection + acceptance. PR2–5 each deposit family recipes/examples as they land.

  ## Reviewed files

  docs/agent-diagrams/ORCHESTRATION.md (full); docs/integration/Progress.md (full, 40 lines); capability/language/contract/types.ts; capability/layout/contract/types.ts; capability/presentation/contract/types.ts. No code audited beyond these contracts; no files written, no services, no agents.

  ## Unverified

  - Whether Model/Language vocabulary already includes alt/loop frames, state choice nodes, badges or icon slots (records/vocabulary not read) — F1/F5 may be partially pre-solved.
  - Whether Presentation's existing `marker()` crow's feet stay legible at practical zoom (before/er.png suggests not).
  - Canvas custom-node rendering seam for images/icons; Templates preset expansion limits; per-PR test budgets and word/line baselines (specs not yet written); worker time limits.

To resume this session: kimi -r session_25f08fbd-13e4-4e0f-9894-0d00c229b3a8
