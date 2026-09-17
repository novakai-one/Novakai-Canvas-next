# M9d — zoom typography and chrome density

PASS. Implemented on `feat/m9d-zoom-density`, based on M9c HEAD **50b5237284ea9699ee5e319c17ffc1b20d08cb7d**. Only the RoadPrototype renderer/styles and published Design System tokens change. No layout, routing, certification, scene, card scaling, export implementation, or acceptance-suite changes. All browser navigation used the existing orchestrator-owned **5191** server, headless; no server lifecycle actions, subagents, push or PR.

## Hard gates

| Gate | Result / evidence |
|---|---|
| Scene bytes equal branch base | PASS, nested/templates/scale full serialized bytes; offline fixtures plus actual live browser scenes captured before edits; [hashes](base-byte-identity.json), [assertions](base-check.txt) |
| Preset scene AND geometry bytes | PASS, all three scenes × compact/comfortable/expanded; exact scene strings, React Flow world styles, port offsets, wire points, rendered node/road/junction/section sizes; camera unchanged on switching; [full probes](probes.json) |
| Invariants unchanged | PASS, templates **130/0**, scale **112/0**; [templates](templates-invariants.txt), [scale](scale-invariants.txt) |
| Exact compile/routing/discovery operations | PASS, nested **19,768/992/0**; templates **28,443/1,626/0**; scale **43,876/2,088/0**; `*-ops-amended.txt`, `*-operations.json` |
| Scale roads-off five-load median ≤300ms | PASS, **235.7ms**; [all samples/stages](browser.json) |
| Templates five-load median ≤250ms | PASS, **197.5ms**; same five-load evidence |
| Zero layout recalcs | PASS, **303 probes**, counter remains **1**, every delta **0** for hover, selection, zoom in/out and preset switching; each scene/preset exercises zoom **0.1 through 2**; [summary](probe-summary.json) |
| Label containment / constant screen size | PASS, **10,629** label measurements, **6,066** with nonzero opacity, **0** visible overflows; screen-height variation <0.02px between compensated zoom steps; [probes](probes.json) |
| Unchanged M9a browser + spotlight | PASS, actual original `verify-browser.py` and `verify-spotlight.py` exit 0 on 5191; [hashes/exits](gate-exits.json), `verify-*.py.txt` |
| Unchanged M9c contrast | PASS, actual original `m9c/verify-contrast.py` on fresh 5191 paint capture: minimum wire **3.049290:1**, opaque label **14.364491:1**; [runner hash/output](contrast-check.txt), [measurements](contrast.json) |
| SVG deterministic | PASS, two native exports **168,752 bytes**, equal SHA-256 **fa7d2734f845fbd4681f3a20784af92d9605b95df093e6431a0e2975242bbdf2**; [export evidence](export.json) |
| 1920×1440 visual evidence | PASS, default, below-default zoom, compact/expanded comparison, roads on/off and actual native SVG inspected; [visual review](visual-review.md) |
| No new `*.test.ts` | PASS, source-scope assertion in [base-check.txt](base-check.txt) |
| `pnpm check` alone, 208/208 | PASS, exit **0**, **208/208**; [standalone log](pnpm-check.txt) |
| Source standards / generated tokens | Source reviews **146/160**, **153/160**, declarations **152/160**; [review](source-review.md); generated token verification retained in `tokens-check.txt` |

M9b adornments are **absent from this M9c branch base**, as the inherited M9c report already records. Existing adornment/marker behavior is preserved; no claim is made that a missing milestone's implementation was tested. M9a/M9c runner files and assertion bodies remain byte-identical to the branch base. Old evidence directories were backed up and restored while their unchanged runners executed.

## Shipped containment rule

For zoom `z`, only the label transform receives `S = max(1, 1/z)`. Thus font glyphs and spacing hold their screen size from zoom 1 downward; above 1, normal magnification resumes. No card, node, section, port, road or wire is scaled independently of the camera. Zoom writes two paint custom properties; it never invokes a builder, measurement projection, routing or certification.

A ResizeObserver measures **untransformed browser text and frame boxes** at mount, font changes and preset changes. This is not a diagram-layout request. Its fit limit is:

`F = min((frame.clientWidth - 1)/(text.offsetWidth + 1), (frame.clientHeight - 1)/(text.offsetHeight + 1))`

The extra pixel conservatively covers CSSOM rounding. Opacity is:

`min(clamp((F - S)/0.15, 0, 1), clamp((z - 0.15)/0.05, 0, 1))`

