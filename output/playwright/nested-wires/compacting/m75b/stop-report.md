> Restored from git history (feat/m75-compacting); relative links below resolve on that branch: git show feat/m75-compacting:output/playwright/nested-wires/compacting/m75b/stop-report.md
# M7.5b — STOP: boundary-safe embedding still fails certification and occupancy

**M7.5b is not complete. The revised candidate is rejected.** Ruling #8 was attempted with boundary support from retained ranks, individual child surrounds, nonuniform node gaps and grid tracks, and separately metered demand-sizing/embedding passes. The joint gate fails. No padding sweep, alternate routing, route search, projector change, threshold edit or baseline-pointer change followed the failure.

Production source is restored to the starting `c7c68c1` tree (the same production source as `d720e7f`). The first file read was the original [M7.5 stop report](../stop-report.md); that report and its evidence remain unchanged. Work stayed on `feat/m75-compacting`. No subagents, new `*.test.ts`, browser sessions, servers, push or PR were used. Ports 5188/5190/5191 were never contacted.

This STOP rejects **this implemented sufficient-clearance policy**. The arithmetic below establishes conflicting occupancy bounds for its footprints. It does **not** prove that every geometry allowed by ruling #8 is impossible. In particular, the support envelope is conservative, children were sized to their local demands rather than jointly enlarged up to their occupancy budgets, and the nested preservation path has an implementation defect. Those limitations are not hidden behind an impossibility claim.

## Reproducible policy

The [candidate patch](rejected-candidate.patch) is diagnostic evidence, not adopted production code or a standards-approved implementation. Neither candidate module has earned the required >144/160 review; neither remains active. The [diagnostic patch](diagnostic-scripts.patch) contains the public-contract audit and the extended AST operation counter. No new test suite was created, and no existing assertion was changed.

Reservation topology, registry, routing, lane allocation, final capacity, network and projection retain their existing single invocations. The existing `lane-allocation` callback contains allocation, then exactly one bottom-up demand pass and one top-down embedding pass. This preserves the exact named-stage sequence required by the inherited verifier. The counter additionally scopes the two named functions as `lane-allocation:demand-sizing` and `lane-allocation:embedding`; it restores the enclosing counter on return and counts each operation once.

Let pitch `p=6`, positive stem `s=p/4=1.5`, full street radius `R(n)=6(n+1)`, and terminal fan envelope `F(t)=6*max(0,t-0.75)`.

- **Fix A:** retained contact and assignment indexes supply each gate/street pair. Its rank-support samples contain the assigned street offset, offset ± quarter pitch, unopposed edge channels `±(R-p/2)`, and opposing rank channels `-R+(i_gate+0.25)p` / `R-(i_street+0.75)p`. The convex envelope also contains the entire street interval `[-R,R]`. This conservatively covers both opposing-turn cases without discovering or changing a turn. The gate plane is placed beyond that support by `s`: `O_side=max(R(g)+s, max_internal_support_radius+s)`. Outside support is reserved independently in that child's surrounding box. The boundary therefore does not cut the widened street. Actual audits confirm every assigned gate crossing and zero non-mouth contacts in both templates and scale.
- **Per-node gaps:** `I(node,side)=max_adjacent R(street)+F(terminal)+s`, calculated separately for all four sides of every node. Node dimensions remain 192×96. Column width is the maximum of `192+Ileft+Iright` for nodes in that column; row height is the maximum of `96+Itop+Ibottom` for nodes in that row. A node retains its own left/top offsets within its track.
- **One-row mouth separation:** for node `i`, required side separation is `S_i=max_left,right(R(nodeTerminal)+R(sectionMouth)+s)`. With content height `H`, its pin-to-mouth signed separation is `(Otop-Obottom+2*Itop_i+96-H)/2`. The pass solves the all-above and all-below inequalities algebraically and uses the smaller added outer inset. This is a closed-form sizing decision, not an offset search or reroute.
- **Fix B:** each child has four independent surrounding insets `G_child,side=max(7.5, its external support radius+s)`. There is no row-wide maximum G. Child cell width is `child.width+Gleft+Gright`. Its height demand is `child.height+Gtop+Gbottom`. Parent content width is the sum of its direct-node columns and child cells. Parent content height is the maximum of its summed node rows and each child height demand. Add the parent's own O insets. Rows/columns, child order and world row membership are retained; identities are not recompiled.

