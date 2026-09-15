import { z } from 'zod';
import { sceneId, coordinate, dimension } from '../brands.js';
import type { ConnectionStyle } from './style.js';
import { fontRef, paint, hexColor, roleName, chromeResolvedStyle } from './style.js';
import type {
  LayoutIntent,
  Placement,
  SequenceItem,
  InputCollection,
  Section,
  Relationship,
} from './input.js';
/** Renderer input primitives carry final local positions; renderer never rewraps or guesses sizes. */
export const textRun = z
  .strictObject({
    kind: z.literal('text'),
    text: z.string().max(100000),
    x: coordinate,
    y: coordinate,
    width: dimension,
    font: fontRef,
    size: z.number().positive().max(1000),
    fill: hexColor,
  })
  .readonly();
export const mediaRun = z
  .strictObject({
    kind: z.literal('media'),
    digest: z.string(),
    alt: z.string(),
    dataUri: z.string().regex(/^data:image\/(png|svg\+xml|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/),
    x: coordinate,
    y: coordinate,
    width: dimension,
    height: dimension,
    fit: z.enum(['contain', 'cover']),
  })
  .readonly();
export const rule = z
  .strictObject({
    kind: z.literal('rule'),
    x1: coordinate,
    y1: coordinate,
    x2: coordinate,
    y2: coordinate,
    stroke: hexColor,
    width: z.number().positive().max(100),
  })
  .readonly();
/** Measured capsule background; number glyphs remain ordinary pinned-font text runs. */
export const badgeRun = z
  .strictObject({
    kind: z.literal('badge'),
    x: coordinate,
    y: coordinate,
    width: dimension,
    height: dimension,
    radius: dimension,
    fill: hexColor,
    stroke: hexColor,
    strokeWidth: z.number().positive().max(100),
  })
  .readonly();
export const primitive = z.discriminatedUnion('kind', [textRun, mediaRun, rule, badgeRun]);
export type Primitive = z.infer<typeof primitive>;
export type TextRun = z.infer<typeof textRun>;
export const anchor = z
  .strictObject({
    member: z.string(),
    x: coordinate,
    y: coordinate,
    direction: z.enum(['in', 'out', 'inout']),
    collapsed: z.boolean(),
    label: z.string(),
  })
  .readonly();
export type Anchor = z.infer<typeof anchor>;
export const content = z
  .strictObject({
    width: dimension,
    height: dimension,
    primitives: z.array(primitive).max(100000).readonly(),
    anchors: z.array(anchor).readonly(),
    outline: z.array(z.string()).readonly(),
  })
  .readonly();
export type MeasuredContent = z.infer<typeof content>;
export const shape = z.enum([
  'card',
  'pill',
  'diamond',
  'bar',
  'entity',
  'module',
  'interface',
  'function',
  'state',
  'participant',
  'note',
  'container',
]);
export type Shape = z.infer<typeof shape>;
/** Engineering notation shares heading compartments across measurement and rendering. */
export const COMPARTMENT_SHAPES = [
  'entity',
  'module',
  'interface',
  'function',
] as const satisfies readonly Shape[];
const placement = z
  .strictObject({
    x: coordinate,
    y: coordinate,
    width: dimension.optional(),
    height: dimension.optional(),
    locked: z.boolean(),
  })
  .readonly();
/** Navigation target is canonical data; the host chooses whether to open it. */
const linkTarget = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('object'), id: z.string(), section: z.string().optional() }),
  z.strictObject({ kind: z.literal('uri'), uri: z.string() }),
]);
const navigation = z
  .strictObject({ member: z.string(), label: z.string(), target: linkTarget })
  .readonly();
/** Node geometry describes minimum measured content bounds; global position remains Layout's decision. */
export const visualNode = z
  .strictObject({
    id: sceneId,
    objectId: z.string().nullable(),
    groupId: z.string().nullable(),
    sectionId: z.string(),
    kind: z.string(),
    label: z.string(),
    role: roleName,
    size: z.enum(['small', 'medium', 'large']),
    shape,
    frame: z.enum(['auto', 'none', 'card', 'panel']),
    paint,
    content,
    navigation: z.array(navigation).readonly(),
    width: dimension,
    height: dimension,
    headerHeight: dimension,
    chromeStyle: chromeResolvedStyle.optional(),
    radius: dimension,
    strokeWidth: dimension,
    placement: placement.nullable(),
    parent: sceneId.nullable(),
  })
  .readonly();
export type VisualNode = z.infer<typeof visualNode>;
export const markerKind = z.enum([
  'none',
  'arrow',
  'open-arrow',
  'one',
  'zero-one',
  'one-many',
  'zero-many',
]);
export type MarkerKind = z.infer<typeof markerKind>;
export interface VisualEndpoint {
  readonly node: SceneIdentity;
  readonly member: string | null;
}
type SceneIdentity = z.infer<typeof sceneId>;
export interface VisualWire {
  readonly id: SceneIdentity;
  readonly relationshipId: string;
  readonly sectionId: string;
  readonly kind: Relationship['kind'];
  readonly source: VisualEndpoint;
  readonly target: VisualEndpoint;
  readonly label: MeasuredContent;
  readonly appearance: ConnectionStyle;
  readonly sourceMarker: MarkerKind;
  readonly targetMarker: MarkerKind;
  readonly style: 'solid' | 'dashed';
  readonly route: Section['wires'][number];
}
export interface VisualSequenceItem {
  readonly item: SequenceItem;
  readonly label: MeasuredContent;
  readonly marker: MarkerKind;
}
export interface VisualSection {
  readonly id: string;
  readonly title: MeasuredContent;
  readonly mode: Section['mode'];
  readonly order: number;
  readonly layout: LayoutIntent;
  readonly placement: Placement | null;
  readonly nodes: readonly VisualNode[];
  readonly wires: readonly VisualWire[];
  readonly sequence: readonly VisualSequenceItem[];
  readonly groups: Section['groups'];
  readonly root: string | null;
}
export interface Projection {
  readonly collectionId: string;
  readonly revision: number;
  readonly title: string;
  readonly styleDigest: string;
  readonly inputKey: string;
  readonly arrangement: InputCollection['arrangement'];
  readonly sections: readonly VisualSection[];
  readonly outline: readonly string[];
  readonly assetDigests: readonly string[];
  readonly fontDigests: readonly string[];
}
