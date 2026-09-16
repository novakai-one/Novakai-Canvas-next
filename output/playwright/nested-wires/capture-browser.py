"""Reproduce Chromium evidence through the installed Playwright CLI skill. Never starts Vite."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = ROOT / 'output/playwright/nested-wires'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'


def command(*args):
    result = subprocess.run([str(CLI), '-s=nested-wires', *args], cwd=ROOT,
                            text=True, capture_output=True, check=True)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout


command('open', 'http://127.0.0.1:5188/roads-prototype.html?nested', '--headed')
command('snapshot')
source = (EVIDENCE / 'capture-browser.mjs').read_text().replace('export async function', 'async function')
output = command('run-code', 'async () => {\n' + source + '\nreturn capture(page);\n}')
report = json.loads(output.split('### Result\n', 1)[1].split('\n###', 1)[0])
(EVIDENCE / 'browser.json').write_text(json.dumps(report, indent=2) + '\n')
print(f"PASS browser: 5 loads; median {report['medianMilliseconds']:.1f} ms")
print(f"PASS overview: {report['overview']}")
print(f"PASS screenshots: {report['closeups']} close-ups; all wire bounding boxes inside viewport")
