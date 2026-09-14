/** Explicit TypeScript runtime for the development worker. Parent receives startup errors and retains the current scene. */
import { tsImport } from 'tsx/esm/api';
const service = await tsImport('../contract/index.ts', import.meta.url);
await service.runRenderWorker();
