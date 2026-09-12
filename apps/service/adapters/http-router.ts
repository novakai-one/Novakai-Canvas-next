import type { ApiCall, ApiRouter, WireOutcome } from '../contract/records/protocol.js';
import type { RouterBindings } from '../contract/records/server.js';
import { failure } from '../contract/errors.js';
/** Read one current collection without reinterpreting its semantic shape; Language/Presentation validate before their use. */
async function source(call: ApiCall, owners: RouterBindings): Promise<WireOutcome> {
  const snapshot = await owners.session.read();
  if (!snapshot.ok) return snapshot;
  const record = snapshot.value.records.find(
    (item) => item.key.kind === 'collection' && item.key.id === call.query.id && !item.deleted,
  );
  if (!record) return failure('not-found', 'collection', 'Collection was not found');
  return owners.source.print(record.value);
}
/** Mutation routes share the exact decoder and Authoring session; no route writes storage directly. */
async function mutate(
  call: ApiCall,
  owners: RouterBindings,
  preview: boolean,
): Promise<WireOutcome> {
  const admitted = owners.decoder.read(call.body, {
    caller: call.caller,
    metadata: call.metadata,
    generation: owners.generation,
    ingress: owners.admission,
  });
  if (!admitted.ok) return admitted;
  if (preview)
    return owners.session.prepare(admitted.value.request, call.signal, admitted.value.preview);
  return owners.session.apply(admitted.value.request, call.signal, admitted.value.options);
}
/** Fixed route registration keeps method/path dispatch separate from handler behavior; unsupported operations fail explicitly. */
export function createHttpRouter(owners: RouterBindings): ApiRouter {
  const routes: Readonly<Record<string, (call: ApiCall) => Promise<WireOutcome>>> = {
    'GET /api/v1/workspace': () => owners.session.read(),
    'GET /api/v1/installation': async () => ({
      ok: true,
      value: {
        fonts: owners.session.installation.fonts,
        tokens: owners.session.installation.tokens,
      },
    }),
    'GET /api/v1/language': async () => ({ ok: true, value: owners.source.describe() }),
    'GET /api/v1/identity': async () => ({
      ok: true,
      value: { workspace: owners.session.workspace },
    }),
    'GET /api/v1/source': (call) => source(call, owners),
    'GET /api/v1/render': (call) => owners.session.render(call.query.id ?? '', call.signal),
    'GET /api/v1/receipt': (call) => owners.session.receipt(call.query.id),
    'POST /api/v1/authoring/preview': (call) => mutate(call, owners, true),
    'POST /api/v1/authoring/apply': (call) => mutate(call, owners, false),
  };
  return {
    invoke: async (call) => {
      const handler = routes[`${call.metadata.method} ${call.path}`];
      if (!handler)
        return failure('not-found', 'route', 'This method and API route are not available');
      return handler(call);
    },
  };
}
