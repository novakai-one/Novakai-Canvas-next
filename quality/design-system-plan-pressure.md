# Design System — sole fresh-context plan pressure test

Scope: five capability specs; public consumers read only as compatibility evidence. Bounded 8 minutes. No edits or second review.

|ID|Category|Evidence|Failure scenario|Minimal correction|
|---|---|---|---|---|
|DS-P1|major build risk|Doc2 TokenValue/T02; Templates preset.ts color schema; Presentation style.ts color schema|Float sRGB versus consumer hex quantization can change contrast/digest after admission.|Quantize before contrast/hash/all outputs; case7 round-trip.|
|DS-P2|major build risk|Doc2 PortableTheme/StyleProjection; Templates roles list; Presentation Paint records|Role names cannot reconstruct paints without undisclosed host policy.|Freeze role token mapping/completeness and multi-role case7.|
