# M10f — real-graph legality analysis

The committed authoring scene is illegal despite all 119 wires returning `ok:true`. This spike reproduces and classifies the evidence; it does **not** implement or prove a sufficient repair. The smallest build candidate is construction-owned connector attribution, motivated by a local corridor **4→2** counterfactual. That candidate remains **unvalidated as a generic product change**. [Evidence: `classification.json` → `value.summary`; `probes.json` → `value.ownershipProbe`; routing success is defined in `R:174–195`, independently of `I:148–165`.]

## Evidence and citation conventions

All artifacts here are analysis-only. The input commit is **534fd8dd4e6b22e143008b975795125c1b538c73**, verified committed on `feat/m10b-dogfood` (its observed HEAD is `1ff0be8`). `replay.mjs:11–15,168–192` reads five JSON files and the verifier directly with `git show`, records their SHA-256 hashes, asserts the public inspector matches the committed audit, and emits every witness. `classification.json` is its complete output; object paths below start at `value`. Source baseline for the following file:line aliases is ordertrial **71a22e8**:

| Alias | Repository file |
|---|---|
| P | `capability/layout/core/nested-lane-projection.ts` |
| C | `capability/layout/core/nested-road-capacity.ts` |
| S | `capability/layout/core/prototype-nested-placement.ts` |
| I | `capability/layout/core/nested-wire-inspection.ts` |
| R | `capability/layout/core/nested-wire-routing.ts` |
| L | `capability/layout/core/nested-wire-lanes.ts` |
| J | `capability/layout/core/prototype-road-junction-union.ts` |
| N | `capability/layout/core/prototype-road-network.ts` |
| V | `output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs` |

Thus `P:262–275` is a file:line citation, not a different artifact. The replay executes the **pinned M10b** verifier. Its relevant geometric/proof algorithms match V, with line numbers two greater after the empty-leaf test. S also differs from M10b in empty-leaf handling and corresponding line offsets; the placement/capacity formulas cited here are unchanged. This distinction matters: the current branch rejects empty leaves (`S:52–55`), whereas the M10b fixture retains three. This replay inspects the committed scene, **not a successful current-branch reconstruction of its semantic spec**. A future build must carry the M10b empty-leaf support or otherwise reconcile that branch prerequisite without deleting directories. [Evidence: `git diff 534fd8d 71a22e8 -- capability/layout output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs`; `classification.json` → `topology.sections`, `inputs`; `replay.mjs:168–179`.]

The old `stop-report.md` is historical. Amendment 1 authorizes correction of the scratch Python error: `excludedTypeOnlyImports` is the scalar **111**; individual imports are in the `imports` array. Reading the scalar and inspecting the array succeeds. No fixture/tool failure was repaired or waived. [Evidence: pinned `authoring-scene/extraction-manifest.json` → `excludedTypeOnlyImports`, `imports`; orchestration brief, Amendment 1.]

## Q1 — every failure witness classified

Witnesses are not distinct defective wires, and counts across classes must not be added as unique defects. `wNN:k` uses a one-based segment ordinal; overlap and uncertified ordinals follow committed array order. All 4/40/87/18/1,273 records, including coordinates, owners and classifications, are retained in `classification.json` → `catalog`. The replay classifies this frozen catalog, not arbitrary future scenes; mechanism labels are diagnostic explanations supported by the traces below, not a general-purpose causal oracle. [Evidence: `replay.mjs:39–90,113–118,180–190`.]

