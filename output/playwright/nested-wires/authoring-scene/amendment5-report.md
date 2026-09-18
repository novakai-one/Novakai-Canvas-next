# M10b Amendment 5 — verified split shipment

The authoritative 47-node / 119-wire / 20-external baseline was committed first as `534fd8dd4e6b22e143008b975795125c1b538c73`, including the original extractor, spec, manifest, empty-section support and complete historical failure evidence. `9630a69` was not used as the byte-comparison baseline. The following commit introduces the Amendment-4 filesystem port and typed extraction failures without changing either generated artifact.

## Amendment 3 split DoD

| Item | Result |
| --- | --- |
| Verified baseline committed before restructure | PASS: `534fd8d`; preceding fresh full check passed 70 files / 208 tests. |
| Filesystem injection | PASS: `ExtractionFilesystem` declares readFile/readdir/realpath; extraction has no node:fs import or ambient cwd read. One-off regeneration CLI binds concrete Node access. |
| Typed extraction failures | PASS: Result discriminant; unreadable-file, unreadable-directory, unresolvable-path, symlink-escape, extraction-failed; original error evidence retained. |
| Semantics and traceability | PASS: 47 source files = 47 nodes; 119 wire citations; 20 external imports; zero bare IDs/type-only wires; 111 type-only imports and 231 type symbols excluded. Ten deterministic random spot-checks printed. |
| Byte-identity proof | PASS: two regenerations exactly equal spec and manifest in `534fd8d`; git diff exits 0. SHA-256 and byte sizes recorded. |
| Port/failure verification | PASS: memory-only fixture; all named failures, root/descendant symlink escapes and safe retry; no real filesystem required for these checks. |
| Scene determinism | PASS: two offline builds byte-identical, 1,957,744 serialized bytes; legality remains deferred. |
| Product-source review | PASS: extractor 151/160; new declaration contract 147/160; offline builder 147/160; unchanged placement review 146/160 retained. |
| Fresh final full pnpm check | PASS: exit 0, 70 test files / 208 tests; typecheck, ESLint, formatting and architecture all pass. Started 2026-09-18 11:16:16 local; test duration 18.26s. See exit file and full output. |
| Evidence scripts | Targeted ESLint and standalone strict TypeScript check pass. The standalone TS6 invocation needed --ignoreConfig and --types node; corrected command only, no source/gate changes. |
| Empty-section support | Retained unchanged from baseline; prior 128×176 empty-leaf regression and default/templates/scale byte-identity evidence remain committed. |
| App entry | DARK: no authoring import or scene-switch entry in roads-prototype.ts; builder explicitly marked offline pending M10f. |
| Routing legality and captures | Deferred to M10f under Amendment 3. No illegal scene presented as accepted UI output. |

## Known failure record

Preserved findings: 4 corridor / 40 node-body / 87 boundary witnesses, 18 overlap-detector witnesses, zero continuity failures, and 0 of 1,273 crossings certified. Historical reports retain the diagonal-overlap and failed-certificate-construction caveats. No routing repair, graph pruning, reference-image changes or gate relaxation was attempted.

**Scales or compounds? Undetermined: no performance acceptance or five-load median is claimed for the illegal real scene.** Historical operation/audit evidence remains available; this resume proves extraction semantics and shipment readiness only.

## HUMAN EXPERIENCE REVIEW

No browser, screenshot, visible window or server was opened. Attention, focus, clutter, readability and reference fidelity remain unassessed. The UI entry stays absent while M10f owns legality. The two offline JSON builds prove determinism, not visual quality. No protected port was touched.

## Reproduce from repository root

```sh
pnpm exec tsx output/playwright/nested-wires/authoring-scene/regenerate-extraction.ts
pnpm exec tsx output/playwright/nested-wires/authoring-scene/verify-extraction.ts
pnpm exec tsx output/playwright/nested-wires/authoring-scene/verify-extraction-port.ts
git diff --exit-code 534fd8dd4e6b22e143008b975795125c1b538c73 -- output/playwright/nested-wires/authoring-scene/scene-spec.json output/playwright/nested-wires/authoring-scene/extraction-manifest.json
pnpm exec tsc --ignoreConfig --noEmit --target ES2023 --module NodeNext --moduleResolution NodeNext --types node --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --resolveJsonModule output/playwright/nested-wires/authoring-scene/verify-extraction-port.ts output/playwright/nested-wires/authoring-scene/regenerate-extraction.ts output/playwright/nested-wires/authoring-scene/verify-extraction.ts
pnpm check
```

The extractor module now exposes `extractAuthoringScene(fs, absoluteRoot)` and is safe to import without filesystem effects. Invoke the evidence regeneration CLI above to write artifacts. Publication retains baseline deterministic overwrite behavior; after a partial write, rerun to regenerate both files. It does not claim atomic two-file publication.

Evidence: `amendment5-byte-identity.txt`, `amendment5-manifest-gates.txt`, `amendment5-port-verification.txt`, `amendment5-scene-determinism.txt`, `amendment5-source-review.md`, and the baseline/final full-check logs.
