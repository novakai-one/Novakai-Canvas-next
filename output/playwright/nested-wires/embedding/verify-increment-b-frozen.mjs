/** Observation only through the public builder: compare consumed preferences before/after solve. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as api from '../../../../capability/layout/contract/index.ts';
const require=createRequire(import.meta.url);
const {build}=createRequire(require.resolve('tsx/package.json'))('esbuild');
const bundle=await build({stdin:{contents:"export {createNestedRoadScene} from './capability/layout/contract/index.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false,
 plugins:[{name:'observe-frozen-inputs',setup(b){b.onLoad({filter:/nested-lane-projection\.ts$/},({path})=>{
  let source=readFileSync(path,'utf8');
  const final='  const byRoad = junctionIndex(junctions);';assert.equal(source.split(final).length,2);
  source=source.replace(final,final+'\n  globalThis.__finalSupports=readNestedProjectionSupports(wires,byWire,roads);');
  const initial='  const adjusted = supports.filter((support) =>';assert.equal(source.split(initial).length,2);
  source=source.replace(initial,'  globalThis.__initialSupports=supports;\n'+initial);
  return{loader:'ts',contents:source};
 });}}]});
const observed=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const root='output/playwright/nested-wires/embedding/';const receipt={};
function frozen(supports,map){return supports.map(s=>({wire:s.wire.id,source:s.wire.sourcePortId,target:s.wire.targetPortId,gates:s.wire.gates,
 travels:s.travels.map(t=>({road:map.get(t.road.id)??t.road.id,first:t.first,last:t.last,direction:t.direction,rank:t.lane.index,count:t.count,offset:t.lane.offset})),
 joins:s.joins.map(j=>({owner:map.get(j.nominal.roadId)??j.nominal.roadId,viaCount:j.nominal.via?.length??0,incoming:j.incoming.first,outgoing:j.outgoing.first}))}));}
for(const name of ['default','hub','templates','scale','authoring']){
 const d=JSON.parse(gunzipSync(readFileSync(root+`increment-b-${name}-active.json.gz`)));
 const scene=observed.createNestedRoadScene({spec:d.spec});
 assert.equal(JSON.stringify(scene),JSON.stringify(api.createNestedRoadScene({spec:d.spec})));
 const map=new Map(d.result.value.roadIds.map(r=>[r.before,r.after]));
 const before=frozen(globalThis.__initialSupports,map),after=frozen(globalThis.__finalSupports,new Map());
 assert.deepEqual(after,before,`${name}: frozen route/turn/bridge template choices`);
 receipt[name]={observedEqualsPublic:true,preferencesUnchanged:true,wires:before.length,travels:before.reduce((n,w)=>n+w.travels.length,0),joins:before.reduce((n,w)=>n+w.joins.length,0)};
}
writeFileSync(root+'increment-b-frozen-preferences.json',JSON.stringify(receipt,null,2)+'\n');console.log(receipt);
delete globalThis.__initialSupports;delete globalThis.__finalSupports;