[Retained-assignment proof](retained-assignment-proof.json) checks unchanged complete lane records, road identities, gate/terminal choices and node sizes for all three scenes. Routing-law, projector, allocator, gate admission, corridor ownership and junction-union source were never edited.

## Per-section demand and packing

Full original contacts, lane-rank samples, support intervals, node gaps, column/row extents and embedded dimensions are in the sizing and demand JSON files. Insets below are **left / right / top / bottom**. Width/height figures are the actual candidate, not hypothetical accepted dimensions. Preserved larger leaves retain their original internal layout.

### Nested sizing

[Full sizing](nested-sizing.json), [per-node demand](nested-demand.json).

| Section | Direct / children | O | Child surround G | Columns | Rows | Size |
| --- | ---: | --- | --- | --- | --- | --- |
| section-1 | 6 / 1 | 64 / 64 / 112 / 64 | 25.5 / 13.5 / 13.5 / 31.5 | 336, 336, 336 | 400, 400 | 2416 × 976 |
| section-2 | 6 / 0 | 64 / 64 / 112 / 64 | 13.5 / 13.5 / 37.5 / 37.5 | 336, 336, 336 | 240, 240 | 1136 × 656 |
| section-3 | 6 / 0 | 64 / 64 / 112 / 64 | 25.5 / 13.5 / 31.5 / 19.5 | 336, 336, 336 | 240, 240 | 1136 × 656 |
| section-4 | 6 / 0 | 64 / 64 / 112 / 64 | 13.5 / 13.5 / 31.5 / 19.5 | 336, 336, 336 | 240, 240 | 1136 × 656 |

### Templates sizing

[Full sizing](templates-sizing.json), [per-node demand](templates-demand.json).

| Section | Direct / children | O | Child surround G | Columns | Rows | Size |
| --- | ---: | --- | --- | --- | --- | --- |
| section-1 | 6 / 2 | 49.5 / 7.5 / 25.5 / 73.5 | 79.5 / 13.5 / 7.5 / 49.5 | 300, 256.5, 232.5 | 138, 214.5 | 1734 × 451.5 |
| section-2 | 2 / 0 | 7.5 / 7.5 / 7.5 / 34.5 | 7.5 / 7.5 / 25.5 / 73.5 | 207, 207 | 111 | 429 × 153 |
| section-3 | 2 / 0 | 7.5 / 7.5 / 13.5 / 25.5 | 7.5 / 7.5 / 25.5 / 73.5 | 207, 207 | 150 | 429 × 189 |
| section-4 | 0 / 4 | 43.5 / 7.5 / 55.5 / 73.5 | 79.5 / 13.5 / 49.5 / 49.5 | — | — | 1462.5 × 573 |
| section-5 | 1 / 0 | 19.5 / 13.5 / 75 / 7.5 | 43.5 / 25.5 / 55.5 / 73.5 | 234 | 118.5 | 267 × 201 |
| section-6 | 1 / 0 | 19.5 / 13.5 / 81 / 7.5 | 25.5 / 25.5 / 55.5 / 73.5 | 234 | 112.5 | 267 × 201 |
| section-7 | 1 / 0 | 19.5 / 7.5 / 13.5 / 88.5 | 25.5 / 7.5 / 55.5 / 73.5 | 226.5 | 114 | 253.5 × 216 |
| section-8 | 2 / 0 | 13.5 / 13.5 / 37.5 / 55.5 | 7.5 / 7.5 / 55.5 / 73.5 | 214.5, 214.5 | 222 | 456 × 315 |
| section-9 | 1 / 0 | 7.5 / 13.5 / 51 / 7.5 | 79.5 / 13.5 / 49.5 / 7.5 | 214.5 | 118.5 | 235.5 × 177 |

### Scale sizing

[Full sizing](scale-sizing.json), [per-node demand](scale-demand.json).

