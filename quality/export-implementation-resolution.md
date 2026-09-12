# Export — sole verified correction round

A1/A2 reports remain unchanged. Findings were checked against current source and the exact original anchors before correction. No second audit was requested or performed.

| Finding | Verification | Disposition |
|---|---|---|
| A1 cancellation between encoder stages | RenderInput carried no signal; PDF continued after awaited fonts/media. | Accepted. Signal now reaches format handlers; PDF, PNG and bundle check after their asynchronous stages. Existing case 2 cancels during actual PDF font dependency and proves media is not called. |
| A1 unused production ports | produce uses snapshots/formats/hash, not Documents/Resources or other Encoding methods. | Accepted. ProductionDependencies is narrowed to those roles; PDF accepts renderer only; import/inspection dependencies are separately narrowed. |
| A1 repeated restoreOrder | Same ordered collection was constructed three times in one overlay. | Accepted. Compute it once and reuse the immutable record. |
| A1 escaping provider failures | Acquisition, import and PDF font/media calls could reject outside their local Result boundary. | Accepted. Named protected boundaries now settle these failures locally; enclosing API still protects consumers. |
| A1 missing recovery names | Entry comments did not identify recovery owner even though API/specs did. | Accepted. Corrected affected entry comments. |
| A1 duplicated PDF page cap | Native and core each declared 512. | Accepted. One contract constant supplies both checks. |
| A1 fixed workflows/OCP cap6 | Steps remain explicit; injected collaborators are not an injected workflow. | Verified. Retain literal docks; no speculative pipeline added for points. |
| A1 native PDF construction/mutation/testability | Target directly uses PDFKit and a local stream buffer. | Verified; unresolved standards gate. Correctness requires the actual native adapter, and this checkpoint does not invent an exemption or hide the same code in a differently named file. |
| A1 one-shot raster initialization | resvg rejects a second successful initialization; contract explicitly requires one startup call. | Verified; retained documented startup behavior and original dock. No idempotency claim. |
| A2-1 swallowed encoder failure | Case 2 ignored the encoder outcome. | Accepted. Assert encoding-failed and no value; also assert pre-acquire cancellation outcome. |
| A2-2 wrong PNG font | Dark pixels could come from a substituted available font. | Accepted. Independent direct-resvg glyph crop uses only pinned Inter bytes, bypassing Export's family rebinding. |
| A2-3 missing painted PDF footer | Metadata and planned page DTOs could satisfy assertions with no drawn footer. | Accepted. PDF.js reads actual page text in the bottom footer region; each page must contain its revision and ordinal/count. |

## Verification

Exactly the same 12 cases remain. Parent replayed only the three already-established A2 faults in isolated ignored copies: each fails its intended case, with the other 11 passing. See acceptance-evidence/export-known-mutation-verification.json. This verifies corrections; it is not a new audit or mutation search. Temporary copies were removed.

Full repository check after corrections: typecheck, ESLint, formatting, import/cycle enforcement and 154 cases across44 files passed; suite7.08s. Export49 TS/TSX files have actual maximum Sonar2. Static source inventory records138 named declarations:137 runtime functions have explicit return types and direct documentation; the WOFF2 ambient declaration has a module comment but no direct function TSDoc. No claim of universal file-score compliance is made.

Initial A1 scores: produce142, manual145, prepare149, PDF120, compose133. Correction-only parent score deltas are recorded in export-file-gate.json, not presented as a second independent audit. Native PDF and compose remain below145; unsampled files remain uncertified. Part1's full standards gate is still open.

Native dependencies: resvg-wasm2.6.2 MPL2, PDFKit0.20.2 MIT, SVG-to-PDFKit0.1.8 MIT, wawoff2 2.0.1 MIT, Sharp0.35.4 Apache2, fontkit2.0.4 MIT. Test-only PDF.js6.3.289 Apache2 follows the official [Node text extraction example](https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs). These license records do not claim a browser UX review.
