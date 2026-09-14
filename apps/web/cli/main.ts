import { startWeb } from '../contract/index.js';
/** The browser owns its mount target. Failure is visible before React exists and never implies diagram data was lost. */
async function main(): Promise<void> {
  const element = document.getElementById('app');
  if (element === null) return;
  const started = await startWeb(element);
  if (!started.ok) element.textContent = `${started.error.message}. ${started.error.recovery}`;
}
void main().catch(() => {
  document.body.textContent = 'Canvas failed to start. Reload the local workspace to reconnect.';
});
