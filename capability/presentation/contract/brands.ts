import { z } from 'zod';
/** Derived scene identities retain section and semantic scope; they are not mutable labels. */
export const sceneId = z.string().min(1).max(500).brand<'SceneId'>();
export type SceneId = z.infer<typeof sceneId>;
/** Exact offline media identity reused for fonts, images and icons. */
export const digest = z.string().regex(/^[a-f0-9]{64}$/);
/** Local world-unit geometry is finite and bounded before rendering. */
export const coordinate = z.number().finite().min(-1_000_000).max(1_000_000);
export const dimension = z.number().finite().min(0).max(1_000_000);
