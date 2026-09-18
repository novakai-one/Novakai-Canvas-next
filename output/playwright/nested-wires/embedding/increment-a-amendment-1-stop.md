# Increment A — STOP for support-template ratification

**Amendment 1 is complete. Increment A is incomplete.** The rejected product diff is preserved, product source equals committed `b9e098a`, and all five ordinary scenes serialize byte-identically to that commit, twice each. Authoring bodies are back to **40**. The new STOP is a support-template judgment concerning the hub control, not the earlier provenance question.

## Ratification-relevant evidence

| Required evidence                                            | Status                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Full authoring constraint-graph admission                    | Not established; no complete graph or public ledger implemented                 |
| Default/hub complete support slack                           | Not established; **hub requires a template-admission decision**, detailed below |
| Templates/scale exact spill populations 13/7                 | Prior design evidence only; not verified by a completed ledger                  |
| Calibrated preflight operations and T/C/G/V/E                | Not measured; no product preflight exists                                       |
| All five ordinary builder serializations vs `b9e098a`, twice | **Pass**                                                                        |
| Restored authoring 40/87/1,273/18/28/96 catalogs             | **Pass**, complete serialized catalog equality                                  |
| `pnpm check`                                                 | **Exit 0**, 70/70 files, **208/208 tests**                                      |
| New/changed product source                                   | None after the authorized restoration                                           |
| Commit / push / PR                                           | Not performed: A has not passed its gates                                       |

No geometry, projection, routing policy, fixture, or baseline was changed. No server or browser was started, and no protected port was touched. B/C/D were not started.

## The judgment requiring ratification

The retained hub route for **w23** enters through `section-1:entry-left`, travels down the section's left interior frame, then turns right onto its first internal horizontal row boundary. Both transitions have exactly one construction contact. The witness identifies those tracks from construction placement fields; it does not parse coordinate-bearing road IDs.

| Quantity                                      | Measured value |
| --------------------------------------------- | -------------: |
| Gate center y                                 |            624 |
| Gate retained lane rank / directional count   |          2 / 3 |
| Gate lane offset                              |            +15 |
| Previous join ends at y                       |        **639** |
| Outgoing row-street center y                  |            648 |
| Outgoing row-street demand / width            |         2 / 36 |
| Nominal left-turn start y, `648 − 36/2 + 6/2` |        **633** |
| Required positive straight stem               |        **1.5** |
| Earliest forward start y, `639 + 1.5`         |      **640.5** |
| Nominal-template deficit                      |        **7.5** |

For the selected nominal template, the proposed forward inequality is `633 ≥ 639 + 1.5`, which fails by 7.5. The existing ordinary builder already applies `forwardConnection`: it moves the connector's start and its **single** via point from y=633 to y=640.5, preserving an orthogonal connector and a 1.5-unit forward stem. This is a non-median turn; it is not the rejected two-column median edit.

Source: `capability/layout/core/nested-lane-projection.ts:104` constructs the nominal anchor, `:316` applies the forward adjustment, and `:327–334` computes and applies it. Design §1 requires positive stems, retained turn kinds, and support compilation over a selected template. Design §7-A and the ratification amendment require a STOP if hub needs binding expansion.

**The observation is not proof that hub geometry must move.** The existing adjusted connector is a concrete alternative at the same scene coordinates. Conversely, the observation does not establish that admitting that adjustment is sufficient for every support constraint or every other retained scene.

A requires a choice before its constraints can be declared authoritative:

1. Treat the nominal turn anchors as fixed by the retained template. This witness then has a 7.5-unit deficit, and the hub no-op condition needs re-ratification.
2. Admit the existing non-median forward adjustment as part of a supported retained template. The ledger would need a general admissibility rule checking the complete adjusted connector, ownership, and longitudinal support; clamp activation alone could not be treated as an expansion deficit. This cannot authorize the rejected median collapse, an exception for w23, or a general legality claim.

**Requested ruling:** which interpretation governs Increment A's support compiler? Neither was silently selected. This is the brief's judgment-call STOP, not a failed mechanical implementation assertion and not a claim of completed typed graph rejection.

## Reproducible witness

