import { parentPort, workerData } from 'node:worker_threads';
import type { Result } from '../contract/errors.js';
import { failure } from '../contract/errors.js';
import type { DiagramProducer } from '../contract/ports/rendering.js';
import type { RenderingJob } from '../contract/records/rendering.js';
/** Parsing is injected at composition; worker transport owns no domain schema or rendering implementation. */
export interface WorkerOwners {
  readonly producer: DiagramProducer;
  read(input: unknown): Result<RenderingJob>;
}
/** A dedicated worker settles one job; parent termination owns cancellation and suppresses stale results. */
export async function serveRenderWorker(owners: WorkerOwners): Promise<Result<void>> {
  const port = parentPort;
  if (port === null)
    return failure('invalid-input', 'worker', 'Rendering entry requires a worker realm');
  const input: unknown = workerData;
  const job = owners.read(input);
  port.postMessage(await rendered(job, owners.producer));
  port.close();
  return { ok: true, value: undefined };
}
/** Invalid messages return typed failures without invoking native measurement. */
async function rendered(
  job: Result<RenderingJob>,
  producer: DiagramProducer,
): Promise<Result<unknown>> {
  if (!job.ok) return job;
  return producer.produce(job.value, new AbortController().signal);
}
