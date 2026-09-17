"""Own nonpersistent headless Chrome on 5192 (order-trial's owned port). No other server is contacted.
Usage: python3 capture.py baseline | variant-a"""
import json
import subprocess
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
mode = sys.argv[1] if len(sys.argv) > 1 else 'baseline'
options = {'prefix': str(OUT / mode / mode)}
if mode != 'baseline':
    options['spec'] = json.loads((OUT / mode / 'scene-spec.json').read_text())
def command(*args):
    result = subprocess.run([str(CLI), '-s=m9-ordertrial', *args], cwd=ROOT, text=True, capture_output=True, check=True)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout
try:
    command('open', 'http://127.0.0.1:5192/roads-prototype.html?templates')
    command('snapshot')
    source = (OUT / 'capture.mjs').read_text().replace('export async function', 'async function')
    result = command('run-code', 'async () => {\n' + source + '\nreturn capture(page,' + json.dumps(options) + ');\n}')
    report = json.loads(result.split('### Result\n', 1)[1].split('\n###', 1)[0])
    (OUT / mode / 'browser.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f"PASS headless Chrome {report['browserVersion']}; 1920x1440 fit view; {report['nodes']} labels / {report['wires']} wires; layout=1; errors=0; interceptedSpec={report['interceptedSpec']}")
    print(f"MEASURE five loads={[l['roads:navigation-to-ready'] for l in report['loads']]}; median={report['medianMilliseconds']:.3f} ms")
finally:
    command('close')
