# Documentation prune — ruling #15 pre-rewrite proof STOP

Branch: `feat/docs-prune`; clean entry commit `c163301`.
Authority: `/Users/christopherdasca/Documents/Codex/2026-09-16/fi/orchestration/docs-prune.md`, including rulings #14 and #15 and the user's ordered execution instructions.
Prior correct STOP reports remain in commits `14ce5d7` and `c163301`; the ruling #14 certification fix remains in `44cd915` unchanged.
This report supersedes the previous report's current-state claims. Ruling #15 resolves the historical-map link issue: the required banners authorize links resolving on the source branches, without artifact imports. That is no longer a blocker.

## STOP: the mandatory pre-rewrite README proof is impossible

Ruling #15 requires the full verifier to exit 0 on the otherwise-unmodified tree **before touching README**, and requires its pinned-string assertions to remain intact. The premise that the existing README contains all pinned strings is false at `c163301`.

| Exact required string | Source of required value | Current README result |
| --- | --- | --- |
| `19768` | `calculations.json`, `laneNetwork.total`; accepted by ruling #10 | Absent. README lines 700, 797, 841 and 875 use `19,768`, which does not satisfy `str(value) in readme`. |
| `104` | `calculations.json`, `wireRouting.perWire.w18.total` | Absent. The existing loop checks **all 26** per-wire totals, including w18, not just the original twelve. |
| `226.3` | `browser.json`, `medianMilliseconds = 226.30000007152557`, formatted with `.1f` | Absent. The original median assertion fails independently. |

README is unchanged at **888 lines**, SHA256 `649ee9950fed5bb00085c5faf5e5399e4673ddbb8f9393590dee8e9a2051a64b`. The literal `100 nodes` is present. No replacement for these pinned literals is authorized: substituting formatted numbers, narrowing the wire loop, choosing another browser artifact, or omitting the assertions would change the expressly protected contract. In particular, **`226.3` has no accepted alternative that both preserves the existing median assertion and appears in the untouched README**. These are missing baseline documentation strings, not unsourced numerical baselines.

This is a deterministic ordering conflict even if every stale verifier constant is modernized correctly. Consequently the first required milestone cannot be proved, and steps 2–4 were not started. No partial verifier modernization was committed as though it met the one-pass requirement.

## One-pass audit: old → accepted replacement and evidence

The following table records the full known modernization findings, **not applied changes**. The three named constant replacements and the independently sourced ratio correction were exercised only in memory. No verifier or artifact was written.

