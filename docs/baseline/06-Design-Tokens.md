# 06 · Design tokens, themes and style ownership

**Target baseline 1.2 · Proposed · 11 September 2026.** [UI/UX](05-UI-UX.md) · [target source tree](03-Repository.md) · [capability ownership](02-Capabilities.md).

## The contract

**Declare the design decisions once; derive component styling from them.** Sixteen high-impact controls govern recurring color, type, spacing, shape and motion. Themes and personal preferences override a small subset. Components consume semantic CSS variables; they never introduce private copies of the palette or spacing scale.

The target is **more than 80% of recurring visual style declarations traceable to those sixteen controls**, plus at least 95% token use across eligible style declarations overall. This is a measurable engineering proxy for the user's “>80% of the experience” objective, not a claim that a CSS variable can determine 80% of usability. Camera, editing, conflict handling and keyboard behavior are explicitly specified in TypeScript in document 5. Both the visual metric and those behavior contracts must pass.

A `design-system` **supporting capability** owns reusable UI primitives, token schemas/resolution and style compilation. It does not become a twelfth domain capability. Templates still owns pinned collection-theme presets; Presentation still owns diagram notation; Canvas still owns interaction. The supporting capability has no imports from domain capabilities or hosts.

## One source, several consumers

```text
Authored definitions + aliases + approved theme/preference deltas
                             │ validate / resolve
                             ▼
                  immutable ResolvedTokenSet
                   ├── CSS custom properties → React DOM / React Flow
                   ├── numeric/font/color data → measurement / SVG / PNG / PDF
                   └── declarations + manifest → TypeScript checks / style lint
```

Authoritative source is `capability/design-system/tokens/definitions.tokens.json`: typed token definitions and base values. `semantics.tokens.json` contains aliases/recipes, not copies of those literals. Versioned theme files contain overrides only. Generated CSS and TS are outputs and are never manually edited. The same resolver serves browser application and headless export; the server does not scrape browser computed styles to discover the design.

Use the stable **Design Tokens Format Module 2025.10** for typed values, groups and aliases. App-specific dimensions/derivation recipes live in a declared `novakai` extension with its own schema; do not claim they are standard DTCG expression evaluation. Tokens are data, with no arbitrary scripts, URLs or `eval`. [Design Tokens Community Group specification](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/).

“One declaration” means one authored authority per decision. Generated theme selectors necessarily assign CSS variables for different scopes/modes; that is compilation of the same system, not a second source to maintain. Theme override files are intentional deltas, not cloned copies of the entire design system.

## The sixteen primary controls

CSS names are the public stable interface. Default values below describe the **paper UI scope**. A diagram scope resolves the same vocabulary from its pinned theme and has its own text-size/density defaults. Raw values in this specification are reference values; production components reference the generated names.

| # | Token / generated CSS variable | Default | Main effects |
|---|---|---|---|
| 1 | `surface.base` / `--nv-surface-base` | `#f4f6f8` | App background, canvas backdrop, recessed areas |
| 2 | `surface.raised` / `--nv-surface-raised` | `#ffffff` | Panels, dialogs, cards, fields |
| 3 | `text.primary` / `--nv-text-primary` | `#17212b` | Labels, body, headings, control text |
| 4 | `text.secondary` / `--nv-text-secondary` | `#526170` | Supporting text, metadata, secondary labels |
| 5 | `border.default` / `--nv-border-default` | `#bbc5d0` | Decorative separators, default panel/card outlines |
| 6 | `action.accent` / `--nv-action-accent` | `#355ccd` | Primary action, focus, active item marker |
| 7 | `action.onAccent` / `--nv-action-on-accent` | `#ffffff` | Text/icons on accent fill |
| 8 | `font.body` / `--nv-font-body` | system UI sans stack | Interface, prose, headings |
| 9 | `font.mono` / `--nv-font-mono` | system monospace stack | DSL, field types, IDs, signatures |
| 10 | `type.base` / `--nv-type-base` | `14px` UI; `16px` diagram default | Body/control text; derived title and caption scale |
| 11 | `space.unit` / `--nv-space-unit` | `4px` | Padding, gaps, row spacing, block rhythm |
| 12 | `control.unit` / `--nv-control-unit` | `36px` | Minimum control/row height; coarse-pointer minimum is separate accessibility floor |
| 13 | `shape.radius` / `--nv-shape-radius` | `6px` | Controls, cards, panels, dialogs |
| 14 | `stroke.base` / `--nv-stroke-base` | `1px` | Borders and derived diagram line weight |
| 15 | `motion.duration` / `--nv-motion-duration` | `120ms` | Optional menu/inspector fades and feedback transitions |
| 16 | `shadow.strength` / `--nv-shadow-strength` | `0.12` | Overlay/popup elevation opacity |

