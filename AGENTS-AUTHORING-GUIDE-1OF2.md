Last updated: 24th September 2026
# Authoring diagrams

Write diagrams in `.canvas` text files. The app calculates node positions and wire routes.

## DSL structure

```
canvas 1
collection @id "Title" {
  node @id KIND "Label" { CONTENT }
  wire @id @source -> @target "Label" kind=RELATIONSHIP
  section @id "Title" mode=DIAGRAM_TYPE {
    group @id "Group label" { show @node }
    show @other-node
    connect @wire
  }
}
```

- `node` defines an object; its contents can include signatures, fields, text or figures.
- `wire` defines a relationship between objects or their members.
- `section` defines a diagram view.
- `show` places an existing object in that view.
- `connect` includes an existing wire.
- `group` contains objects or nested groups.
- `@id` identifies an object for reuse and references.
- Section modes include `modules`, `er`, `tree`, `sequence`, `flow`, `state`, `story` and `grid`. Each supports its own content and relationships.

**Important: Declare each node once per collection.** `show @id` reuses that node in a diagram; it does not create another node. Reuse the same ID across views. Never use escape hatches to recreate a node, its contents or its relationships as a separate visual copy.

Example module diagram:

```
canvas 1
collection @example "Document publishing" {
  node @publisher module "publisher.ts" {
    signature @publish "publish"
      parameters=["draft: Draft"] returns="Receipt"
  }
  node @validator module "validate.ts" {
    signature @validate "validate"
      parameters=["draft: Draft"] returns="Result"
  }
  wire @dependency @publisher -> @validator
    "validate" kind=imports

  section @modules "Publishing modules" mode=modules {
    group @publishing "publishing/" {
      show @publisher @validator
    }
    connect @dependency
  }
}
```

Run `pnpm canvas describe` for the supported vocabulary, properties and defaults.

## Create a collection

```
pnpm canvas create diagram.canvas
```

A collection can contain multiple sections, each showing a different diagram.

For workspace commands, specify the running server and its workspace directory:

```
pnpm canvas create diagram.canvas \
  --server http://127.0.0.1:PORT \
  --workspace /path/to/workspace
```

The commands below accept the same connection arguments.

## Preview without saving

```
pnpm canvas preview diagram.canvas --mode create
```

Preview returns diagnostics and a request ID. To save that preview:

```
pnpm canvas apply REQUEST_ID
```

`create` saves directly; a separate preview is optional.

## Inspect a collection

List collections and their revisions:

```
pnpm canvas list
```

Read layout diagnostics:

```
pnpm canvas inspect COLLECTION_ID
```

To inspect visually, open:

```
http://127.0.0.1:PORT/?collection=COLLECTION_ID
```

## Edit an existing collection

Read the editable source:

```
pnpm canvas read COLLECTION_ID --out diagram.canvas
```

Edit the file, then replace using the revision returned by the read:

```
pnpm canvas replace diagram.canvas --revision N
```

Alternatively, preview the replacement:

```
pnpm canvas preview diagram.canvas --mode replace --revision N
pnpm canvas apply REQUEST_ID
```

For targeted edits, use a DSL patch:

```
pnpm canvas patch change.patch --revision N
```

Keep existing IDs when referring to the same objects. Revision conflicts require reading the current collection before resubmitting.

## References

- **Current language vocabulary:** `pnpm canvas describe`
- **Syntax examples by diagram type:** `resources/examples/language/`
- **Larger examples:** `resources/examples/showcase/`
- **CLI commands:** `pnpm canvas --help`

Examples demonstrate syntax; they do not impose a particular diagram style or authoring workflow.

---

## Nested groups and reused nodes

The current DSL nests **groups inside sections**, not sections inside sections. Sections are separate diagram views.

```
canvas 1
collection @publishing "Publishing" {
  node @publisher module "publisher.ts" {}
  node @validator module "validate.ts" {}
  node @storage module "storage.ts" {}

  wire @checks @publisher -> @validator
    "validate" kind=imports
  wire @saves @publisher -> @storage
    "saveDocument" kind=imports

  section @overview "Publishing files" mode=modules {
    group @src "src/" {
      show @publisher

      group @validation "validation/" {
        show @validator
      }
      group @adapters "adapters/" {
        show @storage
      }
    }
    connect @checks @saves
  }

  section @validation-view "Validation dependency" mode=modules {
    show @publisher @validator
    connect @checks
  }
}
```

Three node declarations; two views. `@publisher` and `@validator` retain the same identities in both.