| Section | Direct / children | O | Child surround G | Columns | Rows | Size |
| --- | ---: | --- | --- | --- | --- | --- |
| section-1 | 6 / 2 | 31.5 / 7.5 / 25.5 / 79.5 | 43.5 / 25.5 / 7.5 / 37.5 | 346.5, 318, 286.5 | 196.5, 268.5 | 1884 × 570 |
| section-2 | 2 / 0 | 7.5 / 7.5 / 13.5 / 34.5 | 7.5 / 7.5 / 25.5 / 79.5 | 208.5, 208.5 | 144 | 432 × 192 |
| section-3 | 2 / 0 | 7.5 / 7.5 / 13.5 / 36 | 7.5 / 7.5 / 25.5 / 79.5 | 208.5, 208.5 | 142.5 | 432 × 192 |
| section-4 | 0 / 4 | 13.5 / 7.5 / 31.5 / 37.5 | 43.5 / 25.5 / 37.5 / 61.5 | — | — | 3311 × 788 |
| section-5 | 4 / 0 | 64 / 64 / 112 / 64 | 13.5 / 13.5 / 31.5 / 31.5 | 336, 336 | 240, 240 | 800 × 656 |
| section-6 | 4 / 0 | 64 / 64 / 112 / 64 | 13.5 / 13.5 / 31.5 / 31.5 | 336, 336 | 240, 240 | 800 × 656 |
| section-7 | 4 / 0 | 64 / 64 / 112 / 64 | 13.5 / 7.5 / 31.5 / 31.5 | 336, 336 | 240, 240 | 800 × 656 |
| section-8 | 4 / 0 | 64 / 64 / 112 / 64 | 7.5 / 7.5 / 31.5 / 31.5 | 336, 336 | 240, 240 | 800 × 656 |
| section-9 | 4 / 0 | 64 / 64 / 112 / 64 | 43.5 / 7.5 / 61.5 / 13.5 | 336, 336 | 240, 240 | 800 × 656 |
| section-10 | 4 / 0 | 64 / 64 / 112 / 64 | 7.5 / 7.5 / 61.5 / 13.5 | 336, 336 | 240, 240 | 800 × 656 |
| section-11 | 3 / 0 | 64 / 64 / 112 / 64 | 7.5 / 13.5 / 61.5 / 13.5 | 336, 336 | 240, 240 | 800 × 656 |
| section-12 | 3 / 0 | 64 / 64 / 112 / 64 | 13.5 / 25.5 / 61.5 / 13.5 | 336, 336 | 240, 240 | 800 × 656 |

### Necessary area bounds for the rejected footprints

The metric is `empty%=100*(1-(direct node area+immediate child rectangle area)/section area)`. Given occupied area A and maximum permitted empty fraction E, necessary section area is `<=A/(1-E)`. The following contradictions are for the fixed demands and child sizes produced by this policy.

| Scene / section | Occupied area | Candidate area | Largest allowed area | Excess area |
| --- | ---: | ---: | ---: | ---: |
| templates / section-1 | 257310 | 782901 | 737814.360158 | 45086.639842 |
| templates / section-4 | 305730 | 838012 | 714628.854576 | 123383.645424 |
| templates / section-8 | 36864 | 143640 | 141366.371681 | 2273.628319 |
| scale / section-1 | 276480 | 1.07388e+06 | 792782.691293 | 281097.308707 |

Validation (`templates section-8`) illustrates the binding conflict. Its two node gap tuples are `(15,7.5,51,75)` and `(7.5,15,39,75)`. Thus width is `214.5+214.5+13.5+13.5=456`. Row height is `max(96+51+75,96+39+75)=222`; boundary-safe top/bottom are `37.5/55.5`, so height is `315`. Area `143,640` exceeds the 15-point budget `141,366.371681` by `2,273.628319`. Improvement is **14.587237 points**, short by **0.412763**. Individual node gaps save 15 width units relative to applying the section maximum, but full internal street support restores 12 horizontal and 6 vertical boundary units compared with M7.5's unsafe mouth-only reservation.

Templates contract: column sum `300+256.5+232.5=789`; two child cells are `429+7.5+7.5=444` each. Width `789+888+49.5+7.5=1734`. Height `138+214.5+25.5+73.5=451.5`. Its empty area still rises by 2.008402 points.

Templates core: child-cell widths are `336,318,286.5,471`, summing to `1411.5`. Add `43.5+7.5` for width `1462.5`. Validation determines height: `315+55.5+73.5+55.5+73.5=573`. Both the child's external street support and the parent's internal support are real reservations in this policy; small children do not remove those streets. Empty area rises by 6.298898 points.

