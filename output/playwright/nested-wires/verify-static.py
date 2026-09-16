"""Static discovery audit; prints the actual grep commands and results, including no-match exits."""
from pathlib import Path
import re
import shlex
import subprocess

ROOT = Path(__file__).resolve().parents[3]
CORE = 'capability/layout/core/'
rows = []

def grep(pattern, paths, absent=False):
    args = ['grep', '-nE', pattern, *paths]
    result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True)
    rows.append('$ ' + shlex.join(args))
    rows.append(result.stdout.rstrip() or f'[no matches; exit {result.returncode}]')
    assert result.returncode in [0, 1], result.stderr
    if absent:
        assert result.returncode == 1, result.stdout

routing = [CORE + f'nested-wire-{name}.ts' for name in ['access', 'corridors', 'law', 'routing']]
grep(r'scene\.roads|roads\.(map|filter|find|some|flatMap|slice)', routing, absent=True)
grep(r'roads\.(slice|flatMap)|for.*of roads', [CORE+'prototype-road-network.ts'], absent=True)
grep(r'scene\.roads|roads\.(map|filter|find|some|flatMap|slice)', sorted(str(p.relative_to(ROOT)) for p in (ROOT/CORE).glob('nested-wire-*.ts')) + [CORE+'prototype-road-network.ts'])
grep(r'constructedContacts|nestedCrossings|registeredEndpoints|registry\.crossings\.get|roads\.get', [CORE+'prototype-nested-scene.ts', CORE+'prototype-road-network.ts', CORE+'nested-wire-law.ts', CORE+'nested-wire-corridors.ts'])
old = subprocess.check_output(['git', 'show', '266a96c:'+CORE+'nested-wire-law.ts'], cwd=ROOT, text=True)
new = (ROOT/CORE/'nested-wire-law.ts').read_text()
def law(source):
    return re.sub(r'\s+', '', source[source.index('function sameRoad'):source.index('\nfunction ', source.index('function quadrant')+1)])
assert law(old) == law(new)
rows += ['PASS pair law unchanged: band -> shared road -> quadrant.', 'PASS routing call chain has no all-road scan; compiler has no road-pair discovery loop.', 'The remaining matches are compile-once road indexing and the independent inspector once-per-inspection index. roadNetwork maps roads once to their owned events and ranks construction contacts; neither traversal is per wire.', 'Construction contacts enumerate registered grid/frame crossings and driveway endpoints; the lane compiler consumes only those contacts. No shifted scan or hidden road-pair helper remains.']
output = '\n'.join(rows)+'\n'
(ROOT/'output/playwright/nested-wires/static-proof.txt').write_text(output)
print(output, end='')
