# Export A2 assertion-correctness audit

Date: 2026-09-12. Branch: `feat/export-capability`.

One bounded pass, completed within eight minutes. Reviewed only `capability/export/tests/{artifact.test.ts,bundle.test.ts,import.test.ts,native.test.ts,fixtures.ts}` as audit targets. Read repository `AGENTS.md`, Export Doc5, Doc2 and Doc3; implementation was supporting evidence only. No E2E, new test cases, production mutations, recursive audits or subagents.

## Verified findings

| ID | Category | Target / assertion | Concrete false-pass scenario | Required correction within existing case |
|---|---|---|---|---|
| A2-1 | engineering violation | `artifact.test.ts:22–24`, case 2 | The injected SVG encoder returns `failed()`, but the test discards the result and checks only one lease release. A broken pipeline can convert this failure into a successful one-byte SVG artifact and still pass. This violates Doc2 E12 and case 2's “no partial artifact” contract. | Capture the result and assert the typed `encoding-failed` outcome and absence of an artifact. Likewise capture the already-present pre-acquire cancellation outcome instead of checking only release count. |
| A2-2 | engineering violation | `native.test.ts:31–39`, case 5 | Both raster checks measure dark/nonblank pixels, not the admitted font. Rebinding every digest-specific SVG font family to `JetBrains Mono` changes body text admitted as Inter, while signature, dimensions, standard deviation and dark-pixel count all still pass. This violates Doc2 E03 and Doc3's exact admitted font binding. | Add an independent exact-font oracle within case 5: for example, a bounded glyph crop compared with a separately established rendering of the pinned Inter font, sensitive to the demonstrated Mono substitution. Keep the existing nonblank check. |
| A2-3 | engineering violation | `native.test.ts:70,76`, case 6 | Removing the PDF adapter's `writeFooter(document, page, fonts)` call leaves every physical page without its source footer, yet both revision assertions pass. `text` still contains `revision 7` in PDF document Subject metadata, and `pdf.pages` contains planned footer strings independent of drawing. This violates Doc2 E05 and Doc3's painted PDF revision/page-count footer requirement. | Assert footer text from actual PDF page content in the expected footer region, including revision and page count, instead of relying on document metadata and the plan DTO. Extend case 6; do not add a thirteenth case. |

These findings concern test oracles; they do not claim the current production implementations exhibit the injected faults.

## Counterexample evidence

Copied Export into ignored `.generated/a2-test-correctness/capability/export`, preserving its test files unchanged, and linked the existing dependency and font-resource directories. Only the copied implementation was mutated:

1. In copied `core/artifacts/produce.ts`, replace `runEncoder`'s direct return of an unsuccessful SVG encoder result with `finish({ bytes: new Uint8Array([1]), pages: [], warnings: [] }, snapshot, request, deps, signal)`. Other format failures retain their original handling. Case 2's encoder-failure scenario now returns success with invalid partial bytes, still releases once, and its assertions pass.
2. In copied `adapters/native/png.ts`, replace `escapeAttribute(font.family)` with `escapeAttribute('JetBrains Mono')` in the digest-family rebinding. The fixture admits Inter as its body font and includes both actual Inter and JetBrains Mono font resources. All body font aliases therefore resolve to the wrong available font; the existing pixel assertions still pass.
3. In copied `adapters/native/pdf.ts`, omit only `writeFooter(document, page, fonts)`. All PDF page footer rendering is removed; Subject metadata and `input.pages` remain unchanged, so the existing assertions still pass.

Command: `pnpm exec vitest run --config .generated/a2-test-correctness/vitest.config.ts`, with the temporary configuration including only the four copied Export test files.

Observed result with all three independent mutations present: **4 test files passed; 12 tests passed; duration 1.39 seconds**. These mutations affect separate format/scenario paths; the original target test files were not edited. The temporary copied implementation and configuration were removed after recording this result.

## Boundaries and gaps

Stopped at three concrete findings as requested. No separate baseline run, complete mutation campaign, E2E, PDF visual inspection or exhaustive audit of all invariant/input combinations was performed. The five target files were read; no additional finding is asserted from coverage gaps alone. Parent verification and one findings-only correction round remain; this is the sole A2 audit.
