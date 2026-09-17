"""Run the exact M4-requested selection assertions, with M4's timing ceiling.

The historical M2 wrapper additionally demands PNG byte identity and its older
M1-relative timing ceiling. Those are not substituted for the M4 DoD: this runner
retains every assertion in verify-selection.mjs unchanged apart from topology.
"""
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/playwright/nested-wires'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result = subprocess.run([str(CLI), '-s=m4-selection', *args], cwd=ROOT, text=True, capture_output=True, check=True)
    if '### Error' in result.stdout:raise RuntimeError(result.stdout)
    return result.stdout
command('open','http://127.0.0.1:5188/roads-prototype.html?nested')
command('snapshot')
source = (ROOT / 'apps/web/cli/verify-selection.mjs').read_text().replace('export async function','async function')
output = command('run-code','async () => {\n'+source+'\nreturn verify(page);\n}')
report = json.loads(output.split('### Result\n',1)[1].split('\n###',1)[0])
report['performance']['m2Median'] = 243.7
report['performance']['ceiling'] = 300
assert report['performance']['median'] <= 300, report['performance']
report['messages'].append(f"PASS M4 timing loads={report['performance']['loads']}; median={report['performance']['median']:.3f} ms <=300; M2=243.7 ms")
(OUT/'m4-selection.json').write_text(json.dumps(report,indent=2)+'\n')
(OUT/'m4-selection-output.txt').write_text('\n'.join(report['messages'])+'\n')
print('\n'.join(report['messages']))

command('close')
