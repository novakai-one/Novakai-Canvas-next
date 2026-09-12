import { z } from 'zod';
import { identity, generation } from '../brands.js';
import type { Scene, PlacedNode, RoutedWire, PlacedSection } from '@novakai/canvas-layout';
import type { Target } from './selection.js';
import type { Box, Point } from './camera.js';
export const stamp = z
  .strictObject({
    collectionId: identity,
    revision: generation,
    inputKey: z
      .string()
      .min(1)
      .max(16 * 1024 * 1024),
    generation,
  })
  .readonly();
export type SceneStamp = z.infer<typeof stamp>;
export type { Scene, PlacedNode, RoutedWire, PlacedSection };
/** Each index entry carries both world and immediate-parent origin; no consumer parses generated IDs. */
export interface TargetInfo {
  readonly target: Target;
  readonly key: string;
  readonly label: string;
  readonly box: Box;
  readonly parentKey: string | null;
  readonly parentOrigin: Point;
  readonly sectionOrigin: Point;
  readonly minimum: { readonly width: number; readonly height: number };
  readonly locked: boolean;
}
export interface SceneIndex {
  readonly targets: Readonly<Record<string, TargetInfo>>;
  readonly order: readonly string[];
  readonly nodes: Readonly<Record<string, PlacedNode>>;
  readonly wires: Readonly<Record<string, RoutedWire>>;
  readonly sections: Readonly<Record<string, PlacedSection>>;
}
