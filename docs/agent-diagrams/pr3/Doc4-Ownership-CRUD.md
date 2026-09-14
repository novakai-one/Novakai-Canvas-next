# Ownership and CRUD

|Operation|Path|Persistence/replay|
|---|---|---|
|Stage local media/font|CLI confined read → authenticated service → Assets.stage|Immutable blob may precede semantic commit; duplicate bytes no-op; unreferenced orphan is collectable|
|Create/edit collection with asset|DSL declaration → staged/pinned digest map → Language → Authoring → Model|Collection-local alt/provenance and asset binding commit atomically; failure leaves prior collection|
|Admit theme|Theme config + staged fonts → Design System codec → Templates plan → preset planner → Authoring|New immutable version or identical no-op; same identity/different content rejects|
|Admit recipe|Editable DSL → Language canonical print/manifest → Templates → Authoring|Ordinary editable intent on later instantiate; exact theme/media dependencies retained|
|Read/render|Committed collection pin → Templates/Assets → Design System/Presentation|Two collection scopes resolve independently; missing bytes/pin fails visibly, never substitutes|

Suggested syntax: `canvas create wetland.canvas`; `canvas theme admit harbor.theme --request theme-harbor-1`; `canvas recipe admit resources/recipes/infographic.canvas --id field-guide --version 1.0.0 --family infographic --title "Field guide" --request recipe-field-guide-1`.

```text
theme 1 @harbor "Harbor" version=1.0.0 base=paper
font body source="./Inter.woff2"
font mono source="./Mono.woff2"
set color surface.base="#eef7f8"
```

This coordinate-free host config maps only to existing typed tokens; it is not diagram JSON or a second canonical theme model.

`recipe instantiate PIN --namespace ID --out FILE` emits editable pinned DSL for create. Replace/patch use `--revision N --request ID`. Font declarations admit bytes; theme body/mono selects descriptor family/digest.
