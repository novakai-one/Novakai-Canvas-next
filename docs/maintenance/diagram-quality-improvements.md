# Diagram quality improvements — seven plans

Date: 13 September 2026. Author: Kimi session (figures-proof workspace).
Priority order set by Chris: **1 = agent-authored diagrams** (prove the app can generate), 2 = UI UX, 3 = human authoring. No work starts on 2 or 3 until priority 1 lands.

Every plan follows the same discipline as the figure-polish slice: mechanisms over bespoke tuning, seams named by real file, contract/version impact stated up front, gates = typecheck + eslint (sonar ≤2) + prettier + depcruise + full suite, no new test files (append to existing suites), evidence rendered and eyeballed before "done".

## Visual benchmark gates (apply to every plan that touches rendered output)

Correctness gates alone are insufficient: a diagram can be valid and still look poor. Each plan below is done only when its target sections also meet these visual benchmarks.

**Target references.**

- `quality/agent-diagrams/references/target/bytebytego-system-design-cheat-sheet.png`
- `quality/agent-diagrams/references/target/bytebytego-design-patterns-cheat-sheet.png`
- `docs/agent-diagrams/visual-quality/References.md` mandatory targets (Docker infographic, AWS architecture)

The bar is not "copy the reference" — it is: same league of density, hierarchy and polish. A frontier-2026 render, not a 2005 default.

**Measurable floors (from the figure-polish evidence base).**

- Role text/fill contrast ≥ 4.5:1; stroke/fill ≥ 3:1; band separators ≥ 3:1 or explicitly noted as separators.
- Heading/body size ratio ≥ 1.3 (strong face), caption legible at export fidelity.
- Zero label collisions and zero unresolved edge overlaps in the scene inspection report.
- Edge crossings budgeted per section (S1-class dense map: ≤ 6 after P1-1; simple flows: 0–1).
- Panel balance: no rendered group panel is >40% empty area; sections do not sprawl beyond content (the cost-curve failure mode).
- Sequence sections: no uniform-slot airiness; branch boxes sized to content (P1-2).

**Review loop (per plan, after self-inspection flatlines).**

1. Render target sections to PNG at full fidelity; inspect personally first — fix everything visible.
2. Pressure-test with a fresh zero-context agent (or `codex astra` headless) given the rubric below. The agent must return findings as: region + severity (blocker / polish / preference) + mechanism-level fix. Work is unfinished if findings arrive without regions or with vibes-only wording.
3. Fix blockers and polish findings; preference findings are logged, not chased.
4. Repeat until a round yields only preference findings or changes smaller than ~5% of visible surface — that is the flatline signal, not the first clean round.

**Reviewer rubric (hand to every pressure agent verbatim).**

- Hierarchy: does the eye land on the section title, then the primary flow, then detail? Any text wall where a figure/structure belongs?
- Readability: label collisions, ambiguous edge endpoints, cramped or orphaned cards, text wrapping that looks like a plain text box.
- Color: contrast failures, warning/decision/success hues used without semantic meaning, flat single-hue sections.
- Craft: alignment drift, uneven gaps, dangling edges, panels that mostly contain air.
- The question: does this look authored by a frontier agentic model in 2026, or by a 2005 diagram tool? Cite the exact region that fails the question.

---

## P1-1 · Dense-graph layout quality

**Goal.** A 13-node, 15-edge import graph lays out tiered and readable on the first attempt; authored spatial hints can never make a scene infeasible.

**Evidence.** `repo-architecture` section 1 staircase-sprawled under default layering; `rank` hints were weakly honored; three ranks together produced `constraint-conflict map:object:wire:p10: No valid labelled route within the initial, eight local and one outside candidate budget`, which names the failing wire but not the constraint that made it infeasible.

**Mechanisms (engine-internal, `capability/layout`).**

