# Ownership and CRUD
|Operation|Path|Persistence|
|---|---|---|
|Create collection with columns|DSL→Language→Authoring→Model/Layout validation|Existing Authoring commit|
|Read|Committed collection→Language print|No write; explicit columns retained|
|Edit columns|DSL patch set/reset→Authoring|Revision-checked; no coordinate write by agent|
|Invalid edit|Typed rejection|No partial mutation|
|Nested scope|Group/section-owned intent|Sibling scopes unaffected|

Existing diagram data can be recreated; no compatibility migration required. Omitted columns retains existing grid default. Agent never writes JSON or x/y. No direct persistence shortcut in fixtures. Recipes expand to ordinary editable intent.