UI typography uses operating-system fonts for reliable offline operation; collections/export resolve and pin a bundled redistributable font through Assets. A system-font alias is resolved to that pinned diagram font when a collection theme is admitted. Export must not silently substitute a platform font. Exact bundled font files/license metadata are selected before implementation and become part of the template/theme digest and measurement inputs.

### Supporting tokens with a different job

Do not force everything through a single accent color. A small **supporting set** captures semantic or structural decisions that cannot safely be inferred from the sixteen: positive/warning/error colors and icons; required input boundaries; diagram role accents; minimum target size; focus thickness/offset; z-order; shell dimensions; breakpoints; size/density bounds; typography ratios and line-height. These also have one source. They count in overall token coverage, but only count toward the >80% primary-control metric if their derivation actually depends on a primary control.

| Supporting family | Frozen values / semantics |
|---|---|
| Status foreground on paper | success `#17663f`; warning `#805200`; error `#b42318`; pair with text/icon, never color alone |
| Status foreground on ink | success `#7bd4a4`; warning `#f0c66d`; error `#ff9c94`; pair with text/icon |
| Essential boundary | paper `#526170`; ink `#9aabba`; used where the boundary is necessary to identify a control; decorative pale borders are not sufficient |
| Type | body line-height 1.5; caption `max(12px, base × 0.857143)`; title `base × 1.428571`; large title `base × 1.714286` |
| Spacing | steps 1, 2, 3, 4, 6, 8 units; no ad hoc “almost the same” gaps |
| Sizes | small/medium/large node widths 180/240/320 world units at diagram base 16px; scale by diagram type-base / 16; content height measured, never clipped to preset height |
| Interaction floor | fine controls 36px; coarse 44px; focus outline 2px/offset 2px; control height is max(unit, line box + 2 spacing units, pointer floor) |
| Layout | header 56px minimum, status 28px minimum; panel widths/bounds and 800/1200px breakpoints exactly as U01–U03 |
| Motion | reduced-motion resolves duration to 0 and disables animated camera transitions; camera changes otherwise interpolate at most 160ms only for explicit navigation |
| Layer order | scene 0; canvas tools 10; docked chrome 20; popover 30; modal backdrop 40; modal 50; toast 60; tooltip 70, clipped/disabled behind active modal |

Token formula dimensions use CSS px within each scope. Presentation converts resolved diagram lengths/measurements to scene world units at the explicit 1 CSS px = 1 world unit pre-camera mapping; camera zoom is applied afterwards. Layout world coordinates never enter token arithmetic. Pixel/world-unit distinction is deliberate: shell values use CSS pixels; diagram values use scene world units and are scaled by camera zoom. Icons/handles drawn in screen space use screen-space hit targets. Tokenizing a number does not change its unit.

## Semantic aliases and CSS ownership

Components style purposes, not palette indices. Examples:

| Semantic variable | Derivation / use |
|---|---|
| `--nv-color-panel` | surface.raised |
| `--nv-color-content` | text.primary |
| `--nv-color-subtle` | text.secondary |
| `--nv-color-action` / `--nv-color-on-action` | action.accent / action.onAccent |
| `--nv-color-input-boundary` | supporting essential-boundary token, contrast validated |
| `--nv-color-focus` | action.accent, independently contrast checked against adjacent backgrounds |
| `--nv-space-2` / `--nv-space-3` | 2× / 3× space.unit |
| `--nv-radius-control` / `--nv-radius-panel` | radius / 2× radius |
| `--nv-control-height` | max(control.unit, type.base × 1.5 + 2× space.unit, active target floor) |
| `--nv-font-caption` | max(12px, type.base × 0.857143) |
| `--nv-diagram-row-min` | diagram type.base × 1.5 + 2× diagram space.unit |
| `--nv-diagram-edge-stroke` | 2× diagram stroke.base |

CSS custom properties inherit through the element tree and participate in the cascade. Derived aliases must be installed **on each token-scope root**, because an inherited alias computed at an ancestor does not automatically re-evaluate after overriding only its underlying variable on a descendant. Portal roots also get an explicit scope. This is a required correctness property, not a CSS implementation detail left to chance. [MDN custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties).

