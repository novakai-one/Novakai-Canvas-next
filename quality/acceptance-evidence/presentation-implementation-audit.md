# Presentation A1 — sole bounded implementation audit

Reviewer library_plan_pressure; read-only, four targets, within8minutes. Exact target-only16principle anchors. All10Presentation cases and target Sonar<=2 passed before findings. No browser readiness claim.

|Category|Finding / original location|Independent author verification and sole fix|
|---|---|---|
|major build risk|node.ts15–25,125–149 role foreground ignored|Verified role paint was used only for frame while text used global foreground. Scoped role foreground/border now feed measurement; existing case8 asserts white runs on black frame.|
|engineering violation|node.ts128,153 placement width ignored|Verified scoped width always read token. Authored outer width now resolves inner measuring width after shape/padding;480 request asserted in case8. Intrinsic minimum can still exceed impossible small width; Layout owns feasibility.|
|engineering violation|node.ts77–93 summary used first outline string|Verified first table lost rows. Blocks measured once and full first block retained; visible row anchors preserved, omitted rows explicitly collapsed. Existing case7 asserts both table rows and hidden later-body outline.|
|minor|NodeContent.tsx52,75 inner named components lacked own docs|Verified AST scan. Each named component now has own documentation and explicit return;110named functions/35files, zero gaps.|

N=node.ts;T=core/content/text.ts;R=adapters/react/NodeContent.tsx;F=adapters/fontkit.ts. Original scores retained:

|Principle|N|T|R|F|Evidence|
|---|---:|---:|---:|---:|---|
|SRP|10|10|10|10|local projection; typography; local React render; pinned metrics|
|OCP|6|6|6|6|fixed owned stages, injected collaborators|
|LSP|7|7|7|7|not demonstrated|
|ISP|10|10|10|10|all narrow roles consumed in target flows|
|DIP|10|10|10|10|core own declarations; native frameworks in adapters|
|DRY|9|10|9|10|node typography request and React frame paint repeated|
|KISS|10|10|8|10|React two named documentation gaps|
|YAGNI|10|10|10|10|present measured-render requirements only|
|Typed failures|5|5|8|10|private N/T structured throws; R named render catch;F typed Result|
|Recovery|8|10|8|8|all replayable;T names Authoring recovery|
|Deep modules|10|10|10|10|small interfaces hide measured projection/render/shaping|
|Demeter|10|10|10|10|direct collaborators/data reads|
|Immutability|10|10|10|10|copies,readonly,no first-party shared cache|
|Type safety|10|10|10|10|no uncheckedcasts/any|
|Cognitive|10|10|10|10|no prohibited idioms;Sonar<=2|
|Testability|10|10|10|10|explicit metric/resource/renderer/parser slots|
|**Total**|**145**|**148**|**146**|**151**||

Documentation correction lifts R KISS8→10 in author verification; no second independent audit. Functional fixes retain measured responsibility boundaries. Other score deductions remain, not rationalized away. Fix scope limited to verified A1/A2 findings and their regression assertions.