Scale contract: column sum `346.5+318+286.5=951`; child cells total `2*(432+7.5+7.5)=894`; boundary width `39`, giving `1884`. Height `196.5+268.5+25.5+79.5=570`. Empty area rises by 9.128733 points. Scale core improves, but cannot compensate for a different parent's failure.

## Occupancy gates

Before values are the retained `d720e7f` public-output baseline; restored final values equal Before. A sparse leaf needs +15 points; other leaves and all parents need nonnegative improvement. No failing baseline pointer was updated.

### Templates occupancy

| Section | Direct / children | Before empty % | Candidate empty % | Improvement, points | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| section-1 | 6 / 2 | 65.125374 | 67.133776 | -2.008402 | FAIL |
| section-2 | 2 / 0 | 88.923077 | 43.836556 | 45.086521 | PASS |
| section-3 | 2 / 0 | 88.923077 | 54.534355 | 34.388722 | PASS |
| section-4 | 0 / 4 | 57.218352 | 63.517251 | -6.298898 | FAIL |
| section-5 | 1 / 0 | 90.450928 | 65.654872 | 24.796057 | PASS |
| section-6 | 1 / 0 | 90.450928 | 65.654872 | 24.796057 | PASS |
| section-7 | 1 / 0 | 90.450928 | 66.337936 | 24.112993 | PASS |
| section-8 | 2 / 0 | 88.923077 | 74.335840 | 14.587237 | FAIL |
| section-9 | 1 / 0 | 90.450928 | 55.781064 | 34.669864 | PASS |

### Scale occupancy

| Section | Direct / children | Before empty % | Candidate empty % | Improvement, points | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| section-1 | 6 / 2 | 65.125374 | 74.254107 | -9.128733 | FAIL |
| section-2 | 2 / 0 | 88.923077 | 55.555556 | 33.367521 | PASS |
| section-3 | 2 / 0 | 88.923077 | 55.555556 | 33.367521 | PASS |
| section-4 | 0 / 4 | 44.907283 | 19.542151 | 25.365132 | PASS |
| section-5 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-6 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-7 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-8 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-9 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-10 | 4 / 0 | 85.951220 | 85.951220 | 0.000000 | PASS |
| section-11 | 3 / 0 | 89.463415 | 89.463415 | 0.000000 | PASS |
| section-12 | 3 / 0 | 89.463415 | 89.463415 | 0.000000 | PASS |

## Invariants and witnesses

All three exact runners executed with unchanged assertions. Their canonical generated files were archived before restoration.

| Candidate suite | Exit | Overlaps | Certified / uncertified | Result |
| --- | ---: | ---: | --- | --- |
| [Nested structural](structural.txt) | 1 | Unmeasured by this runner | Unmeasured by this runner | Frozen node geometry differs |
| [Templates](templates.txt) | 1 | 0 | 130 / 2 | Surplus contacts and a turn-scope failure |
| [Scale](scale.txt) | 1 | 0 | 112 / 21 | Eight corridor violations and surplus contacts |

Scale contract has **90 certified**, satisfying the certified-only ceiling, plus **21 uncertified**, for **111 actual contacts** against 90 baseline. It fails the zero-uncertified gate. Templates contract stays at 12; its two new contacts are in section-7. Complete certificates and all failure witnesses are retained, not just a selected first failure.

1. **Boundary defect removed in this candidate:** templates/scale inspection lists contain zero boundary violations; exact gate crossing and positive forward-lane assertions pass. Both have zero positive-length overlaps. This is narrower than valid routing.
2. **Templates section-7 w24/w28:** uncovered contacts at `(1006.75,1003)` and `(1012.75,971.5)`. Both occur in registered junctions but neither receives an endpoint/linked-order certificate. The turn-scope assertion also reports actual coordinate `1006.75` versus required assigned-lane `1005.25`. See [all certificates](templates-crossing-certificates.json) and [full invariant log](templates.txt).
3. **Scale w16:23–24:** horizontal `(1020.5,443.5)→(1022,443.5)` then vertical `(1022,443.5)→(1022,385)` are owned by `section-1:horizontal:528:640`, whose final bounds are `[1011.5,1998.5] × [298,418]`. Their y=443.5 turn is **25.5 outside** the corridor. w17–w19 have related violations. This implicates the neighboring approach/forward-turn support after parent reflow; boundary support alone does not constrain the preceding approach. The projector and ownership were not changed to hide this. See [all corridor witnesses](scale-witnesses.json).
4. **Nested preservation defect:** the scene has no sparse leaves, but the implementation substituted demand surrounds for an otherwise preserved child and used them in embedding. Node-5 moves from `(1416,504)` to `(1357.5,504)`, **58.5 left**, violating frozen structural identity. Internal sizes and the semantic choices remain unchanged; that does not excuse the move. This is a separate implementation failure, not a geometric impossibility result. See [first changed nodes and identity proof](retained-assignment-proof.json).

