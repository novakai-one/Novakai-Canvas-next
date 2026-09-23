import type { WireDraft } from '../../contract/records/wire-editor.js';
import type { Diagnostic, Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
/** The server's verdict on one exact draft object, drafted from one collection revision. */
export type WireDryRunState =
  | { readonly state: 'idle' }
  | { readonly state: 'checking' | 'ok'; readonly draft: WireDraft; readonly revision: number }
  | {
      readonly state: 'rejected';
      readonly draft: WireDraft;
      readonly revision: number;
      readonly problem: Diagnostic;
    };
export type WirePreview = (draft: WireDraft, signal: AbortSignal) => Promise<Result<void>>;
export interface WireDryRun {
  /** A new draft restarts the debounce; null (no draft, or a local block) cancels. */
  check(draft: WireDraft | null): void;
  getSnapshot(): WireDryRunState;
  subscribe(listener: () => void): () => void;
  /** Stops the timer and aborts the request in flight; a later check starts again. */
  dispose(): void;
}
/** Apply waits for this: debounced, one request at a time, late answers for older drafts dropped. */
export function createWireDryRun(preview: WirePreview, delay = 300): WireDryRun {
  let snapshot: WireDryRunState = { state: 'idle' };
  let current: WireDraft | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let job: AbortController | null = null;
  const listeners = new Set<() => void>();
  function publish(next: WireDryRunState): void {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }
  function cancel(): void {
    clearTimeout(timer);
    job?.abort();
    job = null;
  }
  function check(draft: WireDraft | null): void {
    if (draft === current) return;
    cancel();
    current = draft;
    if (draft === null) return publish({ state: 'idle' });
    publish({ state: 'checking', draft, revision: draft.collection.revision });
    timer = setTimeout(() => void run(draft), delay);
  }
  async function run(draft: WireDraft): Promise<void> {
    const own = new AbortController();
    job = own;
    const result = await preview(draft, own.signal).catch(() => unreachable);
    if (own.signal.aborted || draft !== current) return;
    publish(verdict(draft, result));
  }
  function dispose(): void {
    cancel();
    current = null;
  }
  return {
    check,
    dispose,
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
const unreachable = failure('unavailable', 'The server could not check this wire. Try again.');
function verdict(draft: WireDraft, result: Result<void>): WireDryRunState {
  const revision = draft.collection.revision;
  if (result.ok) return { state: 'ok', draft, revision };
  return { state: 'rejected', draft, revision, problem: result.error };
}
/** Only a verdict for this exact draft and revision counts; anything else is still checking. */
export function dryRunFor(snapshot: WireDryRunState, draft: WireDraft): WireDryRunState {
  return answers(snapshot, draft)
    ? snapshot
    : { state: 'checking', draft, revision: draft.collection.revision };
}
function answers(snapshot: WireDryRunState, draft: WireDraft): boolean {
  if (snapshot.state === 'idle') return false;
  return snapshot.draft === draft && snapshot.revision === draft.collection.revision;
}
