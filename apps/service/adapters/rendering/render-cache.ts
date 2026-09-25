import type { DiagramProducer } from '../../contract/ports/rendering.js';
import type { RenderingJob, RenderDocument } from '../../contract/records/rendering.js';
import type { Result } from '../../contract/errors.js';
/** Recent renders kept; enough for the check render during apply plus the reads after it. */
const KEEP = 8;
/** Everything that shapes the output except the job id. Jobs with a previous scene are never cached. */
function inputKey(job: RenderingJob): string | null {
  if (job.previous !== null) return null;
  return JSON.stringify([
    job.collection,
    job.style,
    job.options,
    job.fonts.map((font) => font.digest),
    job.assets.map((asset) => asset.digest),
    job.wasmResource,
  ]);
}
/** The apply check renders the candidate; the read right after the commit asks for the same render. */
export function cacheRenders(producer: DiagramProducer): DiagramProducer {
  const done = new Map<string, Result<RenderDocument>>();
  return {
    async produce(job, signal) {
      const key = inputKey(job);
      const known = key === null ? undefined : done.get(key);
      if (known !== undefined) return known;
      const result = await producer.produce(job, signal);
      if (key === null || !result.ok) return result;
      done.set(key, result);
      if (done.size > KEEP) done.delete(done.keys().next().value as string);
      return result;
    },
  };
}