[probe-hub-support.mjs](probe-hub-support.mjs) bundles the public Layout entry point in memory and inserts an observation immediately before the existing clamp return. The existing return and geometry remain unchanged. It records the nominal connection, preceding join, retained lane/rank/source-segment ordinal, construction contacts, final roads, and ordinary projected wire.

```sh
node --import tsx output/playwright/nested-wires/embedding/probe-hub-support.mjs
```

The probe observes zero clamp activations in default and one in hub. Each control runs twice with identical observations. Every instrumented scene is asserted byte-identical to its ordinary public-builder output. The exit-0 result means the diagnostic and its assertions reproduced; its report status is **`STOP-support-template-ratification`**, not feasibility or legality success.

Full evidence: [increment-a-support-stop.json](increment-a-support-stop.json). Logical witness identities are section-1 / vertical / frame-left / ordinal 0 and section-1 / horizontal / row-boundary / ordinal 1, plus the retained semantic gate port. This is a witness identity check, not the complete merged-provenance ledger required by A.

Mechanical harness correction: the initial saved probe exported the entire public barrel with external packages retained, causing a data-URL module-resolution error for an unrelated ELK import. Narrowing the bundle entry to the one used public builder export fixed that harness error. No product code, assertion, or support policy changed.

## Amendment 1 and restored baseline

The saved patch is [../projection/rejected-candidate.patch](../projection/rejected-candidate.patch), SHA-256 `476eeb783fbbc8040490c68d81ca1dddbf3b6dccf4fadc19d5613b65bd43e04d`. Its bytes were verified identical to the rejected candidate's current product `git diff` before restoration. The sole touched product file was `capability/layout/core/nested-lane-projection.ts`; it was restored explicitly from `b9e098a`. `git diff b9e098a -- capability apps` is empty.

The inherited `ownership/verify.mjs` changes and all earlier projection evidence were retained. The previous provenance STOP report is preserved as [increment-a-provenance-stop.md](increment-a-provenance-stop.md); its former blocker is resolved.

[verify-baseline.mjs](verify-baseline.mjs) loads a separate public builder whose first-party modules come from Git object `b9e098aab6bb66c3359211efecd721023c59f06f`, compares it with the ordinary worktree builder, and rebuilds both versions twice per scene.

```sh
node --import tsx output/playwright/nested-wires/embedding/verify-baseline.mjs
```

| Scene     | Serialized bytes, both versions | Byte equality | Twice deterministic, both versions |
| --------- | ------------------------------: | ------------- | ---------------------------------- |
| default   |                         649,257 | Yes           | Yes                                |
| hub       |                         713,191 | Yes           | Yes                                |
| templates |                         764,731 | Yes           | Yes                                |
| scale     |                       1,462,875 | Yes           | Yes                                |
| authoring |                       1,953,839 | Yes           | Yes                                |

Full hashes and inspector counts: [increment-a-baseline-gate.json](increment-a-baseline-gate.json).

A fresh read-only authoring catalog replay used the existing verifier's `catalogs` and `supplementary` functions, its pinned `1ff0be8` verifier implementation, and the restored ordinary public builder. The complete serialized diagnostic equals `projection/before-catalogs.json`, SHA-256 `74897f5c3497ed996629e0451512e5b771d626efac1d516ac4a845bc4cd45851`. Counts remain bodies **40**, boundaries **87**, uncertified **1,273**, overlaps **18**, reversed **28**, gate omissions **96**, corridors **2**, continuity **0**. Receipt: [increment-a-catalog-gate.json](increment-a-catalog-gate.json). Routing success does not establish legality; these defects remain in the real ordinary scene.

## Verification and delivery boundary

Final source-tree check: [increment-a-pnpm-check.txt](increment-a-pnpm-check.txt), exit 0, 208/208 tests. No new product files exist, so no product source review score is claimed. The read-only probe and byte gate pass without changing scene serialization; no rendered-output improvement or visual acceptance is claimed.

Remaining A obligations include the public typed ledger, complete travel/contact accounting and logical merged provenance, full support graph admission, complete default/hub slack, real 252/336/480 width and 13/7 spill assertions, negative controls, separately calibrated operations, per-product-file review evidence, and commit/push/PR after A passes. The diagnostic is not substituted for any of those gates. Work stops here under the user's judgment-call rule pending the support-template ruling.