```css
/* Illustrative consumer: Button.module.css. No authored color/spacing literal. */
@layer components {
  .button {
    min-block-size: var(--nv-control-height);
    padding-inline: var(--nv-space-3);
    border: var(--nv-stroke-base) solid var(--nv-color-input-boundary);
    border-radius: var(--nv-radius-control);
    color: var(--nv-color-content);
    background: var(--nv-color-panel);
    font-family: var(--nv-font-body);
    font-size: var(--nv-type-base);
    line-height: var(--nv-line-height-body);
  }
  .button[data-variant="primary"] {
    color: var(--nv-color-on-action);
    background: var(--nv-color-action);
  }
  .button:focus-visible {
    outline: var(--nv-focus-width) solid var(--nv-color-focus);
    outline-offset: var(--nv-focus-offset);
  }
}
```

The production Button defines these state recipes centrally in `semantics.tokens.json`; states do not introduce a new palette:

| State | Visual/behavior recipe |
|---|---|
| Default | Raised surface, primary text, essential input boundary. Primary variant uses accent/on-accent. |
| Hover | Default variant uses base surface; primary keeps its validated fill and adds an on-accent inset 1× stroke outline. Text labels underline; icon-only default controls use an inset essential-boundary outline, while icon-only primary controls use the on-accent outline. Never use on-accent white on the default pale surface. |
| Pressed | Uses hover colors, inset 2× stroke outline and pressed semantic state; no layout-shifting border change. |
| Selected | Accent border/indicator plus explicit selected label/state; primary content remains readable. |
| Focus-visible | Separate accent focus ring with supporting offset, independent of hover/selected. |
| Disabled | Base surface, secondary text, native disabled attribute and disabled pointer affordance; no whole-control opacity reduction. |
| Pending | Retain label, add progress text/icon, disable repeated submission; cancellation remains a separate available control if the operation supports it. |

For custom themes, validate each rendered/composited required pair against its actual state background, including inset outline and focus surroundings. Required state values are validated token recipes, not arbitrary `opacity: .5` applied to essential text. Low-level CSS layout keywords (`display: grid`, `position: relative`, `0`, `100%`, intrinsic sizing) are allowed structural declarations; shared visual decisions are tokenized.

### Cascade and file boundaries

`design-system/adapters/styles/entry.css` establishes the global order:

```css
@layer reset, vendor, tokens, themes, preferences, components, utilities;
```

- `reset.css` sets box sizing and minimal native normalization; no opinionated global `button`, `h2` or `div` theme rules.
- `tokens.generated.css` and `semantics.generated.css` come from the token compiler. Scope roots receive complete validated base values and semantic aliases.
- `themes.generated.css` contains shipped theme deltas, emitted from their canonical theme files. `preferences.generated.css` contains allowed predefined density/text/motion modes; validated custom values are installed by the runtime token adapter on the scope root.
- `layout.generated.css` contains centrally defined structural variables and numeric media conditions. `breakpoints.ts` exports those same authored breakpoints to TypeScript.
- Each `.module.css` is inside `@layer components`; utilities define only focus/visually-hidden/forced-color helpers. Module-scoped classes prevent accidental cross-feature selectors.
- React Flow vendor CSS is imported into `vendor` by its own style-entry adapter; the root layer order must be loaded first. Override vendor variables/properties only in `react-flow-theme.module.css`, never through scattered `.react-flow ...` rules.

Normal unlayered declarations outrank normal layered declarations. Therefore first-party unlayered component rules, `!important` patches and unlayered vendor imports fail the style gate. Inline style is permitted only for measured scene geometry and the validated token-installer boundary, not arbitrary component colors/padding. [MDN cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers).

All cross-package styling loads through the package's public `contract/index.ts` composition/binding, which includes its own style-entry adapter. No private CSS deep imports or CSS export wildcard is introduced. Local CSS asset imports within an adapter and local CSS `@import` are build-resource relationships, not permission for sibling behavioral TS imports. Layers remove dependence on incidental component import order.

## Themes and preferences in a few lines

### Theme authoring

Theme authors supply a validated delta to an existing theme, using the token editor or a theme input file. This is **not diagram DSL** and does not require an agent to repeat styles in every node. Its schema supports only known token IDs and typed values. A theme is admitted as a resolved immutable preset; the fully resolved digest and base version are recorded, so a later base change cannot alter existing diagrams.