1. **Soft vs hard constraints** — `core/constraints/`: authored `rank`/`align`/`before`/`below` become preferences with a deterministic drop order (last-authored drops first). Hard semantics (mode, membership, direction) never drop. Dropped hints are reported, not silent: the scene gains a dropped-constraint report.
2. **Skip-level edge quality** — `core/placement/` + `core/arrangement/`: barycenter sweep within bands to cut crossings on edges that span ranks (the `language→model`, `canvas→presentation` pattern).
3. **Label-aware routing ladder** — `core/routing/wires.ts` + `core/routing/native.ts`: labelled-route search relaxes in order (side preferences → hint constraints → alternate label anchors) and only then fails, with the diagnostic naming the wire **and** the constraint set involved. `constraint-conflict` gains structured `constraints: readonly string[]`.
4. **Diagnostic content** — `core/validation/`: feasibility failures carry the relaxed-and-still-infeasible constraint list so an agent knows what to remove from the DSL.

**Contract/version impact.** Scene record additive field (dropped hints) → layout contract minor release; presentation re-pin (`presentation-6`) only if scene shape changes reach renderers. Error record addition is additive to layout's own error type.

**Tests (append to existing suites).** Dense import-graph fixture lays out within a crossing budget; the v3-rank scene that failed now succeeds with a dropped-hint report; diagnostic content asserted by code, not message.

**Done when.** `repo-architecture` S1 with all three original ranks applies cleanly; inspection reports zero label collisions; a deliberately over-constrained scene succeeds with named dropped hints or fails naming the constraint.

---

## P1-2 · Sequence diagram compactness

**Goal.** Sequence sections pack vertically; `alt`/`opt`/`loop` branches size to their own content; `gap` visibly scales event spacing.

**Evidence.** `repo-architecture` S3: uniform tall event slots, branch boxes mostly empty, `gap=compact` produced no visible change.

**Mechanisms (`capability/layout/core/sequence/` only).**

1. Row height derives from event content (label lines, activation) instead of a uniform slot.
2. Fragment height = maximum branch height, not the sum of branch contents across alternatives.
3. Section `gap` scale (compact/normal/roomy) maps to sequence row padding — one lookup table, no arithmetic branches (sonar ≤2).

**Contract/version impact.** None to records; scene geometry changes → golden corpus re-record under the existing release discipline (layout engine version note, presentation re-pin only if renderers consume changed fields).

**Tests (append).** Sequence packing fixtures: branch with one short event does not reserve sibling height; gap scale changes row pitch monotonically.

**Done when.** S3 vertical extent shrinks ≥30% with zero overlaps in the inspection report; all showcase sequence sections re-render clean and are eyeballed.

---

## P1-3 · Agent quality loop (`canvas inspect`)

**Goal.** An agent can score a scene mechanically — crossings, label collisions, occupancy — without exporting a PNG, and discovers every feasibility failure at preview time.

**Evidence.** Authoring the engineering collection took edit → replace → export → eyeball per iteration. Feasibility is already mandatory at preview (`apps/service/adapters/feasibility.ts:15` — "Geometry failure is mandatory even when callers did not request a visual preview"), so the missing piece is quality signal, not correctness signal. Layout already owns the seam: `inspect(input): Result<Inspection>` in `capability/layout/contract/types.ts:89`, unexposed to agents.

**Mechanisms (thin pass-through of an existing contract operation — no new capability).**

1. **Service** — `apps/service/adapters/http-router.ts` + rendering adapters: read-only `inspect` endpoint composing layout's `inspect` against the committed scene. Adapter wiring only, per the call-permissions matrix.
2. **CLI** — `apps/cli/cli/main.ts`: `canvas inspect ID` prints the Inspection record (CLI is a display boundary; formatting is legal here).
3. **Inspection metrics** — `capability/layout/core/inspection/`: extend the record with crossing count, label-collision count, band occupancy if absent (additive contract fields).
4. **Agent guidance** — `docs/agent-diagrams/` SOP gains the loop: `preview` (fail fast) → `apply` → `inspect` (quality budget) → export only for final eyeball.

**Contract/version impact.** Additive Inspection fields → layout contract minor release. Service/CLI surface additions follow the apps' own contract folders.

**Tests (append).** Inspection metrics asserted against a fixture with known crossings; service router gains the endpoint case in its existing suite; CLI describe output updated.

**Done when.** `canvas inspect repo-architecture` prints a quality report the agent can budget against; the SOP loop is documented; preview-time feasibility has a regression assertion.

---

