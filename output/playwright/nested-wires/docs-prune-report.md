# Documentation prune — ruling #14 applied; STOP with evidence

Branch: `feat/docs-prune`. Entry commit: `14ce5d7`, clean worktree.
Authority: `/Users/christopherdasca/Documents/Codex/2026-09-16/fi/orchestration/docs-prune.md`, including its ruling #14 amendment and the user's explicit order/scope.
The prior STOP remains in Git history. This report supersedes its current-state claims.

## Completed first: ruling #14

Separate commit **`44cd915`**, `fix(evidence): apply ruling #14 crossing certification gate`, replaces only the historical six-crossing assertion in `verify-evidence.py`.
Certification comes from `m45-topological-bound.json`, the same proof used by the M4.5 evidence verifier. The replacement checks the scene SHA256, an empty uncertified list, and exact equality between detected wire-pair/point tuples and certified tuples. All other assertions, ceilings, verifiers, and return values remain unchanged.

An in-memory invocation of the actual geometry function accepts **23 certified / 0 uncertified** crossings. Three negative controls reject a removed certificate, a nonempty uncertified list, and a stale scene hash. No test file or proof artifact was created or edited. `pnpm check` ran alone before the commit: exit 0, 70 files / 208 tests, duration 17.50s.
This is a terminal evidence-script correction, not an admitted application/capability module. No production quality score or source refactor is claimed.

## STOP: restoration references cannot resolve within the requested scope

The four exact historical report blobs exist, but both destination directories and their supporting evidence are absent on this branch. Restoring only the four Markdown maps leaves **81 unresolved link occurrences** after excluding the two links between the requested maps themselves. These are literal Markdown links checked relative to each intended destination, not basename collisions or hypothetical future references.

| Required map | Source branch | Report blob | Lines | Still-missing link occurrences |
| --- | --- | --- | ---: | ---: |
| `compacting/stop-report.md` | `feat/m75-compacting` | `8828d95f7918634f4599f2203307bde8a1160357` | 333 | 31 |
| `compacting/m75b/stop-report.md` | `feat/m75-compacting` | `034a7fd4e159ac34a105d3379194444733c0d661` | 223 | 31 |
| `authoring-scene/stop-report.md` | `feat/m8-authoring-scene` | `85a61f649e804aa10bf939c95e2a9a2c6af680ca` | 193 | 8 |
| `authoring-scene/m8b/stop-report.md` | `feat/m8-authoring-scene` | `113006fc2eef09aa71b700fad89cda8a9c5724a9` | 281 | 11 |

Concrete unresolved references (line numbers in the source report; paths relative to this evidence root):

| Source map and line | Missing target | Target blob on source branch | Mandated basename grep hits before report update |
| --- | --- | --- | ---: |
| `compacting/stop-report.md:20` | `compacting/rejected-candidate.patch` | `7d03978a13b017df5803cf71b1cb6cc4c8bce044` | 0 |
| `compacting/m75b/stop-report.md:11` | `compacting/m75b/rejected-candidate.patch` | `5af55d42aca8b11237c38db808a18b4db45ff14d` | 0 |
| `authoring-scene/stop-report.md:23` | `authoring-scene/capacity-witness.json` | `0d29fb9238acf37e7ea6df4171ed026f6106ec7c` | 0 |
| `authoring-scene/m8b/stop-report.md:16` | `authoring-scene/m8b/probe-sizing.mjs` | `85c0d27a543f383a078ec145d13621f96efc2574` | 0 |

Reproduce any row with `git show <source-branch>:output/playwright/nested-wires/<map>` and `git cat-file -e <source-branch>:output/playwright/nested-wires/<target>`; `test -e output/playwright/nested-wires/<target>` fails in this worktree. The source blobs resolve in Git history, but the reports' relative links do not resolve on this branch.

The brief authorizes restoring four Markdown maps and protects non-Markdown artifacts. Resolving these links requires choosing between importing additional evidence (including executable scripts/patches and JSON) and rewriting the historical links/restoration content. Protocol #4 cannot settle that choice by retaining an existing target: the targets are absent. Following the explicit STOP instruction, neither option was assumed. **No deletion, restoration, or README rewrite occurred.**

