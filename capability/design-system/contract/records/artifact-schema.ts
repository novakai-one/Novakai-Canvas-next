import { z } from 'zod';
import { digest, version } from '../brands.js';
/** Only compiler-owned snapshot paths may be materialized or published. */
export const artifactPath = z.enum([
  'adapters/styles/tokens.generated.css',
  'adapters/styles/semantics.generated.css',
  'adapters/styles/themes.generated.css',
  'adapters/styles/preferences.generated.css',
  'adapters/styles/layout.generated.css',
  'contract/generated/token-names.ts',
  'contract/generated/breakpoints.ts',
]);
export const artifactSet = z.strictObject({
  digest,
  version,
  files: z
    .array(
      z.strictObject({
        path: artifactPath,
        content: z.string().max(4 * 1024 * 1024),
        hash: digest,
      }),
    )
    .length(7),
  manifest: z.strictObject({
    generation: digest,
    version,
    files: z.array(z.strictObject({ path: artifactPath, hash: digest })).length(7),
  }),
});