## P1-4 · Engineering figure vocabulary (+ M5 emphasis spans)

**Goal.** Engineering diagrams can use closed parametric forms the way water diagrams use vessel/gate/stack — and text gains emphasized spans. Two slices, one vocabulary theme; each form admitted with real uses, never speculatively.

**Evidence.** All three engineering diagrams shipped zero figures: the admitted forms (`vessel`, `layered-bed`, `screen`, `gauge`, `window`, `gate`, `stack` — `capability/language/core/vocabulary/constructs.ts:179`) are water-domain. M5 (inline emphasis) is the pre-registered deferral from the figure-polish plan.

**Slice A — new closed forms.** Per form (candidates: store/cylinder, queue, frame/bracket — admitted only with ≥2 genuine showcase uses):

1. `capability/language/core/vocabulary/constructs.ts` — figure `form` values (data row).
2. Model figure record union — matching schema alternative.
3. `capability/presentation` figure drawing (the `FILL` chroma table pattern from the polish slice) — parametric, token-driven, measured, sonar ≤2 via lookup tables.
4. Both renderers (React + static markup), projection digests.
5. Version discipline: presentation re-pin (`presentation-6`), language describe content, corpus goldens re-record, showcase evidence rendered + eyeballed.

**Slice B — M5 emphasis spans (blocked on one Chris decision: marker syntax, e.g. `*term*`).** Language grammar → model content record span type → presentation per-span measurement (intra-line x-advances in text layout) → both renderers → version bumps + golden re-record. Pre-decided except the marker; see the M5 section of `quality/agent-diagrams/visual-quality/figures/polish-plan.md`.

**Tests (append).** Per-form measurement and render assertions through the public contract; emphasis span measurement cases in the existing text suite.

**Done when.** Engineering showcase sections use admitted forms with real meaning; emphasis renders and measures identically in both renderers; gates green; goldens re-recorded.

---

## P1-5 · Authoring-surface predictability (`canvas describe` tells the whole law)

**Goal.** Every acceptance policy an agent can trip on is discoverable from `canvas describe` — declared once as data, consumed by both validation and description.

**Evidence.** Three failures this session were policy surprises: `imports` requires module→module/interface/function (`capability/model/core/relationships/endpoints.ts:19-33`), mode/layout incompatibility (`mode=flow` rejects `layout=grid`), nonblank wire labels. `describe()` (`capability/language/core/vocabulary/description.ts`) lists constructs/defaults/patch forms but neither policy table. Human-geometry visibility already exists (`core/printing/geometry.ts` manual summary) — the gap is agent awareness, not capability.

**Mechanisms.**

1. **Single source of truth** — endpoint-kind policies and the mode/layout compatibility matrix move from validator code to declaration records in the owning contract (model owns relationship policies; language owns mode/layout). Validators read the data; no behavior moves.
2. **describe() surfaces both tables** — language composes its own layout matrix plus model's published policy records (language→model is an existing legal edge).
3. **CLI read guidance** — `canvas read` header notes when a collection carries manual geometry (the manual summary exists; surface a one-line pointer so agents know `replace` will not reflow).

**Contract/version impact.** New declaration records in model/language contracts (data only — no behavior); describe Description record additive.

**Tests (append).** Describe output equals validator policy table (single-source assertion); each of the three session failures has a matching describe entry.

**Done when.** An agent can discover all three policies without reading core; no policy is declared in two places.

---

## P2-1 · Panel and chrome redesign — PLACEHOLDER, do not start

Deferred by Chris's priority order. Scope when entered: side-panel surfaces (the decision left open in PR #33), reading mode, inspector polish; seams are `apps/web` panels + design-system panel primitives under the token system. Entry trigger: P1-1…P1-5 landed and Chris authorizes.

## P3-1 · Human geometry recovery — PLACEHOLDER, do not start

Evidence: the cost-curve incident — human drags create sticky geometry with no visible recovery. When entered: surface the existing `reset-layout`/`reset-route` Model changes as a section-level "tidy" action (`capability/canvas` interaction + `apps/web` affordance — authoring/model already own the change), and a visual marker for manually placed nodes. Entry trigger: after priority 1.
