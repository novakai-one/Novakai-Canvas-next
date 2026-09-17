# Documentation prune — rulings #14–#16

Branch: `feat/docs-prune`; entry `ec00db1`. Prior STOP reports (`14ce5d7`, `c163301`, `ec00db1`) and ruling #14 fix (`44cd915`) remain in history.
Authority: `/Users/christopherdasca/Documents/Codex/2026-09-16/fi/orchestration/docs-prune.md`, including all three amendments and the user's ordered sequence.
Ruling #16 supersedes the impossible pre-README full-pass ordering: first modernize, prove provenance, regenerate metrics, then publish computed README strings and pass the entire verifier. No assertions are bypassed.

## Ruling #15 modernization: old → new

| Contract | Old | New | Accepted source |
| --- | --- | --- | --- |
| Lane compilation | ≤12000 | ==19768 | Ruling #10, `milestone-076-lazy-audit.md:38`; M9a exact gate; canonical calculations |
| Wire total | ≤1200 | ==992 | Same ruling #10 and M9a gate |
| Per-wire ceilings | 12 wires: w01–08=60, w09/11=120, w10/12=180 | Exact 26-wire totals below | Canonical per-wire counters equal their stage counters; ruling #16 exact-current ceilings |
| Maximum leg | ≤60 | ==41 | Canonical perLeg maximum; ruling #16 |
| Scaling shape / diagnostics | 22/44 | 24/48; +1920 unchanged | M4 scene; M4.5 verifier; canonical probe |
| Scaling ratio definition | laneCompile[1]/laneCompile[0] | totalOperations[1]/totalOperations[0] | M4 total-op growth contract; M4.5 verifier diagnostics; canonical probe |
| Scaling ceiling | ≤2.5 | ==1.698683048852266 | 46177/27184; ruling #16 |
| Median load ceiling | ≤239.2 | ==226.30000007152557 | Committed browser.json five-load median; ruling #16 |
| Oracle count | 12 | 26; ordered IDs match scene/counters | M4 scene; M4.5 oracle reconciliation |
| Scene/counter identity | No explicit shape/set gate | 24 nodes, 4 sections, exact w01–w26 | Existing M4.5 scene gate and canonical scene |
| Bundle ceilings | Historical loose constants | Same fixed accepted exact values as assertions | Ruling #16; no ceiling derives from inputs under test |

Exact per-wire acceptance: `w01=11, w02=32, w03=14, w04=11, w05=15, w06=34, w07=32, w08=15, w09=34, w10=71, w11=42, w12=103, w13=32, w14=11, w15=15, w16=72, w17=46, w18=104, w19=15, w20=11, w21=43, w22=33, w23=65, w24=51, w25=27, w26=53`.
Ruling #14's scene-hash-bound certification check is unchanged. Historical 12-closeup screenshot coverage remains explicitly historical; no unsupported expansion to 26 screenshots. Five loads, PNG dimensions, overlap/contrast/heading checks, zero discovery/candidates, detour bounds, clone offset, M1 baseline, no-new-tests and all README assertions remain enforced.
Only this verifier is modernized. Legacy artifact script structure is retained under the explicit one-file modernization scope; no application-source refactor or new source-quality score is claimed.

## Ruling #16 value-provenance proof (before --write)

The verifier ran without `--write` and naturally stopped at old metrics equality after computing the full bundle. No raw evidence or README had changed. Independent reconciliation additionally checked every oracle length against scene segments, every detour against its shortest-path distance, and all stage/component/per-wire operation sums.

