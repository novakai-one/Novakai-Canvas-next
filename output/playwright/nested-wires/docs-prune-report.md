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
