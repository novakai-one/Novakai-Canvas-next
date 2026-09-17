# M9c changed-source review

Reviewed the target files and direct collaborators against all sixteen anchors in `docs/standards/CODING-STANDARDS.md`. These are file assessments, not scores awarded for passing tests. `pnpm-check.txt` independently verifies types, imports, formatting and Sonar cognitive complexity <=2. No exception or suppression added.

C = `capability/canvas/adapters/react-flow/RoadPrototype.tsx`; S = adjacent `RoadPrototype.module.css`.

| Principle | C | S |
|---|---|---|
| SRP | 8: one prototype viewer includes legacy lane, junction and atlas inspectors (LaneProof, JunctionProof, AtlasInspector) | 10: prototype presentation styles only |
| OCP | 6: fixed nodeTypes, toolbar/inspector branches; callbacks remain injected | 6: explicit family/state selectors require editing for new families |
| LSP | 7: no subtype contract suite demonstrated | 7: no subtyping demonstrated |
| ISP | 10: supplied scene/travel/audit/readiness/scheduler roles all consumed | 10: selectors consume narrowly named paint tokens |
| DIP | 10: external Layout enters its public contract; React is adapter-owned; no new dependency | 10: tokens are the paint dependency; no domain behavior |
| DRY | 9: road/block/junction geometry assembly repeats; depth is calculated once in baseNodes | 10: new values have a single token source; specificity overrides existing paint |
| KISS | 9: inherited choice fallback chain and several inspector modes; new ancestry helper is a direct parent lookup | 10: direct parity/family selectors, standard pseudo-element and box-shadow |
| YAGNI | 10: only depth and family paint metadata added | 10: exactly the five requested paint concerns |
| Typed outcomes | 10: admitted typed scenes and travel outcomes; pure depth read introduces no failure channel | 10: declarative styles; missing tokens are rejected by compiler verification |
| Idempotency / recovery | 10: reload reconstructs view; scene records are never mutated; hover cancellation retained | 10: repeatable cascade, no persistent effects |
| Information hiding | 10: scene/callback boundary hides renderer, camera and interaction lifecycle | 10: component-local paint, no exported selectors or layout obligations |
| Demeter | 10: direct callbacks and data records only | 10: direct variable consumption |
| Immutability | 9: existing local Map/accumulator/cancel ref; sectionPaintDepth does not mutate ancestry | 10: static rules, no runtime mutation |
| Type safety | 10: typed paintDepth and readonly ancestry; no any or unchecked cast | 10: generated CSS variable names resolve; no script casts |
| Cognitive complexity | 10: no spread-ternary or nested-ternary idiom; depth helper has one early return; <=2 automated gate passes | 10: no executable functions |
| Testability | 8: callbacks/data injectable; actual React Flow paint still needs browser integration, exercised by unchanged acceptance runners | 10: computed-style, bounds, contrast and screenshot evidence directly observes effects |
| **Total** | **146/160** | **153/160** |

C evidence: Block metadata lines 120–121; blockNode data line 202; memoized section view construction lines 610–620; ancestry helper lines 1087–1091. Geometric fields and sectionLayer are untouched. S evidence: idle path/halo split lines 466–474; section/token paint block lines 497–550. The absolute pseudo-element changes no content sizing or frame dimensions. `before-paint.json` and `after-paint.json` establish exact browser geometry/camera equality.

## Declarative sources and generated publication

The following eight files were inspected independently; all have the same score vector for the documented reasons below:

- `capability/design-system/tokens/definitions.tokens.json`: wire idle ink/halo alpha, section tint/accent, elevation and chrome-border definitions.
- `capability/design-system/tokens/semantics.tokens.json`: default wire ink reference, section even fill/default family, chrome text references.
- `capability/design-system/tokens/themes/ink.theme.json`: three existing-key override records, preserving dark theme intent.
- `capability/design-system/contract/generated/token-names.ts`: compiler-produced const token-name declarations.
- `capability/design-system/adapters/styles/tokens.generated.css`: exact definition values.
- `capability/design-system/adapters/styles/semantics.generated.css`: references resolve to generated definition variables.
- `capability/design-system/adapters/styles/themes.generated.css`: compiler-produced paper/ink resolved scopes.
- `capability/design-system/adapters/styles/preferences.generated.css`: compiler-produced preference scopes and propagated dependency values.

In the table's principle order, each scores **10/10/7/10/10/10/10/10/10/10/5/10/10/10/10/10 = 152/160**. Evidence: single declaration/publication responsibility; data extension without branching; no subtyping (7); no broad callable port; contract-owned values; definitions own facts and compiler owns copies; direct literals/references; only requested paint data; schema/compiler own typed rejection; repeatable generation with prior-generation recovery; thin declarations rather than behavioral hiding (5); direct references; static immutable inputs/const output; validated numeric/color/dimension types; no functions; deterministic local compilation verified in `tokens-check.txt`. Generated files were never hand-edited.

Worst retained findings: C combines several inspector modes (SRP 8), C and S have fixed presentation axes (OCP 6), and declaration files are deliberately thin (information hiding 5). None is claimed fixed by this milestone.

Standalone evidence scripts under `output/` are not runtime sources. They invoke real tools/public contracts, fail on assertions and contain no fake outcomes. The native export harness supplies actual admitted corpus records to public validators/encoders. No new `*.test.ts` exists.
