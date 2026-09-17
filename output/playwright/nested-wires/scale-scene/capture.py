"""Nonpersistent headless Playwright on our 5191; no real browser or other port."""
import json
import subprocess
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
options = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {'scene': 'scale', 'nodes': 40, 'wires': 75, 'prefix': str(OUT / 'scale')}
def command(*args):
    r = subprocess.run([str(CLI), '-s=m7-evidence', *args], cwd=ROOT, capture_output=True, text=True, check=True)
    if '### Error' in r.stdout:
        raise RuntimeError(r.stdout)
    return r.stdout
try:
    command('open', 'http://127.0.0.1:5191/roads-prototype.html?' + options['scene'])
    command('snapshot')
    body = (OUT / 'capture.mjs').read_text().replace('export async function', 'async function')
    result = command('run-code', 'async () => {\n' + body + '\nreturn capture(page,' + json.dumps(options) + ');\n}')
    report = json.loads(result.split('### Result\n', 1)[1].split('\n###', 1)[0])
    Path(options['prefix'] + '-browser.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f"PASS headless Chrome {report['browserVersion']}; 1920x1440; {report['nodes']} nodes / {report['wires']} wires; layout=1; errors=0")
    print(f"MEASURE {report['url']}; five loads={[l['roads:navigation-to-ready'] for l in report['loads']]}; median={report['medianMilliseconds']:.3f} ms")
finally:
    command('close')
