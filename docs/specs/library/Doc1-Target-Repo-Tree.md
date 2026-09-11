# Capability: library — Target repo tree

**Responsibility:** Library defines valid catalog organization and produces revision-labelled discovery results for collections and their contents.

```text
capability/library/
  contract/
    index.ts                     # only outside import surface
    api.ts                       # validate, plan, query
    brands.ts                    # CatalogId, FolderId, CollectionId, ObjectId, SectionId
    errors.ts                    # Diagnostic / Result
    records/catalog.ts           # catalog and folder/membership records
    records/snapshot.ts          # read-only discovery projection and recent visits
    records/change.ts            # complete catalog operations
    records/query.ts             # filters, cursor envelope, hits/page
    types.ts                     # CatalogPlan and read versions
  core/
    validation/validate.ts       # shape and catalog/inventory consistency
    validation/outcomes.ts       # typed diagnostics, detached frozen outcomes
    catalog/folders.ts           # ancestry and folder removal policy
    catalog/plan.ts              # atomic ordered planning
    catalog/operations.ts        # checked catalog transforms
    discovery/project.ts        # collection/section/object search documents
    discovery/query.ts          # filtering, stable ranking and pagination
    discovery/cursor.ts         # query/snapshot cursor identity
  adapters/                      # empty: no owned I/O in this capability
  tests/
    fixtures.ts
    catalog.test.ts
    planning.test.ts
    query.test.ts
```

**Consumers:** Authoring catalog planner; browser library/search through a thin host; CLI discovery through the same public contract.
**Imports:** core → own core/declaration contracts only. External consumers → contract/index. Schema declarations use existing Zod dependency. No Model/private imports; the host maps committed headers/content to Library's projection DTO.
**Data authority:** catalog stores organization only. Collection titles/content/revisions are read projections, never duplicated mutable catalog authority. Recent visits are supplied preference data; query does not record a visit.
