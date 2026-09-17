# M3 source review

Reviewed the restored candidate plus final cap correction against the sixteen anchors in `docs/standards/CODING-STANDARDS.md`. These are whole-file reviews, not pre-awarded scores. Columns: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, retry, depth, Demeter, immutability, type safety, cognitive style, testability. LSP is 7, not demonstrated. OCP is 6 where adding a construction/routing step edits the module. Local mutable buckets receive 8 for immutability. The separate executable Sonar ceiling remains ≤2, without suppressions.

| Source | Sixteen scores | Total |
|---|---|---:|
| core/nested-wire-lanes.ts | 10,6,7,10,10,10,9,10,10,10,10,10,8,10,10,10 | 150 |
| core/nested-lane-projection.ts | 10,6,7,10,10,9,8,10,10,10,10,10,10,10,7,10 | 147 |
| core/nested-road-capacity.ts | 10,6,7,10,10,10,9,10,10,10,10,10,8,10,7,10 | 147 |
| core/nested-wire-inspection.ts | 10,6,7,10,10,10,9,10,10,10,10,10,10,10,7,10 | 149 |
| core/nested-wire-routing.ts | 10,6,7,10,10,10,9,10,10,10,10,10,8,10,7,10 | 147 |
| core/prototype-nested-placement.ts | 10,6,7,10,10,10,9,10,10,10,10,10,8,10,7,10 | 147 |
| core/prototype-nested-scene.ts | 10,6,7,10,10,10,9,10,10,10,10,10,10,10,10,10 | 152 |
| contract/records/nested-wires.ts | 10,10,7,10,10,10,10,10,10,10,5,10,10,10,10,10 | 152 |
| contract/records/road-prototype.ts | 10,10,7,10,10,10,10,10,10,10,5,10,10,10,10,10 | 152 |
| canvas/adapters/react-flow/RoadPrototype.tsx | 10,6,7,10,10,9,9,10,10,10,10,10,8,10,7,10 | 146 |

Paths beginning core/ or contract/ are under capability/layout. Minimum 146/160 >144. These scores are not a repository analytics score.

## Evidence for the scores

- **nested-wire-lanes.ts:24–54** extracts only positive parallel travel from the law's named corridors and coalesces continuous stretches; **56–81** owns the right-hand, pitch and wire-ID ordering policy; **84–112** owns fresh demand/assignment indexes and appends locally rather than copying growing road populations. No scene road scan, ambient dependency or externally mutable state. KISS 9 reflects segment-index retention. The typed fixed-fixture inputs require no external validation; absent named roads are an explicit empty outcome. Reconstruction is documented at the entry.
- **nested-lane-projection.ts:13–36** eliminates zero-length segments and constructs coordinate joins; **38–91** resolves only retained intervening corridor IDs; **93–130** fans exact terminals and clips ownership; **132–199** assembles continuous named-road pieces; **201 onward** materializes the immutable result, retaining the original wire if its required plan is absent. It never selects ports, roads or gates again. Projection axis knowledge repeats that in capacity (DRY 9), and ownership/fan geometry takes multiple steps to trace (KISS 8). Conditional point assembly warrants cognitive style 7. The builder owns full reconstruction, stated in its public entry comment.
- **nested-road-capacity.ts:6–16** is the single final-width application; **17–46** attaches driveways only to registered neighboring streets; **48–83** constructs fresh final records and contact references once; **85–108** compares original centerline endpoints against registered perpendicular streets and caps at their final edges. This fixes the observed world-street/section-1 driveway collision. No all-road pairing. Missing contacts have a typed undefined/empty path, and callers supply a fully constructed registry. Local Map updates and two axis-bound ternaries earn the explicit immutability/style deductions.
- **nested-wire-inspection.ts:16–87** independently checks orthogonality, bounds, node bodies and boundary intersections; **88–141** admits only this wire's gate offset within the mouth; **143–173** validates exact node terminals and continuity; **175 onward** returns structured violation identities. It imports declarations only. Direct record access is not a Demeter violation. Its complexity is the necessary independent geometry audit (KISS 9); axis assembly earns cognitive style 7. The corruption script rejects a wrong lane even inside the correct mouth.
- **nested-wire-routing.ts:14–33** contains the exact 18 semantic requests; **39–174** retains the original ancestry, port/gate selection and finish functions; **176 onward** executes the unchanged law once per attempted leg at zero reservation offset and preserves the atomic typed `NestedWireResult`. Existing local selected-gate mutation, branch assembly and ancestry tracing retain the prior 147 score. The law file itself is unchanged, byte-for-byte from M2.
- **prototype-nested-placement.ts:9–14** names pitch and width; the remaining bottom-up sizing and parent-first placement are unchanged from the prior whole-file review in `source-review.md`. The clone probe checks all original/copied bounds, owners and ports. Existing local placement cursors and axis choices retain the recorded deductions.
- **prototype-nested-scene.ts:27–58** creates capacity, placement, ports and reservation topology once; **59–76** forms a readonly reservation view; **77–99** obtains law demand, widths, final network and projected wires once in that order. Typed route failure returns before finalization; no retries or duplicate stages are hidden. The two geometry representations cost KISS 9; collaborators/step list are not extensible by a declared seam (OCP 6). Measurement is injected, with no clock, React or foreign capability in core.
- **contract records:** `NestedWireSegment.laneId`, readonly `NestedWireLane` and optional `wireLanes`/`wireLaneCount` expose generated evidence without behavior or adapter imports. Shape-only depth is 5; no cast, mutation, I/O or failure behavior exists. All measurement-stage values remain a declaration union.
- **RoadPrototype.tsx:639:** the selector label derives its count from the same `wires` record as the header/options. The rest of the whole-file evidence remains in `../selection/source-review.md`: injected finished scene, view-only selection, typed validation, local midpoint cursor, repeated SVG serialization and conditional JSX. This is a one-line data correction, with no camera, rendering-style or selection-algorithm change.

## Audit programs

Standalone CLI, MJS and Python verification programs retain the established M1.5/M2 audit-tool scope: assertions and I/O failures terminate the process rather than pretending to be application domain APIs. JavaScript remains subject to lint/≤2. No test file or lint exemption was added. `verify-lanes.mjs` independently checks final geometry, whole-scene segment pairs and internal lane assignments; `count-operations.mjs` meters every reachable Layout core module, including lane projection. The browser script changes only expected topology, not assertion logic.

## Worst three limitations

1. Projection retains raw segment ordinals and axis geometry across helpers; that accounts for KISS/style deductions. The independent containment and global segment audits are the verification seam.
2. The fixed reservation topology bounds this fixture's capacity. The 100-node/200-wire estimate in README is a bounded-density extrapolation, not a claim that arbitrary congested topology fits these dimensions.
3. The renderer still combines camera, inspector and selection responsibilities and repeats SVG serialization, as recorded in the M2 review. No unrelated architecture rewrite was made.
