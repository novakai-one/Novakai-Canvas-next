import { it, describe, expect } from 'vitest';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createTokenFileBindings,
  createStylesheetBindings,
  type ArtifactSet,
} from '../contract/index.js';
import { createSha256 } from '../adapters/hash/sha256.js';
import { system, sources, must, rejected, ui, object } from './fixtures.js';
/** Read actual authored CSS; generated styles are excluded from the declared denominator. */
async function componentStyles(
  directory: string,
): Promise<readonly { readonly file: string; readonly css: string }[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) return componentStyles(file);
      if (!file.endsWith('.module.css')) return [];
      return [{ file, css: await readFile(file, 'utf8') }];
    }),
  );
  return nested.flat();
}
describe('Design System artifacts', () => {
  it('8 compiles reproducible CSS/TS snapshots, matching breakpoints and real SHA256 bytes', async () => {
    const compiled = must(system.compile(sources()));
    expect(compiled.files).toHaveLength(7);
    expect(must(system.compile(sources()))).toEqual(compiled);
    const files = must(await createTokenFileBindings(new URL('..', import.meta.url).pathname));
    expect(must(await files.verifySnapshots(compiled))).toEqual([]);
    const css = compiled.files.find((file) => file.path.endsWith('layout.generated.css'))?.content;
    const ts = compiled.files.find((file) => file.path.endsWith('breakpoints.ts'))?.content;
    expect(css).toContain('min-width: 800px');
    expect(css).toContain('min-width: 1200px');
    expect(ts).toContain('800');
    expect(ts).toContain('1200');
    expect(must(createSha256().hash('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
  it('9 publishes immutable generations atomically, replays safely and retains old manifest on failure', async () => {
    const root = await mkdtemp(join(tmpdir(), 'canvas-tokens-'));
    try {
      const files = must(await createTokenFileBindings(root));
      const first = must(system.compile(sources()));
      const published = must(await files.artifacts.publish(first));
      expect(must(await files.artifacts.publish(first))).toEqual(published);
      expect(must(await files.readActive())).toEqual(first);
      const unsafe: ArtifactSet = {
        ...first,
        files: first.files.map((file, index) =>
          index === 0 ? { ...file, path: '../../escape.css' } : file,
        ),
      };
      rejected(await files.artifacts.publish(unsafe));
      expect(must(await files.readActive()).digest).toBe(first.digest);
      const nextSource = {
        ...sources(),
        definitionVersion: '1.0.1',
        themes: sources().themes.map((theme) => ({ ...object(theme), baseVersion: '1.0.1' })),
      };
      const next = must(system.compile(nextSource));
      await writeFile(join(root, '.generated', next.digest), 'blocked');
      rejected(await files.artifacts.publish(next), 'io-failure');
      expect(must(await files.readActive()).digest).toBe(first.digest);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it('14 counts all authored visual values and traces primary roots without padding generated output', async () => {
    const parser = must(await createStylesheetBindings());
    const sample = must(
      parser.read([
        {
          file: 'sample.module.css',
          css: '@layer components { .a { color:var(--nv-color-content); gap:var(--nv-space-2); outline:var(--nv-focus-width) solid var(--nv-color-input-boundary); width:100%; display:flex; font-size:18px; } }',
        },
      ]),
    );
    const coverage = must(system.auditStyles(sample, must(ui())));
    expect(coverage).toMatchObject({ denominator: 4, primary: 2, tokenized: 3, excluded: 2 });
    expect(coverage.violations.map((item) => item.reason)).toEqual(['visual-literal:18px']);
    const invalid = must(
      parser.read([{ file: 'bad.css', css: '.a { color:var(--not-known) !important; }' }]),
    );
    expect(
      must(system.auditStyles(invalid, must(ui()))).violations.map((item) => item.reason),
    ).toEqual([
      'unlayered-or-unknown-layer',
      'important-not-permitted',
      'unknown-variable:--not-known',
    ]);
    const platform = must(
      parser.read([
        {
          file: 'platform.css',
          css: '@layer components { .sheet { max-height:calc(100dvh * var(--nv-sheet-maximum)); padding-bottom:max(var(--nv-space-4), env(safe-area-inset-bottom)); } .bad { height:70dvh; padding-bottom:env(safe-area-inset-bottom, 12px); } }',
        },
      ]),
    );
    const platformAudit = must(system.auditStyles(platform, must(ui())));
    expect(platformAudit.violations.filter((item) => item.selector === '.sheet')).toEqual([]);
    expect(platformAudit.violations.map((item) => item.reason)).toContain('visual-literal:70dvh');
    expect(platformAudit.violations.map((item) => item.reason)).toContain('visual-literal:12px');
    const actual = must(
      parser.read(await componentStyles(new URL('../adapters/react', import.meta.url).pathname)),
    );
    const measured = must(system.auditStyles(actual, must(ui())));
    expect(measured.violations).toEqual([]);
    expect(measured.primaryRatio).toBeGreaterThan(0.8);
    expect(measured.tokenRatio).toBeGreaterThanOrEqual(0.95);
    expect(measured.denominator).toBeGreaterThan(100);
  });
});