Two complete serializations are byte-identical for every candidate scene, with unique stage invocations: [nested](nested-determinism.json), [templates](templates-determinism.json), [scale](scale-determinism.json). Determinism does not certify a wrong result.

## Metered operations and compounding

The extended counter uses the inherited definition: numeric addition/subtraction/absolute value and numeric comparisons; min/max charge n−1. It excludes multiplication/division, native collection iteration, map lookups, allocation and native sort internals. The two passes are separately charged and included in compile and whole-scene totals. Instrumented and uninstrumented complete scenes are byte-identical, including clones. Every base/clone pass and stage executes once.

| Scene | Routing | Allocation | Demand sizing | Embedding | Compile incl. passes | Full / cloned operations | Ratio |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| [nested](nested-operations.json) | 992 | 3790 | 3060 | 4739 | 27567 | 34983 / 70588 | 2.017780 |
| [templates](templates-operations.json) | 1626 | 9430 | 6846 | 7206 | 43161 | 51554 / 103503 | 2.007662 |
| [scale](scale-operations.json) | 2088 | 9335 | 6977 | 10630 | 61469 | 76774 / 154136 | 2.007659 |

Full per-stage tables are in each linked JSON. Base/clone sizes are 24/48 nodes and 26/52 wires; 16/32 and 29/58; 40/80 and 75/150. All ratios are <=2.5. The compiler's inherited road-pair-discovery guard reports 0; the new passes consume contact/assignment indexes, with no all-road pair discovery. This static guard is not misrepresented as a counter of every map operation.

The first extension attempt hit an AST instrumentation error (an inherited object property was treated as a pass-name string). [The error is retained](meter-initial-error.txt). The extension now requires a string-valued pass name. No source geometry changed between that correction and the successful metering runs.

**150 nodes / 300 wires:** unmeasured. These clone runs demonstrate near-linear growth for copies of these exact fixtures only. They do not establish a bound for a denser connected 150-node hub. Demand indexing walks retained contacts/travels; track aggregation scans node gaps once for each row/column, and flattened recursive embedding can repeat descendant concatenations with depth. Existing lane sorting, proof generation, crossing coverage audit and rendering are additional costs. The existing grid-based coverage audit's `O(XY(R+G))` work is outside this layout meter. At 40/75 the geometry already fails. No timing extrapolation or 150-node acceptance is claimed.

## Browser, selection and visual gates

Five-load medians, layout/audit/render decomposition, selection click deltas and 1920×1440 screenshots are **unmeasured** after STOP. Neither historical 374.5/1556.7 ms medians nor old screenshots are presented as candidate results. The 450 ms selection ceiling is unchanged and unverified. No port was opened or contacted; no orchestrator server was disturbed. Approved reference images, tokens, styles and visual acceptance gates remain untouched. The standing panel-density/reference bar is not accepted.

## Restoration and repository check

The candidate and diagnostic programs are preserved as patches; production source and canonical outputs were restored. The restored exact invariant suites pass separately: [structural](restored-structural.txt), [templates 130/0](restored-templates.txt), [scale 112/0](restored-scale.txt), with zero template/scale overlaps. Restored results do not certify the rejected candidate.

The first `pnpm check` stopped during lint on two temporary diagnostic-script errors (unused `across`, cognitive complexity 3 versus 2). [Full log](initial-check-diagnostic-lint.txt). Removing that unused expression fixes both; the corrected diagnostic programs were then archived as replay patches rather than shipped as source. No production-source or verifier change was made to turn that check green.

