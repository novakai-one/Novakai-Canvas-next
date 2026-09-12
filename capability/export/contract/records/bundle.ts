import { z } from 'zod';
import { digest, identity } from '../brands.js';
import { manualSchema } from './manual.js';
import type { Identity, Collection } from './artifact.js';
import type { Diagnostic } from '../errors.js';
/** Metadata remains an owner-validated JSON record; Export grants no resource admission. */
export const resourceKind = z.enum(['asset', 'preset', 'font']);
export interface Resource {
  readonly kind: z.infer<typeof resourceKind>;
  readonly digest: string;
  readonly mediaType: string;
  readonly bytes: Uint8Array;
  readonly metadata: Readonly<Record<string, unknown>>;
}
const resource = z.strictObject({
  kind: resourceKind,
  digest,
  mediaType: z.string().min(1).max(120),
  base64: z.string().max(28 * 1024 * 1024),
  metadata: z.record(z.string(), z.json()),
});
const sourceIdentity = z.strictObject({
  collectionId: identity,
  revision: z.number().int().nonnegative(),
  inputKey: z.string().min(1),
  title: z.string(),
});
export const bundleSchema = z
  .strictObject({
    format: z.literal('novakai.canvas.bundle'),
    schemaVersion: z.literal(1),
    identity: sourceIdentity,
    source: z.string().max(16 * 1024 * 1024),
    sourceDigest: digest,
    manual: manualSchema,
    manualDigest: digest,
    resources: z.array(resource).max(2000),
  })
  .readonly();
export type Bundle = z.infer<typeof bundleSchema>;
export interface BundleInspection {
  readonly identity: Identity;
  readonly source: string;
  readonly sourceDigest: string;
  readonly manual: z.infer<typeof manualSchema>;
  readonly resources: readonly Resource[];
  readonly counts: { readonly resources: number; readonly sections: number };
}
export const importSchema = z.strictObject({
  bytes: z.instanceof(Uint8Array),
  targetCollectionId: identity,
});
export type ImportRequest = z.infer<typeof importSchema>;
export interface PreparedImport {
  readonly original: Identity;
  readonly target: Identity;
  readonly collection: Collection;
  readonly resources: readonly Resource[];
  readonly expected: 'absent';
  readonly sourceDigest: string;
  readonly warnings: readonly Diagnostic[];
}
