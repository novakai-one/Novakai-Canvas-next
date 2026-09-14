# Agent diagram SOP

Author semantic DSL; never JSON coordinates. Measure before eyeballing.

## Quality loop (per iteration)

1. `canvas preview FILE [--revision N]` — fail fast on syntax, domain and feasibility (geometry infeasibility is checked at preview, not only at commit).
2. `canvas apply REQUEST_ID` — commit, then reconcile the receipt.
3. `canvas inspect ID` — machine quality report: `valid`, typed `warnings` (`wire-crossing`, `constraint-relaxed` with targets), `crossings`/`relaxed` counts, `engineVersions`. Gate against the visual benchmark floors in `docs/maintenance/diagram-quality-improvements.md` before touching DSL again.
4. Export/screenshot only for the final visual eyeball of a round, not for geometry verification.

`constraint-relaxed` means the engine dropped or violated an authored hint to keep required geometry; correct the named hint rather than adding more constraints. A `constraint-conflict` names the failing wire and its authored side intent.

## Visual bar

Acceptance targets: `docs/agent-diagrams/visual-quality/References.md`. A diagram that is valid but visually poor is not done.

Human geometry survives `replace`; `reset layout @section` and `reset route` are the explicit edits that clear it.
