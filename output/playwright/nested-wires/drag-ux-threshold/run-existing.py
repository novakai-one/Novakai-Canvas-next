"""Rerun unchanged original CLI harnesses, archive results, restore original evidence."""
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
MODE = sys.argv[1]
SPECS = {
    'track-b': ('drag-ux', 'drag-ux/run.py', 'drag-ux/verify.mjs'),
    'm5': ('m5-swap', 'verify-drag-swap.py', 'verify-drag-swap.mjs'),
}
directory, runner, verifier = SPECS[MODE]
original = OUT.parent / directory
source = OUT.parent / verifier
before_hash = hashlib.sha256(source.read_bytes()).hexdigest()
with tempfile.TemporaryDirectory(prefix='drag-threshold-evidence-') as temporary:
    backup = Path(temporary) / directory
    shutil.copytree(original, backup)
    try:
        result = subprocess.run([sys.executable, str(OUT.parent / runner)], cwd=ROOT,
                                text=True, capture_output=True)
        (OUT / f'{MODE}-output.txt').write_text(result.stdout + result.stderr)
        shutil.copytree(original, OUT / f'{MODE}-rerun', dirs_exist_ok=True)
    finally:
        shutil.rmtree(original)
        shutil.copytree(backup, original)
after_hash = hashlib.sha256(source.read_bytes()).hexdigest()
gate = {'exit': result.returncode, 'verifier_before_sha256': before_hash,
        'verifier_after_sha256': after_hash, 'verifier_unchanged': before_hash == after_hash}
(OUT / f'{MODE}-gate.json').write_text(json.dumps(gate, indent=2) + '\n')
print(result.stdout + result.stderr)
print(json.dumps(gate))
sys.exit(result.returncode)
