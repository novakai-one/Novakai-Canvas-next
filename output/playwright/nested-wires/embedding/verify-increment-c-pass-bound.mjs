import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as api from '../../../../capability/layout/contract/index.ts';
const require=createRequire(import.meta.url);
const {build}=createRequire(require.resolve('tsx/package.json'))('esbuild');
const bundle=await build({stdin:{contents:"export {createNestedRoadScene} from './capability/layout/contract/index.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',packages:'external',write:false,
 plugins:[{name:'count-solve-passes',setup(builder){builder.onLoad({filter:/nested-embedding-solve\.ts$/},({path})=>{
  const source=readFileSync(path,'utf8');
  const marker='  const positions = new Map(ledger.vertices.map((v) => [v.key, v.position]));';
  assert.equal(source.split(marker).length,2);
  return {loader:'ts',contents:source.replace(marker,"globalThis.__cSolvePasses.push({expanded:ledger.spanGrowth!==undefined,spans:ledger.spanGrowth??[]});\n"+marker)};
 });}}]});
const observed=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const root='output/playwright/nested-wires/embedding/';
const receipt={};
for(const name of ['default','hub','templates','scale','authoring']) {
 const {spec}=JSON.parse(gunzipSync(readFileSync(root+`increment-c-${name}-candidate.json.gz`)));
 globalThis.__cSolvePasses=[];
 const scene=observed.createNestedRoadScene({spec});
 assert.equal(JSON.stringify(scene),JSON.stringify(api.createNestedRoadScene({spec})));
 const passes=globalThis.__cSolvePasses;
 assert.equal(passes.length,name==='authoring'?2:1);
 receipt[name]={observerEqualsPublic:true,passes};
}
delete globalThis.__cSolvePasses;
writeFileSync(root+'increment-c-pass-bound.json',JSON.stringify(receipt,null,2)+'\n');
console.log(Object.fromEntries(Object.entries(receipt).map(([name,value])=>[name,value.passes.length])));
