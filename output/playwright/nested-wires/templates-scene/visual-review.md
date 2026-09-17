# M6 rendered-output review

Inspected both required PNGs at 1920×1440 and the supplementary contract view.
Compared against `docs/agent-diagrams/visual-quality/References.md`, including
the retained modules and AWS architecture images, and the measurable floors in
`docs/maintenance/diagram-quality-improvements.md`. No reference asset changed.
No subagent review was performed: the user's explicit prohibition takes priority
over that document's usual fresh-reviewer step.

## What the screenshots establish

- All 16 production filenames are present and in the correct directory groups;
  the empty-direct-node `core` parent has four visibly nested child groups.
- Orthogonal wires stay separated. The apparent dense trunks are distinct
  pitch-6 tracks, not shared segments. All 130 crossings are individually
  certified in registered junctions; none is an unresolved overlap.
- The roads-off image reveals `api.ts`'s inbound concentration and `errors.ts`'s
  outbound fan. `index.ts` is visibly a small re-export sink. Roads-on exposes
  the same graph's physical capacity, including the busy contract/core mouths.
- The browser asserts that every node is within the fit viewport, every label
  ends in `.ts`, all 29 wires render, the pipeline runs once, and no page error
  occurs. These checks do not substitute for a visual-quality verdict.

## Outstanding visual findings

| Region | Severity against general benchmark | Observation / mechanism |
| --- | --- | --- |
| All leaf sections, especially `adapters` and single-file core directories | Blocker | Large empty panels. Node rectangles occupy only 9.55% of each one-node 464×416 panel; even allowing for labels/ports and corridor marks, it visibly exceeds the 40% empty-area floor. The frozen placement/clearance policy determines this. |
| Whole fit overview | Polish | File labels read only at close inspection; the width of the directory layout drives the scale down to approximately half-size. More compact placement or a different overview/detail treatment is needed. |
| Outer world trunk from `adapters` to `contract` | Polish | A long scene-wide perimeter route is lawful but visually expensive. Changing it would require a placement/routing scope decision, not another capacity repair. |
| Default wire labels | Known prototype limit | Overview has no persistent import names; inherited selection exposes wire IDs. Source-line meaning is in the extraction report. The current renderer is unchanged. |

The immediate-child/node rectangle occupancy diagnostic reports empty area
before adding labels/road marks: contract 65.13%, core 57.22%, two-node leaf
sections 88.92%, single-node leaf sections 90.45%. It is **not** a precise pixel
coverage metric and is not passed off as one. The PNG itself confirms the
large-air-pocket finding. Contrast and caption-ratio floors have not been
independently measured; no blanket accessibility/visual PASS is claimed.

The M6 brief permits nested-only placement, capacity/projection repairs and
scene integration. It freezes the existing routing law and other placement
paths. Thus this resume delivers and verifies the requested captures, records
the visible limitations, and does not silently redesign spacing, typography,
node rendering or route topology to claim the general visual benchmark.
**The screenshot deliverable is verified; general visual-quality acceptance
remains open.**
