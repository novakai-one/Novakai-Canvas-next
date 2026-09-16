"""Independent rectilinear visibility graph: full street rectangles, directed driveway centerlines.

Road rectangle edges, port axes, and wire coordinates form a Hanan grid. Street
arcs are bidirectional; driveway arcs follow the admitted down/right direction.
No routing law, contact registry, selected gate list, or application graph is read.
Node bodies have no arcs. Crossing a section wall requires its gate centerline.
Wire vertices only refine the grid; they do not privilege or remove any path.
Dijkstra therefore considers alternative gates and all positions across each street.
"""
import json,heapq,bisect,subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent
from collections import defaultdict
s=json.loads((ROOT / 'scene.json').read_text())
baseline=json.loads(subprocess.check_output(['git','show','266a96c:output/playwright/nested-wires/scene.json']))
report=[]
xs=set();ys=set()
for r in s['roads']:
 b=r['bounds'];xs.update([b['x'],b['x']+b['width']]);ys.update([b['y'],b['y']+b['height']])
for p in s['ports']:xs.add(p['point']['x']);ys.add(p['point']['y'])
for w in s['wiring']['value']:
 for l in w['segments']:
  for p in [l['from'],l['to']]: xs.add(p['x']);ys.add(p['y'])
xs=sorted(xs);ys=sorted(ys);edges=defaultdict(set)
def link(a,b,bidir):
 edges[a].add(b)
 if bidir:edges[b].add(a)
for r in s['roads']:
 b=r['bounds'];xp=xs[bisect.bisect_left(xs,b['x']):bisect.bisect_right(xs,b['x']+b['width'])];yp=ys[bisect.bisect_left(ys,b['y']):bisect.bisect_right(ys,b['y']+b['height'])]
 if r['kind']=='street':
  for y in yp:
   for a,c in zip(xp,xp[1:]):link((a,y),(c,y),True)
  for x in xp:
   for a,c in zip(yp,yp[1:]):link((x,a),(x,c),True)
 elif r['axis']=='horizontal':
  y=b['y']+b['height']/2
  for a,c in zip(xp,xp[1:]):link((a,y),(c,y),False)
 else:
  x=b['x']+b['width']/2
  for a,c in zip(yp,yp[1:]):link((x,a),(x,c),False)
def shortest(a,b):
 q=[(0,a)];seen={a:0}
 while q:
  d,p=heapq.heappop(q)
  if seen[p]!=d:continue
  if p==b:return d
  for t in edges[p]:
   nd=d+abs(t[0]-p[0])+abs(t[1]-p[1])
   if nd<seen.get(t,float('inf')):seen[t]=nd;heapq.heappush(q,(nd,t))
 return float('inf')
for w, old in zip(s['wiring']['value'], baseline['wiring']['value']):
 a=w['segments'][0]['from']; b=w['segments'][-1]['to']
 length=sum(abs(l['from']['x']-l['to']['x'])+abs(l['from']['y']-l['to']['y']) for l in w['segments'])
 old_length=sum(abs(l['from']['x']-l['to']['x'])+abs(l['from']['y']-l['to']['y']) for l in old['segments'])
 d=shortest((a['x'],a['y']),(b['x'],b['y']))
 detour=(length/d-1)*100
 assert 0 <= detour <= 10, (w['id'],length,d,detour)
 assert length <= old_length, (w['id'], 'path became longer')
 for key in ['id','from','to','sourcePortId','targetPortId','gates']:
  assert w[key] == old[key], (w['id'],key)
 for line in w['segments']:
  road=next(r for r in s['roads'] if r['id']==line['corridorId'])['bounds']
  for point in [line['from'],line['to']]:
   assert road['x'] <= point['x'] <= road['x']+road['width']
   assert road['y'] <= point['y'] <= road['y']+road['height']
 report.append({'wire':w['id'],'length':length,'oracle':d,'detourPercent':detour,'beforeLength':old_length})
 print(f"PASS {w['id']} length={length:g} oracle={d:g} detour={detour:.4f}% <= 10%")
(ROOT/'oracle.json').write_text(json.dumps({'method':__doc__.strip(),'graphVertices':len(edges),'wires':report},indent=2)+'\n')
print('PASS all named corridors contain their segments; ports/gates unchanged; every path equal or shorter than M1.')
