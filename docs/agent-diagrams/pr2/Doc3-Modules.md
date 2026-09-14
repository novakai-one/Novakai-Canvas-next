# Modules and contracts
|Owner|Input→output|Failure/recovery|
|---|---|---|
|Design System|Resolved diagram tokens→`StyleProjection` with absolute typography/content metrics|Missing/nonfinite derivation rejects; caller retains prior scope|
|Presentation style boundary|Unknown style→checked `ResolvedStyle`|Old scalar shape rejects explicitly; all constructors migrate atomically|
|Sizing|Canonical blocks + exact font metrics + SizeBand→one content width|Oversized/invalid metrics return typed failure; no guessed dimensions|
|Structured content|Fields/members/signatures/tables→aligned runs, rows and stable anchors|Wrap by measured lexical/cell groups; canonical outline remains complete|
|Media|Admitted asset + contentSizing→centered measured image/icon slot|Missing/unsafe bytes reject; cover clipping belongs shared renderer|
|Notation/projection|Semantic role→heading/body/annotation measurement; sequence operator text|Layout receives changed measured bounds only; it still owns placement/routes|

`sizing.ts` returns a named `ContentMeasurePlan`; `signature.ts` returns `MeasuredContent`. Processors remain registered in `blocks.ts`. React/static parity continues through existing primitives; no second renderer or image-specific template.
