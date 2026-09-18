/** Amendment-5 evidence regeneration CLI edge. Node reports publication failures; rerun overwrites both artifacts after any partial write. */
import { readdirSync, readFileSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractAuthoringScene } from '../../../../apps/web/cli/extract-authoring-scene.js';

const result = extractAuthoringScene(
  {
    readFile: (path) => readFileSync(path, 'utf8'),
    readdir: (path) => readdirSync(path, { withFileTypes: true }),
    realpath: realpathSync,
  },
  resolve('capability/authoring'),
);
if (!result.ok) {
  console.error(result.error);
  process.exitCode = 1;
} else {
  const destination = resolve('output/playwright/nested-wires/authoring-scene');
  const { spec, manifest } = result.value;
  mkdirSync(destination, { recursive: true });
  writeFileSync(resolve(destination, 'scene-spec.json'), JSON.stringify(spec, null, 2) + '\n');
  writeFileSync(
    resolve(destination, 'extraction-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  console.log(
    `EXTRACTED nodes=${manifest.nodes.length}; sections=${spec.directories.length}; wires=${manifest.wires.length}; excluded type-only imports=${manifest.excludedTypeOnlyImports}; excluded type symbols=${manifest.excludedTypeSymbols}; external imports=${manifest.external.length}`,
  );
}
