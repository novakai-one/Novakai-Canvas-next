# Canvas plan resolution — sole fix round

|Finding|Independent verification|Disposition|
|---|---|---|
|C1 major build risk|Presentation ReactBindings/compose export NodeContent,Marker,fonts only; existing ContentBlocks renders exact primitives but no legal measured-content binding exists.|Verified. Doc3 requires additive Presentation public font-bound MeasuredContent binding during integration; no copied typography.|
|C2 major build risk|Doc2 SessionState had one stamp and no readOnly field; pure transition cannot retain displayed A plus requested C or protect read-only after a status update without independent data.|Verified. Doc2 adds requested stamp and immutable readOnly mode; Doc3 defines ownership; cases8/9 strengthen their existing oracle.|
|C3 minor|F28 explicitly requires minimap; Canvas component matrix omitted it.|Verified. CanvasSurface owns ReactFlow MiniMap; case15 includes it.|

One review/one fix; no re-audit. Per-document and aggregate word/line growth mechanically verified <=20%; baseline/final JSON retained. Exact16-case budget unchanged. Specs mirrored to vault. Build begins against corrected set.