| Bundle value | Provenance / checked result |
| --- | --- |
| before | JSON-equal to `266a96c:output/playwright/nested-wires/metrics.json`; bytes unchanged from entry |
| after.calculations | Entire canonical calculations object copied without reshaping; compilation 19768 = 928+3790+11021+4029; routing 992; discovery/candidates 0; every stage invocation 1; instrumentedSceneIdentical true |
| Scene shape | 24 nodes / 4 sections / 26 wires; IDs match counters and oracle |
| Probe | 24/48 nodes; lane compile [19768, 31965]; total ops [27184, 46177]; ratio 1.698683048852266; exact clone at +1920 |
| after.browser | Committed browser.browser copied exactly; five loads [308.5, 250.39999997615814, 226.30000007152557, 218.29999995231628, 220.69999992847443]; independently recomputed median 226.30000007152557 |
| after.visual crossings | 23 detected = 23 certified, 0 uncertified; exact crossing set and scene SHA match M4.5 proof |
| after.visual remaining | Wire overlap 0; self overlap 0; label collision 0; label/node collision 0; contrast 5.892601677370216; heading/body 1.4875 — computed by unchanged functions from canonical scene and historical browser evidence |
| after.screenshots | SHA256 computed for overview + w01–w12; all 13 PNG headers and 1920×1440 dimensions valid; 12 browser closeups fully visible |
| after.oracle | Entire committed oracle copied; all 26 IDs/lengths match scene, positive oracle distance ≤ path length, all recomputed detours 0–10%; maximum 9.1324200913242% |
| ceilings | Fixed constants listed above equal every accepted current measurement; zero headroom |

The old M4.5 metrics schema and stale 19683 compilation value remain in git history. Its certification substance remains in the unchanged topological-bound proof. The regenerated bundle deliberately combines current scene/counters with explicitly historical browser/screenshots; it makes no new rendering/performance claim.

| Pinned input | SHA256 before regeneration |
| --- | --- |
| `before.json` | `ff631346f8255359b67f70c89e2d1e14e66c9b34442193a9cecfc704f2251f56` |
| `oracle.json` | `5baa15820879b3ff17b30fb3941ae81bc8187bda6c7bbd9c1f356e81ea48dddc` |
| `scene.json` | `946bb1e9836c4242382a534ab97f4752b24d7bcc230e85be2835f720145a8e8a` |
| `calculations.json` | `dee9e931975578db71cd5eb855c20e7a22e6d7548ddc60b2bb24f9896d4f5d0d` |
| `browser.json` | `dd12136dda53e50502249a068d96407a203752a0735d8e8cf53c4e28852e2af6` |
| `m45-topological-bound.json` | `f27579b92e9a295305252df7265f48f5eec394e3a6cb1daf9138b30be1b3796d` |

## Execution

Provenance passed. Metrics regeneration, protocol #4, banner-restores, README rewrite and final gates follow in order.

### Metrics regeneration

`python3 output/playwright/nested-wires/verify-evidence.py --write` regenerated metrics through its own write path, then exited 1 at the unchanged README assertion: `AssertionError: Missing README count: 19768`. All 26 fixed per-wire assertions and whole-bundle equality passed first. This expected intermediate failure is resolved by the later authorized README rewrite; it is not a claimed full pass. No pinned input changed. Separate ruling #16 commit contains only metrics and this report update.

## Protocol #4 reference-safety decisions

Scanned each basename from the repository root using exactly `grep -rn "<basename>" --include='*.py' --include='*.mjs' --include='*.mts' --include='*.ts' --include='*.md' output/ capability/ apps/`. Exit 0/1 only; no errors. Every deletion immediately followed its zero-hit scan. Nonzero hits were conservatively retained, including basename collisions and references from other candidates. Before counts precede this new decision table; final after counts include this report. The prior STOP table was replaced by the current provenance report before scanning.

