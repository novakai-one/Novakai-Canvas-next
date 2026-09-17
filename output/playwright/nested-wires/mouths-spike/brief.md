# M10c spike — WHY hub-corner placement was illegal + corner-door design (NO product code changes)

## Context

Scale-scene ordering trial (order-trial-scale/, ruling #20): forcing index.ts top-left +
greedy connectivity order produced an ILLEGAL layout — verifier exit 1: 4 boundary violations
(w16:19, w17:20, w18:21, w19:21), 16 uncertified crossings (85 certified vs 101 actual), w19
missing owned-gate crossing. Baseline passes 112/0.

Chris's standing hypothesis (90% confidence): high-IN-degree files (index.ts) belong top-left,
high-OUT-degree (kernel.ts) bottom-right, pushing wires to the section perimeter and leaving the
interior clean. He ALSO asked overnight for section entrance/exit ("doors") to move from
middle-of-side toward corners (top-left IN, bottom-right OUT) — that work was researched but
never dispatched. Entrances are still middle-of-sides.

This spike answers three questions with code-level evidence, so a follow-on BUILD milestone can
make corner-placement + corner-doors LEGAL under the certification regime.

## Environment

- Worktree: `/Users/christopherdasca/Programming/Novakai-Canvas-next-ordertrial` (branch `feat/order-trial`). Work ONLY here.
- Evidence on disk: `output/playwright/nested-wires/order-trial-scale/{baseline,variant-a}/` (specs, scene.json, invariant-audit.json, crossing-certificates.json, invariant-output.txt) and `report.md`.
- Router/layout source: `capability/layout/**` (placement: `core/prototype-nested-placement.ts`; lane projection: `core/nested-lane-projection.ts`; certifier/verifier: `output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs` and scale wrapper).
- All spike artifacts go under `output/playwright/nested-wires/mouths-spike/` (new dir). Commit spike scripts + doc on feat/order-trial. **Do NOT modify product source.** Headless only if you capture anything.

## Questions to answer (cite file:line everywhere)

**Q1 — Root-cause the illegality.** For EACH of the 4 boundary violations and the w19 missing-gate:
which router assumption did the reordered placement violate? Trace from the audit/certificates JSON
into the producing code. Is the failure class: (a) gate/mouth assignment assumes relative node
positions; (b) lane-order/continuity argument; (c) certifier lower-bound no longer provable though
layout is actually fine; or (d) genuinely unroutable geometry? Distinguish "layout is truly illegal"
from "certifier can't prove it" — they have very different costs.

**Q2 — Corner-door design options.** Today section entry/exit mouths sit middle-of-side. Design
options for moving IN toward top-left corner / OUT toward bottom-right corner (and the mixed
variants Chris listed). For each: what changes in placement, lane projection, junction registry,
and the certifier; what invariants need re-derivation; rough op-count impact (ruling #10 baselines:
nested 19,768/992/0, templates 28,443/1,626/0, scale 43,876/2,088/0 — say if your design moves them
and why); risk rating.

**Q3 — Legal corner placement rule.** Given Q1+Q2: what placement rule ("in-degree desc from
top-left, out-degree desc toward bottom-right" or similar) becomes LEGAL under which door design?
If none is legal without certifier changes, say so precisely.

## Definition of done (binary)

- [ ] `mouths-spike/design.md` with Q1/Q2/Q3 answered, every claim citing file:line or a JSON artifact path.
- [ ] At least one executable spike script reproducing the Q1 failure chain from scene.json data (prints the violated assumption), run output committed.
- [ ] Recommendation: minimal change set (ordered steps) to make "index top-left, kernel bottom-right, corner doors" LEGAL on the scale scene — or a precise statement of why not yet.
- [ ] No product source modified (git status shows only mouths-spike/ + order-trial-scale/ untracked-or-committed docs).
- [ ] `pnpm check` exit 0 (you changed no source — if it fails, STOP and report).
- [ ] Commit + push on feat/order-trial. No PR.

## STOP clause

If evidence is missing or questions can't be answered from code: STOP with what's known. A correct
STOP is success. Do not speculate beyond evidence — label inference as inference.

---

## Amendment 1 (orchestrator) — commit blocked by PRE-EXISTING lint debt; fix it minimally

Orchestrator verified: `pnpm check` fails on `output/playwright/nested-wires/order-trial/capture.mjs:10`,
cognitive complexity 3 > 2 — committed in ca7be03 during Track C, before this spike existed. The spike's
design.md/reproduction artifacts are complete and high quality.

Fix: behavior-preserving refactor of that ONE function in capture.mjs (extract a helper; complexity ≤2).
Do not change what it captures, its CLI, or its output shape — it is a committed evidence tool. Then full
`pnpm check` must exit 0 (208/208). Commit the refactor + the mouths-spike artifacts together on
feat/order-trial with message `docs(mouths-spike): corner-door/legality analysis + lint-debt fix in order-trial capture`. Push. No PR.
The design.md STOP header should be amended to record that analysis was accepted and committed
(violated-assumption content unchanged).
