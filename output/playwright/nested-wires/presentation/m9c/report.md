# M9c — colour and depth

PASS. Implemented all five paint items on `feat/m9c-colour`, based on `a98e55f`. No layout, routing, certification, semantic scene, selection-policy or acceptance-assertion changes. The renderer only adds family/depth paint metadata from already admitted section labels/ancestry; CSS consumes published tokens. No servers started/stopped, no subagents, no push, no PR. Three pre-existing modified M9a evidence JSON files were preserved and excluded from the commit.

## Binary gates

| Gate | Result / evidence |
|---|---|
| Nested/templates/scale scene bytes | PASS, byte-identical to **a98e55f**; [hashes](base-byte-identity.json), fresh rebuild equality in [identity](identity.txt) |
| Invariant suites unchanged | PASS, templates **130 certified / 0 uncertified**, scale **112 / 0**; [templates](templates-invariants.txt), [scale](scale-invariants.txt) |
| Exact operations EQUAL | PASS, nested **19,768 / 992 / 0**; templates **28,443 / 1,626 / 0**; scale **43,876 / 2,088 / 0**; `*-ops-amended.txt` and `*-operations.json` |
| Idle AND converging contrast | PASS, minimum **3.306993:1** across solid resolved surfaces; **3.049290:1** even under a conservative full-strength node shadow; [measurements](contrast.json), [assertions](contrast-check.txt) |
| Node / section label contrast | PASS, minimum **14.364491:1** |
| Scale roads-off five-load median <=300 ms | PASS, **241.5 ms** |
| Templates five-load median <=250 ms | PASS, **193.6 ms**; all samples/stages in [browser.json](browser.json) |
| Zero hover/selection recalcs | PASS, layout count remains 1; exact scene/camera retained; [spotlight](spotlight.json), [selection](selection.json) |
| Fixed M9a assertions unchanged | PASS, actual `verify-browser.py` and `verify-spotlight.py` each exit 0 on 5191; [runner hashes/exits](gate-exits.json); [scope proof](scope-check.txt) |
| Depth parity / family bar clearance | PASS, all 25 section instances, 3px tabs in existing header gutter; before/after browser geometry exactly equal; [paint check](paint-check.txt), [contrast.json](contrast.json) |
| SVG determinism | PASS, two real native exports **168,752 bytes**, byte-identical; [export.json](export.json), [first](export-first.svg), [second](export-second.svg) |
| Headless / server ownership | PASS, all browser navigation on existing **5191**, 1920×1440; no server lifecycle actions |
| New `*.test.ts` | PASS, **0**, invariant and selection suites unmodified |
| `pnpm check` alone | PASS, exit **0**, **208/208** tests; [log](pnpm-check.txt) |
| Published tokens / source standards | PASS, [token check](tokens-check.txt), [file-by-file review](source-review.md): every changed runtime source >144/160; Sonar <=2 |

M9b adornments are not present in this base. Existing labels, marker geometry and M9a interaction paint compose unchanged. Frozen runner files and their capture/spotlight assertion bodies are byte-identical to the branch base.

## Published paint

