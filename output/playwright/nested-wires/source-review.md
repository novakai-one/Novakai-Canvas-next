# M1.5 source review

Reviewed the final application sources and their direct collaborators against `docs/standards/CODING-STANDARDS.md`. Scores were assigned after implementation and actual verification. Each row is a file review, not a claimed repository analytics grade.

Columns follow all 16 anchors: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, retry semantics, depth, Demeter, immutability, type safety, cognitive style, testability. LSP is exactly **7 (not demonstrated)**: these files do not supply substitutable implementations. Orchestration OCP is **6** because adding pipeline steps requires editing. Readonly inputs and typed null/undefined outcomes are distinguished from a promise of runtime validation of arbitrary untyped input. Core functions receive constructed records; they have no filesystem, clock, framework, adapter, or foreign-capability dependency. Their retry safety follows fresh per-invocation construction, with the scene builder owning reconstruction after changed input.

| File (under capability/layout/core) | Sixteen scores | Total |
|---|---|---:|
| `nested-wire-access.ts` | 10, 6, 7, 10, 10, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 148 |
| `nested-wire-corridors.ts` | 10, 6, 7, 10, 10, 10, 10, 10, 10, 10, 7, 10, 10, 10, 10, 10 | 150 |
| `nested-wire-law.ts` | 10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 10, 10, 7, 10 | 149 |
| `nested-wire-routing.ts` | 10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 147 |
| `nested-wire-registry.ts` | 10, 6, 7, 10, 10, 9, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 146 |
| `nested-wire-inspection.ts` | 10, 6, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 8, 10, 10, 10 | 151 |
| `prototype-nested-placement.ts` | 10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 147 |
| `prototype-nested-roads.ts` | 10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 147 |
| `prototype-nested-scene.ts` | 10, 6, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 153 |
| `prototype-road-registry.ts` | 10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 147 |
| `prototype-road-adjacency.ts` | 10, 6, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 8, 10, 10, 10 | 151 |
| `prototype-road-junction-union.ts` | 10, 6, 7, 10, 10, 10, 8, 10, 10, 10, 10, 10, 8, 10, 10, 10 | 149 |
| `prototype-road-network.ts` | 10, 6, 7, 10, 10, 9, 8, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 145 |
| `prototype-road-paths.ts` | 10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 8, 10, 7, 10 | 147 |
| `prototype-roads.ts` | 10, 6, 7, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10, 7, 10 | 145 |
| `prototype-seven-roads.ts` | 10, 6, 7, 10, 10, 10, 9, 10, 10, 10, 10, 10, 10, 10, 7, 10 | 149 |
| `../contract/records/road-prototype.ts` | 10,10,7,10,10,10,10,10,10,10,5,10,10,10,10,10 | 152 |

Minimum changed application-source score: **145/160 > 144**. `pnpm check` enforces Sonar cognitive complexity **≤2 per function**, type safety, import boundaries and formatting; the cognitive-style score above separately applies the SOP's conditional-assembly deductions. No disabled lint rule or test exemption was added.

## Per-file evidence

