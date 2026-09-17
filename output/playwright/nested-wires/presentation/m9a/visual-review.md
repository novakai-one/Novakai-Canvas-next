# M9a visual inspection

Personally inspected the final headless 1920×1440 images at overview and contract reading zoom against `docs/agent-diagrams/visual-quality/References.md`, its retained AWS/module targets, and `docs/maintenance/diagram-quality-improvements.md`. No subagent review: the explicit project instruction prohibits delegation here.

| Image | Observation |
| --- | --- |
| [Idle overview](scale-idle.png) | Contract-to-core trunks and local two-node routes remain continuous and visible. The field is quieter; no labels cover crossings. |
| [Contract hub hover](scale-hover-hub.png) | kernel.ts and its exact incident endpoints gain supporting fill/outline; accent routes are traceable into core and service. Unrelated wires recede. No label appears. |
| [Wire hover](scale-hover-wire.png) | w01 plus kernel.ts/brands.ts are isolated; no primary-selection label. |
| [Primary wire](scale-primary-wire.png) | Existing thicker accent treatment and one w01 label; two endpoints secondary, other objects dim. |
| [Roads on](scale-roads-on.png) | Existing lanes/junctions and 100% coverage footer remain; route geometry unchanged. |
| [Roads-on hover](scale-roads-on-hover.png) | Hover remains usable over the diagnostic road overlay. |
| [Contract detail idle](scale-contract-detail-idle.png) | Quiet routes remain visibly connected through pin fans and nested boundaries; filename text legible at this reading zoom. |
| [Contract detail hover](scale-contract-detail-hover.png) | Fan-out from kernel is visually distinct, with no additional text or displacement. |

Scoped verdict: idle connectivity and progressive hover emphasis pass the milestone's eyeball requirement. No clipping, new label collision, endpoint displacement or new scene-wide detour is introduced. The primary-selected label retains its inherited arc midpoint/lift checks. Real pointer hits were used, not synthetic React state assignment.

## Explicit benchmark limits

- **All overview regions — inherited polish gap:** filename text is small at fit-all zoom; contract/core panels contain substantial blank area. Correcting content density/placement would exceed this paint-only task. Reading-zoom evidence is included; no claim that every overview label is comfortably readable.
- **Contract fan and cross-section trunks — inherited topology gap:** templates/scale retain 130/112 certified crossings, exceeding the generic per-section visual aspiration in places. Exact unchanged counts are mandatory for this milestone. Zero uncertified crossings and zero positive-length overlaps are confirmed by the unchanged suites.
- **Idle wire strokes — contrast tradeoff:** the explicit 0.65 multiplier produces about **2.92:1** nominal stroke-to-white contrast for `#526170`, and **2.07:1** for inherited convergence alpha × idle alpha, before zoom/anti-aliasing. This is below the general 3:1 stroke floor, especially in the converging field. The task expressly requests 0.55–0.7 of previous alpha and unchanged selection; those more specific constraints were followed. Hover/selection provide full contrast for inspection. This is a recorded limitation, not a blanket accessibility/reference-parity claim.
- **Roads-on diagnostic view — inherited noise:** arrows, gate labels and road fills compete with quiet routes. Roads remain off by default; no debug-road redesign was attempted.

The AWS/module references have stronger actor differentiation, text hierarchy and lower relationship density. This milestone adds one interaction tier; it does not claim to close those broader visual gaps. Approved reference assets and authored scene data were not changed.
