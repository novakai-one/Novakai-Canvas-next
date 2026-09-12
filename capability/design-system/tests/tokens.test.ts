import { describe, it, expect } from 'vitest';
import {
  system,
  sources,
  preferences,
  environment,
  must,
  rejected,
  ui,
  diagram,
  replacePath,
} from './fixtures.js';
describe('Design System tokens', () => {
  it('1 resolves sixteen exact primary defaults, inherited types and both reference forms immutably', () => {
    const input = sources();
    const before = JSON.stringify(input);
    const resolved = must(ui({ sources: input }));
    expect(resolved.primary).toHaveLength(16);
    expect(resolved.primary.map((id) => resolved.values[id]?.value)).toEqual([
      '#f4f6f8',
      '#ffffff',
      '#17212b',
      '#526170',
      '#bbc5d0',
      '#355ccd',
      '#ffffff',
      ['system-ui', 'sans-serif'],
      ['ui-monospace', 'monospace'],
      14,
      4,
      36,
      6,
      1,
      120,
      0.12,
    ]);
    const definitions = replacePath(input.definitions, ['sample'], {
      $type: 'dimension',
      a: { $value: { value: 7, unit: 'px' } },
      b: { $value: '{sample.a}' },
      c: { $value: { $ref: '#/sample/a/$value' } },
    });
    const inherited = must(ui({ sources: { ...input, definitions } }));
    expect(inherited.values['sample.c']).toEqual({ type: 'dimension', value: 7, unit: 'px' });
    expect(inherited.values['sample.b']).toEqual(inherited.values['sample.c']);
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(resolved.values)).toBe(true);
    expect(must(ui()).digest).toBe(resolved.digest);
  });
  it('2 rejects unknown references, unsupported types, cycles, mixed units, arity and bounds', () => {
    const input = sources();
    const variants = [
      { $type: 'dimension', $value: '{absent.value}' },
      { $type: 'unsupported', $value: 1 },
      { $type: 'dimension', $value: '{sample.a}' },
      { $type: 'dimension', $value: { value: Infinity, unit: 'px' } },
      {
        $type: 'dimension',
        $value: null,
        $extensions: {
          novakai: { recipe: { op: 'sum', values: [{ op: 'reference', value: '{type.base}' }] } },
        },
      },
      {
        $type: 'dimension',
        $value: null,
        $extensions: {
          novakai: {
            recipe: {
              op: 'sum',
              values: [
                { op: 'reference', value: '{type.base}' },
                { op: 'reference', value: '{shadow.strength}' },
              ],
            },
          },
        },
      },
    ];
    variants.forEach((value) =>
      rejected(
        ui({
          sources: {
            ...input,
            definitions: replacePath(input.definitions, ['sample', 'a'], value),
          },
        }),
      ),
    );
    rejected(ui({ preferences: { ...preferences, textSize: 30 } }), 'invalid-input');
    rejected(
      ui({
        sources: {
          ...input,
          definitions: replacePath(input.definitions, ['extra'], {
            $type: 'dimension',
            $value: { value: 1, unit: 'em' },
          }),
        },
      }),
    );
    const chain = Object.fromEntries(
      Array.from({ length: 66 }, (_, index) => [
        'n' + index,
        {
          $type: 'dimension',
          $value: index === 65 ? { value: 1, unit: 'px' } : '{chain.n' + (index + 1) + '}',
        },
      ]),
    );
    rejected(
      ui({ sources: { ...input, definitions: replacePath(input.definitions, ['chain'], chain) } }),
      'limit',
    );
    rejected(system.readSources({ ...input, definitions: 'x'.repeat(4 * 1024 * 1024) }), 'limit');
  });
  it('3 emits complete matching CSS/numeric derivations on every scope', () => {
    const resolved = must(ui());
    expect(resolved.css['--nv-space-2']).toBe('8px');
    expect(resolved.css['--nv-control-height']).toBe('36px');
    expect(resolved.css['--nv-diagram-row-min']).toBe('29px');
    const larger = must(ui({ preferences: { ...preferences, textSize: 20, density: 'spacious' } }));
    expect(larger.css['--nv-control-height']).toBe('44px');
    expect(larger.css['--nv-diagram-row-min']).toBe('42px');
    expect(Object.keys(larger.css)).toEqual(Object.keys(resolved.css));
    const pinned = must(diagram());
    expect(pinned.values['diagram.widthSmall']?.value).toBe(180);
    expect(pinned.values['diagram.widthMedium']?.value).toBe(240);
    expect(pinned.values['diagram.widthLarge']?.value).toBe(320);
    expect(pinned.css['--nv-diagram-edge-stroke']).toBe('2px');
  });
  it('4 respects density, text and pointer floors plus OS motion without changing diagram identity', () => {
    const initial = must(diagram());
    const compact = must(ui({ preferences: { ...preferences, density: 'compact' } }));
    expect(compact.css['--nv-space-unit']).toBe('3px');
    expect(compact.css['--nv-control-height']).toBe('36px');
    const coarse = must(
      ui({
        environment: { ...environment, pointer: 'coarse', reducedMotion: true },
        preferences: { ...preferences, motion: 'full' },
      }),
    );
    expect(coarse.css['--nv-control-height']).toBe('44px');
    expect(coarse.css['--nv-motion-duration']).toBe('0ms');
    expect(coarse.css['--nv-camera-duration']).toBe('0ms');
    must(
      ui({
        environment: { ...environment, scheme: 'dark' },
        preferences: { ...preferences, textSize: 20, density: 'spacious' },
      }),
    );
    expect(must(diagram()).digest).toBe(initial.digest);
  });
});
