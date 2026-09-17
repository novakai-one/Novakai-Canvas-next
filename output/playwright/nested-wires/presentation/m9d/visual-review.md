# M9d visual review

Personally inspected the 1920×1440 browser outputs, native SVG preview, and the preserved Docker infographic and AWS architecture references in `docs/agent-diagrams/visual-quality/References.md`. Applied the hierarchy/readability/color/craft rubric from `docs/maintenance/diagram-quality-improvements.md`. No reference assets changed. No secondary agent was used, per the explicit repository/user restriction.

## Observed result

- **Hierarchy:** scale default overview retains all twelve section headings at a constant screen text size. Parent/child M9c fills and family tabs still distinguish regions. The toolbar stays within the 1920px viewport; compact/comfortable/expanded changes chrome spacing and frame weight visibly.
- **Containment:** node text is centered in a fixed inner frame; section text starts in a fixed header frame. The complete probe sweep covers 0.1–2 in all three presets and all three scenes. Every nonzero-opacity label's transformed rectangle stays inside that frame, with clipping as a second guard. No card scaling or bounds changes.
- **Readable zoom:** `scale-zoomed-out-legible.png` is a reading view at about 0.558 (zoomed out from 1). `scale-below-default-legible.png` is an additional, stricter view below the actual default: 0.417672 → 0.348060. All section headings and `api.ts` remain visible there. `zoom-overview.json` records the actual transition and zero counter delta.
- **Density comparison:** `compact-vs-expanded.png` shows full captures side by side with actual-size detail crops below. Scene bytes, world coordinates, dimensions, ports, wire points and camera transform are unchanged. Different toolbar heights shift the canvas's browser origin; this is chrome, not a change to diagram coordinates.
- **Color:** the unchanged M9c assertions pass on a fresh 5191 capture. Minimum wire/background contrast is 3.049290:1 under the conservative maximum shadow underlay, and opaque text/fill contrast is 14.364491:1. M9a intentional dim states and M9d partial fade states are not represented as fully legible contrast states.
- **Native export:** `export-preview.png` renders the actual deterministic native SVG. The admitted publishing-boundaries example retains text, interface signatures, illustrations and labelled paths. The image is not presented as a native export of the road prototype.

## Honest limits against the reference bar

- **Scale node cards — deliberate containment tradeoff:** comfortable default overview shows only 5/40 node labels; the other filenames cannot fit at a constant 19.6px screen font, so they fade. The zoom-out below default retains 1/40. This is less information-dense than the AWS reference, but obeys the requested fade rule without enlarging cards. Zoom in or choose compact to read more filenames.
- **Expanded overview — partial fade:** `shell.ts`/`main.ts` and other threshold labels become pale before disappearing. Their rectangles still fit; partial opacity is a disappearance cue, not a contrast claim. No ellipsis, fabricated abbreviation or text substitution is introduced.
- **Roads-on section headers — inherited overlay layers:** diagnostic road paint can cover parts of expanded section headings. Labels remain within their section. The roads-off presentation remains the reading view; changing road geometry or layer semantics was outside this milestone.
- **Frozen dense map — retained limitations:** idle wire labels remain intentionally hidden; long detours, thin scene-wide routes, uniform cards, large panel voids, and equal node/section base font sizes remain. This milestone does not claim to meet the references' full infographic/engineering density, actor imagery, or heading/body ratio floors. Routing, collision certification and packing are frozen by the task; existing invariant suites remain unchanged.
- **Export scope:** road-prototype chrome, spotlight and semantic zoom are browser paint only. Existing native SVG export uses the admitted scene's default presentation and is independent of all three toolbar presets and camera zoom. There is no prototype export button or new native export mode.

No containment or layout-recalculation STOP condition was encountered. Known visual limits are recorded rather than "fixed" through forbidden geometry changes.
