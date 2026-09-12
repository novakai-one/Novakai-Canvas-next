# Stage 3 — numbered relationships and attributable routes

Build branch: `feat/visual-quality-stage-3`, parent `3b569e0` (PR26). This directory records the stage; it does not claim all 24 examples are complete.

## Actual proofs

| Proof | Source | Admitted state | Evidence |
| --- | --- | --- | --- |
| Illustrated process | resources/examples/showcase/story-water-treatment.canvas | revision 7, request vq3-live-label, sequence 18 | water-final.png / .svg; water-browser-final.png; water-browser-detail.png; water-live-label.png |
| Fork/join/return | resources/examples/showcase/flow-research-approval.canvas | revision 2, request vq3-research-return, sequence 17 | research-final.png; browser overview/detail captures |
| Typed module endpoints | resources/examples/showcase/modules-document-publishing.canvas | retained Stage2 revision 0, rerendered with policy12 | modules-final.png; browser overview/detail captures |

Authoring uses public CLI DSL create/replace/patch/read. No scene coordinates were authored. Individual original SVG assets illustrate actors; no asset contains the complete diagram or its labels/routes. Same generic measured primitives, group rules, routing and renderer apply to all three subjects.

## Comparison against References.md

| Dimension | Observed result / limitation |
| --- | --- |
| Meaning | Water follows four numbered arrows, two residual flows and one dashed monitoring relationship to a represented group. Captions explain rather than replace the wires. |
| Hierarchy | Headline, three process regions, side-stream boundary, illustrations and captions have separate sizes/roles. Actors are frame-free rather than identical text cards. |
| Imagery | Five original prominent process illustrations plus one evidence illustration; semantic size=large/small and media-top determine measured geometry. |
| Routing | Badges and complete wrapped labels reserve one footprint; all foreign route/label collisions and obscuring shared runs are inspected. Main water process is serpentine; its final entry bends around the protected region title. |
| Transfer | The same step annotation supports parallel review stage numbers, decision and return paths; module routes retain member/port anchors and full typed contracts. Stage4 owns remaining engineering notation refinements. |
| Delivery | Actual public Export encodes PNG/SVG from admitted scene and pinned resources. Visible browser uses React Flow. At the user's narrow ~617px viewport, toolbar/minimap obscure part of the fit overview; reading zoom and panning verify the content. UI redesign remains deferred. |

The infographic now demonstrates the target's broad composition qualities on an original subject. It is not a pixel replica or an overall completion claim. Stage4 and Stage5 must still prove engineering refinements and all distinct-family examples.

## Builder discoveries and corrections

- A default UI stroke and export stroke differed. Wire appearance now originates in Design System, is measured by Presentation, validated with Layout and painted by both consumers.
- Foreign collinear overlap was not rejected. The new check exposed a dense-route regression: coincident approach turns made otherwise feasible candidates overlap. Deterministic source-order shortening changes only optional approach clearance; required marker advances remain intact. Existing 1000-node/1500-wire acceptance passes.
- Initial water monitoring routes competed with the main flow. DSL now targets the represented treatment region, expressing both barrier checks once. Native routing remains general.
- Research `rank` requested a column, not a parallel row. Corrected semantic alignment/order and an explicit right-side return. No code exception for research or water.
- The first browser reload had a stale client policy build. Rebuilt the client against policy12, then successfully reloaded the admitted diagram. No claim from that failed capture.
- Live patch grew “screened water” to “screened source water” with step=1 while the browser remained at 67% in hand mode. Browser reported Saved and displayed the new label without refresh.

## Verification before auditors

`pnpm check`: 188 tests / 62 files pass, 16.64s; TypeScript, ESLint (Sonar<=2), Prettier and import checks pass (851 modules). `pnpm tokens:check` and web build pass. Four new focused public-contract cases; no E2E tests. One plan pressure review already recorded; A1/A2 and verified dispositions are recorded in implementation-audits.md. Service restarted under its owned workspace; no external browser processes launched.

Post-audit correction: obstacle buffers are local rather than globally reduced by the shortest endpoint approach. The research decision/return gap is now verified in the final actual export. No further audit round.
