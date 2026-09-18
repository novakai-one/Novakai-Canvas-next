"""Independent scalar/materialization replay. No product imports; no changed baselines."""
import gzip,json
from collections import defaultdict,deque
from pathlib import Path
root=Path('output/playwright/nested-wires/embedding')
results={}
for name in ['default','hub','templates','scale','authoring']:
 d=json.loads(gzip.decompress((root/f'increment-b-{name}-active.json.gz').read_bytes()))
 old=d['before']; result=d['result']['value']; scene=result['scene']; g=result['ledger']
 incoming={v['key']:0 for v in g['vertices']}; outgoing=defaultdict(list)
 for c in g['constraints']:
  if c['from']!=c['to']:incoming[c['to']]+=1;outgoing[c['from']].append(c)
 queue=deque(k for k,v in incoming.items() if v==0);order=[]
 while queue:
  key=queue.popleft();order.append(key)
  for c in outgoing[key]:
   incoming[c['to']]-=1
   if incoming[c['to']]==0:queue.append(c['to'])
 assert len(order)==len(g['vertices'])
 positions={v['key']:v['position'] for v in g['vertices']}
 for key in order:
  for c in outgoing[key]:positions[c['to']]=max(positions[c['to']],positions[key]+c['required'])
 assert all(positions[c['to']]>=positions[c['from']]+c['required'] for c in g['constraints'])
 aliases={a:v for v in g['vertices'] for a in v['aliases']}
 original={a:v['position'] for a,v in aliases.items()}
 for group in g['equalities']:
  assert group['position']==max(v['position'] for v in group['members'])
  internal=[c for c in g['constraints'] if c['key'] in group['constraints']]
  assert all(c['required']==0 for c in internal)
  for v in group['members']:
   for a in v['aliases']:original[a]=v['position']
 value=lambda k:positions[aliases[k]['key']]
 for a in aliases:assert value(a)>=original[a]
 roads={r['id']:r for r in scene['roads']}; mapping={r['before']:r['after'] for r in result['roadIds']}
 populations={p['key']:p for p in g['populations']}
 oldroads={r['id']:r for r in old['roads']}
 for p in g['populations']:
  r=roads[mapping[p['roadId']]];b=r['bounds'];o=oldroads[p['roadId']]['bounds']
  along,across,length,breadth=('x','y','width','height') if r['axis']=='horizontal' else ('y','x','height','width')
  assert b[across]+b[breadth]/2==value(p['key'])
  assert b[breadth]==p['width']
  if r['kind']=='street':
   for end in ['start','end']:
    delta=value(p['key']+':'+end)-original[p['key']+':'+end]
    actual=b[along]+(b[length] if end=='end' else 0)
    previous=o[along]+(o[length] if end=='end' else 0)
    assert actual==previous+delta
 for a,b in zip(old['nodes'],scene['nodes']):
  assert a['id']==b['id']
  for axis,dim in [('x','width'),('y','height')]:
   assert a['bounds'][dim]==b['bounds'][dim]
   assert b['bounds'][axis]+b['bounds'][dim]/2==value(b['id']+':'+axis+':center')
   assert any(alias.startswith(b['sectionId']+':'+axis+':track:') for alias in aliases[b['id']+':'+axis+':center']['aliases'])
 for a,b in zip(old['sections'],scene['sections']):
  for axis,dim in [('x','width'),('y','height')]:
   assert b['bounds'][dim]>=a['bounds'][dim]
   assert b['bounds'][axis]==value(b['id']+':'+axis+':low')
   assert b['bounds'][axis]+b['bounds'][dim]==value(b['id']+':'+axis+':high')
 for c in g['contacts']:
  a,b=[roads[mapping[populations[c[k]]['roadId']]]['bounds'] for k in ['a','b']]
  for axis,dim in [('x','width'),('y','height')]:assert min(a[axis]+a[dim],b[axis]+b[dim])>=max(a[axis],b[axis]),c
 resolved=[]
 if name=='authoring':
  prior=json.loads((root/'increment-b-amendment-replay.json').read_text())['scenes']['authoring']['usedMouthsOnlyDiagnostic']['driveCentersOutsideRegisteredStreetSpan']
  for loss in prior:
   drive=roads[mapping[loss['drive']]];street=roads[mapping[loss['street']]]
   axis,dim=('x','width') if street['axis']=='horizontal' else ('y','height')
   at=drive['bounds'][axis]+drive['bounds'][dim]/2;lo=street['bounds'][axis];hi=lo+street['bounds'][dim]
   assert lo<=at<=hi
   resolved.append({'contact':loss['contact'],'drive':drive['id'],'street':street['id'],'beforeDiagnostic':loss['tangentCenter'],'registeredPosition':at,'streetSpan':[lo,hi]})
  assert len(resolved)==17
 results[name]={'independentReplayExit':0,'constraintsSatisfied':len(g['constraints']),'contactsPreserved':len(g['contacts']),'nodeDimensionsUnchanged':True,'sectionShrinks':0,'splitGridTracks':0,'resolvedSpanDiagnostics':resolved,'equalityGroups':g['equalities']}
(root/'increment-b-independent-replay.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps({n:{k:v for k,v in r.items() if k not in ['resolvedSpanDiagnostics','equalityGroups']} for n,r in results.items()},indent=2))