A label fades before exhausting either dimension and is fully transparent when `S >= F`. The declared minimum is **zoom 0.15**: all labels are transparent at or below it, with a fade band from 0.20 to 0.15. A label can disappear earlier because of its own containment. Until measured, fit defaults to zero (transparent). Absolute **overflow: clip** frames are the unconditional guard during font/preset changes; they cannot enlarge their parent. Node frames are inset 4px inside the card's content area. Section frames use the preset inset and a maximum 112px header region, additionally capped inside the section's height. No text substitution or layout retry occurs.

The probe reads each transformed text rectangle at every step and rejects any nonzero-opacity label extending outside its frame. It also asserts full scene and geometry identity, including at the 0.1/2 camera endpoints. Font fitting does not feed back into the scene.

## Density tokens and export behavior

| Local chrome token | Compact | Comfortable (default) | Expanded |
|---|---:|---:|---:|
| Section frame paint weight | 0.5px | 1px | 2px |
| Section label header inset | 20px | 24px | 28px |
| Toolbar vertical padding | 12px | 20px | 28px |
| Toolbar control vertical padding | 6px | 8px | 10px |
| Label font size before compensation | 18px | 19.6px | 21px |

Presets select component-local aliases to published `chromeDensity.*` tokens. Shared layout spacing and preference tokens are never overwritten. Section frame weight is an inset shadow on an absolute pseudo-element, so its box never changes. Toolbar height changes the canvas's browser origin/available viewport, not world geometry or camera transform. Reload resets to comfortable.

**Native SVG export remains the existing default admitted-scene presentation, independently of the active prototype preset and zoom.** Compact/expanded browser chrome is not baked into export; selecting either therefore leaves SVG bytes identical to default. Native export has no RoadPrototype scene/preset input. The determinism harness exports the real admitted `modules-document-publishing` corpus through the existing public export service twice; it does not fabricate a native export of the separate road fixture. Export implementation is byte-unchanged, and the resulting hash also equals M9c's export hash.

## Screenshots and limits

- [Scale, comfortable default](scale-default-roads-off.png).
- [Below the actual default zoom, still legible](scale-below-default-legible.png): **0.417672 → 0.348060**, all twelve section headings plus `api.ts`; [transition evidence](zoom-overview.json).
- [Reading zoom at 0.558](scale-zoomed-out-legible.png).
- [Compact vs expanded side by side](compact-vs-expanded.png), with full views and actual-size detail crops; [compact](scale-compact.png), [expanded](scale-expanded.png).
- [Roads on](scale-roads-on.png) / [off](scale-roads-off.png).
- [Native SVG preview](export-preview.png) / [SVG](export-first.svg).

Containment necessarily limits filename density: comfortable overview shows **5/40** scale node labels, and the below-default view shows **1/40**. Expanded chrome can hide more labels. Partially fading text is deliberately pale. Section headings remain readable until their own fit threshold. Frozen layout/road overlays and the gap to the approved infographic density/hierarchy bar are explicitly recorded in [visual-review.md](visual-review.md). No universal all-labels-legible or full reference-parity claim is made.

The initial browser run caught blocked text hit testing; node text now receives pointer events and the original selection assertions pass. The first full check caught evidence-script lint violations; those scripts were decomposed into bounded helpers without disabling rules. Initial failure logs are retained. No containment or diagram-layout-recalculation STOP condition occurred.

## Reproduction

Run serially from the repository root, using the already-running orchestrator server on 5191:

```sh
pnpm tokens:check
python3 output/playwright/nested-wires/presentation/m9d/run-gates.py
python3 output/playwright/nested-wires/presentation/m9d/browser.py probe.js probes.json
python3 output/playwright/nested-wires/presentation/m9d/verify-base.py
python3 output/playwright/nested-wires/presentation/m9d/contrast.py
node --import tsx output/playwright/nested-wires/presentation/m9d/verify-export.mjs
python3 output/playwright/nested-wires/presentation/m9d/browser.py zoom-overview.js zoom-overview.json
python3 output/playwright/nested-wires/presentation/m9d/comparison.py
pnpm check
```

Run `pnpm check` alone. Do not regenerate `baseline.json` from the changed branch: it was captured from unmodified 50b5237 before implementation. `baseline.js` documents that capture; `verify-base.py` additionally compares committed scene artifacts to the pinned base. Evidence helpers fail on assertions; no thresholds or original acceptance assertions were weakened.