- **nested-wire-access.ts:** L21–43: immutable access/terminal records and direct keyed lookups; missing ownership is undefined, consumed by law/routing. Depth is 5 because lookup behavior is deliberately thin.
- **nested-wire-corridors.ts:** L9–31: one named-road lookup per segment, null for missing roads, zero-length elimination, no all-road predicate. Ownership and reserved-width preconditions are documented at coverPath. Limited behavior earns depth 7.
- **nested-wire-law.ts:** L13–35: original pair law retained verbatim; L45–117: shared crossing registry determines legal turns, with no scene access. L120–151: typed nullable leg result. Mixed corner versus same-axis highway costs one KISS point; multiple conditional geometry expressions cost three cognitive-style points.
- **nested-wire-routing.ts:** L39–54: containment itinerary; L66–118: legal gates evaluated lazily, narrow registry passed to lawLeg; L170–197: atomic typed failure or all wires. firstGate has invocation-local selection mutation (immutability 8); hierarchy state costs one KISS point.
- **nested-wire-registry.ts:** L24–53: gate orientation and owner accesses; L56–88: a separately measured one-time compile, ordered crossings and node terminals, no cached route. L93–119: road ID attachments. Local Maps cost two immutability points, duplicated center projection knowledge with road-registry costs one DRY point, inside/outside side reversal costs one KISS point.
- **nested-wire-inspection.ts:** L16–29: independent named-rectangle endpoint and orthogonality checks; L34–81: body, gate and continuity observations; L84 onward: a single immutable-view road index then per-segment get. Returns structured violation lists. Invocation-local index allocation costs two immutability points; deliberate corruptions reject all four classes.
- **prototype-nested-placement.ts:** L51–97: bottom-up capacity; L127–163: parent-before-child placement with local x/next cursors; L170–204: identical row plan reused for both fixture copies, recursive section numbering. The meter verifies every cloned bound, port shape, owner and parent. Local placement cursors and nested sizing explain the immutability/KISS deductions.
- **prototype-nested-roads.ts:** L18–109: road spans emitted from owner frames/grids and merged on their line key; L117–183: actual owner-port driveways; L186 onward: interior crossing events emitted from that grid. Construction events encode geometry knowledge once at its source. Local span/coordinate grouping costs two immutability points; axis projections cost one KISS point.
- **prototype-nested-scene.ts:** L23–61: measured construction, explicit contacts injected into lane compiler, registry injected into routing. copies is restricted to 1|2 and defaults to the original scene. Public output contains no registry timing or private mutable records. Measurement uses the injected callback; no ambient clock.
- **prototype-road-registry.ts:** L14–32: first-class road entries and line indexes; L34–43: coordinate-keyed street lookup; L45–91: actual frame/crossing/mouth events. There is no road-pair candidate list. Missing entry has a typed empty outcome. Invocation-local indexing costs two immutability points; centerline versus rectangle endpoints costs one KISS point.
- **prototype-road-adjacency.ts:** L9–32: ownership and supplied endpoint keys build incoming/outgoing memberships. L35 onward: first access owner recorded once per junction. No geometric discovery or repeated road/lane scans. Maps are local and exposed as data to the compiler; this costs two immutability points.
- **prototype-road-junction-union.ts:** L8–24: bounds/ownership union; L31–54: local disjoint-set representatives and ordered interval sweep; L57 onward: only events sharing an owning road can be joined. Final order follows the last contributing construction event, preserving M1 IDs and array order. Disjoint-set plus replay ordering costs two KISS points, local Maps cost two immutability points.
- **prototype-road-network.ts:** L20–60: actual contacts become areas and ordered road events; L63–124: span-derived lanes and per-road records; L128–187: junction-local and keyed straight connections; L218–272: one compiler pass consumes ownership and registered endpoints. No pair discovery loop survives. Bounds projection across lane/divider costs one DRY point; ordering/preconditions cost two KISS points; local maps and conditional point assembly explain the remaining deductions.
- **prototype-road-paths.ts:** L11–37: directional turn construction computes only the needed center coordinate; L45–67 and L167–179: cached interval geometry for crossing witnesses; L69–156: indexed access/lanes/turns with lazy witness selection. Output remains byte-identical, including all 86 examples. Invocation-local caches/selection are the immutability deduction; directed lanes versus witness geometry is the KISS deduction.
- **prototype-roads.ts:** L25–36: invalid width now has programmatically distinguishable RangeError; it is not a typed Result, so typed outcomes is 5. Public entry L108 documents correction/retry ownership. L124 onward passes construction contacts to the shared compiler. No shared mutable state. Existing conditional axis assembly scores 7; the fixture suite still covers this public builder.
- **prototype-seven-roads.ts:** L86–108: node/grid-owned street spans; L159–211: one construction pipeline, explicit frame/driveway events injected into the common compiler. Fixed valid fixture has no fallible I/O or untyped throw. All semantic geometry remains generated from node definitions; axis/capacity distinctions explain KISS 9.
- **road-prototype.ts:** the only measurement-contract addition is `wire-registry`; all records remain declaration-only and readonly. There is no behavior or dependency inside this contract. Depth is 5 for shape declarations, not implementation credit.


## Audit artifacts

As in the M1 review, executable evidence under `output/playwright/nested-wires` is terminal audit tooling, separate from the application-source scores above. It is still linted where supported, committed and rerunnable. `count-operations.mjs` uses the original arithmetic transform, instruments every reachable core file, checks both outputs against the normal public builder, and asserts each ceiling. Added law-leg brackets observe work rather than altering it. `verify-oracle.py` builds an independent rectangle graph and runs Dijkstra; `verify-static.py` prints real grep results and compares the preserved pair law. `verify-evidence.py` asserts numeric ceilings, raw measurements, before/after assembly and PNG/visual evidence. Node/Python own assertion and I/O errors; rerunning replaces these evidence artifacts. The new `verify-invariants.mjs` retains all six cases from the deleted Vitest file, through the public contract only. The existing acceptance CLI and browser capture scripts are unchanged.

## Worst three limitations

1. Contact and per-road event sorting retain an O(E log E) worst-case term. The 2.0386× measured doubling result is evidence for this replicated topology, not a proof of universal linear scaling. No road-pair discovery remains.
2. Street track capacity is still the admitted twelve-wire fixture. `coverPath` relies on the constructed crossing/mouth and reserved-width preconditions; it is private, and the independent geometric inspection checks the resulting named rectangles.
3. The older two-node builder still throws `RangeError` for invalid width instead of returning a typed Result. The documented correction/retry path and distinguishable error justify only 5 for typed outcomes, leaving that file at 145. This is an explicit limitation, not a silently awarded 10.

## Visual verification

Inspected all thirteen newly captured images, the M1 overview, and the retained AWS and Docker reference images. The identical section/node layout is demonstrated by the pinned full-scene comparison, not inferred from screenshots. w06 and w12 are visibly shorter within their original families. All endpoints/arrows and complete focused paths are visible. The evidence script reports zero wire overlaps/self-overlaps/label collisions, one crossing, minimum label/halo contrast 5.8926, and heading ratio 1.4875. Frozen fixture spacing and plain node imagery remain inherited limitations, as documented in README; reference assets and visual tokens are unchanged. No subagent review was used under the user's explicit prohibition.
