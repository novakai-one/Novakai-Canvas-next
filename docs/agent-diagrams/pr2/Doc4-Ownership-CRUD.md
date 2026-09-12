# Ownership and CRUD
|Operation|Path|Persistence/recovery|
|---|---|---|
|Create/read projection|Pinned theme→Design System metrics→Presentation measurement|Derived only; no write|
|Edit label/signature/content|Existing DSL→Authoring→reprojection|Existing revisioned commit; failure retains prior scene|
|Change theme/font|Existing preset pin→new metric digest→reprojection/Layout|Authoring owns pin change; no platform fallback|
|Add image/icon later|PR3 Assets admission→existing content block→frozen slot contract|Assets owns bytes; Templates pins; Presentation never stages|
|Render sequence|Canonical event/fragment→Presentation notation→Layout geometry→shared renderers|No semantic mutation or inferred ordering|

All existing style constructors migrate in one PR: Design System projector, service render job, Presentation fixture, Layout fixture and Export fixture. Transport readers already validate `ResolvedStyle`; old payloads fail visibly and are regenerated from pinned tokens. No data migration or compatibility shim.