- `wire.idleInk = #000000`; `wire.defaultColor` references it. Existing stroke widths remain 1.75px / 1.25px. **Idle alpha 0.65**, convergence multiplier **0.72**, effective converging idle alpha **0.468** remain frozen. `wire.idleHaloOpacity = 0.10`; active/selection/spotlight alpha rules are untouched.
- `sectionPaint.evenFill = surface.raised` (**#ffffff**); `sectionPaint.oddFill = #edf1f6`. Parity follows parent ancestry, independent of family. No bounds, padding or frame lines change.
- `nodeElevation.offsetY = 2px`, `blur = 6px`, `spread = 0px`; zero horizontal offset and existing `shadow.opacityColor = rgba(0,0,0,0.12)` yield **0 2px 6px 0 rgba(0,0,0,0.12)**.
- Family tabs: **3px × 48px**, **4px inset**, absolutely painted inside the existing header gutter: contract **#355ccd**, core/default **#526170**, adapters **#2e7d5b**, service **#7955a2**, web **#8a5d23**, cli **#4a6b7d**. Captions retain the semantic family cue.
- `chromePaint.border = #d9e0e8`; `chromePaint.text = text.secondary` (**#526170**). Existing toolbar dimensions, tab placement and control behavior are unchanged.
- Ink theme receives white idle ink, **#303a48** odd fill and **#374151** chrome border. This milestone's numerical browser contrast gates use the required paper-theme 5191 fixtures; no separate ink-theme visual acceptance is claimed.

## Contrast method and measurements

WCAG relative luminance over **browser-resolved sRGB colors after alpha compositing**, not raw tokens and not antialiased edge pixels. First composite the white halo over the background at **0.10**, then the black stroke at **0.65** or **0.468**. Group opacity is asserted to be 1. Every wire of each type is checked to have the same computed path/halo paint. Text uses actual resolved foreground/background colors. CSS `color(srgb ...)` and `rgb(...)` are both decoded correctly.

| Background | Idle | Converging idle |
|---|---:|---:|
| Canvas #f4f6f8 | 6.740454:1 | 3.489115:1 |
| Even section / lightest tint #ffffff | 6.977601:1 | 3.560960:1 |
| Odd section #edf1f6 | 6.604555:1 | 3.447302:1 |
| Node #ffffff | 6.977601:1 | 3.560960:1 |

The assertions cover every resolved canvas, section, node, road and junction fill across all three fixtures, plus an intentionally conservative **full 12% black shadow underlay** over each background. A blurred exposed shadow is weaker than that bound. Initial halo alpha 0.25 lacked margin under that bound; [initial finding](shadow-review-initial.json) records why it was reduced to 0.10. Frozen wire opacity assertions were never changed. Intentional hover/selection dim states retain the original M9a treatment; they are not relabelled as idle.

## Visual evidence and export limits

- [Scale idle before](scale-before.png) / [after](scale-after.png): same viewport and exact camera/geometry.
- [Templates overview](templates-after.png): alternating containment tints visible.
- [Roads on](scale-roads-on.png) / [roads off](scale-off.png).
- [Contract detail idle](scale-contract-detail-idle.png) / [hover](scale-contract-detail-hover.png).
- [Native SVG preview](export-preview.png), [reference comparison and honest limits](visual-review.md).

**Native SVG export includes the admitted corpus palette, notation, pinned fonts and existing 0.65 idle wire alpha. The RoadPrototype CSS tints, tabs, node shadows and interaction paint are browser-only.** The native determinism probe uses the real `modules-document-publishing` admitted corpus; it is not presented as a native export of the separate road scene. The new shadow is off in SVG export, as permitted. Existing low-contrast section borders are containment separators; new tints/tabs convey hierarchy. The frozen dense layout, small overview text and intentionally hidden idle labels remain explicit visual limits, not claims of full infographic parity.

## Reproduction

From repository root, with the orchestrator's existing 5191 server running; do not launch another server:

```sh
pnpm tokens:check
python3 output/playwright/nested-wires/presentation/m9c/verify-paint.py
python3 output/playwright/nested-wires/presentation/m9c/verify-contrast.py
python3 output/playwright/nested-wires/presentation/m9c/run-gates.py
node --import tsx output/playwright/nested-wires/presentation/m9c/verify-export.mjs
pnpm check
```

Run serially; `pnpm check` alone. `run-gates.py` invokes the actual unchanged M9a runners and restores their original artifact bytes, copying current results here. `before-paint.json` / before screenshots were captured from unmodified a98e55f before any source edits; do not overwrite them by running `--before` against the changed source. All gates fail closed, no assertion thresholds were weakened. No new test files or fabricated passing checks.