```text
Theme name: Ink blue
Base: ink@1.0.0
surface.base: #111821
surface.raised: #1a2430
text.primary: #edf2f7
text.secondary: #adbac9
action.accent: #9cb7ff
action.onAccent: #14223a
```

This is the user-facing editor's field/value representation, not a new unversioned language. It serializes to the validated preset schema; source token JSON uses the DTCG types. Color values are checked together, including focus/status/input boundaries; inheriting from ink also inherits appropriate borders/status values. A failed check keeps the previous theme active and shows the exact failed pair.

### Personal preferences

```text
Interface theme: Ink blue
Text size: 16
Density: Comfortable
Motion: Reduced
```

The host persists `UiPreferencesV1` with `schemaVersion=1`, theme selection, text size, density and motion through its preferences adapter. Theme selection is a discriminated union: `{ mode: system }` or `{ mode: pinned, theme: ThemePin }`. System resolves to the exact shipped `paper@1.0.0` pin for light and `ink@1.0.0` pin for dark, with those pins/digests listed in the versioned shipped manifest. The installed token-package version determines that manifest; an upgrade is explicit and preserves a rollback pin. A pinned custom theme ignores OS color-scheme changes. Text size is an integer 12–20px; density is `compact/comfortable/spacious`; motion is `system/reduced/full`.

| Density | `space.unit` delta | `control.unit` delta | Effect |
|---|---|---|---|
| Compact | 3px | 32px | Tighter padding; fine-pointer floor still raises actual control height to at least 36px. |
| Comfortable (default) | 4px | 36px | Matches the default reference UI. |
| Spacious | 6px | 44px | More padding; text growth can raise controls further. |

These values live once in `tokens/preferences.tokens.json` and are validated/digested with the token system, not duplicated in the settings component. All pointer/text accessibility floors apply after density. The shipped ink delta changes base/raised surfaces to `#17191d`/`#22262c`, primary/secondary text to `#f1f3f5`/`#b8c1ca`, decorative border to `#495360`, accent/on-accent to `#9cb7ff`/`#14223a`, and shadow strength to 0.32. Remaining primary values inherit paper; dark status/essential-boundary values come from the supporting set. This delta lives in `tokens/themes/ink.theme.json`; the table/prose here is its reference specification, not another production authority.

 Choosing System follows `prefers-color-scheme`; choosing Reduced always reduces motion, while System follows `prefers-reduced-motion`. Full does not override an OS request for reduced motion. Unknown input keys/versions are rejected by the editor. When loading an unsupported or corrupt stored preference record, keep that record unchanged for recovery, apply safe shipped defaults for this session and show a warning; preferences never mutate a collection.

The UI editor translates these four lines into a small token delta: font size, density-dependent spacing/control height, theme pin and duration. It does not generate a private stylesheet per component. UI preference changes are immediate and reversible. No diagram redraw/relayout is caused by changing the shell's text size or density.

Panel arrangement is recorded separately in `PanelPreferencesV1` (document 5). Shared SidePanel/Header/Body/Section components consume the same semantic tokens as other controls. The ThemeEditor is a consumer of this resolver, never a separate color system; rearranging a section cannot change its style authority.

## Scope, precedence and rendering parity

| Scope | Authority and precedence | Consequence |
|---|---|---|
| UI chrome | base token definitions → selected UI theme → personal visual preferences → accessibility floors/forced colors | Local preference; not stored in diagram history or export |
| Diagram | base definitions at pinned version → pinned collection theme → semantic appearance role/size → explicit permitted diagram overrides | Canonical style change goes through Authoring; measurement/layout inputs include resolved digest |
| Popovers/dialog portals | Explicitly inherit the UI scope, never ambient document/body defaults | Switching theme updates portal controls and focus states too |
| Export/preview | Resolve the snapshot's diagram pins using the same resolver; disable motion; use pinned fonts/assets | Same metrics/colors/line styles as that snapshot, independent of the operator's UI preference |

Each UI/diagram scope installs a **complete resolved set**, including semantic aliases. A diagram root cannot accidentally inherit the user's UI font or density. Node-role overrides are mapped by Presentation from validated role tokens and resolved before measuring; no raw CSS enters the model. A scope uses one immutable token digest; render/measurement jobs with old digests are discarded.