## Independent mandatory-gate conflict after the amendment

The full root verifier now passes the certification assertion and the twelve named per-wire ceilings, then exits 1 at **line 97**, `calculations['laneNetwork']['total'] <= 12000`. The unchanged canonical total is **19768**. M9a independently confirms this exact accepted total. Ruling #14 changes only crossing certification and the declutter branch gate; it does not supersede this lane-network ceiling.

The README assertions remain unreachable. Later unchanged assertions also expect the old `[22, 44]` scaling probe and 12 oracle wires, while canonical evidence has `[24, 48]` and 26. These are static observations, not claims that execution advanced past line 97. No extra assertion or evidence was altered to force exit 0.

## Gate accounting

| Required gate | Observed outcome |
| --- | --- |
| Root verifier, in full | FAIL, exit 1 at unchanged lane-network ceiling; output below |
| Declutter audit | Exit 1 at branch assertion; non-runnability documented below, satisfying ruling #14 |
| M9a offline verifier | PASS, exit 0; all suites and exact operation totals below |
| `pnpm check`, alone | PASS before verifier commit: 70 files / 208 tests; final rerun recorded below |
| README ≤100 lines and pinned strings | NOT MET: unchanged at 888 lines; full root verifier cannot reach pinned-string assertions |
| Scope | Only ruling #14 verifier edit and this report; zero deletions/restores/new tests/source changes |

## Per-file reference-safety decisions

Before considering every candidate, the exact required command was executed from the repository root:

```sh
grep -rn "<basename>" --include='*.py' --include='*.mjs' --include='*.mts' --include='*.ts' --include='*.md' output/ capability/ apps/
```

All scans exited 0 or 1, with no errors. Every existing candidate is retained after the STOP. The initial report already references all candidates; those hits are counted, not silently excluded. Generic names also match unrelated targets, so raw counts alone are not treated as proof of a particular link. Before is `14ce5d7` plus the isolated ruling #14 fix; after includes this updated report. No deletion occurred between scans.

| Candidate relative to evidence root | Decision / reason | File lines before → after | Grep lines before → after |
| --- | --- | ---: | ---: |
| `m3-blocker.md` | Keep: STOP; existing reference hits preserved | 62 → 62 | 1 → 1 |
| `m3-junction-blocker.md` | Keep: STOP; existing reference hits preserved | 62 → 62 | 2 → 2 |
| `m3-source-review.md` | Keep: STOP; existing reference hits preserved | 40 → 40 | 2 → 2 |
| `m4-completion-report.md` | Keep: STOP; existing reference hits preserved | 268 → 268 | 3 → 3 |
| `m4-pin-ruling-stop-report.md` | Keep: STOP; existing reference hits preserved | 78 → 78 | 2 → 2 |
| `m4-source-review.md` | Keep: STOP; existing reference hits preserved | 47 → 47 | 3 → 3 |
| `m4-stop-report.md` | Keep: STOP; existing reference hits preserved | 124 → 124 | 2 → 2 |
| `m4-visual-budget-stop-report.md` | Keep: STOP; existing reference hits preserved | 113 → 113 | 2 → 2 |
| `m45-completion-report.md` | Keep: STOP; existing reference hits preserved | 333 → 333 | 3 → 3 |
| `m45-source-review.md` | Keep: STOP; existing reference hits preserved | 34 → 34 | 2 → 2 |
| `m45-stop-report.md` | Keep: STOP; existing reference hits preserved | 196 → 196 | 3 → 3 |
| `m45-visual-review.md` | Keep: STOP; existing reference hits preserved | 17 → 17 | 3 → 3 |
| `presentation/declutter/report.md` | Keep: STOP; existing reference hits preserved | 313 → 313 | 47 → 50 |
| `presentation/declutter/source-review.md` | Keep: STOP; existing reference hits preserved | 76 → 76 | 23 → 23 |
| `presentation/declutter/visual-review.md` | Keep: STOP; existing reference hits preserved | 39 → 39 | 18 → 18 |
| `presentation/m76/source-review.md` | Keep: STOP; existing reference hits preserved | 31 → 31 | 23 → 23 |
| `presentation/m76/stop-report.md` | Keep: STOP; existing reference hits preserved | 45 → 45 | 25 → 29 |
| `presentation/port-ab/source-review.md` | Absent at specified path; no substitution/deletion | 0 → 0 | 23 → 23 |
| `scale-scene/port-ab/source-review.md` | Keep: STOP; existing reference hits preserved | 57 → 57 | 23 → 23 |
| `scale-scene/ruling5-source-review.md` | Keep: STOP; existing reference hits preserved | 44 → 44 | 1 → 1 |
| `scale-scene/ruling5-visual-review.md` | Keep: STOP; existing reference hits preserved | 40 → 40 | 3 → 3 |
| `source-review.md` | Keep: STOP; existing reference hits preserved | 62 → 62 | 23 → 23 |
| `templates-scene/resume-stop-report.md` | Keep: STOP; existing reference hits preserved | 158 → 158 | 2 → 2 |
| `templates-scene/resume2-report.md` | Keep: STOP; existing reference hits preserved | 221 → 221 | 2 → 2 |
| `templates-scene/resume2-source-review.md` | Keep: STOP; existing reference hits preserved | 89 → 89 | 2 → 2 |
| `templates-scene/source-review.md` | Keep: STOP; existing reference hits preserved | 29 → 29 | 23 → 23 |
| `templates-scene/stop-report.md` | Keep: STOP; existing reference hits preserved | 87 → 87 | 25 → 29 |
| `templates-scene/visual-review.md` | Keep: STOP; existing reference hits preserved | 46 → 46 | 18 → 18 |

