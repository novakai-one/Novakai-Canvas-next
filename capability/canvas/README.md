# Canvas

Owns interactive scene viewing and recoverable geometry intents. React Flow renders actual custom nodes and edges; Presentation supplies measured notation.

Use `createCanvas({sceneAdmission})` for pure operations, `createSession` for an observable session, and explicit `createReactBindings` for browser rendering. Compose once. Scene admission must bind validated Layout/Presentation results; no fallback renderer exists.

Host drains effects after every dispatch, forwards successful diagnostics, submits edits through Authoring and retains durable recovery. Identical accepted edit IDs do not enqueue twice; conflicting reuse rejects. Pan/select events remain repeatable. Session admits at most10,000 edit identities; preserve drafts before opening a replacement session.

Pointer metadata and reading/camera/selection are session state. Only emitted placement/route intents can become persisted constraints. React Flow records never enter persistence.

16 in-process contract cases include mounted drag/route behavior and real shared renderers. These do not certify browser UX. Visible-browser acceptance and per-file standards release gates remain tracked in WORK-PLAN.md.