The restored-source `pnpm check` exits **0**: **70 test files / 208 tests passed**, in 22.43 seconds. Typecheck, lint, formatting and architecture also pass. [Full passing log](restored-pnpm-check.txt). No timing failure occurred, so the one permitted timing retry was not needed. [Restoration proof](restoration-proof.json) byte-compares all three fresh scenes to the retained d720e7f outputs and verifies no source diff and no new tests.

[Machine load before the initial check](machine-load-before.txt) and [before the restored-source check](machine-load-check.txt) retain the requested `ps aux | sort -nrk3 | head -5` output. System and existing user processes were present; no claim of an otherwise idle OS is made. No browser, verifier or operation meter from this task ran concurrently with `pnpm check`.

## Replay

Use an isolated checkout at `c7c68c1` with this evidence directory available. The candidate is rejected; the invariant commands deliberately fail and rewrite generated canonical files. The diagnostic scripts must be applied before invoking them.

```sh
git apply output/playwright/nested-wires/compacting/m75b/rejected-candidate.patch
git apply output/playwright/nested-wires/compacting/m75b/diagnostic-scripts.patch
node --import tsx output/playwright/nested-wires/compacting/m75b/audit-demand.mjs
node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs
node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
node --import tsx output/playwright/nested-wires/scale-scene/verify-scale-scene.mjs
node --import tsx output/playwright/nested-wires/compacting/m75b/count-operations.mjs '{"nested":true,"directory":"output/playwright/nested-wires/compacting/m75b","outputFile":"nested-operations.json"}'
node --import tsx output/playwright/nested-wires/compacting/m75b/count-operations.mjs '{"specFile":"output/playwright/nested-wires/templates-scene/scene-spec.json","directory":"output/playwright/nested-wires/compacting/m75b","outputFile":"templates-operations.json"}'
node --import tsx output/playwright/nested-wires/compacting/m75b/count-operations.mjs '{"specFile":"output/playwright/nested-wires/scale-scene/scale-scene-spec.json","directory":"output/playwright/nested-wires/compacting/m75b","outputFile":"scale-operations.json"}'
```

## Binary DoD

FAIL includes work unverified because of STOP; a restored baseline pass never becomes a candidate pass.

| # | Status | Evidence / limit |
| --- | --- | --- |
| 1. `pnpm check`, >=208 tests, no new tests | **PASS** | Restored source passes 70 files / 208 tests; candidate source was rejected and has no check acceptance. Initial diagnostic lint failure retained. |
| 2. All invariants; zero overlaps/uncertified; scale contract <=90 | **FAIL** | Nested structure changes; templates 130/2; scale 112/21. Scale contract certified 90, actual 111. |
| 3. Every sparse leaf +15 points; no parent/leaf regression | **FAIL** | Validation +14.587237; templates contract/core and scale contract regress. |
| 4. Two full byte-identical serializations per scene | **PASS** | Three fresh pairs and instrumented-byte comparisons; linked digests. |
| 5. Metered passes; clone <=2.5; discovery 0; compounding answer | **PASS** | Both passes metered exactly once; all clone ratios <2.02; limits stated above. |
| 6. Five-load medians and stage decomposition | **FAIL** | Unmeasured after STOP. |
| 7. Selection, click deltas 0, <=450 ms | **FAIL** | Unmeasured after STOP. |
| 8. Headless screenshots before/after/detail on 5191 | **FAIL** | Unmeasured after STOP. |
| 9. README full accepted design/math/occupancy/ops/loads/weaknesses | **FAIL** | STOP documentation and measured ops complete; requested loads do not exist. |
| 10. Logical local commits, clean branch, six-entry log | **PASS** | Final branch/status/log printed; local evidence and report commits only. |

## Local history

Six entries after the evidence commit (before the final report commit):

```text
22f1ffe docs(m75b): retain rejected boundary-support and nonuniform-packing evidence
c7c68c1 docs(m75): report compacting STOP with demand math and binary gates
f99e54e docs(m75): preserve rejected turn-reservation geometry and verification evidence
d720e7f feat(layout): evaluate left section entrances behind an off-by-default option
fb86264 fix(layout): reserve joined terminal through channels and add M7 scale evidence
8082038 docs(m7): record scale geometry STOP and replayable Part B candidate
```

The final report commit and clean status are printed to stdout after this file is committed. No push or PR follows.
