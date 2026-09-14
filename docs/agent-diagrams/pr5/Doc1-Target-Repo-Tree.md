# PR5 — economical labelled routes
Responsibility: route fixed measured nodes with correct semantic endpoints, clear labels and bounded route search.

|Path|Responsibility|
|---|---|
|layout/core/routing/|Endpoint selection, local route candidates, label allocation|
|layout/contract/records/engines.ts|Version derived routing policy|
|layout/tests/|Correctness across port/field/cycle/manual constraints|

Depends integrated PR4. Native libavoid remains behind existing owned routing port. No new commercial dependency. No node layout, model semantics, DSL syntax or UI sidepanel changes.
