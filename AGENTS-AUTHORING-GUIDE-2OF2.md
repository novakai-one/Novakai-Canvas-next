Last updated: 24th September 2026

# DSL examples by diagram type

Each example is a complete collection. Nodes are declared once; `show` and `connect` include existing objects and wires in a view.

## 1. Modules

Shows function signatures, explicit ports, imports and interface implementation.

```
canvas 1
collection @publishing "Publishing contracts" {
  node @publisher module "publisher.ts" {
    signature @publish "publish"
      parameters=["draft: ApprovedDraft"]
      returns="Promise<PublicationReceipt>"
    port @publication out "publication"
      type="PublicationPort"
  }

  node @contract interface "PublicationPort" {
    member @submit "submit"
      type="(draft: ApprovedDraft) => Promise<PublicationReceipt>"
      visibility=public
  }

  node @adapter module "cms-adapter.ts" {
    signature @submit "submit"
      parameters=["draft: ApprovedDraft"]
      returns="Promise<PublicationReceipt>"
  }

  wire @dependency @publisher.@publication -> @contract
    "PublicationPort" kind=imports
  wire @implementation @adapter -> @contract
    "implements submit" kind=implements

  section @modules "Publishing contracts" mode=modules {
    group @application "application/" {
      show @publisher @contract
    }
    group @adapters "adapters/" {
      show @adapter
    }
    connect @dependency @implementation
  }
}
```

- `signature` declares a function’s name, parameters and return type.
- `member` declares an interface member.
- `port` declares a connection endpoint; `@publisher.@publication` references it.
- `imports` points from the importer to its dependency.
- `implements` points from the implementation to its interface.

## 2. Entities

Shows fields, primary and foreign keys, a composite key and relationship cardinality.

```
canvas 1
collection @orders "Orders and products" {
  node @order entity "Order" {
    field @id "order_id" type="OrderId" key=primary
    field @placed "placed_at" type="Timestamp"
  }

  node @product entity "Product" {
    field @id "product_id" type="ProductId" key=primary
    field @name "name" type="string"
  }

  node @line entity "Order line" {
    field @order "order_id" type="OrderId"
      key=foreign references=@order.@id
    field @product "product_id" type="ProductId"
      key=foreign references=@product.@id
    field @quantity "quantity" type="integer"
    keygroup @identity kind=primary fields=[@order,@product]
  }

  wire @contains @order.@id -> @line.@order
    "contains" kind=association from=1 to=1..many
  wire @appears @product.@id -> @line.@product
    "appears on" kind=association from=1 to=0..many

  section @entities "Order records" mode=er {
    show @order @line @product
    connect @contains @appears
  }
}
```

- `field` declares a named, typed field.
- `references` identifies the referenced entity field.
- `keygroup` defines a key spanning multiple fields.
- `from` and `to` declare cardinality at each relationship endpoint.
- Within `@line`, `fields=[@order,@product]` refers to its local field IDs.

## 3. Flowcharts

Shows numbered connections, parallel branches, a join, a decision and a revision loop.

```
canvas 1
collection @review "Document review" {
  node @start start "Document submitted" {}
  node @split fork "Start parallel reviews" {}
  node @content step "Review content" {}
  node @legal step "Review legal requirements" {}
  node @join join "Both reviews complete" {}
  node @decision decision "Both reviews approve?" {}
  node @revise step "Revise document" {}
  node @approved end "Document approved" {}

  wire @begin @start -> @split
    "start review" kind=flow step=1
  wire @content-review @split -> @content
    "content review" kind=flow
  wire @legal-review @split -> @legal
    "legal review" kind=flow
  wire @content-result @content -> @join
    "content result" kind=flow
  wire @legal-result @legal -> @join
    "legal result" kind=flow
  wire @evaluate @join -> @decision
    "evaluate both results" kind=flow step=2
  wire @yes @decision -> @approved
    "yes" kind=flow
  wire @no @decision -> @revise
    "no" kind=flow
  wire @retry @revise -> @split
    "resubmit" kind=flow style=dashed

  section @flow "Review and approval" mode=flow direction=down {
    show @start @split @content @legal
    show @join @decision @revise @approved
    connect @begin @content-review @legal-review
    connect @content-result @legal-result @evaluate
    connect @yes @no @retry
  }
}
```

- `start` and `end` mark entry and terminal outcomes.
- `step` is an action; `decision` is a question with labelled outcomes.
- `fork` separates parallel paths; `join` brings them together.
- `step=1` numbers a connection; it is distinct from the node kind `step`.
- `style=dashed` changes the wire’s appearance; its label explains its meaning.

## 4. Sequences

Shows ordered messages, replies, asynchronous notifications and alternative branches.

```
canvas 1
collection @reservation "Reserve an item" {
  node @customer participant "Customer" {}
  node @orders participant "Orders" {}
  node @inventory participant "Inventory" {}
  node @notifications participant "Notifications" {}

  section @sequence "Reservation request" mode=sequence {
    show @customer @orders @inventory @notifications

    event @request @customer -> @orders
      "Reserve item" kind=call activate=true
    event @check @orders -> @inventory
      "Check availability" kind=call activate=true
    event @availability @inventory -> @orders
      "Availability result" kind=return activate=false

    fragment @result alt "Availability" {
      branch @available "Item available" {
        event @notify @orders -> @notifications
          "Send confirmation" kind=async
        event @confirmed @orders -> @customer
          "Reservation confirmed" kind=return activate=false
      }

      branch @unavailable "Item unavailable" {
        event @declined @orders -> @customer
          "Item unavailable" kind=return activate=false
      }
    }
  }
}
```

