# Polish plan — close the gap to reference infographics

Date: 2026-09-13. Branch: `feat/figure-polish` (continues; PR #33 open).

## Targets (chosen references)

1. `quality/agent-diagrams/references/target/bytebytego-system-design-cheat-sheet.png`
   Source: <https://assets.bytebytego.com/diagrams/0351-system-design-cheat-sheet.png> (review material only).
   Qualities to transfer: display-weight headline; saturated pastel region fills with distinct hue per region; bold colored section titles; bold keyword emphasis inside descriptions; bordered principles/list boxes; chunky figures with dark outlines.
2. `quality/agent-diagrams/references/target/bytebytego-design-patterns-cheat-sheet.png`
   Source: <https://assets.bytebytego.com/diagrams/0167-design-patterns-cheat-sheet-part-2.png> (review material only).
   Qualities to transfer: disciplined grid; consistent diagram family across sections; differentiated wire styles with belonging labels; generous but even whitespace; one-sentence descriptions under bold titles.

Current renders under review: `quality/agent-diagrams/visual-quality/figures/story-context-engineering.png` and `story-water-treatment-figures.png` (exports of the showcase collections, presentation-4).

## Root causes found in code (not taste)

- **C1. All role fills are the same token.** `capability/design-system/tokens/semantics.tokens.json` maps `role/decision|success|warning/fill` → `{surface.raised}`, `role/supporting/fill` → `{surface.base}`. Hue exists only in role strokes. Result: every panel, group and card is the same faint mint regardless of role. Region color identity is impossible at any authoring effort.
- **C2. No bold font is admitted.** Studio theme pins `inter-latin-400-normal` only. `TextRun` carries one font per line; heading/body differ only in size and color. Display-weight headlines and bold keywords are impossible at any authoring effort.
- **C3. Figure palette derives from neutral tokens.** `capability/presentation/core/content/figures.ts` `palette()` sets `tint` = neutral role fill (mint), `soft` = border; accent hues appear only as thin strokes. Result: figures read pale-wash-on-pale-chip at overview scale.
- **C4. warning and decision share one hue.** Both roles stroke with `status.warning`; `status.error` is defined but unused by any role.
- **C5. Composition density is authoring-level.** The context-engineering showcase leaves the right-middle and bottom-right empty; sections do not tile. Fix is DSL re-authoring after C1–C4 land, not app code.

## Changes (mechanisms, in order) — revised after zero-context audit

Audit verdict: sound-with-changes. C1–C5 verified against code. Corrections folded in below.

- **M1+M2. One design-system definition release: per-role tinted fills + warning/decision hue split** (fixes C1, C4; batched to avoid two invalidation cycles).
  Audit correction: `set color role.*.fill` in studio.theme is mechanically impossible — `readOverride` rejects derived-token overrides (`core/tokens/read.ts:63-65`) and `resolveDiagram` re-derives from literal roots only (`core/themes/diagram.ts`). So:
  1. `definitions.tokens.json`: add literal root tokens `rolefill.decision` (amber pastel), `rolefill.success` (green pastel), `rolefill.warning` (rose pastel), `rolefill.supporting` (cool neutral pastel), `rolefill.neutral` (= surface.raised value).
  2. `semantics.tokens.json`: re-point `role/<name>/fill` → `{rolefill.<name>}`; `role/warning/stroke` → `{status.error}` (decision keeps amber; error hue currently unused by roles).
  3. Bump `tokens/source.json` definitionVersion; bump `baseVersion` in shipped `paper.theme.json` and `ink.theme.json`; **ink theme must override the new `rolefill.*` roots for dark scope** (light pastels fail ink's contrast gate — `validateContrast` enforces role text-on-fill ≥4.5 in every scope).
  4. Regenerate compiled token artifacts (`artifacts.test.ts` snapshot verify), re-admit studio preset at new version (canonical re-derivation invalidates the existing one).
  5. Contrast guardrail already exists mechanically (`contrast.ts` role text-on-fill ≥4.5 at admission) — harvest `resolved.contrast` for the evidence table instead of hand-computing.
- **M3. Strong font for headings** (fixes C2) — probe first, then full touch list.
  1. **Go/no-go probe**: font identity is family-keyed and ambiguous families are rejected (`core/themes/fonts.ts:46-58` uniqueFamilyPin; same check in export's `adapters/native/fonts.ts`). Probe the candidate 700-weight file's nameID 1 with the repo's own fontkit before any code change. If it reports `Inter` (collision with the admitted 400), choose a strong face whose nameID 1 is a distinct family (e.g. Inter Tight / Inter Display) — avoids the pin-model contract change (subfamily/digest-keyed pins across `fontPin`, assets descriptor, theme-preparation), which is out of scope.
  2. Full touch list (audit found the plan understated it): new literal root `font.strong` in `definitions.tokens.json`; `core/themes/fonts.ts:22-23` scope check gains `font.strong`; `core/themes/admit-data.ts:29,36-39` (keys selectedFonts body/mono/strong); CLI grammar `apps/cli/adapters/theme-config.ts:53,76` (regex + resources count 2→3); `portable.ts:66-79` manifest reference (root token satisfies it); contracts: `StyleProjection.strongFont` (design-system `theme.ts`), `ResolvedStyle.strongFont` + `matchingFonts` extension (presentation `style.ts` — strong face permitted for heading roles only); `core/themes/diagram.ts:150-159` typography() maps `sectionHeading`/`nodeHeading` to `font.strong`.
  3. Existing assertion `themes.test.ts:96` (`sectionHeading.font == bodyFont`) must flip to strong — criterion 1 reworded below to permit modifying named existing assertions (still no new test files).
  4. Renderers need no changes (verified: per-run font digests flow through measurement to React + export).
- **M4. Raise figure chroma from accent hues** (fixes C3). In `figures.ts`, sub-element bands that today use neutral `tint`/`soft` switch to accent-hue fills (accent / accentAlt / success) at tuned opacities — the pastel-band technique already used for layered-bed strata. Stage chip stays subtle; the art on it gains saturation. Applies to all seven forms; re-themes automatically. Audit note: evidence table must state the **composited** hex per band (SVG opacity over chip hex; re-implement `contrast.ts` composite math in the evidence script), because `accentAlt` (dark ochre `#805200`) at low opacity over mint muddies.
- **M5. Inline emphasis spans — DEFERRED with mechanized trigger** (audit ruling). Blast radius confirmed large (per-span runs need intra-line x-advances in `text.ts:74-84`, model content record, language grammar + round-trip, two version bumps + second scene invalidation). Trigger, made checkable: after M1–M4+M6, crop-inspect every section description against reference 1 and count descriptions where an un-emphasized keyword still flattens the reading (ref 1 emphasizes ≥1 keyword per description). If a majority of section descriptions fail that comparison, M5 starts as its own slice with pre-registered version bumps; otherwise cut.
- **M6. Re-author the two showcase DSLs for density** (fixes C5). Tighter grids, balanced columns, add a principles/list section using existing fields/table content kinds, remove empty quadrants. Content work only; no app code. This is also the reuse proof: same mechanisms, two different subjects.
- **Presentation version bump** to `presentation-5` at exactly two sites: `capability/presentation/adapters/static-markup.ts:22` and `capability/presentation/adapters/fontkit.ts:86`. Workspace scenes invalidate honestly.

## Explicitly out of scope

- App chrome (side panels, header, toolbar, minimap) — deferred by Chris.
- Headline pill decoration behind a title word (reference 1's pink pill). Cut unless the loop shows the headline still reads flat after M3; likely YAGNI.
- New figure forms. The seven existing forms cover the showcases.
- Exact replica of either reference; they are quality targets, not subjects.

## Evaluation criteria (mechanistic done / needs-work)

Loop per change: implement → `pnpm check` → re-render affected showcases via `.local/export-ctx.mjs` → `ReadMediaFile` at overview **and** ≥2 region crops at full fidelity → score the checklist → fix the top failing item → repeat. No submission while any checklist item fails.

1. **Gates**: `pnpm check` green (typecheck, eslint sonar ≤2, prettier, depcruise, full test suite). No new test files; named existing assertions may be modified when a mechanism intentionally changes the contracted behavior (e.g. `themes.test.ts` heading-font assertion for M3).
2. **Hierarchy (measurable in SVG)**: collection title font size ≥2× body; section heading ≥1.3× body; heading runs use the strong face (font digest differs from body runs in exported SVG).
3. **Region identity (crop test)**: sibling regions with different roles are distinguishable by fill hue alone at overview scale; ≥3 distinct region hues on the context-engineering canvas.
4. **Contrast (numeric)**: every role's text-on-fill ≥4.5:1 (harvested from `resolved.contrast` at admission, not hand-computed); **role stroke on role fill ≥3:1** (computed from token hex — this pair class is ungated by the resolver); figure accent bands on stage chip ≥3:1 against the chip, computed on **composited** hex values. Recorded in the evidence README.
5. **Figure prominence (crop test)**: figure fill bands clearly visible at 25% zoom of the export; figure reads as the node's visual anchor, with the chip recessive.
6. **Routing**: wire labels sit on pills belonging to their wires; zero label collisions or clipped markers at 100% crop.
7. **Density (overview test)**: no empty quadrant on either showcase canvas; sections tile with even gutters.
8. **Legibility**: no clipped or overlapping text at 100% crop anywhere.
9. **Regression**: re-export three existing corpus diagrams (ER museum-loans, modules document-publishing, sequence payment-settlement); confirm no clipped/overlapping text and no visual degradation; layout deltas are acceptable **only** where traceable to M3 heading font-metric changes (Inter strong shapes wider than 400 at the same point size).
10. **Evidence**: before/after PNGs committed under `quality/agent-diagrams/visual-quality/figures/`; contrast table appended to that folder's README.

Done = items 1–10 hold for both showcase collections. Any failed item → another loop iteration, not a reported nit.