| Catalog → count | Mechanism | Producing/observing code |
|---|---|---|
| Corridor → 2 | C1: forward clamp collapses the median dogleg, emitting a diagonal (`w03:5`, `w23:5`) | `P:151–164,241–244,262–275`; rejected by `I:21–31` |
| Corridor → 2 | C2: turn/stem attributed to an outgoing road that does not contain it (`w41:16–17`) | `P:46–63,192–244,262–275`; `I:21–28` |
| Node body → 40 | N: demand-sized streets/turns exceed fixed body clearance; 39 orthogonal witnesses and one diagonal witness | `S:10–22,129–141`; `C:31–39`; `P:88–97,192–223`; `I:36–47,159–161` |
| Boundary → 45 | B1 only: quarter-pitch displaced turn crosses wall away from assigned gate | `P:46–63,88–97,262–275`; `C:46–56`; `I:75–115` |
| Boundary → 22 | B1 and B2 on the same segment, at different section contacts | Same B1 chain plus `C:114–136`; `I:66–70,112–115` |
| Boundary → 20 | B2 only: enlarged street/channel crosses an unplanned section wall | `S:10–22,149–159`; `C:31–39,114–136`; `R:30–40`; `I:112–115` |
| Overlap → 12 | O1: diagonal bounding-box artifacts; not positive-length collinear overlaps | C1 producer; rectangle intersection in `V:122–143` |
| Overlap → 2 | O2: terminal backtrack shares another wire's terminal lane | `P:180–202,214–222,299–312`; `V:122–143,246–256` |
| Overlap → 4 | O3: separately allocated channels share physical space | `L:59–83`; `P:46–97,192–244`; `C:31–56`; `V:122–143` |
| Uncertified → 1,273 | U: proof globally aborts on overlapping proof regions before producing any pair certificate | `J:56–83`; `V:312–327,510–538,573–594` |

Boundary totals count **87 segments**, containing **119 illegal wall contacts**: 67 B1 and 52 B2. There can be more than one contact per segment. The 18 overlap reports contain **six confirmed collinear positive-length overlaps**; 12 involve a diagonal, violating the overlap routine's orthogonal precondition. The illegal diagonals remain corridor defects; calling these reports artifacts does not legalize their geometry. [Evidence: `classification.json` → `summary`, `boundaryContactCounts`, `catalog.overlap`; classifier `replay.mjs:60–90`; `V:122–143`.]

### Corridor traces — all four

`w03:5` runs (3089.5,454)→(3247,457). `medianBridge` first makes two distinct columns, x=3001 and x=3247, with median y=454. `forwardConnection` moves **both** via points to x=3089.5 while leaving the destination at (3247,457). `connectionLine` removes the zero-length middle piece and connects the last via directly to the destination, creating the diagonal. `w23:5` repeats the mechanism: nominal columns 603/741 collapse to 625.5, producing (625.5,1678)→(741,1681). Both exact emitted segments are asserted by executing the pinned producer functions in memory. This is a new projector defect beyond the mouths-spike gate-plane case. [Evidence: `P:151–164,20–21,241–244,262–275`; `probes.mjs:17–38`; `probes.json` → `medianProbes`.]

`w41:16` runs (6181,1910.5)→(6182.5,1910.5); `w41:17` then runs to (6182.5,1813). Their declared horizontal owner spans y=1756..1828, so both fail endpoint containment, although both segments are orthogonal. The forward extension and connection inherit the outgoing ownership chosen by `nextOwner`/`leftConnection` and used by `owned`/`connectionLine`. Both segments instead fit the incoming vertical road x=6040..6376, y=1438..2056 and registered J280, which lists both roads. This is an ownership defect distinguished from C1's geometry defect; a generic attribution rule has not been tested. [Evidence: `P:54–62,192–244,262–275`; `classification.json` → `catalog.corridor`; `probes.mjs:57–79`; `probes.json` → `ownershipProbe`.]

### Node-body traces — three distinct streets

`w03:6` runs x=3247→3196 at y=457, through node-3's x=3196..3388, y=400..496 interior. Its vertical street has width 252 (20 retained travels), exceeding the fixed 72-unit clearance on each side. `w25:20` runs (6130.5,1865.5)→(6289,1865.5), entering node-37 at x>6280, y=1864..1960; its vertical owner has width 336 (27 travels). `w25:22` runs x=6289→6625 at y=1639 through node-35 and node-36 interiors; its horizontal owner has height 228 (18 travels). These examples cover all three street IDs represented by the 40 witnesses. [Evidence: `classification.json` → `catalog.nodeBody` identities above; `S:10–22`; `L:87–107`; `C:31–39`; `P:88–97,192–223`; detector `I:36–47`.]

The shared failure is capacity added after fixed embedding without re-establishing body clearance. The inspector's body predicate assumes axis-aligned segments; `w03:5` is its sole diagonal body witness. Here its actual line also enters node-3: at x=3196 its y is approximately 456.03, inside 400..496. Thus this particular witness remains a real body penetration, but the rectangle predicate is not a general diagonal intersection proof. [Evidence: `I:36–47`; `classification.json` → `catalog.nodeBody` (`w03:5`); linear interpolation of its recorded endpoints.]

