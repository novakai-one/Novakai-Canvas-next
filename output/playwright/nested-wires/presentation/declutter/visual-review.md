# M6.5b personal visual review

Inspected the five required PNGs at 1920×1440, the M6.5a roads-off overview,
and the approved AWS architecture and Docker infographic PNGs linked from
`docs/agent-diagrams/visual-quality/References.md`. Read the benchmark gates in
`docs/maintenance/diagram-quality-improvements.md`. No subagent was used under
the explicit user/project prohibition.

- **Templates roads off:** all section counts, node subtitles, port rings/text,
  and border badges disappear. Node file names are centered and distinct from
  directory headers. Route positions and sparse panel footprints match M6.5a.
- **Templates roads on:** the same chrome is absent; lane tints, arrows and tiny
  road diagnostics remain. They are road diagnostics, not the removed port badges.
- **Contract detail:** reading zoom makes the remaining file names, child header,
  arrows and separated pin stems legible. This is a deliberate crop of the contract
  region; outer nodes at the viewport edge are cropped. No body subtitle or pin
  ring obscures the endpoints. The full region remains visible in the overview.
- **Nested roads off:** the same cleanup applies, with the original synthetic
  section/node names and no imported-name metadata. The inherited selection
  captures and runner confirm w06/w04 still display ID labels.
- **Selected catalog → plan:** one `hashContent + 4 more` label sits above the
  selected horizontal run, clear of nodes and section captions. Both endpoints
  and the complete selected route are visible. Selection retains full prominence
  while other paths dim; no collision is visible in this required witness.

No concrete wire legibility regression justified changing the M6.5a tokens.
The browser audit independently checks every wire's convergence membership,
width and opacity; token regeneration checks pass unchanged. The invariant
suite reports templates 130 certified / 0 uncertified crossings; this is not a
claim that the scene has fewer crossings or meets the general per-section budget.

The reference comparison still exposes the inherited weaknesses: excessive panel
whitespace, small text at fit view, long trunk/perimeter routes, identical plain
cards without conceptual imagery, and diagnostic roads-on noise. Panel balance
and reference density/polish remain unmet, as already recorded in M6.5a; the
explicit zero-geometry scope prohibits fixing them here. The selected label uses
the old typography and is small, but its text now carries source meaning. No
claim is made about collision freedom for every possible selected label or theme.
External orchestrator visual acceptance remains independent.
