# Design System — sole verified plan correction

|ID|Independent verification|Disposition|
|---|---|---|
|DS-P1|Both public consumer schemas accept hex6/8 only. Arbitrary DTCG components need byte quantization before contrast or identity.|Verified: round(channel×255), lowercase hex6 opaque / hex8 translucent, before every projection/hash. Existing case7 extended.|
|DS-P2|Templates stores role names while Presentation requires named Paint records. Model/Language default role is neutral.|Verified: role.<id>.fill/stroke/text, all colors required; neutral required; core reconstructs paints, host only translates contracts. Existing case7 extended.|

No second audit. Frozen baseline2245 words/194 lines; final counts recorded beside baseline; each document and aggregate remain below120% for words and lines.