### Boundary traces — three per subgroup

B1-only examples are `w22:29`, crossing section-2 at (4540.5,136) instead of (4539,136); `w25:20`, crossing section-14 at (6144,1865.5) instead of (6144,1867); and `w28:22`, at (6144,1859.5) instead of (6144,1861). Each is displaced exactly pitch/4=1.5. The widened road edge starts the turn on the wrong side of the gate plane, while `leftConnection` offsets the outgoing coordinate; clipping/forward support does not restore a gate-plane crossing. The section-2 gate driveway in the first example has zero length. This is the **known mouths-spike mechanism**, now on the real graph. [Evidence: `P:46–63,88–97,187–202,262–275`; `C:46–56`; `I:75–110`; `classification.json` → `catalog.boundary`; `../mouths-spike/design.md`, Q1 gate witnesses.]

Mixed examples `w22:11`, `w24:12`, `w25:12` cross the section-6 bottom at x=778.5/814.5/796.5 instead of assigned x=777/813/795, then cross section-5's bottom y=2232 at those same x coordinates. Section-5's road centered y=2168 has height 480 and extends to y=2408, outside its own section. The first crossing is B1, the second B2 (no matching owned gate). Moving only the 1.5-unit displacement would leave the larger spill. [Evidence: the three complete `catalog.boundary` records and their `contacts`; `C:31–39,114–136`; `P:46–63`; `I:96–115`.]

B2-only examples `w24:16`, `w25:16`, `w26:16` cross section-5's bottom at x=4199/6129/6153. The first two have no section-5 gate in their planned gate list; `w26:16` also crosses section-14's bottom at (6153,2096), while its planned entry is (6144,1903). Widening the horizontal street and extending perpendicular end caps creates legal-within-road coordinates outside the frozen section. The route plan uses source/target ancestry, so it never intended these extra wall traversals. [Evidence: `C:31–39,114–136`; `R:30–40`; `classification.json` → `catalog.boundary`; `I:66–70,96–115`.]

The classifier uses exact recorded gate distances to partition B1 from B2. It does not assert that every future 1.5-unit discrepancy has this cause, or that every other discrepancy must be capacity spill. These catalog-specific explanations rest on the road/section bounds and producer traces above. [Evidence: `replay.mjs:53–75`.]

### Overlap traces

O1 examples `overlap:1` (`w03:5`/`w12:5`), `overlap:2` (`w03:5`/`w13:18`) and `overlap:3` (`w03:5`/`w13:19`) report lengths 3, 3 and 6. The routine intersects bounding boxes and sums their x/y extents; a diagonal's box has two positive dimensions, so these lengths are not coincident wire lengths. The same defect accounts for all twelve O1 reports involving w03/w23. Repairing diagonals requires recomputing contacts, not merely subtracting twelve from an acceptance total. [Evidence: `V:122–143`; C1 above; `classification.json` → `catalog.overlap`.]

Both O2 witnesses are real: `overlap:13` is `w26:24` x=6274→6280 and `w61:23` x=6280→6256 at y=1681, sharing length 6; `overlap:14` is `w36:24` x=6280→6250 and `w67:23` x=6268→6280 at y=1675, sharing length 12. All belong to `drive:node-35:entry-left`. Fan depth depends on lane population, and the clipped lane piece can backtrack from the turn to the terminal fan. The join-forward clamp constrains the connection start, not every final target stem. [Evidence: `P:180–202,214–222,262–275,299–312`; `V:246–256`; `catalog.overlap` and `probes.json` → `supplementary.reversedAssignedSegments`.]

Three O3 examples: `overlap:15` (`w37:21`/`w86:11`) shares x=6072..6075 at y=1769.5 between two separately owned vertical-road turn channels; `overlap:16` (`w41:18`/`w85:12`) shares x=6182.5..6184 at y=1813 between a horizontal street and gate driveway; `overlap:17` (`w41:18`/`w85:13`) continues x=6184..6187 against a vertical-road connector. `overlap:18` is retained in the catalog as the fourth O3 witness. Distinct lane assignment per road does not imply distinct physical channels when demand-expanded road/turn envelopes overlap. This is new evidence of a cross-owner allocation problem, not the same as an incorrect corridor label. [Evidence: `L:59–83`; `P:46–97,192–244`; `C:31–56`; `classification.json` → `catalog.overlap`.]

