# M4.5 visual inspection — 2026-09-17

Personally inspected the generated PNGs, plus the pinned AWS and Docker reference images in `docs/agent-diagrams/visual-quality/References.md`. The milestone's frozen nodes, sections and road bounds govern this fixture; the crossing exception/ceilings are the user's final M4.5 ruling. No reference asset was edited. No subagent was used, following the explicit project/user constraint.

| Region / severity | Observation and disposition |
|---|---|
| J21 / acceptance | Before/after uses the exact same camera and unchanged React renderer. The left image now verifies every rendered wire path against the immutable `0e5f21e` snapshot. Six original intersections reduce to two: the two through lanes continue inside the joining lanes. Four avoidable X intersections disappear. PASS. |
| S1 hub approaches / acceptance | Roads-off output keeps separated terminal rows and clear horizontal/vertical bundles; the small quarter-pitch corner steps stay inside junctions. No coincident path segment, parallel touch, reversed assigned stem or non-junction crossing remains in the independent audit. PASS. |
| World between S1/S4 / acceptance | Opposing left turns occupy separate outer channels. Six candidate double crossings disappear, and original M4 world count falls 8→0. The overview and roads-off view both show traceable separated paths. PASS. |
| Whole scene / acceptance | Same four section regions and 24-node hierarchy; 26 wires, labels hidden by default. No new clipped marker, detached endpoint or visible label collision. Selection verifies labels when requested without geometry changes. PASS. |
| Whole scene / inherited preference | Plain prototype cards, small port/gate annotations and sparse frozen spacing remain below the artwork/detail density of the AWS/Docker exemplars. These are the retained M4 fixture presentation, not newly introduced geometry changes. The milestone does not claim an infographic redesign or a new panel-density measurement. |

The benchmark's crossing and overlap gates are independently measured, not inferred from screenshot halos. Color/typography/layout assets are unchanged; no new contrast or heading-size treatment was introduced. The proof accounts for all 23 actual intersections, including five linked-road-order certificates. Visible routing has improved while the approved frozen fixture remains intact.

Capture provenance: `capture-m45.py` renders current application output first, then substitutes the **immutable baseline scene at the app's scene-construction boundary in an isolated headless page** using the same renderer. It checks all 26 baseline polylines against that snapshot before saving the before image. The comparison sheet only arranges those two unmodified screenshots with captions. It never changes the production scene, the Vite process, or the user's browser.

A first capture harness missed Vite's query-string module URL and produced an invalid identical before image; visual QA caught it, the route match was corrected, and an all-wire baseline assertion now prevents recurrence. A subsequent five-load batch exceeded 300 ms during ongoing work; its complete sample is retained in `m45-browser-attempts.json`. Final acceptance uses a complete fresh batch after source edits and checks, never a filtered set of loads.
