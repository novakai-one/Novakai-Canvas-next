"""Replay standing gates serially and retain this milestone's own evidence."""
import hashlib, json, re, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
SOURCE=OUT.parent/'m9a'
result=subprocess.run(['python3',str(SOURCE/'verify-offline.py')],cwd=ROOT,capture_output=True,text=True)
(OUT/'offline-output.txt').write_text(result.stdout+result.stderr+f'\nexit {result.returncode}\n')
print(result.stdout,flush=True)
for name in re.findall(r'^([\w-]+): exit',result.stdout,re.M):
    shutil.copyfile(SOURCE/(name+'.txt'),OUT/(name+'.txt'))
for name in ['nested','templates','scale']:
    shutil.copyfile(SOURCE/(name+'-operations.json'),OUT/(name+'-operations.json'))
assert result.returncode==0, result.stderr
identity=[]
for path in ['output/playwright/nested-wires/scene.json',
             'output/playwright/nested-wires/templates-scene/scene.json',
             'output/playwright/nested-wires/scale-scene/scene.json']:
    before=subprocess.check_output(['git','show','94c605f:'+path],cwd=ROOT)
    after=(ROOT/path).read_bytes()
    assert before==after,path
    identity.append({'path':path,'bytes':len(after),'baseSha256':hashlib.sha256(before).hexdigest(),'currentSha256':hashlib.sha256(after).hexdigest()})
subprocess.run(['git','diff','--exit-code','94c605f','--','capability','apps'],cwd=ROOT,check=True)
(OUT/'base-byte-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
print('PASS scene bytes identical to 94c605f; all runtime sources identical',flush=True)
result=subprocess.run(['pnpm','tokens:check'],cwd=ROOT,capture_output=True,text=True)
(OUT/'tokens-check.txt').write_text(result.stdout+result.stderr+f'\nexit {result.returncode}\n')
assert result.returncode==0,result.stdout+result.stderr
print('PASS tokens:check',flush=True)