Changing a collection theme opens preview with affected metrics/layout warnings. Authoring checks hard constraints before committing its pin. UI themes may switch without a collection transaction; this distinction is visible in Settings. Forced-colors and reduced-motion are viewing accommodations; exports preserve canonical color unless the user explicitly selects a monochrome/print export profile. The accessible outline remains readable when graph color is unavailable.

**First paint:** the host loads validated local UI preferences before mounting visible chrome; missing/invalid preferences fall back to paper. Token installation and portal scope creation occur before content becomes visible. SSR is not required for this local app. Font loading in a diagram is an explicit measurement dependency; no silent late swap may leave stale bounds/routes.

### Resolution and numeric fidelity

The resolver accepts versioned definitions, a pinned theme and a typed preference delta. It rejects unknown IDs, alias cycles, mismatched types, out-of-range dimensions, unsupported font pins and inaccessible required contrast pairs. It returns `Result<ResolvedTokenSet, TokenError>` with a deterministic digest and CSS/numeric views derived from the same resolved values.

The derivation vocabulary is intentionally bounded: token reference, multiply by a declared scalar, sum of 2–8 values in the same unit, max of 2–8 values in the same unit, and alpha for a declared color. Recipe arity and input/output types are validated; mixed-unit sums/max operations are errors. Thus the row/control formula is one typed sum of a line-box dimension and a spacing dimension, evaluated once for both output views. Theme authors cannot add executable recipes. Root numeric bounds are: UI type.base 12–20px; diagram type.base 10–32 CSS px before scene mapping; space.unit 2–8 CSS px; control.unit 24–64 CSS px; radius 0–16 CSS px; stroke 0.5–3 CSS px; duration 0–240ms; shadow strength 0–0.4. Accessibility floors take precedence over requested control sizes. Fonts must be approved aliases or admitted pins, colors typed color values, and no string is evaluated as raw CSS. Expressions live once in `semantics.tokens.json` and are evaluated by the resolver; CSS output serializes the result rather than reimplementing formulas independently. Aliases may still use `var()` for inspectability, but their generated values and TS numeric equivalents must agree at every tested scope. Unit conversion is explicit: px, world-unit, scalar, millisecond and font reference are distinct validated types.

## TypeScript and CSS source inventory

The tree in document 3 is authoritative for placement. These files determine the token behavior, not just its documentation.

| Target file, relative to `capability/design-system/` | Responsibility |
|---|---|
| `contract/token-types.ts`, `contract/token-schemas.ts` | Token IDs/value types, resolved set, theme delta and typed failures |
| `contract/react-types.ts` | Adapter-only primitive props/slots; core cannot import React types |
| `core/tokens/resolve.ts` | Ordered resolution, aliases/recipe evaluation and complete immutable scope |
| `core/tokens/validate.ts` | Type/range/cycle validation and dependency diagnostics |
| `core/tokens/contrast.ts` | Required contrast-pair validation, not guessed visual safety |
| `core/tokens/emit.ts` | CSS/declaration/numeric output from the same resolved values |
| `tokens/preferences.tokens.json` | Canonical density deltas, default choices, bounds and system-theme manifest references |
| `contract/ports/token-source.ts`, `contract/ports/token-artifacts.ts` | Narrow readonly definition-reader and generated-artifact writer contracts |
| `adapters/build/token-files.ts` | Filesystem implementation of both ports; stages the complete generated set and atomically replaces the output manifest after successful validation |
| `tokens/definitions.tokens.json`, `tokens/semantics.tokens.json` | Single authored definitions and derived aliases/recipes |
| `tokens/themes/paper.theme.json`, `tokens/themes/ink.theme.json` | Shipped deltas; base versions pinned |
| `adapters/browser/install-tokens.ts` | Apply validated scope variables, portal scope updates and first-paint lifecycle |
| `adapters/styles/entry.css`, `reset.css`, `utilities.css` | Layer entry, native reset and narrowly scoped utilities |
| `adapters/styles/{tokens,semantics,themes,preferences,layout}.generated.css` | Compiler output, no manual edits |
| `contract/generated/token-names.ts`, `breakpoints.ts` | Publicly re-exported generated declarations/data; no alternative authored values |
| `adapters/react/*.tsx` and colocated `.module.css` | Reusable primitive rendering and state styling |

