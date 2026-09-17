"""CLI I/O boundary. Fresh-page reruns replace evidence; errors retain CLI output.
No servers are started/stopped. Playwright CLI defaults to headless (no --headed).
Usage: python3 output/playwright/nested-wires/drag-ux/run.py [verify|timing]
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'verify'
assert MODE in ('verify', 'timing')


def command(*args):
    result = subprocess.run([str(CLI), '-s=drag-ux', *args], cwd=ROOT,
                            text=True, capture_output=True, check=True)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout


def execute():
    command('open', 'http://127.0.0.1:5188/roads-prototype.html?nested')
    source = (OUT / 'verify.mjs').read_text().replace('export async function', 'async function')
    output = command('run-code', 'async (page) => {\n' + source + '\nreturn ' + MODE + '(page);\n}')
    (OUT / f'{MODE}-cli.txt').write_text(output)
    report = json.loads(output.split('### Result\n', 1)[1].split('\n###', 1)[0])
    (OUT / f'{MODE}.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'probes'}, indent=2))
    if MODE == 'timing' and report['status'] != 'PASS':
        raise RuntimeError('Timing gate failed; see timing.json')
    for probe in report['probes']:
        print(probe['name'], json.dumps({k: probe.get(k) for k in ('moved', 'maxDeviation', 'intervalMedian')}))
        for check in probe.get('checks', []):
            print('PASS' if check['pass'] else 'DIVERGENCE', check['name'])


try:
    execute()
finally:
    command('close')
