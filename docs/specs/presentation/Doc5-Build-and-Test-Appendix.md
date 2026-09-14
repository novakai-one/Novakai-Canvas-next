# Capability: presentation — Build / acceptance appendix

| Step | Exit |
|---|---|
|1| Checked visual/style contracts, required domain/resource roles, TSX import enforcement |
|2| Exact font measurements and composable text/table/media processors |
|3| Node/relationship/sequence notation and whole collection projection |
|4| Shared React/static renderer and frozen contract suite |
|5| Two bounded audits, one verified fix, PR; proceed Layout |

## Frozen test budget

Exactly10definitions/10cases, fast in-process contract/render tests. No E2E. Actual visible-browser readability/interaction remains mandatory Part2, not replaced by static markup assertions. Fixtures include approved font bytes, real fontkit and React static rendering; domain/theme adapters use explicit canonical fixture input and known token values.

|#|Scenario|Tier/type|Loop/nightly s|Maintenance|For/confidence|Against/confidence|Covered|Retires when|
|---|---|---|---:|---|---|---|---|---|
|1| Exact offline font metrics, missing font/glyph/error |fast/adapter|.04/.04|medium|prevents platform drift95%|font fixture upkeep25%|none|metrics adapter replaced|
|2| Newlines/long Unicode text wraps without clipping |fast/contract|.03/.03|medium|readable content95%|finite Unicode samples30%|none|text engine replaced|
|3| ER field/type/key/nullability row anchors |fast/contract|.03/.03|medium|engineering detail95%|fixture width20%|Model semantics only|notation replaced|
|4| Typed ports/members/signatures/table rows |fast/contract|.03/.03|medium|valid wired interfaces95%|many rows25%|Model semantics only|content projection replaced|
|5| Exact cardinality marker combinations, labelled relationship kinds |fast/contract|.02/.02|low|honest ER notation95%|symbol assertions25%|none|marker vocabulary replaced|
|6| Media sizing/alt and missing/unsafe resource failure |fast/contract|.03/.03|medium|offline readable imagery95%|reader fixture25%|Assets admission only|media processor replaced|
|7| Shared appearances, groups, detail outline and sequence labels |fast/contract|.04/.04|medium|mixed views95%|grouped variations25%|Model topology only|projection replaced|
|8| Theme/content identity change, camera independence, immutable result |fast/contract|.03/.03|low|stale scene protection95%|hash input fixture20%|none|identity contract replaced|
|9| React/static output parity, escaping, font pins, all shapes |fast/render|.05/.05|medium|no second renderer95%|browser still needed35%|none|render adapter replaced|
|10| Invalid provider/schema/limits fail without partial projection |fast/contract|.03/.03|medium|honest failure95%|cannot exhaust inputs30%|none|public boundary replaced|
|**Fast/TOTAL**|**10**||**.33/.33**||||||
|**Slow/guard**|**0**||**0/0**||||||

Declare initial words/lines; one fresh-context plan reviewer<=8minutes, capability-only. Categories engineering violation/major build risk/preference/minor. One verified fix round<=20% per-doc/aggregate words AND lines, no second plan review. A1 ~10% varied files,max5, fidelity/16principles; A2 max5testfiles attempts3 incorrect assertion scenarios. Both8minutes, one verified findings-only fix, no re-audit. Each first-party TS/TSX file>144/160, named docs/returns, Sonar<=2. Static renderer evidence is not a human-experience signoff; visible inspection is recorded separately when integrated.