### Uncertified traces and proof limit

The first failing pair is J17 (x=7002..7302, y=2226..2382) and J145 (x=6998..7034, y=1928..2408), with positive-area intersection. Nine overlapping proof-region pairs are replayed: **J17/J145, J134/J280, J152/J258, J152/J273, J152/J280, J253/J280, J265/J280, J271/J276, J271/J282**. Road-indexed junction merging does not establish scene-wide disjointness, and terminal-expanded proof rectangles impose an additional condition. The assertion precedes the entire certificate loop; therefore endpoint certificates, linked constraints and obstructions all remain empty. Coverage then leaves all 1,273 recorded hits uncovered. [Evidence: `J:56–83`; `V:312–327,518–538,573–594`; `replay.mjs:91–112`; `classification.json` → `proofAbort`.]

Three representative uncovered records demonstrate why fixing the first assertion alone is insufficient evidence:

| Record | Recorded contact | Diagnostic perimeter evidence |
|---|---|---|
| `uncertified:1` w01/w11 | (2791,451), J52 | Two events each; still no certificate because the global pass aborted. |
| `uncertified:2` w01/w12 | (3259,299), J36 | One event for w01, two for w12. Current `junctionPath` would omit w01. |
| `uncertified:3` w01/w15 | (3121,293), J62 | Two events for w01, one for w15. Current `junctionPath` would omit w15. |

These events are read diagnostically without bypassing the abort or issuing certificates (`replay.mjs:113–118`; `classification.json` → `catalog.uncertified`). The latter two expose the known interior-terminal/perimeter-model limitation from mouths-spike, via `N:190–203` and `V:329–347,490–493`. The new immediate blocker is **global region overlap**. None of this establishes which of the 1,273 contacts are unavoidable, nor that every contact is geometrically legal; the actual-count/lower-bound and one-use coverage obligations remain (`V:546–594,596–626`).

### Shared causes and other exit-0 obligations

Fixed embedding followed by demand widening is the common upstream pressure behind N, B1/B2, O2/O3 and overlapping proof regions. C1 additionally contains a reproducible dogleg-clamp error; C2 contains a separate ownership error; O1 is a measurement artifact downstream of C1; U is the prover's immediate global-abort behavior. This is a causal grouping, **not proof that one clearance patch cures every class**. [Evidence: producer/inspector traces above; `S:10–22`; `C:31–39,73–102`; `P:262–275`; `V:518–526`.]

The five requested counts do not exhaust verifier exit 0. The supplemental probe finds **28 assigned segments with reversed direction**, **96 missing owned gate traversals**, and **0 terminal pins outside the six-unit margin**. Those are diagnostic populations, not 28/96 additional independent root causes. Continuity is empty. Future acceptance must include forward lane direction, owned distinct gates, pitch, pins and nonjunction ownership as well as the requested counts. [Evidence: `probes.json` → `supplementary`, `ownershipProbe.before.continuity`; `probes.mjs:80–118`; `V:174–256,659–706`.]

## Q2 — topology, cycles and concentration

The directed rendered graph has **47 file nodes, 119 value-import edges, 15 sections**. Direction is importer→imported file; tests are included, re-export declarations are excluded, and the manifest records 111 excluded type-only import declarations. **Cycle list: `[]` (none)** for this 119-edge graph. This is not a claim about the graph after adding type-only imports or re-exports. Replay asserts the manifest's edge list matches scene-spec requests and wire identities; its cycle search explores simple directed paths with the minimum-number vertex as the canonical start. [Evidence: pinned `extraction-manifest.json` → `scope`, `excludedTypeOnlyImports`; `classification.json` → `topology`; `replay.mjs:119–166`.]

Degree histograms (all nodes, including isolated directions):

| Degree | In-degree node count | Out-degree node count |
|---:|---:|---:|
| 0 | 11 | 11 |
| 1 | 15 | 6 |
| 2 | 6 | 10 |
| 3 | 4 | 8 |
| 4 | 3 | 4 |
| 5 | 2 | 3 |
| 6 | 2 | 1 |
| 7 | 1 | 2 |
| 8 | 0 | 1 |
| 9 | 1 | 0 |
| 10 | 0 | 1 |
| 11 | 1 | 0 |
| 19 | 1 | 0 |

