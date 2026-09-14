import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { runHeadless, type HeadlessOptions } from '../contract/index.js';
/** CLI owns malformed arguments and terminal display; render failures retain owner diagnostics. */
function options(args: readonly string[]): HeadlessOptions {
  const { values } = parseArgs({
    args: args.filter((arg) => arg !== '--'),
    options: {
      collection: { type: 'string' },
      theme: { type: 'string' },
      'theme-file': { type: 'string' },
      out: { type: 'string' },
      format: { type: 'string', default: 'png' },
    },
  });
  return {
    collection: required(values.collection, '--collection'),
    theme: values.theme,
    themeFile: values['theme-file'],
    out: resolve(required(values.out, '--out')),
    format: format(values.format),
    root: new URL('../../../', import.meta.url).pathname,
  };
}
/** Required arguments fail before any temporary asset store is created; main prints usage and permits retry. */
function required(value: string | undefined, name: string): string {
  if (!value) throw new TypeError(name + ' is required');
  return value;
}
/** Only the requested artifact encoders are exposed; main handles invalid input without partial output. */
function format(value: string | undefined): 'svg' | 'png' {
  if (value === 'svg' || value === 'png') return value;
  throw new TypeError('--format must be svg or png');
}
/** Standalone read-only command; diagnostics set a failing process status and never modify stored state. */
async function main(): Promise<void> {
  try {
    const result = await runHeadless(options(process.argv.slice(2)));
    console.log(JSON.stringify(result));
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
  }
}
await main();
