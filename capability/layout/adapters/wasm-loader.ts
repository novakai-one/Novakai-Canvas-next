import { AvoidLib } from 'libavoid-js';
/** Only the loader lifecycle is consumed; native graph/handle APIs remain opaque until the routing adapter checks them. */
export interface ModuleLoader {
  load(resource: string): Promise<void>;
  getInstance(): unknown;
}
/** Host supplies the pinned replaceable resource; createRouting catches loader failures and Authoring retains its current scene. */
export function wasmLoader(
  resource: string,
  native: ModuleLoader = AvoidLib,
): () => Promise<unknown> {
  /** The host's worker realm owns the loaded module; routers remain per invocation and no latest-job state is stored here. */
  async function load(): Promise<unknown> {
    await native.load(resource);
    return native.getInstance();
  }
  return load;
}