| Candidate | Decision / evidence | File lines before → after | Grep lines before → after |
| --- | --- | ---: | ---: |
| `m3-blocker.md` | Delete: zero references | 62 → 0 | 0 → 1 |
| `m3-junction-blocker.md` | Delete: zero references | 62 → 0 | 0 → 1 |
| `m3-source-review.md` | Keep: README.md:36 | 40 → 40 | 1 → 7 |
| `m4-completion-report.md` | Keep: README.md:5, README.md:244 | 268 → 268 | 2 → 8 |
| `m4-pin-ruling-stop-report.md` | Keep: README.md:104 | 78 → 78 | 1 → 1 |
| `m4-source-review.md` | Keep: README.md:204, m4-completion-report.md:25 | 47 → 47 | 2 → 2 |
| `m4-stop-report.md` | Keep: README.md:112 | 124 → 124 | 1 → 1 |
| `m4-visual-budget-stop-report.md` | Keep: README.md:118 | 113 → 113 | 1 → 1 |
| `m45-completion-report.md` | Keep: README.md:1, README.md:292 | 333 → 333 | 2 → 5 |
| `m45-source-review.md` | Keep: README.md:292 | 34 → 34 | 1 → 1 |
| `m45-stop-report.md` | Keep: README.md:3, README.md:261 | 196 → 196 | 2 → 1 |
| `m45-visual-review.md` | Keep: m45-completion-report.md:16, README.md:292 | 17 → 17 | 2 → 2 |
| `presentation/declutter/report.md` | Keep: README.md:1, README.md:3, README.md:5, README.md:104, README.md:112, README.md:118, README.md:244, README.md:261, README.md:292, README.md:303, README.md:327, README.md:356, README.md:466, README.md:472, README.md:494, README.md:566, README.md:604, README.md:637, README.md:659, README.md:784, README.md:801, README.md:817, README.md:879, presentation/declutter/verify-audit.py:10, presentation/declutter/verify-audit.py:24, presentation/styling/report.md:310, presentation/styling/report.md:335, templates-scene/extract-scene.mts:146, templates-scene/resume-stop-report.md:29, templates-scene/resume-stop-report.md:102, templates-scene/resume2-report.md:84 | 313 → 313 | 31 → 52 |
| `presentation/declutter/source-review.md` | Keep: m3-source-review.md:27, m3-source-review.md:30, README.md:36, README.md:204, README.md:292, README.md:605, README.md:855, README.md:881, m4-completion-report.md:25, presentation/declutter/report.md:299, presentation/styling/report.md:323, templates-scene/resume2-report.md:36 | 76 → 76 | 12 → 18 |
| `presentation/declutter/visual-review.md` | Keep: m45-completion-report.md:16, scale-scene/ruling5-report.md:162, README.md:292, README.md:576, README.md:606, README.md:782, README.md:882, presentation/m9a/report.md:20, presentation/m9a/report.md:38, presentation/declutter/report.md:22, presentation/declutter/report.md:299, presentation/styling/report.md:49, presentation/styling/report.md:275, templates-scene/resume2-report.md:18 | 39 → 39 | 14 → 13 |
| `presentation/m76/source-review.md` | Keep: m3-source-review.md:27, m3-source-review.md:30, README.md:36, README.md:204, README.md:292, README.md:605, README.md:855, README.md:881, m4-completion-report.md:25, presentation/declutter/report.md:299, presentation/styling/report.md:323, templates-scene/resume2-report.md:36 | 31 → 31 | 12 → 18 |
| `presentation/m76/stop-report.md` | Keep: README.md:3, README.md:104, README.md:112, README.md:118, README.md:261, README.md:303, README.md:356, README.md:472, README.md:494, README.md:637, README.md:659, README.md:801, presentation/declutter/verify-audit.py:24, presentation/styling/report.md:335 | 45 → 45 | 14 → 23 |
| `presentation/port-ab/source-review.md` | Absent at requested path; no substituted deletion | 0 → 0 | 12 → 18 |
| `scale-scene/port-ab/source-review.md` | Keep: m3-source-review.md:27, m3-source-review.md:30, README.md:36, README.md:204, README.md:292, README.md:605, README.md:855, README.md:881, m4-completion-report.md:25, presentation/declutter/report.md:299, presentation/styling/report.md:323, templates-scene/resume2-report.md:36 | 57 → 57 | 12 → 18 |
| `scale-scene/ruling5-source-review.md` | Delete: zero references | 44 → 0 | 0 → 1 |
| `scale-scene/ruling5-visual-review.md` | Keep: scale-scene/ruling5-report.md:162, README.md:782 | 40 → 40 | 2 → 2 |
| `source-review.md` | Keep: m3-source-review.md:27, m3-source-review.md:30, README.md:36, README.md:204, README.md:292, README.md:605, README.md:855, README.md:881, m4-completion-report.md:25, presentation/declutter/report.md:299, presentation/styling/report.md:323, templates-scene/resume2-report.md:36 | 62 → 62 | 12 → 18 |
| `templates-scene/resume-stop-report.md` | Keep: README.md:356 | 158 → 158 | 1 → 2 |
| `templates-scene/resume2-report.md` | Keep: README.md:466 | 221 → 221 | 1 → 11 |
| `templates-scene/resume2-source-review.md` | Keep: templates-scene/resume2-report.md:36 | 89 → 89 | 1 → 2 |
| `templates-scene/source-review.md` | Keep: m3-source-review.md:27, m3-source-review.md:30, README.md:36, README.md:204, README.md:292, README.md:605, README.md:855, README.md:881, m4-completion-report.md:25, presentation/declutter/report.md:299, presentation/styling/report.md:323, templates-scene/resume2-report.md:36 | 29 → 29 | 12 → 18 |
| `templates-scene/stop-report.md` | Keep: README.md:3, README.md:104, README.md:112, README.md:118, README.md:261, README.md:303, README.md:356, README.md:472, README.md:494, README.md:637, README.md:659, README.md:801, presentation/declutter/verify-audit.py:24, presentation/styling/report.md:335 | 87 → 87 | 14 → 23 |
| `templates-scene/visual-review.md` | Keep: m45-completion-report.md:16, scale-scene/ruling5-report.md:162, README.md:292, README.md:576, README.md:606, README.md:782, README.md:882, presentation/m9a/report.md:20, presentation/m9a/report.md:38, presentation/declutter/report.md:22, presentation/declutter/report.md:299, presentation/styling/report.md:49, presentation/styling/report.md:275, templates-scene/resume2-report.md:18 | 46 → 46 | 14 → 13 |