Each column sums to 47 nodes; each weighted degree sum is 119. Maximum IN=19, OUT=10. Top-five ties use ascending node number; node-30 also has IN=6 and is outside the displayed five. [Evidence: `classification.json` → `topology.histogramIn`, `histogramOut`, `degrees`; `replay.mjs:134–137,151–166`.]

| Rank | Incoming hub (path relative to authoring) | IN | Outgoing hub | OUT |
|---:|---|---:|---|---:|
| 1 | node-36 `core/validation/outcomes.ts` | 19 | node-20 `core/admission/pipeline.ts` | 10 |
| 2 | node-3 `contract/brands.ts` | 11 | node-25 `core/history/journal.ts` | 8 |
| 3 | node-6 `contract/index.ts` | 9 | node-2 `contract/api.ts` | 7 |
| 4 | node-35 `core/validation/input.ts` | 7 | node-21 `core/admission/prepare.ts` | 7 |
| 5 | node-16 `contract/records/storage.ts` | 6 | node-26 `core/history/read.ts` | 6 |

The five IN hubs absorb 52/119=43.70% of edges; the OUT hubs emit 38/119=31.93%. Internal directed density is e/[n(n−1)], without self-edges; n<2 is undefined, not zero density. Highest direct-file densities are `core/validation` 6/12=0.5; `core/history`, `core/records`, `core/transactions` each 2/6=0.3333; `core/admission` 8/30=0.2667. Those directories have no descendants, so subtree densities agree. By raw subtree edge volume, `core` leads with 62/420=0.1476 across 21 nodes; `contract` has 12/240=0.05 across 16. Direct `contract` density is 2/30=0.0667. The three empty directories are `core/commit`, `core/preparation`, `core/receipts`. Full direct/subtree rows and internal wire IDs are in `classification.json` → `topology.sections`; calculations are `replay.mjs:138–150`.

No inspected routing law requires a DAG, a fixed degree bound, or balanced inbound/outbound degree: requests route individually through ancestry-selected gates (`R:30–40,133–195`), lanes group by road and direction (`L:77–107`), and capacity reserves both traffic sides (`S:12–15`). Acyclicity therefore does not rescue the geometry. The violated assumption is spatial: fixed clearance and gate/terminal support must accommodate demand-derived widths and rank-dependent fans. For example, 27 travels yield width 336 and 39 yield 480, while placement clearance stays 72. Node degree also understates transit-road demand. [Evidence: N/B traces; `S:10–22`; `C:31–39`; `P:180–185`.]

`index.ts` is not the highest IN hub here, and **no kernel-named node exists** in the manifest. Chris's index-top-left/kernel-bottom-right goal must be treated as a semantic placement intent (and validated on scenes containing kernel), not silently replaced by a highest-degree heuristic that selects outcomes/pipeline. A future policy can reserve explicit semantic roles first and use degree for remaining placement, with a specified conflict/tie rule. That is a proposal, not measured behavior. [Evidence: `classification.json` → `topology.topIn`, `topOut`, `kernelNodes`, `degrees`; current order-to-grid behavior `S:129–141`; prior goal `../mouths-spike/design.md`, Q3.]

## Q3 — ordered minimal legal change set: obligations, not a sufficiency theorem

A mathematically minimal sufficient patch is **not established** by these artifacts. The following is the smallest set of distinct repair obligations supported by the failures; combine implementations only when evidence shows one change satisfies several obligations. Do not tune the fixture, widen inspector tolerances, bypass disjointness, hard-code observed crossing totals, or delete empty directories to produce green output. Geometry and certificates must be regenerated from unchanged semantic requests. [Basis: Q1 traces; `V:90–120,142–143,518–626,671–706`.]

Ruling #10 reference **compile/routing/discovery** counts are default **19,768/992/0**, templates **28,443/1,626/0**, scale **43,876/2,088/0** (`../mouths-spike/brief.md:38–40`; `../calculations.json` → `laneNetwork`; `../templates-scene/operations.json`; `../scale-scene/operations.json`). No proposed product delta is measured here. Complexity estimates below are in addition to that uncertainty; preserve zero discovery through construction indexes, not scene-wide collision search. [Basis: `J:56–83`; `N:218–243`.]

