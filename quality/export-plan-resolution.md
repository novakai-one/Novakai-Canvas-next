# Export plan findings — one correction round

| Finding | Verification | Decision |
|---|---|---|
| EP1 | Layout PlacedSection stores origin separately; Canvas uses section-local node boxes including groups. The two renderer instructions conflict. | Accepted; all section geometry gets the origin once; case 3 includes nested groups and nonzero origins. |
| EP2 | Presentation admits image/webp; PDFKit officially accepts PNG/JPEG. | Accepted; required bounded lossless media conversion before PDF encoding, actual WebP PDF assertion in case 6. |

Native raster binds in-memory decoded fonts through resvg WASM, avoiding a temporary font-file dependency. Fontkit reads actual internal family names; native normalization must retain exact digest binding. No additional plan audit. Baseline and final word/line inventories are in acceptance-evidence; growth is bounded per document and overall.