## Banner-restored re-entry maps

Each body is byte-identical to `git show` on its named source branch; only the exact required one-line banner is prepended. No sibling patch, script, JSON or other artifact was imported.

| Map | Source branch | Restored lines |
| --- | --- | ---: |
| `compacting/stop-report.md` | `feat/m75-compacting` | 334 |
| `compacting/m75b/stop-report.md` | `feat/m75-compacting` | 224 |
| `authoring-scene/stop-report.md` | `feat/m8-authoring-scene` | 194 |
| `authoring-scene/m8b/stop-report.md` | `feat/m8-authoring-scene` | 282 |

## README rewrite and final gates

README is 79 lines (was 888). Pinned strings were formatted from the verifier execution globals after natural README failure, not manually transcribed. The unchanged full command now exits 0, including metrics equality, all 26 per-wire strings, `19768`, `226.3`, frozen M1 baseline, clone identity and no-new-test assertions.

### Declutter: documented branch restriction

```text
Traceback (most recent call last):
  File "/Users/christopherdasca/Programming/Novakai-Canvas-next-templates/output/playwright/nested-wires/presentation/declutter/verify-audit.py", line 13, in <module>
    assert run(['git', 'branch', '--show-current']).decode().strip() == 'feat/m65b-declutter'
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError
exit 1
```

The branch assertion runs before extraction or writes. Ruling #14 explicitly accepts this non-runnability on `feat/docs-prune`; no branch switch or bypass occurred.

### M9a offline replay

Unmodified runner executed serially in a disposable snapshot of staged tree `8e99b00e481a34d00a00b1b189caf3ac1ab47cad`, with existing dependency directories linked, original Git history and a private copied index. Snapshot was inside the allowed evidence directory and removed afterward; no protected worktree artifact was rewritten.

