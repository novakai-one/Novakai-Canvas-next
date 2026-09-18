import { Worker as NodeWorker } from 'node:worker_threads';
import type { RenderingJob } from '../contract/records/rendering.js';
import type { RenderTransport } from '../contract/ports/rendering.js';
import { resultEnvelope } from '../contract/records/results.js';
import { failure, type Result } from '../contract/errors.js';
/** Structured worker replies remain unknown until the composed reader independently reconstructs the scene. */
function reply(input: unknown): Result<unknown> {
  const parsed = resultEnvelope.safeParse(input);
  if (!parsed.success)
    return failure('unavailable', 'worker', 'Rendering worker returned a malformed result');
  return parsed.data;
}
/** Cancellation destroys the active realm; successful work can reuse its initialized modules and font providers. */
function observe(
  worker: NodeWorker,
  job: RenderingJob,
  signal: AbortSignal,
  timeoutMs: number,
  release: (worker: NodeWorker) => void,
): Promise<Result<unknown>> {
  return new Promise((resolve) => {
    let settled = false;
    function finish(result: Result<unknown>, reusable = false): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      worker.removeListener('message', message);
      worker.removeListener('error', error);
      worker.removeListener('exit', exited);
      if (reusable) {
        release(worker);
        resolve(result);
        return;
      }
      void worker.terminate().then(
        () => resolve(result),
        () => resolve(failure('unavailable', 'worker', 'Worker termination could not be confirmed')),
      );
    }
    function message(input: unknown): void {
      finish(reply(input), true);
    }
    function error(): void {
      finish(failure('unavailable', 'worker', 'Rendering worker failed'));
    }
    function exited(): void {
      finish(failure('unavailable', 'worker', 'Rendering worker ended without a result'));
    }
    function cancel(): void {
      finish(failure('cancelled', 'worker', 'Rendering was cancelled'));
    }
    const timer = setTimeout(
      () => finish(failure('unavailable', 'worker', 'Rendering exceeded its time limit')),
      timeoutMs,
    );
    worker.once('message', message);
    worker.once('error', error);
    worker.once('exit', exited);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    worker.ref();
    worker.postMessage(job);
  });
}
/** Keep one idle initialized worker, never derived geometry. Concurrent jobs retain separate cancellation realms. */
export function createRenderTransport(timeoutMs: number): RenderTransport {
  let idle: NodeWorker | null = null;
  function create(): NodeWorker {
    const worker = new NodeWorker(new URL('../cli/render-worker.mjs', import.meta.url), {
      execArgv: [],
    });
    const retired = (): void => {
      if (idle === worker) idle = null;
    };
    worker.on('error', retired);
    worker.on('exit', retired);
    worker.unref();
    return worker;
  }
  function release(worker: NodeWorker): void {
    if (idle !== null) {
      void worker.terminate();
      return;
    }
    idle = worker;
    worker.unref();
  }
  idle = create();
  return {
    async run(job, signal): Promise<Result<unknown>> {
      try {
        const worker = idle ?? create();
        idle = null;
        return await observe(worker, job, signal, timeoutMs, release);
      } catch {
        return failure('unavailable', 'worker', 'Rendering worker could not start');
      }
    },
  };
}
