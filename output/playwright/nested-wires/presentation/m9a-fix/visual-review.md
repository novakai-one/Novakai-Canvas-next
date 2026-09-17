# Visual check — probe-only change

Personally inspected the fixed probe's scale idle, wire-hover and contract-detail hub-hover PNGs, comparing against `docs/agent-diagrams/visual-quality/References.md`, its local AWS reference image, and the standing benchmark list in `docs/maintenance/diagram-quality-improvements.md`.

- Overview idle: all 40 nodes and 12 named section boundaries remain visible; the 75-wire field remains connected and quiet. Header controls stay within the viewport.
- Wire hover: kernel.ts, brands.ts and their connecting wire are highlighted; unrelated nodes and wires remain dim. No hover label is visible.
- Contract detail hub hover: kernel.ts, its incident routes and one-hop endpoint nodes are highlighted. clock.ts and receipt.ts remain outside this hub's net. No hover label appears. This is the existing detail camera, not a newly authored layout.

No rendered application source, palette, geometry, route or camera behavior changes in this fix. Exact geometry and camera identity is asserted within each spotlight run. Approved reference assets are untouched.

The broad reference-quality gaps documented in M9a remain: small overview labels, flat uniform node cards, large empty panel regions, dense crossings and dim stroke contrast below the general 3:1 floor. This scoped reliability fix does not claim to bring those inherited visuals up to the AWS/Docker benchmark or change M9a's prescribed dimming. No visual redesign is authorized. No second-agent review was run because the task explicitly prohibits subagents.
