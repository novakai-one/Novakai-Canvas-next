"""Headless scaling measurements; synthetic samples do not change acceptance fixtures."""
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/playwright/nested-wires/m5-swap'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result = subprocess.run([str(CLI), '-s=m5-scaling', *args], cwd=ROOT, text=True, capture_output=True, check=True)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout
try:
    command('open', 'http://127.0.0.1:5188/roads-prototype.html?nested')
    command('snapshot')
    source = (OUT.parent / 'measure-m5-scaling.mjs').read_text().replace('export async function','async function')
    output = command('run-code', 'async () => {\n' + source + '\nreturn measure(page,' + json.dumps('/@fs/' + str(ROOT / 'capability/layout/contract/index.ts')) + ');\n}')
    report = json.loads(output.split('### Result\n',1)[1].split('\n###',1)[0])
    (OUT / 'scaling.json').write_text(json.dumps(report,indent=2)+'\n')
    for row in report['results']:
        print(f"MEASURE {row['nodes']} nodes/{row['wires']} wires: build={row['buildMedian']:.3f} ms; drop-to-ready={row['median']:.3f} ms; five={row['dropToReady']}; ok={row['ok']}; violations={row['violations']}")
finally:
    command('close')