| Old contract / constant | Accepted replacement or finding | Evidence source |
| --- | --- | --- |
| Lane compile `<= 12000` | Exact `== 19768`; matching diagnostic text | Ruling #10 in `milestone-076-lazy-audit.md:38`; current `calculations.json`; `presentation/m9a/verify-offline.py:29`. |
| Routing total `<= 1200` | Exact `== 992`; matching diagnostic text | Same ruling #10 baseline and M9a exact gate; current `calculations.json`. |
| Scaling nodes `[22, 44]`; printed 22/44 and final “44-node clone” text | `[24, 48]`; printed 24/48 and 48-node clone | M4 brief title and DoD 5; `verify-m45-evidence.py:35`; current `calculations.json.scalingProbe`. The +1920 offset and exact-clone flag remain valid. |
| Scaling ratio equals `laneCompile[1] / laneCompile[0]` | Equals `totalOperations[1] / totalOperations[0]`; growth ceiling stays `2.5` | M4 brief DoD 5 specifies total-op growth; M4.5 completion report §5/6 and `verify-m45-evidence.py:103` report clone total operations. Current ratio `46177 / 27184 = 1.698683048852266`; lane-only ratio is `31965 / 19768 = 1.6170072845002024`. |
| Oracle wire count `12` | `26` | M4 brief DoD 2/9, M4.5 completion report, current scene/oracle. All 26 current detours already satisfy the existing 0–10% assertion. |
| M1.5 metrics object `{before, after, ceilings}` and whole-object equality | Current artifact is the M4.5 schema, but its raw-calculation equality also fails; **no accepted passing reconciliation sourced within the allowed edits** | `metrics.json`, last updated in `88c65fe`; schema constructed by `verify-m45-evidence.py:86–98`. Details below. |
| README `19768`, `104`, median `226.3` | **No permissible replacement** preserving the explicit pinned-string contract and pre-rewrite sequence | Original `verify-evidence.py:115–119`, unchanged canonical calculations/browser and README. |
| Crossings ceiling (already replaced under ruling #14) | Keep scene-hash-bound exact certificate equality and empty uncertified list | `44cd915`, `m45-topological-bound.json`: 23 certified / 0 uncertified. No further change required. |

Other historical checks were inspected: original 12-wire screenshot set, PNG dimensions, five historical browser loads, median ceiling 239.2, twelve named per-wire ceilings, per-leg 60, zero discovery, detour ceiling, M1 baseline, and exact clone offset. They are not automatically changed just because a number is old. In-memory execution confirms the historical screenshot/load checks and all twelve named per-wire ceilings pass. The M4.5 metrics schema has its own separate browser and screenshot artifacts.

The metrics problem is independent of the README problem. `metrics.json.calculations.laneNetwork.total` is **19683**, but `calculations.json.laneNetwork.total` is **19768**. The recorded clone totals are `[26107, 44120]`, versus canonical `[27184, 46177]`. Merely changing the object schema cannot reconcile those bytes. Ruling #10 accepts current operation totals; it does not supply a replacement frozen metrics artifact or authorize changing `metrics.json`. Dropping whole-object/raw-evidence reconciliation, substituting the expected object from the artifact under test, or running `--write` would not preserve the gate within the stated scope. No such workaround was used.

## Execution evidence and gate accounting

The actual unchanged root verifier exits 1 at its original lane-network assertion, not at a later assertion. An in-memory diagnostic with the three specifically named replacements reaches the ratio assertion at line 104 and fails. Adding only the sourced total-operation ratio replacement reaches the metrics equality at line 113 and fails. Separately evaluating the original pinned-string conditions produces:

```text
FAIL original pinned-string assertion: Missing README count: 19768
FAIL original pinned-string assertion: Missing README count: 104
README median literal '226.3' present: False
README '100 nodes' present: True
README lines: 888
```

These diagnostic probes are not claimed as a passing full verifier. No assertions were removed or bypassed in any on-disk file, and no `--write` mode ran.

| Required gate | Observed result |
| --- | --- |
| Full root verifier before README | Exit 1; ordering/metrics blockers documented above. |
| Full root verifier after README | Not reached; README rewrite not started. |
| M9a offline verifier | Exit 0; exact operation totals and all suites below. |
| Declutter audit | Exit 1 at the branch assertion; its own output below satisfies ruling #14's documentation alternative. |
| `pnpm check`, alone | PASS, exit 0: 70 files / 208 tests; standalone run after M9a finished. |
| README ≤100 lines | Not reached: unchanged at 888 lines. |
| Prune and four bannered restorations | Not started because the first required proof cannot pass. |
| Scope | Only this Markdown report changed; no new tests, verifier edits, application source edits or artifact imports. |

### Actual root verifier output

```text
PASS w01: 11 <= 60 routing ops
PASS w02: 32 <= 60 routing ops
PASS w03: 14 <= 60 routing ops
PASS w04: 11 <= 60 routing ops
PASS w05: 15 <= 60 routing ops
PASS w06: 34 <= 60 routing ops
PASS w07: 32 <= 60 routing ops
PASS w08: 15 <= 60 routing ops
PASS w09: 34 <= 120 routing ops
PASS w10: 71 <= 180 routing ops
PASS w11: 42 <= 120 routing ops
PASS w12: 103 <= 180 routing ops
Traceback (most recent call last):
  File "/Users/christopherdasca/Programming/Novakai-Canvas-next-templates/output/playwright/nested-wires/verify-evidence.py", line 97, in <module>
    assert calculations['laneNetwork']['total'] <= 12000
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError

exit 1
```

### Actual declutter output

```text
Traceback (most recent call last):
  File "/Users/christopherdasca/Programming/Novakai-Canvas-next-templates/output/playwright/nested-wires/presentation/declutter/verify-audit.py", line 13, in <module>
    assert run(['git', 'branch', '--show-current']).decode().strip() == 'feat/m65b-declutter'
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError

exit 1
```

This assertion executes before extraction/writes. The required branch remains `feat/docs-prune`; no branch switch or verifier bypass occurred.

### M9a offline output

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

The unmodified command ran serially in an isolated `git archive c163301` tree, with existing dependency directories linked, the original Git directory, the isolated worktree path and a private copied index. This is necessary because M9a writes protected logs/operation JSON and its child scripts regenerate canonical artifacts. The actual worktree's protected files remained untouched. The isolated tree contains exactly the retained application/verifier/evidence bytes; only this report differs. This PASS does not claim prune completion.

## Per-file reference-safety decisions

Before updating this report, every prior candidate was scanned from the repository root with the required command:

```sh
grep -rn "<basename>" --include='*.py' --include='*.mjs' --include='*.mts' --include='*.ts' --include='*.md' output/ capability/ apps/
```

Every scan exited 0 or 1, without errors. No deletion was attempted. All candidates remain because execution stopped before the prune, and existing reference hits remain relevant; previous report references were counted. Basename collisions are not silently excluded. Before = clean `c163301`; after = this report update. Counts describe matching output lines, not total occurrences.

| Candidate relative to evidence root | Decision / reason | File lines before → after | Grep lines before → after |
| --- | --- | ---: | ---: |
| `m3-blocker.md` | Keep: pre-rewrite proof STOP; reference hits retained | 62 → 62 | 1 → 1 |
| `m3-junction-blocker.md` | Keep: pre-rewrite proof STOP; reference hits retained | 62 → 62 | 2 → 2 |
| `m3-source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 40 → 40 | 2 → 2 |
| `m4-completion-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 268 → 268 | 3 → 3 |
| `m4-pin-ruling-stop-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 78 → 78 | 2 → 2 |
| `m4-source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 47 → 47 | 3 → 3 |
| `m4-stop-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 124 → 124 | 2 → 2 |
| `m4-visual-budget-stop-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 113 → 113 | 2 → 2 |
| `m45-completion-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 333 → 333 | 3 → 3 |
| `m45-source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 34 → 34 | 2 → 2 |
| `m45-stop-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 196 → 196 | 3 → 3 |
| `m45-visual-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 17 → 17 | 3 → 3 |
| `presentation/declutter/report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 313 → 313 | 50 → 42 |
| `presentation/declutter/source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 76 → 76 | 23 → 23 |
| `presentation/declutter/visual-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 39 → 39 | 18 → 18 |
| `presentation/m76/source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 31 → 31 | 23 → 23 |
| `presentation/m76/stop-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 45 → 45 | 29 → 21 |
| `presentation/port-ab/source-review.md` | Absent at specified path; no substitution | 0 → 0 | 23 → 23 |
| `scale-scene/port-ab/source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 57 → 57 | 23 → 23 |
| `scale-scene/ruling5-source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 44 → 44 | 1 → 1 |
| `scale-scene/ruling5-visual-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 40 → 40 | 3 → 3 |
| `source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 62 → 62 | 23 → 23 |
| `templates-scene/resume-stop-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 158 → 158 | 2 → 2 |
| `templates-scene/resume2-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 221 → 221 | 2 → 2 |
| `templates-scene/resume2-source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 89 → 89 | 2 → 2 |
| `templates-scene/source-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 29 → 29 | 23 → 23 |
| `templates-scene/stop-report.md` | Keep: pre-rewrite proof STOP; reference hits retained | 87 → 87 | 29 → 21 |
| `templates-scene/visual-review.md` | Keep: pre-rewrite proof STOP; reference hits retained | 46 → 46 | 18 → 18 |

## Final scope and validation

`pnpm check` ran alone after all other verifier processes completed, exit 0. Typecheck, lint, formatting, architecture and tests passed:

```text
 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  23:26:25
   Duration  17.27s (tests 74%, import 14%, transform 10%, environment 2%)
```

A byte comparison against entry commit `c163301` confirms that only this report changed: README, the ruling #14 verifier, all other verifiers, all non-Markdown artifacts, all protected reports and everything under M9a are unchanged. The frozen styling trio and presentation STOP also match `11f2db3`. No new tracked or untracked test file exists. There was no rendered-output change and no new visual acceptance claim. All 28 reference scans completed without errors; every candidate remains unchanged.

Original evidence Markdown remains **5,056 lines excluding this report**. No prune savings, restored maps, completed modernization or completed README rewrite is claimed. No push or PR.
