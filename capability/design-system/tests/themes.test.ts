import { tokenId } from '../contract/index.js';
import { describe, it, expect } from 'vitest';
import { resolvedStyle } from '@novakai/canvas-presentation';
import { composeTemplates, digest, type ThemePayload } from '@novakai/canvas-templates';
import {
  system,
  sources,
  preferences,
  environment,
  fonts,
  diagramPin,
  must,
  rejected,
  ui,
  diagram,
  portable,
  themeRequest,
  color,
} from './fixtures.js';
/** The bridge proves the portable structural contract through Templates' actual schema/admission. */
function templatePayload(value: ReturnType<typeof portable>): ThemePayload {
  return {
    ...value,
    tokens: Object.fromEntries(
      Object.entries(value.tokens).map(([id, token]) => [
        id,
        token.type === 'font' ? { ...token, digest: digest.parse(token.digest) } : token,
      ]),
    ),
    fonts: value.fonts.map((font) => digest.parse(font)),
    base: null,
  };
}
describe('Design System themes', () => {
  it('5 validates paper/ink states, composited alpha and rejects inaccessible deltas', () => {
    for (const scheme of ['light', 'dark']) {
      const resolved = must(ui({ environment: { ...environment, scheme } }));
      expect(resolved.contrast.length).toBeGreaterThan(20);
      expect(resolved.contrast.every((pair) => pair.ratio >= pair.required)).toBe(true);
    }
    rejected(system.resolveTheme(themeRequest({ 'text.primary': color(1, 1, 1) })), 'contrast');
    const alpha = portable({ 'text.secondary': color(0, 0, 0, 0.8) });
    expect(alpha.tokens['text.secondary']).toEqual({ type: 'color', value: '#000000cc' });
    must(diagram('diagram', alpha));
    rejected(
      system.resolveTheme(themeRequest({ 'surface.base': color(1, 1, 1, 0.9) })),
      'contrast',
    );
  });
  it('6 requires admitted font bytes, prevents CSS injection, and disables export motion', () => {
    const theme = portable();
    rejected(
      system.resolve({ scope: 'diagram', sources: sources(), theme, fonts: [], pin: diagramPin }),
      'missing-font',
    );
    rejected(
      system.resolveTheme({
        sources: sources(),
        theme: {
          base: { kind: 'ui', pin: must(ui()).provenance.ui },
          overrides: {},
          fonts: { ...fonts, body: { ...fonts.body, approved: false } },
        },
      }),
    );
    rejected(system.resolveTheme(themeRequest({ 'font.body': ['Inter; color:red'] })));
    const exported = must(diagram('export'));
    expect(exported.css['--nv-motion-duration']).toBe('0ms');
    expect(exported.css['--nv-camera-duration']).toBe('0ms');
    const normal = must(diagram());
    expect(exported.values[tokenId.parse('type.base')]).toEqual(
      normal.values[tokenId.parse('type.base')],
    );
    expect(must(system.projectDiagram(normal)).bodyFont).toEqual({
      family: 'Inter',
      digest: 'a'.repeat(64),
    });
  });
  it('7 freezes color bytes and role paints across public consumers; rejects stale preferences/pins', () => {
    const payload = portable({ 'text.secondary': color(0.101, 0.201, 0.301, 0.9) });
    expect(payload.tokens['text.secondary']).toEqual({ type: 'color', value: '#1a334de6' });
    const checked = must(diagram('diagram', payload));
    const style = must(system.projectDiagram(checked));
    expect(resolvedStyle.safeParse(style).success).toBe(true);
    expect(style.typography.sectionHeading.size).toBeCloseTo(27.428576, 6);
    expect(style.typography.nodeHeading.size).toBeCloseTo(22.857136, 6);
    expect(style.typography.body.size).toBe(16);
    expect(style.typography.mono.size).toBe(16);
    expect(style.typography.annotation.size).toBeCloseTo(13.714288, 6);
    expect(style.typography.sectionHeading.lineHeight).toBeCloseTo(41.142864, 6);
    expect(style.typography.nodeHeading.lineHeight).toBeCloseTo(34.285704, 6);
    expect(style.typography.body.lineHeight).toBe(24);
    expect(style.typography.mono.lineHeight).toBe(24);
    expect(style.typography.annotation.lineHeight).toBeCloseTo(20.571432, 6);
    expect(style.typography.mono.font).toEqual(style.monoFont);
    expect(style.typography.sectionHeading.font).toEqual(style.bodyFont);
    expect(style.contentSizing).toEqual({
      widths: {
        small: { preferred: 180, maximum: 240 },
        medium: { preferred: 240, maximum: 320 },
        large: { preferred: 320, maximum: 500 },
      },
      rowMinimum: 32,
      iconBox: { small: 24, medium: 32, large: 48 },
      figureBox: { small: 96, medium: 128, large: 192 },
    });
    expect(resolvedStyle.safeParse({ ...style, fontSize: 14 }).success).toBe(false);
    expect(
      resolvedStyle.safeParse({
        ...style,
        typography: {
          ...style.typography,
          nodeHeading: { ...style.typography.nodeHeading, font: style.monoFont },
        },
      }).success,
    ).toBe(false);
    const oversizedTitle = {
      ...checked,
      values: {
        ...checked.values,
        'font.title': { type: 'dimension' as const, value: 1.7e308, unit: 'px' as const },
      },
      css: { ...checked.css, '--nv-font-title': '1.7e+308px' },
    };
    rejected(system.projectDiagram(oversizedTitle), 'invalid-input');
    expect(
      resolvedStyle.safeParse({
        ...style,
        contentSizing: {
          ...style.contentSizing,
          widths: { ...style.contentSizing.widths, small: { preferred: 200, maximum: 100 } },
        },
      }).success,
    ).toBe(false);

    expect(style.roles.neutral).toEqual({ fill: '#ffffff', stroke: '#526170', text: '#17212b' });
    expect(style.roles.primary).toEqual({ fill: '#355ccd', stroke: '#355ccd', text: '#ffffff' });
    const templates = composeTemplates({
      recipe: {
        inspect: () => {
          throw new TypeError('Recipe must not be invoked by this theme-only fixture');
        },
        expand: () => {
          throw new TypeError('Recipe must not be invoked by this theme-only fixture');
        },
      },
      theme: { resolve: () => ({ ok: true, value: templatePayload(payload) }) },
    });
    const admitted = templates.validatePreset([], {
      schemaVersion: 1,
      id: 'paper',
      version: '1.0.0',
      title: 'Paper',
      description: '',
      kind: 'theme',
      raw: {},
    });
    expect(admitted.ok).toBe(true);
    rejected(ui({ preferences: { ...preferences, schemaVersion: 2 } }));
    rejected(ui({ preferences: { ...preferences, unknown: true } }));
    const pin = must(ui()).provenance.ui;
    rejected(
      ui({
        preferences: {
          ...preferences,
          theme: { mode: 'pinned', theme: { ...pin, digest: 'd'.repeat(64) } },
        },
      }),
      'stale-pin',
    );
    const pinned = must(
      ui({
        preferences: { ...preferences, theme: { mode: 'pinned', theme: pin } },
        environment: { ...environment, scheme: 'dark' },
      }),
    );
    expect(pinned.css['--nv-surface-base']).toBe('#f4f6f8');
    rejected(system.resolveTheme(themeRequest({ 'unknown.token': 1 })), 'unknown-token');
  });
});