Host files `apps/web/contract/preferences.ts`, `core/preferences/preference-state.ts` and `adapters/browser/preferences.ts` own user selection, migration/default handling and storage. Templates owns collection-theme admission/pins; Presentation asks the injected resolver for diagram style data. Diagram renderers consume resolved numeric tokens as well as CSS, so PNG/PDF/ER row alignment does not depend on browser stylesheet introspection.

## Quantified gates and review

| ID | Release evidence |
|---|---|
| T01 | Definitions/overrides have one authored location; generated output regenerates reproducibly with no drift. Token alias/type/cycle failures produce typed diagnostics. |
| T02 | More than 80% primary-control reachability and ≥95% overall token use, using the denominator below. No per-component theme copies or hard-coded recurring visual values. |
| T03 | Changing only the four preference fields updates workspace, library, dialogs and portals consistently; four-line delta survives reload. |
| T04 | UI scope change leaves a pinned diagram's resolved token digest and export metrics unchanged. Collection-theme change gets a new digest and reruns feasibility/layout. |
| T05 | Every required text/action/focus/control/status pair passes contrast in paper and ink, including disabled/error/selected/hover states. Forced colors preserves actionable boundaries and labels. |
| T06 | Browser and headless resolution agree for the same theme/input digest; font/row/edge dimensions agree within 0.5 world unit in acceptance fixtures after measurement. |
| T07 | Browser/system text zoom and coarse-pointer settings respect minimums; reduced motion disables animated camera and overlay transitions. |
| T08 | Theme/preference rejection retains the last valid scope; alias cycles, stale theme versions, missing fonts and invalid CSS injection strings cannot partially apply. |

**Coverage denominator:** in the authored UI and diagram component CSS, count each eligible property declaration once per selector/state: color/fill/stroke/background, font/text metrics, margin/padding/gap, non-instance width/height/min/max dimensions, border/radius/outline, shadow and transition/animation values. Include Canvas's vendor-override stylesheet; exclude third-party vendor source, generated definitions themselves, intrinsic layout keywords and per-instance scene coordinates. For each counted declaration, trace every value through the token dependency graph. It counts toward primary reachability only if all its visual values are tokenized and at least one path reaches the primary sixteen; otherwise it counts only toward overall token use if fully tokenized. Literal structural zeros do not disqualify an otherwise tokenized declaration. Report numerator, denominator and exclusions; no multiplying generated aliases or adding dead CSS to improve the ratio.

Also inspect twelve representative states: library, empty collection, mixed canvas, entity editor, wire editor, asset picker, template picker, search, change review, conflict, settings and export. Theme changes must visibly propagate through every state. This catches a formally tokenized but unused system. The percentage is a proposed release gate; no compliance percentage is claimed for the unbuilt UI.

**Test budget for this documentation change: 0 new automated application tests.** T01–T08 are future acceptance evidence. Inventory and justify actual tests at the implementation slice; do not infer a large new test suite from these rows. The existing per-file >144/160 gate remains in force for first-party source, including CSS; Sonar ≤2 applies to functions in TS/TSX/tooling. CSS review additionally checks token use, cascade, contrast and selector scope. No source file receives an exemption or pre-awarded score here. If the literal rubric cannot certify a file, record the evidence and resolve that requirement conflict before claiming implementation completion.

## Pressure-test record

Completed 11 September 2026. A new reviewer started with no conversation history and examined documents 5–6, the expanded tree/import rules and the relevant original contracts. All seven finding groups were verified and corrected, then rechecked:

- Token recipes now support bounded, same-unit addition and validate arity/units.
- System/pinned theme selection, density names/deltas and preference recovery are explicit.
- The token compiler has concrete source/artifact ports and a filesystem build adapter.
- Canvas remains the sole owner of inspector visibility; host overlay layout cannot create a competing flag.
- Delete distinguishes local appearances from shared objects.
- Narrow overlays/sheets have modal focus, scroll, dismissal and draft rules.
- Pending commits preserve newer draft generations and release their slot on **any definitive outcome**; uncertain outcomes reconcile by receipt.

The recheck also corrected the icon-only hover outline so default controls cannot inherit white on-accent styling on a pale background. No remaining specification freeze blocker was found.

Local artifact checks confirmed the 40-TSX/39-colocated-module inventory, links and SVG structure; the UI illustration was browser-rendered and visually inspected. Numeric checks cover the specified default/example contrast pairs. These are design/artifact checks, not proof of runtime accessibility, completed React components, token-coverage percentages or future per-file scores. Those remain implementation gates.
