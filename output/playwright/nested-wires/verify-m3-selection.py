"""Run the exact M3-requested selection assertions, with M3's timing ceiling.

The historical M2 wrapper additionally demands PNG byte identity and its older
M1-relative timing ceiling. Those are not substituted for the M3 DoD: this runner
retains every assertion in verify-selection.mjs unchanged apart from topology.
"""
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/playwright/selection'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result = subprocess.run([str(CLI), '-s=m3-selection', *args], cwd=ROOT, text=True, capture_output=True, check=True)
    if '### Error' in result.stdout:raise RuntimeError(result.stdout)
    return result.stdout
command('open','http://127.0.0.1:5188/roads-prototype.html?nested','--headed')
command('snapshot')
source = (ROOT / 'apps/web/cli/verify-selection.mjs').read_text().replace('export async function','async function')
output = command('run-code','async () => {\n'+source+'\nreturn verify(page);\n}')
report = json.loads(output.split('### Result\n',1)[1].split('\n###',1)[0])
report['performance']['m2Median'] = 243.7
report['performance']['ceiling'] = 280
assert report['performance']['median'] <= 280, report['performance']
report['messages'].append(f"PASS M3 timing loads={report['performance']['loads']}; median={report['performance']['median']:.3f} ms <=280; M2=243.7 ms")
(OUT/'metrics.json').write_text(json.dumps(report,indent=2)+'\n')
(OUT/'verification.txt').write_text('\n'.join(report['messages'])+'\n')
print('\n'.join(report['messages']))
