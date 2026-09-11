# Capability: templates — Target repository tree

**Responsibility:** own immutable versioned recipe/theme identity, admission plans, discovery, exact pin resolution and independent recipe expansion.

**Consumers:** Authoring admits preset records/applies expanded intent; UI/CLI list/preview recipes; Presentation/DesignSystem request exact themes; Export/backup retain pinned records. Pure core; no writes, network, UI or hidden live inheritance.

```text
capability/templates/
├── contract/
│   ├── api.ts · compose.ts · index.ts
│   ├── brands.ts · errors.ts · types.ts
│   ├── records/preset.ts
│   └── ports/{codecs,identity}.ts
├── core/
│   ├── validation/{catalog,outcomes}.ts
│   ├── admission/plan.ts
│   ├── discovery/select.ts
│   └── expansion/instantiate.ts
├── adapters/identity.ts
└── tests/{fixtures,presets.test,expansion.test}.ts
```

Shipped source assets: resources/recipes/{er,modules,sop,mindmap,sequence,infographic}.canvas; manifest records their family/version. Language validates/lowers these actual sources during host integration. Theme roots belong to DesignSystem token assets. No fake parser, theme resolver or default expansion provider is supplied by Templates.

Imports: external consumers→contract/index only; core→own core/declaration contracts; compose→own identity adapter; no core cross-capability import. Host injects Language and DesignSystem public-contract bridges. Construction performs no I/O.