Specific retained links include root README:36 to the M3 source review, root README:604–606 to the declutter report/reviews, the M4 completion report:25 to its source review, the second templates resume report:36 to its source review, and the protected ruling #5 report:162 to its visual review. The presentation port-A/B review path is absent; the scale-scene port-A/B review is a separate retained file. No ambiguous link was redirected.

## Verifier-owned output

Root verifier, actual worktree, exit 1:

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
```

Declutter audit, actual worktree, exit 1:

```text
Traceback (most recent call last):
  File "/Users/christopherdasca/Programming/Novakai-Canvas-next-templates/output/playwright/nested-wires/presentation/declutter/verify-audit.py", line 13, in <module>
    assert run(['git', 'branch', '--show-current']).decode().strip() == 'feat/m65b-declutter'
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError
```

The declutter branch assertion runs before extraction or writes. Remaining on `feat/docs-prune` prevents this verifier from proceeding; no branch switch or verifier bypass was performed.

M9a offline verifier, exit 0:

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
```

M9a writes logs/operation files in its protected directory and its children rewrite canonical evidence. To preserve those bytes, the unchanged command ran in an isolated `git archive 44cd915` copy with existing dependency directories linked, the original Git directory, the isolated worktree path, and a private copied index. The archive contains the committed ruling #14 edit; only this Markdown report differs from the final worktree. This verifies the actual retained source/evidence, not completion of a prune. No browser or other gate ran concurrently.

## Final standalone check and scope verification

`pnpm check` ran alone after M9a completed, exit 0. Typecheck, lint, formatting, architecture and tests all passed:

```text
 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  23:19:46
   Duration  18.60s (tests 75%, import 14%, transform 10%, environment 2%)

```

A byte comparison against `14ce5d7` confirms every tracked file except this report and the explicitly amended verifier remains unchanged, including all protected Markdown, all M9a files, and every other non-Markdown artifact. The frozen styling trio and presentation STOP also match `11f2db3`. No new tracked or untracked test file exists. No rendered output changed or visual acceptance is claimed.

README remains 888 lines; original evidence Markdown remains 5,056 lines excluding this report. Zero prune savings or completed restoration is claimed. The standalone ruling #14 commit is retained, followed by this STOP evidence report. No push or PR.
