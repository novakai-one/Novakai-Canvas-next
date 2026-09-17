# M4.5 application-source review — 2026-09-17

Whole-file review against `docs/standards/CODING-STANDARDS.md`; direct collaborators and the retained public contracts were read. Order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, retry/failure semantics, depth, Demeter, immutability, type safety, cognitive style, testability. Scores are findings from this implementation, not inherited awards. Sonar ≤2 is separately enforced by `pnpm check` without exemptions.

| Target | Sixteen scores | Total |
|---|---|---:|
| `capability/layout/core/nested-lane-order.ts` | 10,6,7,10,10,10,8,10,10,10,10,10,8,10,7,10 | 146 |
| `capability/layout/core/nested-wire-lanes.ts` | 10,6,7,10,10,10,9,10,10,10,10,10,8,10,10,10 | 150 |
| `capability/layout/core/nested-lane-projection.ts` | 10,6,7,10,10,9,7,10,10,10,10,10,10,10,7,10 | 146 |
| `capability/layout/core/prototype-nested-scene.ts` | 10,6,7,10,10,10,9,10,10,10,10,10,10,10,10,10 | 152 |

## Evidence for the sixteen dimensions

- **SRP/OCP:** order owns retained-path ordering (order:21–154); allocation owns road/direction ranks (lanes:74–124); projection owns assigned-path materialization (projection:29–314); scene owns the fixed stage sequence (scene:31–93). Each has one purpose, but each fixed policy/sequence requires edits for extension: OCP 6, without a YAGNI excuse.
- **LSP:** exactly 7, not demonstrated: no subtype implementation exists in these targets. Shared behavioral contract compliance is not invented.
- **ISP/DIP:** narrow typed data roles (`Travel`, `AssignedTravel`, readonly maps, scene spec, injected measurement callback); only own core and declaration-only records are imported. No React, adapter, host, filesystem or sibling-capability behavior dependency. No infrastructure port is declared or passed through.
- **DRY:** path compaction and fork comparison have one definition (order:21–74); width/pitch remain centralized; allocation delegates ordering once (lanes:97). Projection's direct-corner and opposed-corner record construction repeat a small connection assembly (projection:51–89), costing one point. Turn direction and edge geometry are shared helpers.
- **KISS:** order uses memoized two-ended path walks and a geometric conflict priority (order:75–154), costing two points; projection has corner, bridge, ownership, fan and short-stem interactions (projection:29–253), costing three. Allocation and scene lose one for grouping/restoring traversal order and reservation/final geometry staging respectively. Neither searches alternative routes or retries geometry.
- **YAGNI:** only retained-route lane ordering and junction continuity are added. No route solver, per-junction IDs, scene-specific wire list, alternate pipeline, adapter seam or rendering change.
- **Typed outcomes:** inputs are internally constructed typed route records; ordering/projection are total reconstruction helpers over those records. Missing assignments retain the existing routing failure owner (projection:264–276); scene's routing failure stays the existing structured result (scene:74). No new domain or I/O throw is introduced; the compiler is not an external JSON admission API.
- **Retry/failure semantics:** allocation and scene name caller-owned reconstruction in their entry comments; projection names reconstruction/failure ownership. Every cache, bucket and output is invocation-local. Repeated calls produce byte-identical complete scenes, and the instrumented builder byte-matches the normal one.
- **Depth/Demeter:** order returns one comparator hiding path compaction, shared-fork traversal and memoization; allocation returns lanes/demand/byWire; projection returns materialized wires; scene returns the assembled scene. No caller learns turn control points. Only direct data records/maps are read.
- **Immutability:** allocation's buckets and ordering's path arrays/memo tables mutate locally (lanes:128–132; order:25–41,75–89), costing two points each. No cross-call mutation. Projection and scene construct fresh records and arrays from readonly inputs.
- **Type safety:** no `any`, runtime cast, unchecked assertion or suppression in these four targets. Missing map/array entries are handled explicitly. Literal traffic directions retain the 1/-1 union.
- **Cognitive style:** order's two axis-selection ternaries in `earlier` (order:126–128) and inherited projection's optional record assembly cost three points under the named-style anchor. Allocation and scene contain no flagged style idiom. The executable maximum remains ≤2 per function, independently checked.
- **Testability:** deterministic pure inputs, no ambient I/O/clock/randomness; scene measurement is injected. Public standalone audits independently calculate frozen identity, exact pin rows, interval scope, all segment intersections, alternating boundary certificates and numeric operation counts. No new test file is added.

## Worst three limitations

1. Ordering and projection remain specialized geometry policies with fixed extension axes (OCP 6). They are not a general route-topology optimizer.
2. Projection's ownership/fan/turn interactions are the least readable part (KISS 7). The short-stem audit caught a reversed lane during development; the accepted output has no reversed assigned segment or off-junction turn.
3. Fork walks and memoization need local state (immutability 8). The clone probe measures 48 nodes with the retained 26 requests; it does not establish a bound for arbitrary dense 150-node traffic.

Standalone audit MJS/Python files are terminal evidence tooling, as in the retained M3/M4 source reviews; assertions/I/O errors intentionally fail their process. They are not application APIs. New controls reject unknown/duplicate crossing certification, and all old corruption controls remain. The amended lane verifier replaces only superseded wire-ID/pin-freeze assertions with the corrected assignment/pin-row law; the historical M4 pin-preservation script is retained unchanged. The M4 selection runner and its browser assertions remain unchanged.
