# M9d changed-source review

Reviewed the complete changed files and their direct collaborators against the sixteen anchors in `docs/standards/CODING-STANDARDS.md`. Scores below are source assessments, not inferred from passing tests. No exception or suppression is introduced. The final `pnpm-check.txt` supplies the independent Sonar <=2 and import/type checks.

C = `capability/canvas/adapters/react-flow/RoadPrototype.tsx`; S = adjacent `RoadPrototype.module.css`.

| Principle | C | S |
|---|---|---|
| SRP | 8: prototype viewer still includes legacy lane/junction/atlas inspectors; new behavior is label paint | 10: prototype presentation only |
| OCP | 6: fixed nodeTypes, inspector branches and preset choices require editing | 6: explicit preset and state selectors require editing |
| LSP | 7: no subtype contract suite demonstrated | 7: no subtyping demonstrated |
| ISP | 10: supplied scene/travel/audit/readiness/scheduler roles consumed; LabelPaint takes only its root | 10: narrowly scoped chrome and zoom tokens |
| DIP | 10: external Layout imports enter public contract; DOM and React Flow stay in the adapter | 10: published tokens own numeric paint policy |
| DRY | 9: inherited geometry assembly repetition remains; all node/section labels share fit measurement and scale | 10: one shared containment/fade rule; preset values have a single token source |
| KISS | 9: existing inspector/fallback complexity; new fit is the minimum of two ratios | 10: absolute frames, transform, clip and numeric opacity |
| YAGNI | 10: exactly requested presets and zoom compensation; no saved preference or new export mode | 10: no unrequested themes or structural changes |
| Typed outcomes | 10: admitted typed scene/travel outcomes unchanged; DOM lookups narrow null; no new domain failures or raw throws | 10: declarative styles; token schema/compiler verifies publication |
| Idempotency/recovery | 10: reload rebuilds view; LabelPaint documents unmount cleanup and safe remount; default fit fails transparent | 10: idempotent cascade; missing fit paints nothing |
| Information hiding | 10: scene/callback boundary hides observer, paint scaling and camera lifecycle | 10: component-local frames and aliases; no caller layout obligations |
| Demeter | 10: direct records/DOM methods; no infrastructure behavior navigation | 10: direct token consumption |
| Immutability | 9: inherited local Maps/ref mutation and explicitly local DOM paint writes; no scene mutation | 10: static rules |
| Type safety | 10: typed root/query; no new cast/any | 10: generated variable names verified; no script casts |
| Cognitive complexity | 10: new helpers have at most one guard; effect callbacks have no branching | 10: no executable functions |
| Testability | 8: injected scene/callbacks, but real ResizeObserver/React Flow needs the headless browser probe | 10: browser geometry, computed styles and containment directly observed |
| **Total** | **146/160** | **153/160** |

C evidence: Block frames at lines 131–141; local density/root state at 583–584; toolbar choice at 724–730; LabelPaint at 1331–1344 changes only two custom properties on zoom; measureLabelFit at 1348–1355 reads untransformed sizes with a conservative rounding margin; observeLabel at 1358–1362 covers font and frame resizing. Cleanup disconnects the observer. Existing `baseNodes` and scene builders are unmodified. The original spotlight/selection assertions exercise strong-element targeting and pass unchanged after restoring pointer events on node text.

S evidence: preset aliases 547–567; toolbar-only padding 568–580; frame weight is an inset shadow on an absolute pseudo-element 581–591; absolute clipped label frames 593–608; shared fade/transform 609–622; centered node text 623–629. No `.node`/road/wire/section bounds, card scale, port offsets or shared layout tokens change. Partial opacity is possible only while the compensated text fits; hard clipping guards the measurement lifecycle.

## Declarative and generated files

Each following file was reviewed as a declaration/publication unit:

- `capability/design-system/tokens/definitions.tokens.json`: three explicit chrome preset groups and one zoom containment policy; no existing token changes.
- `capability/design-system/contract/generated/token-names.ts`: generated token name additions only.
- `capability/design-system/adapters/styles/tokens.generated.css`: generated literal definitions.
- `capability/design-system/adapters/styles/themes.generated.css`: generated resolved theme publication; existing theme values retained.
- `capability/design-system/adapters/styles/preferences.generated.css`: generated preference publication; existing shared spacing/control values retained.

Each scores **10/10/7/10/10/10/10/10/10/10/5/10/10/10/10/10 = 152/160** in table order. Evidence: single declaration responsibility; extensible data; no subtyping (7); no broad callable port; values are contract-owned; compiler owns copies; direct literals; requested scope only; schema/compiler owns typed rejection; atomic/repeatable compiler publication owns recovery; deliberately thin declarations (5); direct dependencies; immutable source/const output; validated dimensions/numbers; no functions; repeatable local compilation. Generated files were produced with `tokens:build`, never hand edited.

Worst retained findings: viewer combines several inspector modes (SRP 8), renderer/CSS have fixed presentation axes (OCP 6), declarations are intentionally shallow (information hiding 5). None is disguised as fixed by M9d. Browser evidence scripts are acceptance tooling under `output/`, not runtime source or new test-suite cases.