```text
identity: exit 0
verify-nested-wires: exit 0
verify-invariants: exit 0
verify-m3-topology: exit 0
verify-m45-pins: exit 0
verify-m45-geometry: exit 0
verify-structural-identity: exit 0
verify-lanes: exit 0
verify-static: exit 0
verify-oracle: exit 0
verify-m45-topological-bound: exit 0
templates-invariants: exit 0
scale-invariants: exit 0
nested-ops-amended: exit 0
PASS nested: exact compile/routing/discovery [19768, 992, 0]
templates-ops-amended: exit 0
PASS templates: exact compile/routing/discovery [28443, 1626, 0]
scale-ops-amended: exit 0
PASS scale: exact compile/routing/discovery [43876, 2088, 0]
exit 0
```

Independent oracle replay reproduced the pinned oracle bytes exactly: True.

### pnpm check — standalone run

Ran after the M9a process exited and its snapshot was removed, with no concurrent verifier or test process launched by this task.

```text
Checking formatting...
All matched files use Prettier code style!

✔ no dependency violations found (924 modules, 2207 dependencies cruised)


 RUN  v5.0.0 /Users/christopherdasca/Programming/Novakai-Canvas-next-templates


 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  23:34:39
   Duration  18.32s (tests 74%, import 14%, transform 10%, environment 1%)

$ pnpm typecheck && pnpm lint && pnpm format:check && pnpm architecture && pnpm test
$ tsc --noEmit
$ eslint .
$ prettier --check "capability/**/*.{ts,tsx}" "apps/**/*.{ts,tsx}" eslint.config.js .dependency-cruiser.cjs
$ depcruise capability apps --config .dependency-cruiser.cjs --output-type err
$ vitest run capability apps
(node:75357) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75359) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75360) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75360) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75359) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75357) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75360) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75359) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75357) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75359) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75360) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75357) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75376) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75359) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75360) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75359) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75357) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75360) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75360) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75357) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75398) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75399) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75400) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75408) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75404) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75405) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75419) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75417) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75412) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75416) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75424) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75427) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75430) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75433) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:75436) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

exit 0
```

### Full root verifier after rewrite