| Order | File-level proposed change | Invariants to re-derive and acceptance | Estimated operation impact / risk / corner dependency |
|---|---|---|---|
| 0 — preserve baseline and branch compatibility | Future contract tests and authoring-scene verifier wrapper; carry the existing M10b empty-leaf behavior in `prototype-nested-placement.ts` when integrating this fixture | Same 47/15/119 semantics, including empty sections; reproduce every catalog; retain default/templates/scale outputs and proof controls | Offline fixture work: no layout operations. Empty-leaf handling is a separate integration prerequisite, not a geometric cure. Independent of doors/hubs. |
| 1 — connector ownership | `nested-lane-projection.ts` (`nextOwner`, `beforeOwner`, connection representation/emission), using adjacent construction roads/junction metadata | Every segment contained by its actual registered owner; preserve exact geometry, lane IDs, continuity, legal turn membership and gate ownership; target C2 without relabeling unrelated segments | Constant candidates per emitted piece, thus O(segments), if adjacent ownership suffices; exact count unknown. Low surface area, medium semantic risk. Independent of doors/hubs; Q4 candidate. |
| 2 — orthogonal, forward projection | `nested-lane-projection.ts` (`medianBridge`, `forwardConnection`, target fan/stem and `owned`) | Keep distinct dogleg columns or return explicit infeasibility; every segment orthogonal, forward assigned travel, contained, no terminal backtrack sharing; regenerate all contacts | O(travels + emitted pieces) for bounded local support checks; potentially more pieces. Medium/high risk: generic clamping can create collisions. Addresses C1/O1/O2 and 28 reversed witnesses; local repair may require step 3. Necessary support for moved doors, not alone an unblock. |
| 3 — demand-feasible embedding and gate intervals | `prototype-nested-placement.ts`, `nested-road-capacity.ts`, `prototype-nested-roads.ts`, orchestration in `prototype-nested-scene.ts`; projection consumes legal support intervals | Reserve street half-widths, full fan/turn depths and margins against nodes and all relevant section walls. Every planned gate has an owned crossing at its exact assigned offset. Rebuild node/section bounds and construction contacts coherently; no unplanned boundary traversal | At least demand/support aggregation O(retained travels + contacts); exact additional placement/routing work unmeasured. **High risk**: changed placement can change gate preferences/demand; termination and compatibility with the one-way stage contract require design, not an assumed extra loop. Targets N/B1/B2/O2 and gate omissions. Main prerequisite for corner doors and hub relocation. |
| 4 — shared physical channels and proof-region topology | `prototype-road-registry.ts`, `prototype-road-junction-union.ts`, `prototype-road-network.ts`; `nested-wire-lanes.ts`/`nested-lane-order.ts`/projection only where shared turn reservation is necessary | Distinct physical channels across road identities (O3); registered turn coverage; no overlapping independently additive proof regions. Preserve construction terminal provenance or ensure geometry makes it unnecessary | Indexed local contact/group work; sorted event processing roughly O(k log k), no numeric promise and no global discovery fallback. High risk: region unions may create swallowed terminal paths and alter ordering. Required for general legal hub/door combinations; not solved by renaming owners. |
| 5 — semantic corner-door/hub policy within the feasible regime | `prototype-nested-placement.ts`, declaration-only scene option contract and `prototype-nested-scene.ts` wiring as needed; road construction retains original side/role identities | Reserve index top-left and kernel bottom-right where present; report absence/conflict deterministically. Desired corner fractions must lie in feasible intervals inset from corners; keep four distinct mouths, stable semantics, pitch/pins and contact ownership; repeat steps 2–4 checks | Degree counting O(nodes+requests), optional per-section sorting O(n log n), constant work per desired port before support checks. Medium/high risk of demand redistribution. Directly implements both goals; not a claim that ordering reduces crossings. No third-mouth expansion is justified as minimal. |
| 6 — valid proof and complete acceptance | Offline `verify-templates-scene.mjs` and authoring wrapper; registry provenance only if geometry cannot supply the current model | First try geometry with disjoint regions and legitimate two-endpoint paths. If internal terminals remain, derive a sound terminal/region model before modifying the certifier. Certify every actual contact exactly once, actual count equals derived bound, all negative controls retained. If a crossing is avoidable under the legal order model, reduce it rather than certifying an unsupported floor | Offline-only proof edits add zero layout operations; truth-table enumeration can be exponential in shared variables (`V:529–538`). High mathematical risk. May reuse current proof after geometry repair; proof-source changes are conditional, not proven unavoidable. |

