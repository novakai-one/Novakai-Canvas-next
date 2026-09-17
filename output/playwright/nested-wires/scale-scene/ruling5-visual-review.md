# M7 visual review — not accepted as reference parity

Personally inspected the 1920×1440 scale roads-off and roads-on overviews,
contract reading zoom, templates current/left-edge overviews and failed
scale-left view. Compared against `docs/agent-diagrams/visual-quality/References.md`
and the actual approved AWS architecture image, plus the benchmark gates in
`docs/maintenance/diagram-quality-improvements.md`. No reference asset was
changed. No subagent was used, per the explicit user/repo restriction.

- **Scale contract / blocker against the standing crossings budget:** 90
  certified crossings, versus six for a dense section. Through-channel fix
  removes coincident wiring, but certification does not make this bundle easy
  to trace. Fix would need approved semantic decomposition or routing/topology
  policy work; neither is smuggled into Ruling #5.
- **Scale toolbar / polish:** twelve section buttons plus wire selector crowd
  the heading into a narrow column and clip right-side chrome. The diagram
  regions themselves fit. A responsive host-toolbar layout is a separate
  presentation fix; no stylesheet or baseline scene was changed here.
- **Scale overview / polish:** contract→core→adapters/service/web/CLI hierarchy
  is visible and the smaller sections have regular rows. Node captions and
  wire separation are too small for tracing dense contract dependencies at
  overview scale. Contract reading zoom restores caption readability but does
  not remove the bundle density.
- **Panels / deferred:** large air margins remain in nested-only and sparsely
  occupied sections. The 40% empty-panel benchmark is not proven satisfied.
  Compacting is explicitly withdrawn to M7.5, not attempted here.
- **Templates left edge / blocker:** screenshot footer reports coverage needs
  correction; machine audit finds a missing owned gate crossing and an absent
  forward interval on w17. Extra world crossings concentrate along the left
  approach. Visual similarity is not evidence of correctness.
- **Scale left edge / blocker:** zero visible wires are the atomic typed
  routing failure w27. This is a failure-state screenshot, not an improved
  diagram. No wire-length/crossing count is assigned to the missing graph.

No body intersection or positive-length wire overlap remains in default scale;
that is independently machine-verified. Contrast and empty-area benchmark
measurements were not completed, so no all-benchmark acceptance is asserted.
The visible hierarchy is useful evidence, but M7 does not receive an overall
visual PASS. No publishing or source-of-truth diagram commit was performed by
this prototype evaluation.