```text
PASS w01: 11 == 11 routing ops
PASS w02: 32 == 32 routing ops
PASS w03: 14 == 14 routing ops
PASS w04: 11 == 11 routing ops
PASS w05: 15 == 15 routing ops
PASS w06: 34 == 34 routing ops
PASS w07: 32 == 32 routing ops
PASS w08: 15 == 15 routing ops
PASS w09: 34 == 34 routing ops
PASS w10: 71 == 71 routing ops
PASS w11: 42 == 42 routing ops
PASS w12: 103 == 103 routing ops
PASS w13: 32 == 32 routing ops
PASS w14: 11 == 11 routing ops
PASS w15: 15 == 15 routing ops
PASS w16: 72 == 72 routing ops
PASS w17: 46 == 46 routing ops
PASS w18: 104 == 104 routing ops
PASS w19: 15 == 15 routing ops
PASS w20: 11 == 11 routing ops
PASS w21: 43 == 43 routing ops
PASS w22: 33 == 33 routing ops
PASS w23: 65 == 65 routing ops
PASS w24: 51 == 51 routing ops
PASS w25: 27 == 27 routing ops
PASS w26: 53 == 53 routing ops
PASS 4 metrics.json matches raw operation counts, five browser loads, and README summary.
Node positioning: 331 | Roads: 1033 | Driveways: 1824
Wire routing per wire: {'w01': 11, 'w02': 32, 'w03': 14, 'w04': 11, 'w05': 15, 'w06': 34, 'w07': 32, 'w08': 15, 'w09': 34, 'w10': 71, 'w11': 42, 'w12': 103, 'w13': 32, 'w14': 11, 'w15': 15, 'w16': 72, 'w17': 46, 'w18': 104, 'w19': 15, 'w20': 11, 'w21': 43, 'w22': 33, 'w23': 65, 'w24': 51, 'w25': 27, 'w26': 53}
Wire routing total: 992 | Lane-network total: 19768
Browser loads (ms): [308.5, 250.4, 226.3, 218.3, 220.7] | Median: 226.3 ms
PASS 5 overview.png + w01.png through w12.png: 13 valid 1920x1440 PNGs; all 12 complete paths inside their screenshot viewport.
PASS visual geometry: {"wireOverlapCount": 0, "selfOverlapCount": 0, "crossings": [["w01", "w09", 539, 457], ["w01", "w24", 533, 457], ["w02", "w09", 539, 449.5], ["w02", "w24", 533, 449.5], ["w03", "w09", 539, 645], ["w03", "w23", 365, 651], ["w03", "w24", 533, 645], ["w05", "w06", 1845, 675], ["w09", "w18", 1509, 429], ["w09", "w23", 539, 651], ["w09", "w24", 534.5, 849.5], ["w10", "w21", 1845, 1033], ["w11", "w26", 1477, 1591.5], ["w12", "w24", 533, 251], ["w15", "w23", 359, 651], ["w16", "w17", 1645, 1371], ["w16", "w21", 1833, 1033], ["w16", "w22", 1833, 1027], ["w17", "w26", 1477, 1585.5], ["w18", "w24", 533, 257], ["w21", "w26", 1038.5, 1033], ["w22", "w26", 1038.5, 1027], ["w23", "w24", 533, 651]], "labelCollisionCount": 0, "labelNodeCollisionCount": 0, "minimumLabelHaloContrast": 5.892601677370216, "headingBodyRatio": 1.4875}
PASS hard ceilings: routing total 992 == 992; lane compile 19768 == 19768; road-pair discovery checks == 0
PASS maximum leg: 41 == 41 ops
PASS scaling: 24 nodes = 19768 ops; 48 nodes = 31965 ops; ratio = 1.698683048852266 == 1.698683048852266
PASS median load: 226.30000007152557 == 226.30000007152557 ms
PASS pinned M1 before metrics unchanged; exact 48-node clone verified at +1920 south.
PASS nested-wires.test.ts deleted; new test files = 0; pnpm check test count = 208
exit 0
```

## Final scope and outcome

- Modernization commit: `1a6c5c2` (ruling #15/#16); separate metrics commit: `9ff377e` (ruling #16). Earlier STOP commits and ruling #14 remain ancestors.
- Full root verifier exit 0; M9a offline replay exit 0; standalone `pnpm check` exit 0, **70/70 files and 208/208 tests**. Declutter's branch assertion is documented above, satisfying ruling #14.
- README **888 → 79 lines**; three zero-reference files deleted (**168 lines**); four exact-banner maps restored (**1034 lines**).
- **The ~1540-line target is not reached:** evidence Markdown excluding this audit totals **5056 → 5113 lines**. Protocol #4 keeps 24 referenced candidates; one requested path was absent. Reduction before map restoration is 977 lines; required maps add 1034. Kept-with-reason decisions take precedence over the approximate target. No second deletion pass after README rewrite was used to evade the ordered reference protocol.
- All tracked files were byte-compared against entry `ec00db1`: changes are confined to the evidence subtree. The only changed existing non-Markdown files are the authorized root verifier and regenerated metrics. All other verifiers, canonical inputs, PNGs, scripts and logs are unchanged.
- Frozen styling trio and presentation STOP match `11f2db3`; protected extraction/scale/amended reports and **every M9a file** match entry bytes. All six pinned input hashes above still match.
- No new test code, application source changes, branch switch, push or PR. The disposable replay snapshot and private index were removed. No rendered-output changes or new visual acceptance claims; retained reviews continue to govern visual limitations.
