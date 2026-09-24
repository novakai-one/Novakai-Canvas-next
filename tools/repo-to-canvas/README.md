# Repository to Canvas DSL

One module node per source file; public function members inside it; nested directory groups; wires for static function imports and reexports. Function-valued constants count as functions. Types, data constants and private functions do not become members. Positions and routes are entirely app-owned.

```sh
node --import tsx tools/repo-to-canvas/index.ts /path/to/repo --out .novakai/repository.canvas
pnpm canvas preview .novakai/repository.canvas --request repo-preview \
  --server http://127.0.0.1:5210 --workspace .novakai/walkthrough
pnpm canvas apply repo-preview --server http://127.0.0.1:5210 --workspace .novakai/walkthrough
```

| Option | Purpose |
|---|---|
| `--out FILE` | Write DSL; otherwise stdout. Parent directory must exist. |
| `--source-root PATH` | Select a subtree relative to the repository root. |
| `--tsconfig PATH` | Choose compiler resolution options; defaults to root `tsconfig.json`. For solution configs, choose the relevant referenced config explicitly. |
| `--include-tests` | Include test/spec files and fixture directories. |

Git repositories use tracked plus non-ignored untracked files. Other directories use a filesystem walk. Both exclude dependency folders, declarations, local state, generated folders, and tests by default. Gitignored build output is excluded; tracked source under a directory called `build` remains eligible. Only selected files become nodes; following an import never silently widens the selected scope.

JSON on stderr reports `nodes`, `wires`, `extractionMs`, and counts of external, non-code, outside-scope, unresolved and unsupported module declarations. These counts explain omissions; extraction time is **not** application load time. `unresolved` means TypeScript could not resolve a source dependency. No repository scripts are executed.

Named/default imports, callable aliases, direct namespace imports and ordinary barrel exports are supported. A namespace import connects to each exposed function, whether or not it is called. Dynamic imports, CommonJS `require`, class methods and namespace reexports are outside this ESM function-map scope. Namespace reexports are counted as unsupported. This is not a runtime call graph or a claim of whole-program behavioral analysis.

Stable IDs derive from relative paths and export names. The same selected source and compiler environment produce the same DSL. The collection ID is `repository`; use the normal revision-aware replace workflow to update it.

The renderer currently admits at most 1,000 projected nodes and 1,500 wires per collection. This script never truncates a graph to fit. Keep oversized generated DSL for inspection, or explicitly choose a smaller source root. No generated repository DSL belongs in the project README.
