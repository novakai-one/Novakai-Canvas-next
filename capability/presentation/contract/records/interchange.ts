import { z } from 'zod';
import { sceneId } from '../brands.js';
import { connectionStyle } from './style.js';
import { content, markerKind, visualNode } from './visual.js';
import { PROJECTION_CAPACITY } from './limits.js';
/** Serialized visual fields are owned here; Model fragments remain unknown until owner validation and equality checks. */
const endpoint = z.strictObject({ node: sceneId, member: z.string().nullable() }).readonly();
const wire = z
  .strictObject({
    id: sceneId,
    relationshipId: z.string(),
    sectionId: z.string(),
    kind: z.string(),
    source: endpoint,
    target: endpoint,
    label: content,
    appearance: connectionStyle,
    sourceMarker: markerKind,
    targetMarker: markerKind,
    style: z.enum(['solid', 'dashed']),
    route: z.unknown(),
  })
  .readonly();
const sequence = z
  .strictObject({ item: z.unknown(), label: content, marker: markerKind })
  .readonly();
const section = z
  .strictObject({
    id: z.string(),
    title: content,
    mode: z.string(),
    order: z.number().int().nonnegative(),
    layout: z.unknown(),
    placement: z.unknown(),
    nodes: z.array(visualNode).max(PROJECTION_CAPACITY.maxNodes).readonly(),
    wires: z.array(wire).max(PROJECTION_CAPACITY.maxWires).readonly(),
    sequence: z.array(sequence).readonly(),
    groups: z.unknown(),
    root: z.string().nullable(),
  })
  .readonly();
/** Structural admission cannot mint foreign domain records; the reader rebinds every such value from Model. */
export const projectionEnvelope = z
  .strictObject({
    collectionId: z.string(),
    revision: z.number().int().nonnegative(),
    title: z.string(),
    styleDigest: z.string(),
    inputKey: z.string(),
    arrangement: z.unknown(),
    sections: z.array(section).readonly(),
    outline: z.array(z.string()).readonly(),
    assetDigests: z.array(z.string()).readonly(),
    fontDigests: z.array(z.string()).readonly(),
  })
  .readonly();
export type ProjectionEnvelope = z.infer<typeof projectionEnvelope>;
export type SectionEnvelope = z.infer<typeof section>;
export type WireEnvelope = z.infer<typeof wire>;

/** Serialized supplemental metrics are owned Presentation data; Layout verifies their exact branch address set. */
export const supplementalMeasurements = z
  .strictObject({
    version: z.string().min(1).max(256),
    branchHeadings: z
      .array(
        z
          .strictObject({ section: z.string(), fragment: z.string(), branch: z.string(), content })
          .readonly(),
      )
      .max(4096)
      .readonly(),
    markers: z
      .record(
        markerKind,
        z
          .strictObject({
            advance: z.number().finite().nonnegative().max(10000),
            halfHeight: z.number().finite().nonnegative().max(10000),
          })
          .readonly(),
      )
      .readonly(),
  })
  .readonly();
