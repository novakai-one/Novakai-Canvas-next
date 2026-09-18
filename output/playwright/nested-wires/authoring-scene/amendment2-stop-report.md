# M10b Amendment 2 — STOP: faithful real scene fails routing invariants

Empty-leaf placement is now accepted by a small additive change. The full real scene then fails the existing invariant verifier. This is a product-behavior STOP under the mission brief; routing/capacity and extracted data were not changed.

Branch: `feat/m10b-dogfood`. Existing dispatch base recorded by the prior run: `b93910aa1ec0dd2a1759266d1337b20b91a72b3c`. Work remains uncommitted; no push or PR.

## What changed

Removed the explicit zero-node/zero-child rejection in `capability/layout/core/prototype-nested-placement.ts`. Existing arithmetic already supplies 128×176 header/padding bounds, while the existing zero-count guard emits no nodes. Updated its recovery comment. No sizing constants, routing, lane allocation, capacity, extractor, spec or existing scene selector behavior changed in this run.

Updated only the obsolete empty-section rejection assertion in the existing public-contract evidence verifier to require a finite labelled box and successful zero-wire output. All routing/crossing/overlap gates remain unchanged. A minimal single-empty-section call reproduced the original RangeError before the edit and passed afterward.

## Completed evidence

- `pnpm install`: exit 0.
- [Empty-leaf regression](amendment2-empty-leaf-output.txt): zero nodes, one labelled section, 128×176 bounds, finite roads, successful empty wiring, deterministic output.
- [Baseline identity](amendment2-baseline-identity.txt): full serialized output for **default, nested-default, nested-hub, templates and scale** is byte-identical before/after the placement change. Before-change serialization was retained at `/tmp/m10b-amendment2-baselines.json` for the comparison.
- Real scene: **47 nodes / 15 sections / 119 wires**, finite geometry, containment and exact semantic directory/file order pass. All three empty directories remain. Two complete builds are byte-identical; each measured pipeline stage executes once.
- Engine reports all 119 wires `ok:true`; the independent legality checks below fail. Successful route construction is not legality certification.
- [pnpm check](amendment2-pnpm-check-output.txt): **exit 0; 70 test files, 208/208 tests**. Includes typecheck, `eslint .` with cognitive complexity <=2, format, architecture and tests. `git diff --check` also passes.
- [Whole-file placement review](amendment2-placement-review.md): **146/160**, with all sixteen anchors, line evidence and worst three findings. Review is for the changed engine source, not a claim that all milestone source reviews are finished.
- Earlier extraction evidence remains applicable: 47 files, 119 value-import edges, 20 external imports; 111 type-only declarations and 231 type symbols excluded; manifest completeness, ten pseudorandom source checks and extractor byte determinism passed in Amendment 1. The extractor/spec/manifest were left unchanged in this run.

## Routing finding

The verifier exits **1**. See [complete output](amendment2-invariant-output.txt), [structured summary and witnesses](amendment2-stop-evidence.json), [invariant audit](invariant-audit.json), [crossing certificates](crossing-certificates.json), and [generated scene](scene.json).

| Check | Result |
| --- | ---: |
| Corridor failures | 4 segment witnesses |
| Node-body failures | 40 segment witnesses |
| Boundary failures | 87 segment witnesses |
| Continuity failures | 0 |
| Positive-length overlap detector witnesses | 18 |
| Certified / uncertified crossings | 0 / 1,273 |

The overlap detector uses axis-aligned segment intersection assumptions. Some witnesses contain diagonal output, so 18 must not be described as 18 independently proven collinear overlaps. A direct horizontal overlap is nevertheless decisive: **w26 and w61 share x=6274..6280 at y=1681**, length 6, in `drive:node-35:entry-left`.

Additional concrete failures:

- `w03:5` moves from `(3089.5,454)` to `(3247,457)`: diagonal output in a vertical corridor.
- `node-2:exit-right`: nonplanar pin fan.
- `w07:0`: forward-lane assertion fails (`-1 !== 1`).
- `J17/J145`: proof regions overlap. Certificate construction fails there; 1,273 uncertified does **not** prove all 1,273 crossings avoidable.
- `w31`: missing owned gate crossing.

These witnesses establish failure of the faithful real graph. They do not isolate its root cause or establish that empty leaves caused the routing defects. Repair would require investigation beyond the authorized narrow placement change. No repair or data tuning was attempted.

Reproduce from the worktree root:

```sh
pnpm exec tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs "$(cat output/playwright/nested-wires/authoring-scene/amendment1-verifier-config.json)"
```

The verifier collects multiple failures in one invocation; it completed its existing audit before returning exit 1. After that result, activity was limited to recording evidence, reviewing the provisional placement patch and running its required repository check.

## Literal STOP and outstanding DoD

The brief requires: “Any gate failure, or the real data breaking the engine: STOP with evidence.” This run stops at independent routing legality. Empty-section sizing stayed small; downstream legality did not pass. No gates were relaxed.

Not reached: operation-count instrumentation, five browser loads/median, requested four captures and visual inspection, complete product-source scoring for extractor/scene wiring, commits, push or small PRs. The existing scene host remains provisional. No new standalone evidence script was created. The adapted existing JavaScript verifier passes ESLint; no standalone strict JavaScript typecheck was claimed.

**Scales or compounds? Not determined: real-scene legality fails before performance acceptance. One invocation per stage and deterministic output do not establish computational scaling.**

Headless execution only. No browser/server was started and no port was touched, including 5197 and all prohibited ports.

## HUMAN EXPERIENCE REVIEW

No captures were taken after the legality STOP. Attention, focus, clutter, label readability, empty-header fit, selection behavior and visual-reference fidelity remain unassessed. The scene has labelled empty-section records, but rendered header presentation is not visually certified. Node-body intersections and an actual shared wire interval already undermine trustworthy tracing. A green 208-test suite and accepted empty geometry do not satisfy the binding visual benchmarks or the complete milestone DoD.
