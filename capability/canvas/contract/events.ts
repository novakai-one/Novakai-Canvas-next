import { z } from 'zod';
import { identity } from './brands.js';
import { point, box, camera, viewport } from './records/camera.js';
import { target, selection } from './records/selection.js';
import { stamp } from './records/scene.js';
import { endpoint } from './records/intent.js';
const side = z.enum(['preserve', 'auto', 'top', 'right', 'bottom', 'left']);
export const event = z
  .discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('pan'), delta: point }),
    z.strictObject({ kind: z.literal('viewport'), camera }),
    z.strictObject({
      kind: z.literal('zoom'),
      factor: z.number().finite().positive().max(100),
      pointer: point,
    }),
    z.strictObject({ kind: z.literal('fit'), target: target.nullable() }),
    z.strictObject({ kind: z.literal('locate'), target }),
    z.strictObject({ kind: z.literal('resize-viewport'), viewport }),
    z.strictObject({
      kind: z.literal('select'),
      targets: selection,
      mode: z.enum(['replace', 'toggle', 'add']),
    }),
    z.strictObject({ kind: z.literal('marquee'), box, additive: z.boolean() }),
    z.strictObject({ kind: z.literal('tool'), tool: z.enum(['select', 'hand', 'connect']) }),
    z.strictObject({ kind: z.literal('inspect'), target }),
    z.strictObject({
      kind: z.literal('begin'),
      id: identity,
      gesture: z.enum(['move', 'resize', 'route']),
      targets: selection,
    }),
    z.strictObject({ kind: z.literal('move'), id: identity, delta: point }),
    z.strictObject({ kind: z.literal('resize'), id: identity, box }),
    z.strictObject({
      kind: z.literal('route'),
      id: identity,
      points: z.array(point).min(2).max(10000).readonly(),
      sourceSide: side,
      targetSide: side,
      locked: z.union([z.boolean(), z.literal('preserve')]),
    }),
    z.strictObject({
      kind: z.literal('preview-routes'),
      id: identity,
      wires: z
        .array(
          z
            .strictObject({
              id: identity,
              points: z.array(point).min(2).max(10000).readonly(),
              labelBox: z.union([
                box,
                point
                  .unwrap()
                  .extend({ width: z.literal(0), height: z.literal(0) })
                  .readonly(),
              ]),
            })
            .readonly(),
        )
        .max(10000)
        .readonly(),
    }),
    z.strictObject({ kind: z.literal('finish'), id: identity }),
    z.strictObject({ kind: z.literal('cancel'), id: identity }),
    z.strictObject({
      kind: z.literal('reject'),
      id: identity,
      message: z.string().min(1).max(2000),
    }),
    z.strictObject({ kind: z.literal('confirmed'), id: identity }),
    z.strictObject({ kind: z.literal('discard'), id: identity }),
    z.strictObject({ kind: z.literal('expect-scene'), stamp }),
    z.strictObject({ kind: z.literal('receive-scene'), stamp, scene: z.unknown() }),
    z.strictObject({ kind: z.literal('connected'), value: z.boolean() }),
    z.strictObject({ kind: z.literal('mutation-available'), value: z.boolean() }),
    z.strictObject({ kind: z.literal('connect'), id: identity, endpoint }),
    z.strictObject({ kind: z.literal('remove-appearances'), id: identity }),
    z.strictObject({ kind: z.literal('duplicate'), id: identity }),
    z.strictObject({
      kind: z.literal('align'),
      id: identity,
      axis: z.enum(['left', 'center', 'right', 'top', 'middle', 'bottom']),
    }),
    z.strictObject({
      kind: z.literal('nudge'),
      id: identity,
      direction: z.enum(['left', 'right', 'up', 'down']),
      coarse: z.boolean(),
    }),
    z.strictObject({
      kind: z.literal('keyboard'),
      id: identity,
      key: z.string(),
      alt: z.boolean(),
      shift: z.boolean(),
      typing: z.boolean(),
      modal: z.boolean(),
    }),
    z.strictObject({ kind: z.literal('escape') }),
    z.strictObject({
      kind: z.literal('reading'),
      action: z.enum(['enter', 'next', 'previous', 'exit']),
    }),
    z.strictObject({ kind: z.literal('collapse'), target }),
  ])
  .readonly();
export type CanvasEvent = z.infer<typeof event>;
export type EventOf<K extends CanvasEvent['kind']> = Extract<CanvasEvent, { kind: K }>;
