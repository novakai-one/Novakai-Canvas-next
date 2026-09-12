import { fileURLToPath } from 'node:url';
import { runCli } from '../contract/index.js';
/** The executable reports one readable outcome and exit status. No credentials or request envelopes are logged. */
async function main(): Promise<void> {
  const workspace = fileURLToPath(new URL('../../../.local/workspace', import.meta.url));
  const result = await runCli(process.argv.slice(2), workspace);
  if (!result.ok) {
    process.stderr.write(
      `${result.error.code}: ${result.error.message}\n${result.error.recovery}\n`,
    );
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`${result.value}\n`);
}
void main().catch(() => {
  process.stderr.write('CLI failed. Preserve the request ID and check its receipt.\n');
  process.exitCode = 1;
});
