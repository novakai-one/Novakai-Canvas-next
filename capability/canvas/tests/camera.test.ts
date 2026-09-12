import { describe, it, expect } from 'vitest';
import { createCanvas, defaultProfile } from '../contract/index.js';
import { harness, scene, admission, value, step, alpha } from './fixtures.js';
describe('Canvas camera contract', () => {
  it('1 initial fit is separate from restored camera and non-navigation updates', () => {
    const original = scene();
    const next = scene(1);
    const canvas = createCanvas({ sceneAdmission: admission([original, next]) });
    const state = value(
      canvas.open({
        scene: original,
        expected: { collectionId: 'demo', revision: 0, inputKey: 'scene-0', generation: 0 },
        viewport: { width: 800, height: 600 },
      }),
    );
    expect(state.camera.zoom).toBeCloseTo(736 / 560);
    const selected = step(canvas, state, {
      kind: 'select',
      targets: [alpha],
      mode: 'replace',
    }).state;
    const inspected = step(canvas, selected, { kind: 'inspect', target: alpha });
    expect(inspected.state.camera).toBe(state.camera);
    expect(inspected.effects[0]?.kind).toBe('inspect-request');
    const stamp = { collectionId: 'demo', revision: 1, inputKey: 'scene-1', generation: 1 };
    const requested = step(canvas, selected, { kind: 'expect-scene', stamp }).state;
    expect(
      step(canvas, requested, { kind: 'receive-scene', stamp, scene: next }).state.camera,
    ).toBe(state.camera);
    expect(harness().state.camera).toEqual({
      x: 0,
      y: 0,
      zoom: 1,
      viewport: { width: 800, height: 600 },
    });
  });
  it('2 pointer zoom and dock resize preserve independently calculated world anchors', () => {
    const { canvas, state } = harness();
    const zoomed = step(canvas, state, {
      kind: 'zoom',
      factor: 2,
      pointer: { x: 300, y: 200 },
    }).state;
    expect(zoomed.camera).toEqual({
      x: -300,
      y: -200,
      zoom: 2,
      viewport: { width: 800, height: 600 },
    });
    const resized = step(canvas, zoomed, {
      kind: 'resize-viewport',
      viewport: { width: 1000, height: 700 },
    }).state;
    expect(resized.camera).toEqual({
      x: -200,
      y: -150,
      zoom: 2,
      viewport: { width: 1000, height: 700 },
    });
    expect(
      step(canvas, state, { kind: 'zoom', factor: 100, pointer: { x: 0, y: 0 } }).state.camera.zoom,
    ).toBe(4);
    expect(
      step(canvas, state, { kind: 'zoom', factor: 0.001, pointer: { x: 0, y: 0 } }).state.camera
        .zoom,
    ).toBe(0.01);
  });
  it('3 normalized gesture precedence preserves typing and threshold clicks', () => {
    const { canvas } = harness();
    const base = {
      tool: 'select',
      pointer: 'fine',
      button: 'primary',
      shift: false,
      space: false,
      typing: false,
      interactive: false,
      target: 'blank',
      distance: 0,
    };
    expect(value(canvas.gesture(base))).toBe('pan');
    expect(value(canvas.gesture({ ...base, shift: true }))).toBe('marquee');
    expect(value(canvas.gesture({ ...base, button: 'middle', target: 'node' }))).toBe('pan');
    expect(value(canvas.gesture({ ...base, space: true, target: 'node' }))).toBe('pan');
    expect(value(canvas.gesture({ ...base, space: true, typing: true }))).toBe('ignore');
    expect(value(canvas.gesture({ ...base, tool: 'hand', interactive: true }))).toBe('ignore');
    expect(value(canvas.gesture({ ...base, target: 'node', distance: 3 }))).toBe('select');
    expect(value(canvas.gesture({ ...base, target: 'node', distance: 4 }))).toBe('move');
    expect(value(canvas.gesture({ ...base, target: 'node', pointer: 'coarse', distance: 7 }))).toBe(
      'select',
    );
    expect(value(canvas.gesture({ ...base, target: 'node', pointer: 'coarse', distance: 8 }))).toBe(
      'move',
    );
    expect(value(canvas.gesture(base, { ...defaultProfile, blankDrag: 'marquee' }))).toBe(
      'marquee',
    );
  });
});
