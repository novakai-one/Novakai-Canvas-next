import { z } from 'zod';
import { digest } from '../brands.js';
import { workspaceState } from './storage.js';
import type { WorkspaceState } from './storage.js';
import type { Digest } from '../brands.js';
/** Base64 is canonical; injected Assets verifier proves bytes match digest and media policy. */
export const blob = z.strictObject({
  digest,
  base64: z
    .string()
    .max(32 * 1024 * 1024)
    .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
});
export const backupBundle = z.strictObject({
  schemaVersion: z.literal(1),
  state: workspaceState,
  blobs: z.array(blob),
});
export interface BlobRecord {
  readonly digest: Digest;
  readonly base64: string;
}
export interface BackupBundle {
  readonly schemaVersion: 1;
  readonly state: WorkspaceState;
  readonly blobs: readonly BlobRecord[];
}