Steps 1 and the C1 part of 2 can be investigated independently of corner placement. Step 3 makes desired positions admissible; steps 2, 4 and 6 establish the routing/proof obligations that step 5 must continue to satisfy. Door slides do not cure high-demand body collisions by themselves, and a hub order is not a legality theorem. [Basis: Q1; `P:46–97,180–223`; `S:106–141`; `../mouths-spike/design.md`, Q2 invariants/Q3.]

The final sufficient **acceptance condition**, not a proved implementation, is: rebuild the real scene twice identically; all 119 wires succeed; corridor/body/boundary/continuity/positive-length overlaps are zero; lane direction/pitch/pins/owned gates pass; every crossing has a valid one-use certificate with actual=derived lower bound and uncertified=0; **the complete authoring verifier exits 0**. Run retained default/templates/scale verifiers and compare canonical geometry/semantics: unchanged output is preferred; changed output must have independently demonstrated legality and no worsened retained gates. Remeasure operation deltas against ruling #10, require `pnpm check`, and inspect future rendered changes against the repository visual references/benchmarks. Those future build gates have **not** passed for a repaired real scene in this spike. [Evidence: `V:90–120,142–143,174–256,518–626,671–706`; `AGENTS.md:23–24`; `docs/agent-diagrams/visual-quality/SOP.md:5–17`.]

## Q4 — smallest first milestone

Recommend **validate construction-owned connector attribution** before a full geometry redesign. The in-memory experiment changes only `corridorId` on w41 segments 16/17 to their containing incoming vertical road, both inside registered J280. The public inspector then reports corridors **4→2**, with body=40, boundary=87 and continuity=0 unchanged. Coordinates and lane IDs are asserted byte-equivalent as JSON data; the exact 18-entry overlap catalog is unchanged. No new certificate pass is performed on the candidate, and the preserved 1,273 uncovered crossings remain unresolved. [Evidence: `probes.mjs:46–79`; `probes.json` → `ownershipProbe`.]

This is an **unvalidated generic-fix candidate**, not a validated milestone or a legal scene. The experiment selects two known segments by identity; that selection is diagnostic and must not ship as the fix. Build acceptance should demand a general rule using existing adjacent construction ownership, then rerun this real catalog and default/templates/scale. Require the exact 4→2 target with no new failures, stable geometry/lane IDs, valid junction/turn ownership, no gate or proof regression, baseline preservation, deterministic output and measured operation counts. Metadata is meaningful law data, so an inspector-only improvement is not enough to validate it. If that general rule cannot meet the gates independently, the milestone is not achieved; the candidate cannot be declared sufficient by this counterfactual. [Basis: `I:21–28`; `P:192–244`; `V:659–706`; counterfactual assertions above.]

This scope avoids depending on the unproved demand/placement/proof redesign while offering one small measurable legality improvement to test. Its value is narrow: two corridor ownership witnesses, with every harder failure explicitly retained. [Inference from the unchanged catalogs in `probes.json`.]

## Reproduction and delivery evidence

From repository root (Node 24 with the repository's installed `tsx`/TypeScript):

```sh
node --import tsx output/playwright/nested-wires/legality-spike/replay.mjs
node --import tsx output/playwright/nested-wires/legality-spike/probes.mjs
node --import tsx output/playwright/nested-wires/legality-spike/replay.mjs --assert-legal
```

The first two return 0 for successful **diagnosis**; the last is an expected exit-1 negative control on the unchanged illegal scene. Infrastructure/diagnostic failures return exit 2. The scripts read pinned Git objects and the public layout inspector; no product geometry is written. Two independent replay invocations must produce byte-identical stdout matching `classification.json`; receipts/hashes are in `validation.json`. Both script standards reviews are in `source-review.md`. Final-tree check output and exit status are `pnpm-check-output.txt` / `pnpm-check-exit.txt`. Git commit/push is restricted to this directory on `feat/order-trial`, with no PR. [Evidence: `replay.mjs:1–15,168–207`; `probes.mjs:1–23,120–140`; delivery receipts.]

No rendering or screenshot capture is part of this analysis-only delivery, and no visual improvement is claimed. The prior rendered references and product sources remain unchanged. Final check success verifies repository health, not scene legality; full legality remains the future build acceptance described above.
