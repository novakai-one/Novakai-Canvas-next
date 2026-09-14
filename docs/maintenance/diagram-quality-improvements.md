# Diagram quality — benchmark gates, deferred work, findings

Standing bar for any change that touches rendered output, plus the deferred queue. Completed plans are summarized in one line; full plan detail lives in git history (PRs #31–#38).

## Visual benchmark gates (apply to every change that touches rendered output)

Correctness gates alone are insufficient: a diagram can be valid and still look poor. A change is done only when its target sections also meet these benchmarks.

**Target references.**

- `quality/agent-diagrams/references/target/bytebytego-system-design-cheat-sheet.png`
- `quality/agent-diagrams/references/target/bytebytego-design-patterns-cheat-sheet.png`
- `docs/agent-diagrams/visual-quality/References.md` mandatory targets (Docker infographic, AWS architecture)

The bar is not "copy the reference" — it is: same league of density, hierarchy and polish.

**Measurable floors.**

- Role text/fill contrast ≥ 4.5:1; stroke/fill ≥ 3:1; band separators ≥ 3:1 or explicitly noted as separators.
- Heading/body size ratio ≥ 1.3 (strong face), caption legible at export fidelity.
- Zero label collisions and zero unresolved edge overlaps in the scene inspection report.
- Edge crossings budgeted per section (dense map: ≤ 6; simple flows: 0–1).
- Panel balance: no rendered group panel is >40% empty area; sections do not sprawl beyond content.
- Sequence sections: no uniform-slot airiness; branch boxes sized to content.

**Review loop.**

1. Render target sections to PNG at full fidelity; inspect personally first — fix everything visible.
2. Pressure-test with a fresh zero-context agent given the rubric below. Findings must arrive as: region + severity (blocker / polish / preference) + mechanism-level fix. Work is unfinished if findings arrive without regions or with vibes-only wording.
3. Fix blockers and polish findings; preference findings are logged, not chased.
4. Repeat until a round yields only preference findings or changes smaller than ~5% of visible surface — that is the flatline signal, not the first clean round.

**Reviewer rubric (hand to every pressure agent verbatim).**

- Hierarchy: does the eye land on the section title, then the primary flow, then detail? Any text wall where a figure/structure belongs?
- Readability: label collisions, ambiguous edge endpoints, cramped or orphaned cards, text wrapping that looks like a plain text box.
- Color: contrast failures, warning/decision/success hues used without semantic meaning, flat single-hue sections.
- Craft: alignment drift, uneven gaps, dangling edges, panels that mostly contain air.
- The question: does this look authored by a frontier agentic model in 2026, or by a 2005 diagram tool? Cite the exact region that fails the question.

## Landed (PRs #31–#38, 13–14 Sep 2026)

- #31 parametric token-drawn figures (vessel/gate/stack/window/screen/layered-bed/gauge) — infographics without hand-authored art.
- #32 figure vocabulary v2 + context-engineering showcase; #33 staged figures, pilled wire labels, stronger strokes (presentation-5).
- #34 soft spatial hints (`rank`/`align`/`before`/`below`) as strong solver preferences; one deterministic retry with hints dropped; `constraint-relaxed` scene warnings naming authored sides (layout-policy-15).
- #35 sequence compactness: event rows 1× gap; unclosed activations trim to the last event (layout-policy-17).
- #36 `canvas inspect ID` + `GET /api/v1/inspect` — machine scene quality report (valid, typed warnings, crossings/relaxed counts, engine versions).
- #37 engineering figures `store`/`queue`/`cloud`; `*…*` emphasis spans; stretched-content centering (presentation-6).
- #38 acceptance policies as declaration data (model contract records) surfaced by `canvas describe`; CLI readout notes manual geometry; media-top text column centering.

## Engine backlog (deferred, accepted)

- Collection-level packing: masonry/backfill across sections (~30% sheet voids on wide canvases).
- Decision-diamond aspect ratio inside grid tracks.
- WRITE retry-corridor panel clearance.
- Sequence `alt` fragment UML pentagon tab + guards.
- Persistence well 6px lean (preference).
- Sequence outer-padding asymmetry.

## P2-1 · Panel and chrome redesign — PLACEHOLDER, do not start

Deferred by Chris's priority order (1 = agent-authored diagrams, 2 = UI UX, 3 = human authoring). Scope when entered: side-panel surfaces, reading mode, inspector polish; seams are `apps/web` panels + design-system panel primitives under the token system. Entry trigger: Chris authorizes.

## P3-1 · Human geometry recovery — PLACEHOLDER, do not start

Evidence: the cost-curve incident — human drags create sticky geometry with no visible recovery. When entered: surface the existing `reset-layout`/`reset-route` Model changes as a section-level "tidy" action (`capability/canvas` interaction + `apps/web` affordance — authoring/model already own the change), and a visual marker for manually placed nodes. Entry trigger: after priority 1.

## Chris's visual findings — 14 Sep 2026 (recorded, no action authorized)

Noted by Chris reviewing the live demo; parked here until he authorizes work.

1. **Module kind-tag noise.** Every module node renders the "MODULE" eyebrow, consuming visual real estate on every box. Candidates when entered: suppress the kind tag when uniform within a section, or demote size/weight. Seam: presentation figure drawers / `adapters/react/NodeContent.tsx`.
2. **"Who imports who" content inconsistency.** Module nodes mix three content idioms: some list functions, some name an invariant, some show an image (persistence). Chris verified the UI allows adding an interface to a module, so the suspicion is a DSL/docs gap, not an engine gap. When entered: confirm the language construct for module interface/function members, teach it in `docs/agent-diagrams/visual-quality/SOP.md` and `canvas describe` examples, then re-author the section consistently.
3. **Showcase section critique.** Verdict: clear diagrams, spacing reasonably good, no giant whitespace, wires ~75% OK. Under-developed items:
   - Nodes read as basic flat green boxes — weakest element; no depth or hierarchy in node treatment.
   - A large white box (panel) sits behind all diagrams — dead visual weight.
   - Font overhang on decision diamonds: "valid?" and "planned?" labels spill past the diamond bounds.

## Capability audit — 14 Sep 2026 (8 families, one each; recorded, no action authorized)

All 8 families created fresh via DSL in a clean workspace: 8/8 `valid:true`, 0 relaxed constraints. Screenshots `.local/audit-shots/`; workspace `.local/capability-audit` on port 5185. Verdict: **mostly visual polish + four targeted functionality gaps**; nothing missing at capability level.

**Functionality gaps (engine cannot currently do).**

1. Grid/table model: no proportional-font prose cells (entire table renders monospace), no column-width control or header emphasis. Grid is furthest from target.
2. Decision-diamond label sizing: measurement neither grows the diamond nor wraps its label (reproduced: "Both reviews approve?" in flow-research-approval).
3. Sequence notation: UML pentagon fragment tabs (already in engine backlog); self-message renders as open notch, not a loop arrow; loop tab label wraps and collides with the frame.
4. State-diagram wire management: long cancel/confirm wires need corridors that keep them off panel borders (state-batch-job: 5 crossings, wire bus at region top).

**Polish gaps (engine can, output needs craft).**

1. Node depth: uniform flat fills, no elevation/hierarchy beyond tint — biggest lever toward the ByteByteGo bar.
2. Panel air pockets (modules policy panel ~25%, story band 03).
3. Long guard/effect label pills wrap awkwardly and drift from their wire (state).
4. Minor: ER vertical-wire label drift from midpoint; tree far-node sprawl (Calibration); story side-stream wires ride band edges.

**Strong:** semantic DSL covers all 8 families first-attempt; hierarchy (eyebrow + strong heading), role tints, pilled labels, numbered badges, figure vocabulary, measured code; sequence compactness; ER/modules engineering correctness.
