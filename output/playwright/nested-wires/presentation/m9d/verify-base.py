"""Byte equality to pinned M9c HEAD, plus actual browser bytes across all preset/zoom probes."""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
BASE='50b5237284ea9699ee5e319c17ffc1b20d08cb7d'
before=json.loads((OUT/'baseline.json').read_text())
after=json.loads((OUT/'probes.json').read_text())
results={}
for scene,path in [('nested','scene.json'),('templates','templates-scene/scene.json'),('scale','scale-scene/scene.json')]:
    path='output/playwright/nested-wires/'+path
    pinned=subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
    assert (ROOT/path).read_bytes()==pinned
    initial=after['scenes'][scene]['initial']
    assert initial['sceneBytes']==before[scene]['sceneBytes']
    assert initial['geometry']==before[scene]['geometry']
    rows=after['scenes'][scene]['rows']
    assert all(r['layoutDelta']==0 and r['sceneBytesEqual'] and r['geometryBytesEqual'] and r['sizesBytesEqual'] and r['overflow']==0 for r in rows)
    assert after['scenes'][scene]['presetByteIdentity']
    results[scene]={'base':BASE,'offlineSceneSha256':hashlib.sha256(pinned).hexdigest(),'browserSceneSha256':hashlib.sha256(initial['sceneBytes'].encode()).hexdigest(),'probeCount':len(rows),'zoomMinimum':min(r['zoom'] for r in rows),'zoomMaximum':max(r['zoom'] for r in rows),'equalToBase':True,'presetsEqual':True,'allLayoutDeltas':0,'allVisibleOverflow':0}
paths=['capability/layout','apps/web/cli','capability/export','output/playwright/nested-wires/presentation/m9a','output/playwright/nested-wires/presentation/m9a-fix','output/playwright/nested-wires/presentation/m9c']
subprocess.run(['git','diff','--exit-code',BASE,'--',*paths],cwd=ROOT,check=True)
assert not subprocess.check_output(['git','diff','--name-only','--diff-filter=A',BASE,'--','*.test.ts'],cwd=ROOT).strip()
assert not subprocess.check_output(['git','ls-files','--others','--exclude-standard','--','*.test.ts'],cwd=ROOT).strip()
(OUT/'base-byte-identity.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
print('PASS base scenes, browser scene/geometry bytes, all presets, all probes; frozen engine/export/runners; no new tests')