- `event` declares a message between existing objects; declaration order determines message order.
- `call`, `return` and `async` distinguish requests, replies and asynchronous messages.
- `activate` controls activation display.
- `fragment alt` contains alternative `branch` paths.
- Sequence messages use `event`; they do not require separate `wire` declarations.

## 5. State diagrams

Shows states, triggering events, transition conditions and effects.

```
canvas 1
collection @job "Job lifecycle" {
  node @queued start "Queued" {}
  node @running state "Running" {}
  node @waiting state "Waiting to retry" {}
  node @succeeded end "Succeeded" {}
  node @failed end "Failed" {}

  wire @begin @queued -> @running
    "claim job" kind=transition
    guard="worker available" effect="increment attempt"

  wire @retry @running -> @waiting
    "attempt failed" kind=transition
    guard="retryable error and attempts remain"

  wire @resume @waiting -> @running
    "retry timer elapsed" kind=transition
    effect="increment attempt"

  wire @complete @running -> @succeeded
    "work completed" kind=transition

  wire @stop @running -> @failed
    "attempt failed" kind=transition
    guard="non-retryable error or no attempts remain"

  section @lifecycle "Job lifecycle" mode=state {
    show @queued @running @waiting @succeeded @failed
    connect @begin @retry @resume @complete @stop
  }
}
```

- A `state` names a condition the subject can remain in.
- A `transition` connects the state before an event to the state afterwards.
- The wire label names the triggering event.
- `guard` states when the transition is permitted; `effect` states its consequence.
- These describe the lifecycle; they do not execute application logic.

## 6. Trees and mind maps

Shows a root and multiple nesting levels through parent-child relationships.

```
canvas 1
collection @repository "Repository structure" {
  node @root concept "project/" size=small {}
  node @src concept "src/" size=small {}
  node @app concept "app.ts" size=small {}
  node @validation concept "validation/" size=small {}
  node @validate concept "validate.ts" size=small {}

  wire @root-src @root -> @src
    "contains" kind=parent
  wire @src-app @src -> @app
    "contains" kind=parent
  wire @src-validation @src -> @validation
    "contains" kind=parent
  wire @validation-file @validation -> @validate
    "contains" kind=parent

  section @tree "Source files" mode=tree direction=down {
    show @root @src @app @validation @validate
    connect @root-src @src-app @src-validation @validation-file
    root @root
  }
}
```

- `root` identifies the starting object.
- `kind=parent` establishes the hierarchy; nesting comes from relationships.
- Folder and file names are labels on nodes, not separate DSL declarations.
- Concept hierarchies use the same constructs with topic labels instead of paths.
- Tree mode does not imply a separate radial mind-map layout.

## 7. Infographics

Shows built-in figures, captions, composition and grouped stages.

```
canvas 1
collection @publishing-story "From draft to publication" {
  node @draft concept "Prepare the draft"
    frame=none composition=media-top {
    figure @art stack layers=some size=large
    text @caption "Collect the material to publish." role=caption
  }

  node @review concept "Review the draft"
    frame=none composition=media-top {
    figure @art gate pass=few size=large
    text @caption "Check the publication requirements." role=caption
  }

  node @publish concept "Publish"
    frame=none composition=media-top {
    figure @art store size=large
    text @caption "Retain the approved document." role=caption
  }

  wire @submit @draft -> @review
    "draft" kind=flow step=1
  wire @approve @review -> @publish
    "approved document" kind=flow step=2

  section @story "Publishing stages" mode=story {
    group @stages "Prepare, review, publish"
      layout=grid columns=3 {
      show @draft @review @publish
    }
    connect @submit @approve
  }
}
```

- `figure` selects built-in artwork; its parameters configure the illustration.
- `composition=media-top` places the illustration above the text.
- `frame=none` removes the surrounding card frame.
- Content IDs such as `@art` are local to their node; the nodes remain distinct.
- Figure settings are illustrative, not measured quantities.

For a custom illustration, add an asset declaration inside the collection:

```
asset @review-art image
  source="./assets/review.svg"
  alt="A document being reviewed"
```

Then **replace the existing `figure @art …` line inside `@review`** with:

```
image @art asset=@review-art size=large
```

This changes the illustration without duplicating the node. Keep its title, caption and relationships in DSL.

## 8. Comparison grids

Shows explicit columns and rows inside a table content block.

```
canvas 1
collection @export-options "Compare export formats" {
  node @formats concept "Choose an export format" {
    table @comparison columns=["Format", "Purpose", "Output"] {
      row @png cells=[
        "PNG",
        "Share a fixed image",
        "Raster image"
      ]
      row @svg cells=[
        "SVG",
        "Scale without raster pixelation",
        "Vector image"
      ]
      row @dsl cells=[
        "DSL",
        "Read and edit diagram semantics",
        "Text source"
      ]
    }
  }

  section @comparison-view "Export options"
    mode=grid layout=grid columns=1 {
    show @formats
  }
}
```

- Table `columns` names the comparison dimensions.
- Each `row` supplies cells in that column order.
- Section `columns=1` controls the arrangement of objects, not table columns.
- One row represents one thing; each column retains the same meaning across rows.
- This is native table content, not an image of a table.