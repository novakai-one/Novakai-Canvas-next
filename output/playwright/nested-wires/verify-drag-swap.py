"""Run M5 in an isolated headless CLI session. Never manage the existing Vite process."""
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/playwright/nested-wires/m5-swap'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result = subprocess.run([str(CLI), '-s=m5-drag-swap', *args], cwd=ROOT, text=True, capture_output=True, check=True)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout
try:
    command('open', 'http://127.0.0.1:5188/roads-prototype.html?nested')
    command('snapshot')
    source = (OUT.parent / 'verify-drag-swap.mjs').read_text().replace('export async function', 'async function')
    output = command('run-code', 'async () => {\n' + source + '\nreturn verify(page,' + json.dumps('/@fs/' + str(ROOT / 'capability/layout/contract/index.ts')) + ');\n}')
    report = json.loads(output.split('### Result\n', 1)[1].split('\n###', 1)[0])
    for name in ['before', 'after']:
        (OUT / f'{name}-scene.json').write_text(json.dumps(report.pop(name), indent=2) + '\n')
    (OUT / 'interaction.json').write_text(json.dumps(report, indent=2) + '\n')
    (OUT / 'interaction-output.txt').write_text('\n'.join(report['messages']) + '\n')
    print('\n'.join(report['messages']))
finally:
    command('close')
