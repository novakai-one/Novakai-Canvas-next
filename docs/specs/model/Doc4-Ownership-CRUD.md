---
custom-width: 100
date created: Fri 11 Sep, 9:53 PM
date modified: Fri 11 Sep, 10:41 PM
---
# Capability: model — Ownership / CRUD

| Object                               | Create                                               | Read                                           | Update                                                         | Delete                                                                        |
| ------------------------------------ | ---------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Collection                           | validate proposed initial document; Authoring admits | validate / successful plan                     | replace-document through plan; same ID/revision                | outside Model: Authoring/Library catalog transaction                          |
| DiagramObject                        | plan create objects                                  | Collection.objects                             | plan replace objects; all appearances share content            | remove objects with final reference checks; delete-object explicit cascade    |
| ContentBlock / Port / Key / TableRow | containing object create/replace                     | containing object; endpoint resolver           | replace containing object preserving intended stable IDs/order | replace containing object; dangling endpoints/FKs fail                        |
| Relationship / Endpoint              | plan create relationships                            | Collection.relationships                       | replace relationship; same ID                                  | remove relationships; dangling wire appearances must be removed in same batch |
| Section                              | plan create sections                                 | Collection.sections                            | replace section; preserve surviving overrides                  | remove sections; canonical objects/relationships remain                       |
| Appearance                           | section create/replace                               | Section.appearances                            | replace section; local presentation overrides only             | hide, section replace/remove; canonical object remains                        |
| Group                                | section create/replace                               | Section.groups                                 | section replacement                                            | section replacement; dangling membership must be corrected                    |
| WireAppearance                       | section create/replace                               | Section.wires                                  | section replacement; reset-route for manual routing            | section replacement, hide or canonical explicit cascade                       |
| SequenceItem / Branch                | section create/replace                               | Section.sequence; ordered parent/branch scopes | section replacement; same stable IDs                           | section replacement; references must remain valid                             |
| Source                               | plan create sources                                  | Collection.sources                             | plan replace sources                                           | remove sources; referencing source lists must be corrected in batch           |
| Asset binding                        | plan create assets; bytes already admitted by Assets | Collection.assets                              | plan replace assets                                            | remove assets; referenced content must be corrected in batch                  |
| ThemePin                             | initial collection / replacement                     | Collection.theme                               | replace-document; roles revalidated                            | never absent; replace with another exact pin                                  |
| LayoutIntent                         | collection/section/group creation                    | containing record                              | complete owning-record replacement                             | replace constraints with empty array; layout remains required                 |
| Manual geometry                      | accepted human input in owning record                | section/appearance/group/wire                  | replacement with explicit geometry                             | reset-layout/reset-route; removed view identity loses override                |
| ChangePlan / Diagnostic / Impact     | Model API computation                                | caller                                         | never                                                          | caller discards; not authoritative history                                    |

**Write boundary:** Model returns data, never writes storage. Only Authoring may admit Model's plan and ask Persistence to commit. Pure success is not permission, geometry feasibility, persisted success, concurrency protection or a revision receipt.

**Failure boundary:** `{ok:false}` has no candidate; input unchanged. Recovery: caller fixes diagnostics and replans from its current snapshot; Authoring retries/recovers any subsequent transaction. No I/O means no Model crash-recovery journal or event stream.
