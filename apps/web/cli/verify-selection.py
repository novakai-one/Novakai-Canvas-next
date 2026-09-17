"""Standalone Playwright runner. Uses the installed CLI, existing Vite and no new dependencies.
Node/Playwright/assertion failures fail this process; rerun safely replaces selection evidence.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/playwright/selection'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'


def command(*args):
    result = subprocess.run([str(CLI), '-s=selection', *args], cwd=ROOT,
                            text=True, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError(result.stdout + result.stderr)
    if '### Error' in result.stdout:
        raise RuntimeError(result.stdout)
    return result.stdout


OUT.mkdir(parents=True, exist_ok=True)
command('open', 'http://127.0.0.1:5188/roads-prototype.html?nested')
command('snapshot')
source = Path(__file__).with_suffix('.mjs').read_text().replace('export async function', 'async function')
output = command('run-code', 'async () => {\n' + source + '\nreturn verify(page);\n}')
report = json.loads(output.split('### Result\n', 1)[1].split('\n###', 1)[0])
m1 = json.loads((ROOT / 'output/playwright/nested-wires/before.json').read_text())['browser']['medianMilliseconds']
report['performance']['m1Median'] = m1
report['performance']['ceiling'] = m1 * 1.15
median = report['performance']['median']
assert median <= m1 * 1.15, f'FAIL 4 median {median} > M1 {m1} * 1.15'
report['messages'].append(f"PASS 4 five loads={report['performance']['loads']}; median={median:.3f} ms; M1={m1:.3f} ms; ceiling={m1 * 1.15:.3f} ms")
for name in ['default', 'node-selected', 'wire-selected', 'cleared']:
    image = OUT / f'{name}.png'
    assert image.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'), f'FAIL 5 {name}.png'
    report['messages'].append(f'PASS 5 {name}.png exists ({image.stat().st_size} bytes)')
assert (OUT / 'default.png').read_bytes() == (OUT / 'cleared.png').read_bytes(), 'FAIL default/cleared screenshot mismatch'
report['messages'].append('PASS 5 default.png and cleared.png byte-identical')
(OUT / 'metrics.json').write_text(json.dumps(report, indent=2) + '\n')
(OUT / 'verification.txt').write_text('\n'.join(report['messages']) + '\n')
print('\n'.join(report['messages']))
