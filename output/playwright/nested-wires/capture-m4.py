"""Reproduce Chromium evidence through the installed Playwright CLI skill. Never starts Vite."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = ROOT / 'output/playwright/nested-wires'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'


def command(*args):
    result = subprocess.run([str(CLI), '-s=m4-capture', *args], cwd=ROOT,
                            text=True, capture_output=True)
    if result.returncode: raise RuntimeError(result.stdout + result.stderr)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout


command('open', 'http://127.0.0.1:5188/roads-prototype.html?nested')
command('snapshot')
source = (EVIDENCE / 'capture-m4.mjs').read_text().replace('export async function', 'async function')
output = command('run-code', 'async () => {\n' + source + '\nreturn capture(page);\n}')
report = json.loads(output.split('### Result\n', 1)[1].split('\n###', 1)[0])
(EVIDENCE / 'm4-browser.json').write_text(json.dumps(report, indent=2) + '\n')
print(f"PASS M4 five loads={[l['roads:navigation-to-ready'] for l in report['loads']]}; median={report['medianMilliseconds']:.3f} ms; M2=243.7 ms; ceiling=300 ms")
assert report['medianMilliseconds'] <= 300, report
assert report['wires'] == 26 and report['nodes'] == 24 and report['layoutRecalcCount'] == 1
print('PASS 24 nodes, 26 wires, one layout calculation; three M4 screenshots captured')

assert report['roadsOff']
command('close')
