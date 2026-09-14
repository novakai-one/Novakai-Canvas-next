import { z } from 'zod';
import { stamp } from './records/scene.js';
import { camera, viewport } from './records/camera.js';
import { profile, defaultProfile } from './records/profile.js';
export const openInput = z
  .strictObject({
    scene: z.unknown(),
    expected: stamp,
    viewport,
    camera: camera.nullable().default(null),
    profile: profile.default(defaultProfile),
    readOnly: z.boolean().default(false),
  })
  .readonly();
export type OpenInput = z.infer<typeof openInput>;
