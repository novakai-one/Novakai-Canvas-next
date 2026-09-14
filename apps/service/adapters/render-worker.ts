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
/** Single-job lifecycle settles only after worker termination; late events cannot publish a second result. */
function observe(
  worker: NodeWorker,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<Result<unknown>> {
  return new Promise((resolve) => {
    let settled = false;
    /** End native work before releasing caller resources or allowing a newer job result to replace this one. */
    function finish(result: Result<unknown>): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      worker.removeAllListeners();
      void worker.terminate().then(
        () => resolve(result),
        () =>
          resolve(failure('unavailable', 'worker', 'Worker termination could not be confirmed')),
      );
    }
    /** Cancellation is a typed outcome, never an empty or last-known scene disguised as new work. */
    function cancel(): void {
      finish(failure('cancelled', 'worker', 'Rendering was cancelled'));
    }
    const timer = setTimeout(
      () => finish(failure('unavailable', 'worker', 'Rendering exceeded its time limit')),
      timeoutMs,
    );
    worker.once('message', (input: unknown) => finish(reply(input)));
    worker.once('error', () => finish(failure('unavailable', 'worker', 'Rendering worker failed')));
    worker.once('exit', () =>
      finish(failure('unavailable', 'worker', 'Rendering worker ended without a result')),
    );
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
  });
}
/** Constructor/startup failures never escape into Authoring or leave a successful-looking preview. */
async function run(
  job: RenderingJob,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<Result<unknown>> {
  try {
    const worker = new NodeWorker(new URL('../cli/render-worker.mjs', import.meta.url), {
      workerData: job,
      execArgv: [],
    });
    return await observe(worker, signal, timeoutMs);
  } catch {
    return failure('unavailable', 'worker', 'Rendering worker could not start');
  }
}
/** Bind a finite host timeout; every render executes in its own cancellable worker realm. Service owns retry. */
export function createRenderTransport(timeoutMs: number): RenderTransport {
  return { run: (job, signal) => run(job, signal, timeoutMs) };
}
