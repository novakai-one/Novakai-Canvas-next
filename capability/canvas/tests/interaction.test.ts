import { describe, it, expect } from 'vitest';
import { sequenceScene, harness, value, step, alpha, beta, group, wire } from './fixtures.js';
describe('Canvas semantic interaction contract', () => {
  it('4 selection, toggling, marquee and keyboard retain scoped appearance identity', () => {
    const { canvas, state } = harness();
    let current = step(canvas, state, {
      kind: 'select',
      targets: [alpha, beta],
      mode: 'replace',
    }).state;
    current = step(canvas, current, { kind: 'select', targets: [alpha], mode: 'toggle' }).state;
    expect(current.selection).toEqual([beta]);
    current = step(canvas, current, {
      kind: 'marquee',
      box: { x: 110, y: 230, width: 150, height: 100 },
      additive: false,
    }).state;
    expect(current.selection).toContainEqual(alpha);
    expect(current.selection).not.toContainEqual(beta);
    const original = state.scene;
    const source = original.sections[0];
    expect(source).toBeDefined();
    if (!source) return;
    const copy = {
      ...source,
      id: 'copy',
      nodes: source.nodes.map((node) => ({
        ...node,
        sectionId: 'copy',
        measured: { ...node.measured, sectionId: 'copy' },
      })),
    };
    const reused = harness([{ ...original, sections: [source, copy] }]);
    const second = { kind: 'node' as const, section: 'copy', id: 'alpha' };
    const both = step(reused.canvas, reused.state, {
      kind: 'select',
      targets: [alpha, second],
      mode: 'replace',
    }).state;
    expect(
      step(reused.canvas, both, { kind: 'select', targets: [alpha], mode: 'toggle' }).state
        .selection,
    ).toEqual([second]);

    const selected = step(canvas, state, {
      kind: 'keyboard',
      id: 'key',
      key: 'ArrowRight',
      alt: false,
      shift: false,
      typing: false,
      modal: false,
    }).state;
    expect(selected.selection).toEqual([group]);
    expect(selected.camera).toBe(state.camera);
    expect(
      step(canvas, current, {
        kind: 'keyboard',
        id: 'key',
        key: 'Delete',
        alt: false,
        shift: false,
        typing: true,
        modal: false,
      }).effects,
    ).toEqual([]);
    expect(
      canvas.transition(state, {
        kind: 'select',
        targets: [{ ...alpha, section: 'other' }],
        mode: 'replace',
      }).ok,
    ).toBe(false);
  });
  it('10 connection and bulk commands emit local intent with current base, never an unlabeled committed wire', () => {
    const { canvas, state } = harness();
    const selected = step(canvas, state, {
      kind: 'select',
      targets: [alpha, beta],
      mode: 'replace',
    }).state;
    for (const kind of ['remove-appearances', 'duplicate'] as const) {
      const result = step(canvas, selected, { kind, id: kind });
      expect(result.effects).toMatchObject([
        {
          kind: 'edit-intent',
          intent: { kind, scope: 'appearance', base: state.stamp, targets: [alpha, beta] },
        },
      ]);
      expect(result.state.scene).toBe(state.scene);
    }
    expect(
      step(canvas, selected, { kind: 'align', id: 'align', axis: 'left' }).effects,
    ).toMatchObject([{ intent: { kind: 'align', axis: 'left' } }]);
    const source = step(canvas, state, {
      kind: 'connect',
      id: 'connect',
      endpoint: { section: 'flow', node: 'alpha', member: 'id' },
    }).state;
    expect(
      step(canvas, source, {
        kind: 'connect',
        id: 'connect',
        endpoint: { section: 'flow', node: 'beta', member: 'id' },
      }).effects,
    ).toMatchObject([
      {
        intent: {
          kind: 'connection',
          source: { node: 'alpha' },
          target: { node: 'beta' },
          base: state.stamp,
        },
      },
    ]);
    expect(
      canvas.transition(state, {
        kind: 'connect',
        id: 'bad',
        endpoint: { section: 'flow', node: 'alpha', member: 'missing' },
      }).ok,
    ).toBe(false);
    expect(
      step(
        canvas,
        step(canvas, state, { kind: 'select', targets: [alpha], mode: 'replace' }).state,
        { kind: 'nudge', id: 'nudge', direction: 'right', coarse: true },
      ).effects,
    ).toMatchObject([{ intent: { entries: [{ target: alpha, placement: { x: 52, y: 40 } }] } }]);
  });
  it('11 reading collapse hides descendants and restores exact editing state without canonical writes', () => {
    const { canvas, state } = harness();
    const selected = step(canvas, state, {
      kind: 'select',
      targets: [alpha],
      mode: 'replace',
    }).state;
    const reading = step(canvas, selected, { kind: 'reading', action: 'enter' }).state;
    const collapsed = step(canvas, reading, { kind: 'collapse', target: group }).state;
    const view = value(canvas.present(collapsed));
    expect(view.nodes.find((node) => node.target.id === 'alpha')?.hidden).toBe(true);
    expect(view.wires.find((edge) => edge.target.id === wire.id)?.hidden).toBe(true);
    const next = step(canvas, collapsed, { kind: 'reading', action: 'next' }).state;
    const restored = step(canvas, next, { kind: 'reading', action: 'exit' }).state;
    expect(restored.camera).toBe(selected.camera);
    expect(restored.selection).toEqual([alpha]);
    expect(restored.scene).toBe(state.scene);
  });
  it('12 accessible outline exposes typed rows, image alternatives, labels and both cardinalities', () => {
    const { canvas, state } = harness([sequenceScene()]);
    const outline = value(canvas.describeAccessibility(state));
    expect(outline[0]?.title).toBe('Engineering');
    expect(outline[0]?.entries.find((entry) => entry.target.id === 'alpha')).toMatchObject({
      description: ['entity', 'alpha', 'id: UUID primary key', 'Image: process icon'],
      endpoints: [{ member: 'id', label: 'id: UUID', direction: 'inout' }],
    });
    expect(outline[0]?.entries.find((entry) => entry.target.kind === 'wire')).toMatchObject({
      label: 'owns',
      description: ['alpha id (exactly one) → beta id (zero or many)'],
    });
    expect(outline[1]?.entries.find((entry) => entry.target.id === 'choice')?.description).toEqual([
      'fragment',
      'parent root',
      'branch none',
      'order 0',
      'Allowed',
      'Denied',
    ]);
    expect(
      outline[1]?.entries.find((entry) => entry.target.id === 'request')?.description,
    ).toContain('branch allowed');
  });
});
