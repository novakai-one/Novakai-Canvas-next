import { describe, it, expect } from 'vitest';
import { harness, step, begin, alpha, group, section, wire, value } from './fixtures.js';
describe('Canvas geometry draft contract', () => {
  it('5 repeated previews coalesce into one local intent; cancel and no-op have no effects', () => {
    const { canvas, state } = harness();
    const started = begin(canvas, state);
    const first = step(canvas, started, { kind: 'move', id: 'drag', delta: { x: 10, y: 20 } });
    const final = step(canvas, first.state, { kind: 'move', id: 'drag', delta: { x: 30, y: 40 } });
    expect(first.effects).toEqual([]);
    expect(final.effects).toEqual([]);
    expect(final.state.scene).toBe(state.scene);
    const finished = step(canvas, final.state, { kind: 'finish', id: 'drag' });
    expect(finished.effects).toEqual([
      {
        kind: 'edit-intent',
        intent: {
          kind: 'placement',
          id: 'drag',
          base: state.stamp,
          scope: 'appearance',
          entries: [{ target: alpha, placement: { x: 50, y: 80, locked: false } }],
        },
      },
    ]);
    expect(canvas.transition(finished.state, { kind: 'finish', id: 'drag' }).ok).toBe(false);
    expect(step(canvas, started, { kind: 'finish', id: 'drag' }).effects).toEqual([]);
    expect(step(canvas, final.state, { kind: 'cancel', id: 'drag' }).effects).toEqual([]);
    expect(step(canvas, final.state, { kind: 'escape' }).state.draft).toBeNull();
  });
  it('6 selected ancestor moves descendants once and section origins remain distinct from frame bounds', () => {
    const { canvas, state } = harness();
    const started = begin(canvas, state, [group, alpha]);
    const moved = step(canvas, started, {
      kind: 'move',
      id: 'drag',
      delta: { x: 25, y: 30 },
    }).state;
    const view = value(canvas.present(moved));
    expect(view.nodes.find((node) => node.target.id === 'alpha')?.box).toMatchObject({
      x: 145,
      y: 270,
    });
    expect(step(canvas, moved, { kind: 'finish', id: 'drag' }).effects).toMatchObject([
      { intent: { entries: [{ target: group, placement: { x: 25, y: 30 } }] } },
    ]);
    const whole = step(canvas, begin(canvas, state, [section]), {
      kind: 'move',
      id: 'drag',
      delta: { x: 25, y: 30 },
    }).state;
    expect(step(canvas, whole, { kind: 'finish', id: 'drag' }).effects).toMatchObject([
      { intent: { entries: [{ target: section, placement: { x: 125, y: 230 } }] } },
    ]);
    const resize = step(canvas, state, {
      kind: 'begin',
      id: 'resize',
      gesture: 'resize',
      targets: [alpha],
    }).state;
    const resized = step(canvas, resize, {
      kind: 'resize',
      id: 'resize',
      box: { x: 120, y: 240, width: 1, height: 1 },
    }).state;
    expect(resized.draft).toMatchObject({
      current: [{ box: { width: 120, height: 60 } }],
      changed: false,
    });
    const expanded = step(canvas, resize, {
      kind: 'resize',
      id: 'resize',
      box: { x: 140, y: 250, width: 160, height: 80 },
    }).state;
    expect(step(canvas, expanded, { kind: 'finish', id: 'resize' }).effects).toMatchObject([
      {
        kind: 'edit-intent',
        intent: {
          kind: 'placement',
          entries: [{ target: alpha, placement: { x: 40, y: 50, width: 160, height: 80 } }],
        },
      },
    ]);
  });
  it('7 route edits retain section-local points and side controls in one intent', () => {
    const { canvas, state } = harness();
    const started = step(canvas, state, {
      kind: 'begin',
      id: 'route',
      gesture: 'route',
      targets: [wire],
    }).state;
    const points = [
      { x: 140, y: 70 },
      { x: 200, y: 70 },
      { x: 200, y: 100 },
      { x: 380, y: 100 },
      { x: 380, y: 70 },
    ];
    const updated = step(canvas, started, {
      kind: 'route',
      id: 'route',
      points,
      sourceSide: 'right',
      targetSide: 'left',
      locked: true,
    }).state;
    expect(step(canvas, updated, { kind: 'finish', id: 'route' }).effects).toMatchObject([
      { intent: { kind: 'route', target: wire, route: { points, locked: true } } },
    ]);
    expect(
      canvas.transition(started, {
        kind: 'route',
        id: 'route',
        points: [{ x: 0, y: 0 }],
        sourceSide: 'auto',
        targetSide: 'auto',
        locked: false,
      }).ok,
    ).toBe(false);
    expect(
      canvas.transition(started, {
        kind: 'route',
        id: 'wrong',
        points,
        sourceSide: 'auto',
        targetSide: 'auto',
        locked: false,
      }).ok,
    ).toBe(false);
  });
  it('9 pending/read-only/disconnected states cannot authorize edits and only matching confirmation clears recovery', () => {
    const { canvas, state } = harness();
    const finished = step(
      canvas,
      step(canvas, begin(canvas, state), { kind: 'move', id: 'drag', delta: { x: 8, y: 0 } }).state,
      { kind: 'finish', id: 'drag' },
    ).state;
    const rejected = step(canvas, finished, {
      kind: 'reject',
      id: 'drag',
      message: 'Conflict',
    }).state;
    expect(rejected.recovery[0]).toMatchObject({ reason: 'rejected', message: 'Conflict' });
    expect(step(canvas, rejected, { kind: 'confirmed', id: 'other' }).state.recovery).toHaveLength(
      1,
    );
    expect(step(canvas, rejected, { kind: 'confirmed', id: 'drag' }).state.recovery).toHaveLength(
      0,
    );
    const disconnected = step(canvas, begin(canvas, state), {
      kind: 'connected',
      value: false,
    }).state;
    expect(disconnected.recovery[0]?.reason).toBe('disconnected');
    expect(disconnected.draft).toBeNull();
    expect(
      canvas.transition(disconnected, {
        kind: 'begin',
        id: 'new',
        gesture: 'move',
        targets: [alpha],
      }).ok,
    ).toBe(false);
    const pending = step(canvas, state, { kind: 'mutation-available', value: false }).state;
    expect(canvas.transition(pending, { kind: 'duplicate', id: 'new' }).ok).toBe(false);
    const viewer = harness(undefined, true);
    const enabled = step(viewer.canvas, viewer.state, {
      kind: 'mutation-available',
      value: true,
    }).state;
    expect(
      viewer.canvas.transition(enabled, {
        kind: 'begin',
        id: 'new',
        gesture: 'move',
        targets: [alpha],
      }).ok,
    ).toBe(false);
    expect(
      step(viewer.canvas, enabled, { kind: 'pan', delta: { x: 12, y: 0 } }).state.camera.x,
    ).toBe(12);
  });
});
